const broadcast = require("../utils/broadcast");
const { getUsers, getGroups } = require("../models/users");

let connectedUsers = [];
let groupMessages = {}; // { [groupId]: [{ user, text, timestamp, messageId }] }

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
                    
                    // Almacenar mensaje en el grupo
                    const message = {
                        user: data.user,
                        text: data.text,
                        timestamp: new Date().toISOString(),
                        messageId: Date.now() + Math.random().toString(36).substr(2, 9)
                    };
                    
                    if (!groupMessages[data.groupId]) {
                        groupMessages[data.groupId] = [];
                    }
                    
                    groupMessages[data.groupId].push(message);
                    
                    // Limitar historial a 100 mensajes por grupo
                    if (groupMessages[data.groupId].length > 100) {
                        groupMessages[data.groupId] = groupMessages[data.groupId].slice(-100);
                    }

                    // Transmitir mensaje a todos los usuarios conectados
                    broadcast(connectedUsers, { 
                        type: "chat", 
                        user: data.user, 
                        text: data.text,
                        groupId: data.groupId,
                        timestamp: message.timestamp
                    });
                }

                // Nuevo: solicitud de mensajes de un grupo
                if (data.type === "get_group_messages") {
                    const messages = groupMessages[data.groupId] || [];
                    ws.send(JSON.stringify({
                        type: "group_messages",
                        groupId: data.groupId,
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