import { connect, sendMessage } from "./web/chatSocket.js";
import { clearUser, redirectToLogin, updateGroupList, setActiveGroup } from "./ui/chatUI.js";
import { getGroups } from "./services/api.js";

// Verificar usuario
const user = JSON.parse(localStorage.getItem("user"));
if (!user) redirectToLogin();

document.getElementById("chat-username").textContent = "Bienvenido " + user.name;

// Elementos del DOM
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const logoutBtn = document.getElementById("logoutBtn");
const usersToggle = document.getElementById("usersToggle");
const userPanel = document.getElementById("userPanel");
const closePanel = document.getElementById("closePanel");
const userImgEl = document.getElementById("currentUserImg");
const userNameEl = document.getElementById("currentUserName");
const chatTitle = document.getElementById("chat-username");

// Configurar usuario actual
userNameEl.textContent = user.name;
if (user.img && user.img.trim() !== "") {
    userImgEl.src = user.img;
} else {
    userImgEl.src = "/img/default-avatar.png";
}

// Variables globales
let currentGroup = null;

// Cargar y mostrar grupos
async function loadGroups() {
    try {
        const groups = await getGroups();
        console.log("Grupos cargados:", groups);
        
        updateGroupList(groups, (group) => {
            currentGroup = group;
            setActiveGroup(group);
            // Cerrar panel de usuarios si está abierto al cambiar de grupo
            closeUserPanel();
        });
        
        // Intentar restaurar grupo anterior o seleccionar el primero
        const savedGroup = localStorage.getItem('currentGroup');
        if (savedGroup) {
            currentGroup = JSON.parse(savedGroup);
            setActiveGroup(currentGroup);
        } else if (groups.length > 0) {
            currentGroup = groups[0];
            setActiveGroup(groups[0]);
        }
    } catch (error) {
        console.error("Error cargando grupos:", error);
        // Fallback: crear grupo por defecto
        const defaultGroup = {
            id: 1,
            name: "General",
            description: "Chat general",
            img: "https://cdn-icons-png.flaticon.com/512/1006/1006771.png"
        };
        currentGroup = defaultGroup;
        setActiveGroup(defaultGroup);
    }
}

// Función para mostrar/ocultar el panel de usuarios
function toggleUserPanel() {
    userPanel.classList.toggle('active');
    // Opcional: deshabilitar el input de mensaje cuando el panel está abierto
    messageInput.disabled = userPanel.classList.contains('active');
}

function closeUserPanel() {
    userPanel.classList.remove('active');
    messageInput.disabled = false;
}

// Conectar al WebSocket
connect(user);

// Eventos
chatForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const text = messageInput.value.trim();
    console.log("Enviando mensaje:", text, "al grupo:", currentGroup);
    
    if (text && currentGroup) {
        sendMessage(user.name, text, currentGroup.id);
        messageInput.value = "";
        messageInput.focus();
    }
});

logoutBtn.addEventListener("click", function() {
    clearUser();
    redirectToLogin();
});

// Toggle del panel de usuarios
usersToggle.addEventListener("click", toggleUserPanel);

// Cerrar panel con el botón X
closePanel.addEventListener("click", closeUserPanel);

// Cerrar panel con la tecla Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && userPanel.classList.contains('active')) {
        closeUserPanel();
    }
});

// Cerrar panel al hacer clic en el título del chat (si está abierto)
chatTitle.addEventListener("click", function() {
    if (userPanel.classList.contains('active')) {
        closeUserPanel();
    } else {
        toggleUserPanel();
    }
});

// Cargar grupos cuando la página esté lista
document.addEventListener("DOMContentLoaded", loadGroups);