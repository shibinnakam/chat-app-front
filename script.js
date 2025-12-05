const backend = "https://chat-app-876w.onrender.com";
const socket = io(backend);

// Inputs
const senderInput = document.getElementById("sender");
const receiverInput = document.getElementById("receiver");
const msgInput = document.getElementById("msg");
const chatBox = document.getElementById("messages");

// Create audio element dynamically
const msgSound = new Audio("./message.mp3");
msgSound.preload = "auto";
let audioUnlocked = false;

// ---------------------------
// UNLOCK AUDIO ON FIRST INTERACTION (for desktop/laptop)
document.body.addEventListener("click", () => {
    if (!audioUnlocked) {
        msgSound.play().catch(() => {
            msgSound.pause();
            msgSound.currentTime = 0;
        });
        audioUnlocked = true;
    }
}, { once: true });

// ---------------------------
// USER ONLINE STATUS
// ---------------------------
function setOnline() {
    const user = senderInput.value.trim();
    if (user) socket.emit("userOnline", user);
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
// CHECK IF MESSAGE IS VISIBLE ON SCREEN
// ---------------------------
function isInView(element) {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
}

// ---------------------------
// ADD MESSAGE TO CHAT
// ---------------------------
function addMessage(msg) {
    const sender = senderInput.value.trim();
    const receiver = receiverInput.value.trim();

    if (!(
        (msg.sender === sender && msg.receiver === receiver) ||
        (msg.sender === receiver && msg.receiver === sender)
    )) return;

    const div = document.createElement("div");
    div.id = msg._id;
    div.className = msg.sender === sender ? "sent" : "received";

    // Ticks for delivery/read
    let ticks = "";
    if (msg.sender === sender) {
        if (msg.read) ticks = `<span style="color:blue">✓✓</span>`;
        else if (msg.delivered) ticks = "✓✓";
        else ticks = "✓";
    }

    div.innerHTML = `
        <b>${msg.sender}:</b> ${msg.text}
        <span style="float:right; font-size:12px; color:gray">${ticks}</span>
    `;

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Play sound for incoming messages (other sender)
    if (msg.sender !== sender && audioUnlocked) {
        msgSound.play().catch(() => {});
    }

    // DELIVERED (receiver online)
    if (msg.receiver === sender) socket.emit("delivered", msg._id);
}

// ---------------------------
// REAL-TIME NEW MESSAGE
// ---------------------------
socket.on("newMessage", (msg) => addMessage(msg));

// ---------------------------
// READ RECEIPT → MAKE TICK BLUE
// ---------------------------
socket.on("readReceipt", (msgId) => {
    const msgDiv = document.getElementById(msgId);
    if (msgDiv) {
        msgDiv.innerHTML = msgDiv.innerHTML.replace("✓✓", `<span style="color:blue">✓✓</span>`);
    }
});

// ---------------------------
// AUTO-DELETE MESSAGE
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

// ---------------------------
// DETECT WHEN RECEIVER SEES MESSAGE → READ
// ---------------------------
function checkVisibleMessages() {
    const sender = senderInput.value.trim();
    const receiver = receiverInput.value.trim();

    const receivedMsgs = document.querySelectorAll(".received");
    receivedMsgs.forEach(msgDiv => {
        if (isInView(msgDiv)) {
            const msgId = msgDiv.id;
            if (!msgDiv.dataset.readSent) {
                msgDiv.dataset.readSent = "true";
                socket.emit("read", msgId);
            }
        }
    });
}

document.getElementById("messages").addEventListener("scroll", checkVisibleMessages);
setInterval(checkVisibleMessages, 1000);
