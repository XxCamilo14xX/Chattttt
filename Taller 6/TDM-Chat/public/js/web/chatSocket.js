import { addMessage, addSystemMessage, updateUserList, loadGroupMessages, scrollToBottom } from '../ui/chatUI.js';

let ws;
let currentUser = null;
let currentGroupId = null;

export function connect(user) {
    currentUser = user;
    et wsUrl = location.hostname === "localhost" ? "ws://localhost:3000" : `wss://${location.host}`;
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log("Conectado al WebSocket");
        ws.send(JSON.stringify({ type: "login", user }));
        
        // Restaurar grupo anterior si existe
        const savedGroup = localStorage.getItem('currentGroup');
        if (savedGroup) {
            const group = JSON.parse(savedGroup);
            currentGroupId = group.id;
            console.log("Grupo restaurado:", group.id, group.name);
        }
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Mensaje recibido del servidor:", data);
        
        if (data.type === "chat") {
            // Solo mostrar mensajes del grupo actual
            if (currentGroupId && data.groupId === currentGroupId) {
                const isSelf = data.user === currentUser.name;
                console.log("Mostrando mensaje en grupo actual:", data.text);
                addMessage(data.user, data.text, isSelf);
                
                // Forzar scroll al final para mensajes nuevos
                setTimeout(() => {
                    const messagesDiv = document.getElementById("messages");
                    if (messagesDiv) {
                        messagesDiv.scrollTop = messagesDiv.scrollHeight;
                    }
                }, 50);
            } else {
                console.log("Mensaje ignorado - grupo diferente. Actual:", currentGroupId, "Recibido:", data.groupId);
            }
        } else if (data.type === "system") {
            addSystemMessage(data.text);
        } else if (data.type === "users") {
            updateUserList(data.users);
        } else if (data.type === "group_messages") {
            console.log("Cargando mensajes del grupo:", data.groupId, "Cantidad:", data.messages.length);
            loadGroupMessages(data.messages);
        } else if (data.type === "groups") {
            console.log("Grupos recibidos:", data.groups);
        }
    };

    ws.onerror = (error) => {
        console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
        console.log("Conexión WebSocket cerrada");
    };
}

export function sendMessage(user, text, groupId) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        const messageData = {
            type: "chat",
            user: user,
            text: text,
            groupId: groupId
        };
        console.log("Enviando mensaje:", messageData);
        ws.send(JSON.stringify(messageData));
    } else {
        console.error("WebSocket no está conectado");
    }
}

export function requestGroupMessages(groupId) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        console.log("Solicitando mensajes del grupo:", groupId);
        ws.send(JSON.stringify({
            type: "get_group_messages",
            groupId: groupId
        }));
    } else {
        console.error("WebSocket no está conectado para solicitar mensajes");
    }
}

export function setCurrentGroup(groupId) {
    currentGroupId = groupId;
    console.log("Grupo actual establecido:", groupId);
}

