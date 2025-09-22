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
const userImgEl = document.getElementById("currentUserImg");
const userNameEl = document.getElementById("currentUserName");

if (user.img && user.img.trim() !== "") {
    userImgEl.src = user.img;
} else {
    userImgEl.src = "/img/default-avatar.png"; // fallback si no hay imagen
}

document.addEventListener("DOMContentLoaded", () => {
  const chatTitle = document.getElementById("chat-username");
  const userPanel = document.getElementById("userPanel");
  const closePanel = document.getElementById("closePanel");

  chatTitle.addEventListener("click", () => {
    userPanel.classList.add("active");
  });

  closePanel.addEventListener("click", () => {
    userPanel.classList.remove("active");
  });
});

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
