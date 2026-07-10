/* MediFlow Pro - Chat Widget
   Self-contained: builds its own styles + markup and appends them to
   <body> on load. Does not read, modify, or depend on any existing
   element, class, or script on the page it's included in. */
(function () {
  const API_URL = "/api/chatbot";
  const TOKEN_KEY = "mf_token";

  /* ── Scoped styles (mf-chat- prefix avoids collisions) ────────────── */
  const style = document.createElement("style");
  style.textContent = `
    #mf-chat-fab {
      position: fixed; bottom: 20px; right: 20px; width: 56px; height: 56px;
      border-radius: 50%; background: #4f46e5; color: #fff; border: none;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; cursor: pointer; box-shadow: 0 6px 20px rgba(79,70,229,.4);
      z-index: 99999;
    }
    #mf-chat-panel {
      position: fixed; bottom: 90px; right: 20px; width: 340px; max-width: 92vw;
      height: 460px; max-height: 70vh; background: #fff; border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0,0,0,.2); display: none; flex-direction: column;
      overflow: hidden; z-index: 99999; font-family: 'Plus Jakarta Sans', Arial, sans-serif;
    }
    #mf-chat-panel.mf-open { display: flex; }
    #mf-chat-header {
      background: #4f46e5; color: #fff; padding: 14px 16px; font-weight: 700;
      display: flex; justify-content: space-between; align-items: center; font-size: .95rem;
    }
    #mf-chat-close { cursor: pointer; background: none; border: none; color: #fff; font-size: 18px; }
    #mf-chat-messages {
      flex: 1; overflow-y: auto; padding: 12px; background: #f8fafc;
      display: flex; flex-direction: column; gap: 8px;
    }
    .mf-msg {
      max-width: 82%; padding: 8px 12px; border-radius: 12px; font-size: .82rem;
      line-height: 1.45; white-space: pre-wrap; word-break: break-word;
    }
    .mf-msg.mf-bot { background: #eef2ff; color: #1e293b; align-self: flex-start; border-bottom-left-radius: 2px; }
    .mf-msg.mf-user { background: #4f46e5; color: #fff; align-self: flex-end; border-bottom-right-radius: 2px; }
    #mf-chat-quick { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 12px; border-top: 1px solid #e2e8f0; }
    .mf-chip {
      background: #eef2ff; color: #4f46e5; border: none; border-radius: 99px;
      padding: 5px 10px; font-size: .7rem; cursor: pointer;
    }
    #mf-chat-inputrow { display: flex; gap: 8px; padding: 10px; border-top: 1px solid #e2e8f0; }
    #mf-chat-input {
      flex: 1; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 10px;
      font-size: .82rem; font-family: inherit; min-width: 0;
    }
    #mf-chat-send {
      background: #4f46e5; color: #fff; border: none; border-radius: 10px;
      padding: 8px 14px; cursor: pointer; font-size: .82rem;
    }
    @media (max-width: 480px) {
      #mf-chat-panel { right: 4vw; left: 4vw; width: auto; bottom: 82px; }
      #mf-chat-fab { right: 16px; bottom: 16px; }
    }
  `;
  document.head.appendChild(style);

  /* ── Markup ─────────────────────────────────────────────────────── */
  const fab = document.createElement("button");
  fab.id = "mf-chat-fab";
  fab.type = "button";
  fab.innerHTML = "💬";
  fab.setAttribute("aria-label", "Open chat assistant");

  const panel = document.createElement("div");
  panel.id = "mf-chat-panel";
  panel.innerHTML = `
    <div id="mf-chat-header">
      <span>🏥 MediFlow Assistant</span>
      <button id="mf-chat-close" type="button" aria-label="Close chat">✕</button>
    </div>
    <div id="mf-chat-messages"></div>
    <div id="mf-chat-quick">
      <button class="mf-chip" type="button" data-q="What are your timings?">Timings</button>
      <button class="mf-chip" type="button" data-q="List doctors">Doctors</button>
      <button class="mf-chip" type="button" data-q="Billing">Billing</button>
      <button class="mf-chip" type="button" data-q="Book an appointment">Appointments</button>
    </div>
    <div id="mf-chat-inputrow">
      <input id="mf-chat-input" type="text" placeholder="Type a message..." />
      <button id="mf-chat-send" type="button">Send</button>
    </div>
  `;

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  const messagesEl = panel.querySelector("#mf-chat-messages");
  const inputEl = panel.querySelector("#mf-chat-input");
  const sendBtn = panel.querySelector("#mf-chat-send");
  const closeBtn = panel.querySelector("#mf-chat-close");

  function addMessage(text, who) {
    const div = document.createElement("div");
    div.className = "mf-msg " + (who === "user" ? "mf-user" : "mf-bot");
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  let greeted = false;
  fab.addEventListener("click", () => {
    panel.classList.toggle("mf-open");
    if (panel.classList.contains("mf-open") && !greeted) {
      greeted = true;
      sendMessage("hi", true);
    }
  });
  closeBtn.addEventListener("click", () => panel.classList.remove("mf-open"));

  panel.querySelectorAll(".mf-chip").forEach((chip) => {
    chip.addEventListener("click", () => sendMessage(chip.getAttribute("data-q")));
  });

  sendBtn.addEventListener("click", () => sendMessage(inputEl.value));
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage(inputEl.value);
  });

  async function sendMessage(text, silent) {
    if (!text || !text.trim()) return;
    if (!silent) addMessage(text, "user");
    inputEl.value = "";

    const typingEl = document.createElement("div");
    typingEl.className = "mf-msg mf-bot";
    typingEl.textContent = "…";
    messagesEl.appendChild(typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      typingEl.remove();
      addMessage(data.reply || "Sorry, I couldn't process that.", "bot");
    } catch (e) {
      typingEl.remove();
      addMessage("⚠️ Can't reach the server right now. Please try again.", "bot");
    }
  }
})();