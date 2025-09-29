const fs = require("fs");
const path = require("path");

const USERS_FILE = path.join(__dirname, "..", "data", "users.json");

function getData() {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function saveData(data) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

function getUsers() {
    return getData().users;
}

function getGroups() {
    return getData().groups || [];
}

function saveUsers(users) {
    const data = getData();
    data.users = users;
    saveData(data);
}

module.exports = { getUsers, saveUsers, getGroups };