const messagesDiv = document.getElementById("messages");
const userList = document.getElementById("userList");

function fixChatHeight() {
    document.querySelector(".chat-container").style.height = window.innerHeight + "px";
}
window.addEventListener("resize", fixChatHeight);
fixChatHeight();

export function addMessage(user, text, isSelf = false) {
    const msgEl = document.createElement("div");
    msgEl.classList.add("message");
    if (isSelf) msgEl.classList.add("self");
    msgEl.innerHTML = `<strong>${user}: </strong>${text}`;
    messagesDiv.appendChild(msgEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

export function addSystemMessage(text) {
    const msgEl = document.createElement("div");
    msgEl.classList.add("message", "system");
    msgEl.innerHTML = `<em>⚙️ ${text}</em>`;
    messagesDiv.appendChild(msgEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

export function updateUserList(users) {
    userList.innerHTML = "";
    users.forEach(u => {
        const li = document.createElement("li");
        li.classList.add("user-item");

        li.innerHTML = `
            <div class="user-avatar">
                <img src="${u.img}" alt="${u.name}" class="avatar-img">
                <span class="status ${u.connected ? "online" : "offline"}"></span>
            </div>
            <div class="user-info">
                <span class="user-name">${u.name}</span>
                <small class="user-role">${u.rol}</small>
            </div>
        `;

        userList.appendChild(li);
    });
}

export function showUserList(list, show) {
    if (show) {
        list.classList.add("active");
    } else {
        list.classList.remove("active");
    }
}

export function clearUser() {
    localStorage.removeItem("username");
}

export function redirectToLogin() {
    window.location.href = "/login.html";
}
