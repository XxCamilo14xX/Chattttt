import { addMessage, addSystemMessage, updateUserList, loadGroupMessages } from '../ui/chatUI.js';

let ws;
let currentUser = null;

export function connect(user) {
    currentUser = user;
    ws = new WebSocket("ws://localhost:3000");

    ws.onopen = () => {
        console.log("Conectado al WebSocket");
        ws.send(JSON.stringify({ type: "login", user }));
        
        // Restaurar grupo anterior si existe
        const savedGroup = localStorage.getItem('currentGroup');
        if (savedGroup) {
            const group = JSON.parse(savedGroup);
            requestGroupMessages(group.id);
        }
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Mensaje recibido:", data);
        
        if (data.type === "chat") {
            // Solo mostrar mensajes del grupo actual
            const currentGroup = JSON.parse(localStorage.getItem('currentGroup'));
            if (currentGroup && data.groupId === currentGroup.id) {
                const isSelf = data.user === currentUser.name;
                addMessage(data.user, data.text, isSelf);
            }
        } else if (data.type === "system") {
            addSystemMessage(data.text);
        } else if (data.type === "users") {
            updateUserList(data.users);
        } else if (data.type === "group_messages") {
            // Cargar mensajes históricos del grupo
            loadGroupMessages(data.messages);
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
            groupId: groupId || 1
        };
        console.log("Enviando mensaje:", messageData);
        ws.send(JSON.stringify(messageData));
    } else {
        console.error("WebSocket no está conectado");
    }
}

export function requestGroupMessages(groupId) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: "get_group_messages",
            groupId: groupId
        }));
    }
}