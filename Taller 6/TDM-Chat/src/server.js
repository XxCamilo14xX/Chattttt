const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const handleUsersRoutes = require("./routes/users");
const handleAuthRoutes = require("./routes/auth");
const setupChat = require("./web/chat");

const PORT = 3000;
const PUBLIC_PATH = path.join(__dirname, "..", "public");

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    // Rutas API
    if (handleUsersRoutes(req, res)) return;
    if (handleAuthRoutes(req, res)) return;

    // Archivos estáticos
    let filePath = req.url === "/" ? "login.html" : req.url;
    const extname = path.extname(filePath);
    const mimeTypes = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "text/javascript",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpg",
        ".gif": "image/gif"
    };

    const fullPath = path.join(PUBLIC_PATH, filePath);

    fs.readFile(fullPath, (err, content) => {
        if (err) {
            res.writeHead(err.code === "ENOENT" ? 404 : 500);
            res.end(err.code === "ENOENT" ? "404 Not Found" : `Error: ${err.code}`);
        } else {
            res.writeHead(200, { "Content-Type": mimeTypes[extname] || "text/plain" });
            res.end(content);
        }
    });
});

// Servidor WS
const wss = new WebSocket.Server({ server });
setupChat(wss);

server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});