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
    const msgEl = document.createElement("div");
    msgEl.classList.add("message", "system");
    msgEl.innerHTML = `<em>⚙️ ${text}</em>`;
    messagesDiv.appendChild(msgEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

export function updateUserList(users) {
     const userList = document.getElementById("userList");
    userList.innerHTML = "";

    // Agrupación por rol o equipo (puedes ajustar a tus datos)
    const groups = {
        admin: [],
        equipoA: [],
        equipoB: []
    };

    // Clasificar usuarios
    users.forEach(u => {
        if (u.rol === "admin") {
            groups.admin.push(u);
        } else if (u.team === "A") {
            groups.equipoA.push(u);
        } else if (u.team === "B") {
            groups.equipoB.push(u);
        }
    });

    // Función para renderizar un bloque
    function renderGroup(title, members) {
        if (members.length === 0) return "";

        let html = `
            <div class="user-group">
                <h4>${title}</h4>
                <hr/>
        `;

        members.forEach(u => {
            html += `
                <div class="user-item">
                    <img src="${u.img}" alt="${u.name}" class="avatar-img">
                    <span class="user-name">${u.name}</span>
                    <span class="status ${u.connected ? "online" : "offline"}"></span>
                </div>
            `;
        });

        html += `</div>`;
        return html;
    }

    // Insertar al sidebar
    userList.innerHTML =
        renderGroup("Admin", groups.admin) +
        renderGroup("Equipo A", groups.equipoA) +
        renderGroup("Equipo B", groups.equipoB);



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
