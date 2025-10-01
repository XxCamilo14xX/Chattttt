const broadcast = require("../utils/broadcast");
const { getUsers, getGroups } = require("../models/users");

let connectedUsers = [];
let groupMessages = {}; // Almacenamiento en memoria de los mensajes por grupo

function setupChat(wss) {
    wss.on("connection", (ws, req) => {
        let currentUser = null;
        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;

        ws.on("message", (msg) => {
            try {
                const data = JSON.parse(msg);
                console.log("Mensaje recibido del cliente:", data);

                if (data.type === "login") {
                    currentUser = { 
                        id: data.user.id, 
                        name: data.user.name, 
                        ws: ws 
                    };
                    connectedUsers.push(currentUser);

                    console.log(`${new Date().toISOString()} - 🟢 Cliente conectado (${currentUser.name} | ${ip})`);

                    // Enviar grupos al usuario
                    const groups = getGroups();
                    ws.send(JSON.stringify({
                        type: "groups",
                        groups: groups
                    }));

                    broadcast(connectedUsers, { 
                        type: "system", 
                        text: `${currentUser.name} se unió` 
                    });

                    // Actualizar lista de usuarios
                    updateUserList();
                }

                if (data.type === "chat") {
                    console.log(`Mensaje de ${data.user}: ${data.text} para grupo ${data.groupId}`);
                    
                    // Almacenar mensaje en el grupo correcto
                    const message = {
                        user: data.user,
                        text: data.text,
                        timestamp: new Date().toISOString(),
                        messageId: Date.now() + Math.random().toString(36).substr(2, 9),
                        groupId: data.groupId
                    };
                    
                    // Asegurarnos de que el grupo existe en el almacenamiento
                    if (!groupMessages[data.groupId]) {
                        groupMessages[data.groupId] = [];
                    }
                    
                    groupMessages[data.groupId].push(message);
                    
                    // Limitar historial a 200 mensajes por grupo (para no sobrecargar memoria)
                    if (groupMessages[data.groupId].length > 200) {
                        groupMessages[data.groupId] = groupMessages[data.groupId].slice(-200);
                    }

                    console.log(`Mensaje guardado en grupo ${data.groupId}. Total mensajes: ${groupMessages[data.groupId].length}`);

                    // Transmitir mensaje a todos los usuarios conectados
                    broadcast(connectedUsers, { 
                        type: "chat", 
                        user: data.user, 
                        text: data.text,
                        groupId: data.groupId,
                        timestamp: message.timestamp
                    });
                }

                // Solicitud de mensajes de un grupo
                if (data.type === "get_group_messages") {
                    const groupId = data.groupId;
                    const messages = groupMessages[groupId] || [];
                    
                    console.log(`Enviando ${messages.length} mensajes para grupo ${groupId} al usuario ${currentUser?.name}`);
                    
                    ws.send(JSON.stringify({
                        type: "group_messages",
                        groupId: groupId,
                        messages: messages
                    }));
                }

            } catch (error) {
                console.error("Error procesando mensaje:", error);
            }
        });

        ws.on("close", () => {
            if (currentUser) {
                console.log(`${new Date().toISOString()} - 🔴 Cliente desconectado (${currentUser.name} | ${ip})`);
                connectedUsers = connectedUsers.filter(u => u !== currentUser);

                broadcast(connectedUsers, { 
                    type: "system", 
                    text: `${currentUser.name} salió` 
                });

                updateUserList();
            }
        });

        ws.on("error", (error) => {
            console.error("WebSocket error:", error);
        });
    });
}

function updateUserList() {
    const allUsers = getUsers();
    const usersWithStatus = allUsers.map(u => ({
        id: u.id,
        name: u.name,
        rol: u.rol,
        img: u.img,
        connected: connectedUsers.some(c => c.id === u.id)
    }));

    broadcast(connectedUsers, {
        type: "users",
        users: usersWithStatus
    });
}

module.exports = setupChat;