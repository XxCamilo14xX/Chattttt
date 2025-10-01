import { connect, sendMessage, setCurrentGroup, requestGroupMessages } from "./web/chatSocket.js";
import { clearUser, redirectToLogin, loadGroupMessages, addMessage, addSystemMessage, updateUserList, scrollToBottom } from "./ui/chatUI.js";
import { getGroups } from "./services/api.js";

// Verificar usuario
const user = JSON.parse(localStorage.getItem("user"));
if (!user) redirectToLogin();

// Elementos del DOM
let chatForm, messageInput, logoutBtn, usersToggle, userPanel, closePanel;
let toggleSidebarBtn, closeSidebarBtn, sidebarOverlay, groupsSidebar;
let chatGroupName, groupsList, groupSearch, welcomeMessage, messagesDiv, userImgEl, userNameEl;
let currentGroup = null;
let isUserPanelOpen = false;
let isSidebarOpen = false;

// Inicializar la aplicación
document.addEventListener("DOMContentLoaded", function() {
    initializeDOM();
    initializeUser();
    loadGroups();
    connect(user);
    setupEventListeners();
    setupResponsive();
});

function initializeDOM() {
    console.log("Inicializando DOM...");
    
    // Sidebar y navegación
    toggleSidebarBtn = document.querySelector(".toggle-groups-sidebar");
    closeSidebarBtn = document.querySelector(".close-sidebar");
    sidebarOverlay = document.querySelector(".sidebar-overlay");
    groupsSidebar = document.querySelector(".groups-sidebar");
    
    // Elementos de grupos
    groupsList = document.getElementById("groupsList");
    groupSearch = document.getElementById("groupSearch");
    chatGroupName = document.getElementById("chat-group-name");
    userImgEl = document.getElementById("currentUserImg");
    userNameEl = document.getElementById("currentUserName");
    
    // Elementos del chat
    chatForm = document.getElementById("chatForm");
    messageInput = document.getElementById("messageInput");
    logoutBtn = document.getElementById("logoutBtn");
    usersToggle = document.getElementById("usersToggle");
    userPanel = document.getElementById("userPanel");
    closePanel = document.getElementById("closePanel");
    messagesDiv = document.getElementById("messages");
    welcomeMessage = document.querySelector(".welcome-message");

    console.log("Elementos cargados:", {
        toggleSidebarBtn: !!toggleSidebarBtn,
        groupsSidebar: !!groupsSidebar,
        groupsList: !!groupsList
    });
}

function initializeUser() {
    const userImgEl = document.getElementById("currentUserImg");
    const userNameEl = document.getElementById("currentUserName");
    
    if (userNameEl) {
        userNameEl.textContent = user.name;
    }
    
    if (userImgEl) {
        if (user.img && user.img.trim() !== "") {
            userImgEl.src = user.img;
        } else {
            userImgEl.src = "/img/default-avatar.png";
        }
        
        // Agregar manejo de error por si la imagen no carga
        userImgEl.onerror = function() {
            this.src = "/img/default-avatar.png";
        };
    }
}

function setupEventListeners() {
    console.log("Configurando event listeners...");
    
    // Chat
    chatForm.addEventListener("submit", handleSendMessage);
    logoutBtn.addEventListener("click", handleLogout);
    usersToggle.addEventListener("click", toggleUserPanel);
    closePanel.addEventListener("click", closeUserPanel);

    // Sidebar - AÑADIR console.log para debug
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener("click", function(e) {
            console.log("Botón sidebar clickeado");
            toggleSidebar();
        });
    } else {
        console.error("toggleSidebarBtn no encontrado");
    }

    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener("click", closeSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", closeSidebar);
    }

    // Búsqueda de grupos
    if (groupSearch) {
        groupSearch.addEventListener("input", filterGroups);
    }

    // Teclado
    document.addEventListener('keydown', handleKeydown);

    console.log("Event listeners configurados");
}

function setupResponsive() {
    window.addEventListener('resize', handleResize);
    handleResize();
}

function handleResize() {
    const isMobile = window.innerWidth <= 1024;
    
    if (!isMobile) {
        // En desktop, sidebar siempre visible
        openSidebar();
        document.body.classList.add('sidebar-visible');
    } else {
        // En móvil, sidebar oculta por defecto
        closeSidebar();
        document.body.classList.remove('sidebar-visible');
    }
}

function handleSendMessage(e) {
    e.preventDefault();
    const text = messageInput.value.trim();
    
    if (text && currentGroup) {
        sendMessage(user.name, text, currentGroup.id);
        messageInput.value = "";
        messageInput.focus();
    }
}

function handleLogout() {
    clearUser();
    redirectToLogin();
}

function handleKeydown(e) {
    if (e.key === 'Escape') {
        if (isUserPanelOpen) closeUserPanel();
        if (isSidebarOpen && window.innerWidth <= 1024) closeSidebar();
    }
}

