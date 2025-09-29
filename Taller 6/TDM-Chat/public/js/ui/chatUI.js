import { requestGroupMessages } from '../web/chatSocket.js';

const messagesDiv = document.getElementById("messages");
const userList = document.getElementById("userList");

function fixChatHeight() {
    const chatContainer = document.querySelector(".chat-container");
    if (chatContainer) {
        chatContainer.style.height = window.innerHeight + "px";
    }
}
window.addEventListener("resize", fixChatHeight);
fixChatHeight();

export function addMessage(user, text, isSelf = false) {
    if (!messagesDiv) {
        console.error("messagesDiv no encontrado");
        return;
    }
    
    const msgEl = document.createElement("div");
    msgEl.classList.add("message");

    if (user.toLowerCase() === "admin") {
        msgEl.classList.add("admin");
    } else if (isSelf) {
        msgEl.classList.add("self");
    } else {
        msgEl.classList.add("user");
    }

    msgEl.innerHTML = `<strong>${user}:</strong> ${text}`;
    messagesDiv.appendChild(msgEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

export function addSystemMessage(text) {
    if (!messagesDiv) return;
    
    const msgEl = document.createElement("div");
    msgEl.classList.add("message", "system");
    msgEl.innerHTML = `<em>⚙️ ${text}</em>`;
    messagesDiv.appendChild(msgEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

export function updateUserList(users) {
    if (!userList) return;
    
    userList.innerHTML = "";
    
    if (users.length === 0) {
        userList.innerHTML = '<li class="no-users">No hay usuarios conectados</li>';
        return;
    }
    
    // Filtrar solo usuarios conectados
    const connectedUsers = users.filter(u => u.connected);
    
    if (connectedUsers.length === 0) {
        userList.innerHTML = '<li class="no-users">No hay usuarios conectados</li>';
        return;
    }
    
    connectedUsers.forEach(u => {
        const li = document.createElement("li");
        li.classList.add("user-item");
        li.innerHTML = `
            <img src="${u.img}" alt="${u.name}" class="avatar-img">
            <span class="user-name">${u.name}</span>
            <span class="status ${u.connected ? "online" : "offline"}"></span>
        `;
        userList.appendChild(li);
    });
}

// Nueva función para actualizar la lista de grupos
export function updateGroupList(groups, onGroupClick) {
    const groupList = document.getElementById("groupList");
    if (!groupList) {
        console.error("groupList no encontrado");
        return;
    }
    
    groupList.innerHTML = "";

    groups.forEach(group => {
        const groupEl = document.createElement("li");
        groupEl.classList.add("group-item");
        groupEl.innerHTML = `
            <div class="group-avatar">
                <img src="${group.img}" alt="${group.name}" class="avatar-img">
            </div>
            <div class="group-info">
                <span class="group-name">${group.name}</span>
                <small class="group-desc">${group.description}</small>
            </div>
        `;

        groupEl.addEventListener("click", () => onGroupClick(group));
        groupList.appendChild(groupEl);
    });
}

// Función para cambiar el chat activo
export function setActiveGroup(group) {
    // Actualizar el header
    const chatTitle = document.getElementById("chat-username");
    if (chatTitle) {
        chatTitle.textContent = group.name;
    }
    
    // Limpiar mensajes actuales
    if (messagesDiv) {
        messagesDiv.innerHTML = "";
    }
    
    // Agregar mensaje del sistema
    addSystemMessage(`Cargando mensajes de ${group.name}...`);
    
    // Solicitar mensajes históricos del grupo
    requestGroupMessages(group.id);
    
    // Guardar grupo actual en localStorage para persistencia
    localStorage.setItem('currentGroup', JSON.stringify(group));
}

// Función para cargar mensajes históricos
export function loadGroupMessages(messages) {
    if (!messagesDiv) return;
    
    // Limpiar mensajes (excepto el mensaje de sistema de carga)
    messagesDiv.innerHTML = "";
    
    if (messages.length === 0) {
        addSystemMessage(`No hay mensajes en este grupo. ¡Sé el primero en escribir!`);
    } else {
        addSystemMessage(`Mostrando ${messages.length} mensajes anteriores`);
        
        messages.forEach(msg => {
            const isSelf = msg.user === JSON.parse(localStorage.getItem('user')).name;
            addMessage(msg.user, msg.text, isSelf);
        });
    }
}

export function clearUser() {
    localStorage.removeItem("user");
    localStorage.removeItem("currentGroup");
}

export function redirectToLogin() {
    window.location.href = "/login.html";
}

export function showError(message) {
    const errorEl = document.getElementById("loginError");
    if (errorEl) {
        errorEl.textContent = message;
    }
}

export function clearError() {
    const errorEl = document.getElementById("loginError");
    if (errorEl) {
        errorEl.textContent = "";
    }
}

export function saveUser(user) {
    localStorage.setItem("user", JSON.stringify(user));
}

export function redirectToChat() {
    window.location.href = "/chat.html";
}