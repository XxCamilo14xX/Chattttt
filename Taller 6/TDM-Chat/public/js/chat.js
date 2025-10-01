import { connect, sendMessage, setCurrentGroup } from "./web/chatSocket.js";
import { clearUser, redirectToLogin, updateGroupList, setActiveGroup } from "./ui/chatUI.js";
import { getGroups } from "./services/api.js";

// Verificar usuario
const user = JSON.parse(localStorage.getItem("user"));
if (!user) redirectToLogin();

// Elementos del DOM
let chatForm, messageInput, logoutBtn, usersToggle, userPanel, closePanel;
let userImgEl, userNameEl, chatTitle, usersCount;

// Variables globales
let currentGroup = null;
let isUserPanelOpen = false;

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function() {
    initializeDOM();
    initializeUser();
    loadGroups();
    connect(user);
    setupEventListeners();
});

function initializeDOM() {
    chatForm = document.getElementById("chatForm");
    messageInput = document.getElementById("messageInput");
    logoutBtn = document.getElementById("logoutBtn");
    usersToggle = document.getElementById("usersToggle");
    userPanel = document.getElementById("userPanel");
    closePanel = document.getElementById("closePanel");
    userImgEl = document.getElementById("currentUserImg");
    userNameEl = document.getElementById("currentUserName");
    chatTitle = document.getElementById("chat-username");
    usersCount = document.getElementById("usersCount");
}

function initializeUser() {
    document.getElementById("chat-username").textContent = "Bienvenido " + user.name;
    userNameEl.textContent = user.name;
    
    if (user.img && user.img.trim() !== "") {
        userImgEl.src = user.img;
    } else {
        userImgEl.src = "/img/default-avatar.png";
    }
}

function setupEventListeners() {
    chatForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const text = messageInput.value.trim();
        
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

    usersToggle.addEventListener("click", toggleUserPanel);
    closePanel.addEventListener("click", closeUserPanel);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isUserPanelOpen) {
            closeUserPanel();
        }
    });

    chatTitle.addEventListener("click", function() {
        if (isUserPanelOpen) {
            closeUserPanel();
        } else {
            toggleUserPanel();
        }
    });
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
        messageInput.disabled = true;
        isUserPanelOpen = true;
    }
}

function closeUserPanel() {
    if (userPanel) {
        userPanel.classList.remove('active');
        messageInput.disabled = false;
        isUserPanelOpen = false;
        
        setTimeout(() => {
            if (messageInput) messageInput.focus();
        }, 100);
    }
}

async function loadGroups() {
    try {
        const groups = await getGroups();
        console.log("Grupos disponibles:", groups);
        
        updateGroupList(groups, (group) => {
            currentGroup = group;
            setActiveGroup(group);
            setCurrentGroup(group.id);
            
            if (isUserPanelOpen) {
                closeUserPanel();
            }
        });
        
        // Intentar restaurar grupo anterior
        const savedGroup = localStorage.getItem('currentGroup');
        if (savedGroup) {
            currentGroup = JSON.parse(savedGroup);
            setActiveGroup(currentGroup);
            setCurrentGroup(currentGroup.id);
        } else if (groups.length > 0) {
            currentGroup = groups[0];
            setActiveGroup(groups[0]);
            setCurrentGroup(groups[0].id);
        }
    } catch (error) {
        console.error("Error cargando grupos:", error);
        const defaultGroup = {
            id: 1,
            name: "General",
            description: "Chat general",
            img: "https://cdn-icons-png.flaticon.com/512/1006/1006771.png"
        };
        currentGroup = defaultGroup;
        setActiveGroup(defaultGroup);
        setCurrentGroup(defaultGroup.id);
    }
}