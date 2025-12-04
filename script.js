const backend = "https://chat-app-876w.onrender.com";
const socket = io(backend);

// Inputs
const senderInput = document.getElementById("sender");
const receiverInput = document.getElementById("receiver");
const msgInput = document.getElementById("msg");
const chatBox = document.getElementById("messages");

// ---------------------------
// USER ONLINE STATUS
// ---------------------------
function setOnline() {
    const user = senderInput.value.trim();
    if (user) {
        socket.emit("userOnline", user);
    }
}

senderInput.addEventListener("input", setOnline);

// Display online users
socket.on("onlineUsers", (users) => {
    const receiver = receiverInput.value.trim();

    const statusBox = document.getElementById("status");
    if (!statusBox) return;

    if (receiver && users[receiver]) {
        statusBox.innerHTML = `🟢 ${receiver} Online`;
        statusBox.style.color = "green";
    } else {
        statusBox.innerHTML = `🔴 ${receiver} Offline`;
        statusBox.style.color = "red";
    }
});

// ---------------------------
// SEND MESSAGE
// ---------------------------
function send() {
    const sender = senderInput.value.trim();
    const receiver = receiverInput.value.trim();
    const text = msgInput.value.trim();

    if (!sender || !receiver || !text) {
        alert("Please fill all fields");
        return;
    }

    const data = { sender, receiver, text };

    fetch(`${backend}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    msgInput.value = "";
}

// ---------------------------
// TYPING INDICATOR
// ---------------------------
msgInput.addEventListener("input", () => {
    const sender = senderInput.value.trim();
    const receiver = receiverInput.value.trim();
    if (!sender || !receiver) return;

    socket.emit("typing", { sender, receiver });
});

socket.on("typing", (data) => {
    const currentUser = senderInput.value.trim();
    if (data.receiver === currentUser) showTyping(`${data.sender} is typing…`);
});

function showTyping(text) {
    let t = document.getElementById("typing");
    if (!t) {
        t = document.createElement("div");
        t.id = "typing";
        t.style.fontStyle = "italic";
        t.style.color = "gray";
        chatBox.appendChild(t);
    }
    t.innerText = text;

    setTimeout(() => t.remove(), 1500);
}

// ---------------------------
// ADD MESSAGE TO CHAT (with ticks)
// ---------------------------
function addMessage(msg) {
    const sender = senderInput.value.trim();
    const receiver = receiverInput.value.trim();

    // Only show messages between the selected sender/receiver
    if (!(
        (msg.sender === sender && msg.receiver === receiver) ||
        (msg.sender === receiver && msg.receiver === sender)
    )) return;

    const div = document.createElement("div");
    div.id = msg._id;
    div.style.margin = "6px";
    div.style.padding = "6px 10px";
    div.style.borderRadius = "8px";
    div.style.maxWidth = "70%";

    const isMine = msg.sender === sender;

    div.style.background = isMine ? "#dcf8c6" : "#fff";
    div.style.alignSelf = isMine ? "flex-end" : "flex-start";

    // Read status ticks
    let ticks = "";
    if (isMine) {
        ticks = msg.read ? "✓✓" : "✓";
    }

    div.innerHTML = `
        <b>${msg.sender}:</b> ${msg.text}
        <span style="float:right; color:gray; font-size:12px">${ticks}</span>
    `;

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Mark message as read when receiver views it
    if (msg.receiver === sender) {
        socket.emit("markRead", msg._id);
    }
}

// ---------------------------
// REAL-TIME NEW MESSAGE
// ---------------------------
socket.on("newMessage", (msg) => {
    addMessage(msg);
});

// ---------------------------
// READ RECEIPT UPDATED ✓✓
// ---------------------------
socket.on("readReceipt", (msgId) => {
    const msgDiv = document.getElementById(msgId);
    if (msgDiv) {
        msgDiv.innerHTML = msgDiv.innerHTML.replace("✓", "✓✓");
    }
});

// ---------------------------
// AUTO-DELETED MESSAGE
// ---------------------------
socket.on("deleteMessage", (id) => {
    const msgElement = document.getElementById(id);
    if (msgElement) msgElement.remove();
});

// ---------------------------
// LOAD OLD MESSAGES
// ---------------------------
window.onload = function () {
    fetch(`${backend}/messages`)
        .then(res => res.json())
        .then(data => data.forEach(addMessage));
};
