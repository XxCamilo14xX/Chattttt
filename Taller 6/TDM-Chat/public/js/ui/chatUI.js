import { requestGroupMessages, setCurrentGroup } from '../web/chatSocket.js';

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

// Función mejorada para hacer scroll al final
function scrollToBottom() {
    if (!messagesDiv) return;
    
    // Usar requestAnimationFrame para asegurar que el DOM se ha actualizado
    requestAnimationFrame(() => {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

// Función para verificar si el usuario está cerca del final del chat
function isNearBottom() {
    if (!messagesDiv) return true;
    const threshold = 100; // 100px desde el fondo
    return messagesDiv.scrollTop + messagesDiv.clientHeight >= messagesDiv.scrollHeight - threshold;
}

export function addMessage(user, text, isSelf = false) {
    if (!messagesDiv) {
        console.error("messagesDiv no encontrado");
        return;
    }
    
    // Verificar si el usuario está viendo los mensajes más recientes
    const shouldScroll = isNearBottom();
    
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
    
    // Solo hacer scroll si el usuario está cerca del final
    if (shouldScroll) {
        scrollToBottom();
    }
}

export function addSystemMessage(text) {
    if (!messagesDiv) return;
    
    // Siempre hacer scroll para mensajes del sistema
    const shouldScroll = isNearBottom();
    
    const msgEl = document.createElement("div");
    msgEl.classList.add("message", "system");
    msgEl.innerHTML = `<em>⚙️ ${text}</em>`;
    messagesDiv.appendChild(msgEl);
    
    if (shouldScroll) {
        scrollToBottom();
    }
}

export function updateUserList(users) {
    if (!userList) {
        console.error("userList no encontrado");
        return;
    }
    
    userList.innerHTML = "";
    
    // Filtrar solo usuarios conectados
    const connectedUsers = users.filter(u => u.connected);
    const totalUsers = connectedUsers.length;
    
    // Actualizar contador
    const usersCount = document.getElementById("usersCount");
    if (usersCount) {
        usersCount.textContent = `${totalUsers} usuario${totalUsers !== 1 ? 's' : ''} conectado${totalUsers !== 1 ? 's' : ''}`;
    }
    
    if (totalUsers === 0) {
        userList.innerHTML = `
            <li class="no-users">
                <i class="fa-solid fa-user-slash" style="font-size: 2em; margin-bottom: 10px; display: block;"></i>
                No hay usuarios conectados
            </li>
        `;
        return;
    }
    
    connectedUsers.forEach(u => {
        const li = document.createElement("li");
        li.classList.add("user-item");
        li.innerHTML = `
            <img src="${u.img}" alt="${u.name}" class="avatar-img">
            <span class="user-name">${u.name}</span>
            <span class="status ${u.connected ? "online" : "offline"}"></span>
            ${u.rol === 'admin' ? '<span class="user-role admin-role"><i class="fa-solid fa-crown"></i></span>' : ''}
        `;
        userList.appendChild(li);
    });
}

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

        groupEl.addEventListener("click", () => {
            console.log("Grupo seleccionado:", group.id, group.name);
            onGroupClick(group);
        });
        groupList.appendChild(groupEl);
    });
}

export function setActiveGroup(group) {
    console.log("Cambiando al grupo activo:", group.id, group.name);
    
    // Actualizar el header
    const chatTitle = document.getElementById("chat-username");
    if (chatTitle) {
        chatTitle.textContent = group.name;
    }
    
    // Actualizar el grupo actual en el WebSocket
    setCurrentGroup(group.id);
    
    // Limpiar mensajes actuales
    if (messagesDiv) {
        messagesDiv.innerHTML = "";
    }
    
    // Agregar mensaje del sistema
    addSystemMessage(`Cargando mensajes de ${group.name}...`);
    
    // Solicitar mensajes históricos del grupo
    console.log("Solicitando mensajes para el grupo:", group.id);
    requestGroupMessages(group.id);
    
    // Guardar grupo actual en localStorage para persistencia
    localStorage.setItem('currentGroup', JSON.stringify(group));
}

export function loadGroupMessages(messages) {
    if (!messagesDiv) return;
    
    // Limpiar mensajes anteriores
    messagesDiv.innerHTML = "";
    
    console.log("Cargando", messages.length, "mensajes en la interfaz");
    
    if (messages.length === 0) {
        addSystemMessage(`No hay mensajes en este grupo. ¡Sé el primero en escribir!`);
    } else {
        addSystemMessage(`Cargados ${messages.length} mensajes anteriores`);
        
        // Ordenar mensajes por timestamp (por si acaso)
        const sortedMessages = messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        sortedMessages.forEach(msg => {
            const currentUserData = JSON.parse(localStorage.getItem('user'));
            const isSelf = msg.user === currentUserData.name;
            addMessage(msg.user, msg.text, isSelf);
        });
        
        // addSystemMessage(`--- Fin de los mensajes históricos ---`);
        
        // Forzar scroll al final después de cargar todos los mensajes históricos
        setTimeout(scrollToBottom, 100);
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

export { scrollToBottom };