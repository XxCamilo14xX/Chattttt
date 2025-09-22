import { connect, sendMessage } from "./web/chatSocket.js";
import { showUserList, clearUser, redirectToLogin } from "./ui/chatUI.js";

// Verificar usuario
const user = JSON.parse(localStorage.getItem("user"));
if (!user) redirectToLogin();

document.getElementById("chat-username").textContent = "Bienvenido " + user.name;

// Sidebar y controles
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const logoutBtn = document.getElementById("logoutBtn");
const sidebar = document.getElementById("userSidebar");
const toggleBtn = document.getElementById("usersToggle");
const closeBtn = document.getElementById("closeSidebar");

// Conectar al WebSocket
connect(user);

// Eventos
chatForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (text) {
        sendMessage(user.name, text);
        messageInput.value = "";
    }
});

logoutBtn.addEventListener("click", function() {
    clearUser();
    redirectToLogin();
});

toggleBtn.addEventListener("click", () => {
    showUserList(sidebar, true);
});

closeBtn.addEventListener("click", () => {
    showUserList(sidebar, false);
});
