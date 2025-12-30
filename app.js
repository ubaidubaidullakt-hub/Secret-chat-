// 🔥 Firebase config (replace with yours)
const firebaseConfig = {
  apiKey: "AIzaSyBfm9sdgiWVParO8zI2gP7xATUCODCLkzw",
  authDomain: "secret-chat-2f397.firebaseapp.com",
  databaseURL: "https://secret-chat-2f397-default-rtdb.firebaseio.com",
  projectId: "secret-chat-2f397",
  storageBucket: "secret-chat-2f397.appspot.com",
  messagingSenderId: "1022707339714",
  appId: "1:1022707339714:web:e5a96bd6c899fb1c59465b"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 🔐 Secret key
const SECRET_KEY = "1111";

// Username
let username = localStorage.getItem("name") || prompt("Enter your name");
localStorage.setItem("name", username);

// Crypto
let cryptoKey;
let userId = Math.random().toString(36).slice(2);

// Room & references
const room = "main";
const msgRef = db.ref("rooms/" + room + "/messages");
const usersRef = db.ref("rooms/" + room + "/users");

// Add user to online list
usersRef.child(userId).set(username);
usersRef.child(userId).onDisconnect().remove();

// Show online users
usersRef.on("value", s => {
  const u = s.val() || {};
  document.getElementById("users").innerText = "Online: " + Object.values(u).join(", ");
});

// Unlock function
async function unlock() {
  const keyInput = document.getElementById("keyInput");
  if (keyInput.value !== SECRET_KEY) {
    alert("Wrong key");
    return;
  }

  cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET_KEY),
    "AES-GCM",
    false,
    ["encrypt","decrypt"]
  );

  document.getElementById("lock").hidden = true;
  document.getElementById("chat").hidden = false;
}

// Encrypt / Decrypt
async function encrypt(text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    new TextEncoder().encode(text)
  );
  return btoa(String.fromCharCode(...iv)) + ":" + btoa(String.fromCharCode(...new Uint8Array(enc)));
}

async function decrypt(data) {
  try {
    const [iv, enc] = data.split(":");
    const dec = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: Uint8Array.from(atob(iv), c=>c.charCodeAt(0)) },
      cryptoKey,
      Uint8Array.from(atob(enc), c=>c.charCodeAt(0))
    );
    return new TextDecoder().decode(dec);
  } catch {
    return "❌ Encrypted";
  }
}

// Load messages
msgRef.limitToLast(200).on("child_added", async snap => {
  const d = snap.val();
  const div = document.createElement("div");
  div.className = "msg";
  div.innerHTML = `<b>${d.name}</b>: ${await decrypt(d.enc)}`;
  document.getElementById("messages").appendChild(div);
});

// Send message
async function send() {
  const msg = document.getElementById("msg");
  if (!msg.value) return;

  msgRef.push({
    name: username,
    enc: await encrypt(msg.value),
    owner: userId,
    time: Date.now()
  });

  msg.value = "";
}

// Change name
function changeName() {
  const n = prompt("New name");
  if (n) {
    username = n;
    localStorage.setItem("name", n);
    usersRef.child(userId).set(n);
  }
}