async function loadGroups() {
    try {
        const groups = await getGroups();
        console.log("Grupos disponibles:", groups);
        renderGroups(groups);
    } catch (error) {
        console.error("Error cargando grupos:", error);
        renderGroups([]);
    }
}

function renderGroups(groups) {
    if (!groupsList) {
        console.error("groupsList no encontrado");
        return;
    }
    
    groupsList.innerHTML = "";
    
    if (groups.length === 0) {
        groupsList.innerHTML = `
            <div class="no-groups" style="text-align: center; padding: 40px 20px; color: var(--color-text-secondary);">
                <i class="fa-solid fa-comments" style="font-size: 3em; margin-bottom: 15px; display: block;"></i>
                <p>No hay grupos disponibles</p>
            </div>
        `;
        return;
    }
    
    groups.forEach(group => {
        const groupItem = document.createElement("div");
        groupItem.className = "group-sidebar-item";
        groupItem.innerHTML = `
            <img src="${group.img}" alt="${group.name}" class="group-sidebar-avatar">
            <div class="group-sidebar-info">
                <div class="group-sidebar-name">${group.name}</div>
                <div class="group-sidebar-desc">${group.description}</div>
            </div>
        `;
        
        groupItem.addEventListener("click", () => {
            selectGroup(group, groupItem);
        });
        
        groupsList.appendChild(groupItem);
    });
}

function filterGroups() {
    const searchTerm = groupSearch.value.toLowerCase();
    const groupItems = groupsList.querySelectorAll('.group-sidebar-item');
    
    groupItems.forEach(item => {
        const groupName = item.querySelector('.group-sidebar-name').textContent.toLowerCase();
        const groupDesc = item.querySelector('.group-sidebar-desc').textContent.toLowerCase();
        
        if (groupName.includes(searchTerm) || groupDesc.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function selectGroup(group, groupElement) {
    // Remover activo de todos los grupos
    const allGroups = groupsList.querySelectorAll('.group-sidebar-item');
    allGroups.forEach(g => g.classList.remove('active'));
    
    // Marcar grupo como activo
    groupElement.classList.add('active');
    
    currentGroup = group;
    chatGroupName.textContent = group.name;
    
    // Ocultar mensaje de bienvenida
    if (welcomeMessage) {
        welcomeMessage.style.display = 'none';
    }
    
    // Configurar el grupo
    setCurrentGroup(group.id);
    
    // Limpiar mensajes anteriores
    if (messagesDiv) {
        // Mantener solo el welcome message si existe, sino limpiar todo
        const welcome = messagesDiv.querySelector('.welcome-message');
        messagesDiv.innerHTML = '';
        if (welcome) {
            messagesDiv.appendChild(welcome);
            welcome.style.display = 'none';
        }
    }
    
    // Solicitar mensajes del grupo
    requestGroupMessages(group.id);
    
    // Cerrar sidebar en móviles
    if (window.innerWidth <= 1024) {
        closeSidebar();
    }
    
    // Enfocar input
    setTimeout(() => {
        if (messageInput) messageInput.focus();
    }, 100);
}

// FUNCIONES CORREGIDAS PARA EL SIDEBAR
function toggleSidebar() {
    console.log("toggleSidebar llamado, estado actual:", isSidebarOpen);
    if (isSidebarOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

function openSidebar() {
    console.log("Abriendo sidebar...");
    if (groupsSidebar) {
        groupsSidebar.classList.add('active');
        if (sidebarOverlay) {
            sidebarOverlay.classList.add('active');
        }
        isSidebarOpen = true;
        
        if (window.innerWidth <= 1024) {
            document.body.style.overflow = 'hidden';
        }
        console.log("Sidebar abierto");
    } else {
        console.error("groupsSidebar no encontrado al intentar abrir");
    }
}

function closeSidebar() {
    console.log("Cerrando sidebar...");
    if (groupsSidebar) {
        groupsSidebar.classList.remove('active');
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
        }
        isSidebarOpen = false;
        document.body.style.overflow = '';
        console.log("Sidebar cerrado");
    }
}

function toggleUserPanel() {
    if (isUserPanelOpen) {
        closeUserPanel();
    } else {
        openUserPanel();
    }
}

function openUserPanel() {
    if (userPanel) {
        userPanel.classList.add('active');
        if (messageInput) messageInput.disabled = true;
        isUserPanelOpen = true;
    }
}

function closeUserPanel() {
    if (userPanel) {
        userPanel.classList.remove('active');
        if (messageInput) messageInput.disabled = false;
        isUserPanelOpen = false;
        
        setTimeout(() => {
            if (messageInput) messageInput.focus();
        }, 100);
    }
}

// Hacer funciones globales para WebSocket
window.loadGroupMessages = loadGroupMessages;
window.addMessage = addMessage;
window.addSystemMessage = addSystemMessage;
window.updateUserList = updateUserList;
window.scrollToBottom = scrollToBottom;

// Debug inicial
console.log("Chat.js cargado correctamente");