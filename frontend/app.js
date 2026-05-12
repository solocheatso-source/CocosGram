const state = {
  token: localStorage.getItem("cocosgram.token") || "",
  user: null,
  tab: "feed",
  feed: [],
  people: [],
  chats: [],
  activeChat: null,
  messages: [],
  socket: null,
};

const app = document.getElementById("app");
const bottomNav = document.getElementById("bottomNav");
const topbarActions = document.getElementById("topbarActions");

boot();

async function boot() {
  const tokenFromHash = new URLSearchParams(location.hash.slice(1)).get("token");
  if (tokenFromHash) {
    state.token = tokenFromHash;
    localStorage.setItem("cocosgram.token", tokenFromHash);
    history.replaceState(null, "", location.pathname);
  }

  if (state.token) {
    try {
      state.user = await api("/api/me");
      connectSocket();
      await loadFeed();
    } catch {
      logout();
      return;
    }
  }

  render();
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Ошибка запроса");
  }

  return response.headers.get("content-type")?.includes("application/json")
    ? response.json()
    : response.text();
}

function render() {
  topbarActions.innerHTML = state.user
    ? `<button class="btn" id="logoutBtn">Выйти</button>`
    : "";
  document.getElementById("logoutBtn")?.addEventListener("click", logout);

  bottomNav.classList.toggle("hidden", !state.user);
  bottomNav.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === state.tab);
    button.onclick = () => setTab(button.dataset.tab);
  });

  if (!state.user) {
    renderAuth();
    return;
  }

  app.innerHTML = `
    <div class="layout">
      <aside class="side">
        <div class="nav">
          ${navButton("feed", "Лента")}
          ${navButton("messages", "Сообщения")}
          ${navButton("people", "Люди")}
          ${navButton("settings", "Настройки")}
        </div>
        <div class="card person" style="margin-top:14px">
          <div class="row">
            ${avatar(state.user)}
            <div>
              ${nameLine(state.user)}
              <div class="muted">@${state.user.username || "username"}</div>
            </div>
          </div>
        </div>
      </aside>
      <section>${renderTab()}</section>
    </div>
  `;

  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => setTab(button.dataset.nav));
  });
  bindTab();
}

function renderAuth() {
  app.innerHTML = `
    <section class="auth">
      <div class="card auth-card">
        <h1>Вход</h1>
        <p class="muted">Аккаунт создается только после Google OAuth или подтверждения кода с почты.</p>
        <div class="form">
          <a class="btn primary" style="display:grid;place-items:center;text-decoration:none" href="/api/auth/google/start">Войти через Google</a>
          <input class="input" id="emailInput" placeholder="Почта">
          <button class="btn" id="requestCodeBtn">Получить код</button>
          <input class="input" id="codeInput" placeholder="Код из письма">
          <input class="input" id="nameInput" placeholder="Имя">
          <button class="btn primary" id="verifyCodeBtn">Войти по коду</button>
        </div>
      </div>
    </section>
  `;

  document.getElementById("requestCodeBtn").onclick = requestEmailCode;
  document.getElementById("verifyCodeBtn").onclick = verifyEmailCode;
}

function renderTab() {
  if (state.tab === "feed") {
    return `
      <div class="feed">
        ${state.feed.length ? state.feed.map(renderPost).join("") : `<div class="card empty">Постов пока нет</div>`}
      </div>
    `;
  }

  if (state.tab === "people") {
    return `
      <div class="panel-stack">
        <div class="card" style="padding:14px">
          <input class="input" id="searchInput" placeholder="Поиск по @username">
        </div>
        <div class="grid-list" id="peopleList">
          ${state.people.length ? state.people.map(renderPerson).join("") : `<div class="card empty">Введите username</div>`}
        </div>
      </div>
    `;
  }

  if (state.tab === "messages") {
    return `
      <div class="card chat-window">
        <div class="chat-list">
          ${state.chats.length ? state.chats.map(renderChat).join("") : `<div class="empty">Переписок пока нет</div>`}
        </div>
        <div class="messages">
          <div class="message-list" id="messageList">
            ${state.activeChat ? state.messages.map(renderMessage).join("") : `<div class="empty">Выберите диалог</div>`}
          </div>
          ${state.activeChat ? `
            <div class="composer">
              <input class="input" id="messageInput" placeholder="Сообщение">
              <button class="btn primary" id="sendMessageBtn">Отправить</button>
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }

  return `
    <div class="panel-stack">
      <div class="card" style="padding:14px">
        <h2 style="margin:0 0 12px">Настройки</h2>
        <div class="form">
          <input class="input" id="usernameInput" value="${escapeHtml(state.user.username || "")}" placeholder="username">
          <button class="btn primary" id="saveUsernameBtn">Сохранить username</button>
        </div>
      </div>
      <div class="card settings-row">
        <div>
          <b>Тема</b>
          <div class="muted">Светлая или угольно-черная</div>
        </div>
        <button class="btn" id="themeBtn">Переключить</button>
      </div>
      <div class="card settings-row">
        <div>
          <b>Конфиденциальность</b>
          <div class="muted">Закрытый профиль и сообщения</div>
        </div>
        <button class="btn" id="privacyBtn">${state.user.privacy?.privateProfile ? "Закрыт" : "Открыт"}</button>
      </div>
      <div class="card" style="padding:14px">
        <h3 style="margin:0 0 10px">Заявка на галочку</h3>
        <textarea class="textarea" id="verifyReason" placeholder="Почему аккаунт должен быть подтвержден"></textarea>
        <input class="input" id="verifyLinks" placeholder="Ссылки через запятую">
        <button class="btn primary" id="applyVerifyBtn" style="margin-top:10px">Отправить заявку</button>
      </div>
    </div>
  `;
}

function bindTab() {
  if (state.tab === "people") {
    const input = document.getElementById("searchInput");
    input?.addEventListener("input", debounce(async () => {
      const value = input.value.trim();
      state.people = value.length >= 2 ? await api(`/api/users/search?username=${encodeURIComponent(value)}`) : [];
      render();
    }, 250));
  }

  if (state.tab === "messages") {
    document.querySelectorAll("[data-chat]").forEach((button) => {
      button.addEventListener("click", async () => {
        state.activeChat = button.dataset.chat;
        state.messages = await api(`/api/chats/${state.activeChat}/messages`);
        render();
      });
    });
    document.getElementById("sendMessageBtn")?.addEventListener("click", sendMessage);
  }

  if (state.tab === "settings") {
    document.getElementById("saveUsernameBtn")?.addEventListener("click", saveUsername);
    document.getElementById("themeBtn")?.addEventListener("click", toggleTheme);
    document.getElementById("privacyBtn")?.addEventListener("click", togglePrivacy);
    document.getElementById("applyVerifyBtn")?.addEventListener("click", applyVerification);
  }

  document.querySelectorAll("[data-open-user]").forEach((button) => {
    button.addEventListener("click", async () => {
      const chat = await api("/api/chats/direct", {
        method: "POST",
        body: JSON.stringify({ userId: button.dataset.openUser }),
      });
      state.tab = "messages";
      await loadChats();
      state.activeChat = chat.id;
      state.messages = await api(`/api/chats/${chat.id}/messages`);
      render();
    });
  });
}

async function requestEmailCode() {
  const email = document.getElementById("emailInput").value;
  await api("/api/auth/email/request-code", { method: "POST", body: JSON.stringify({ email }) });
  toast("Код отправлен на почту");
}

async function verifyEmailCode() {
  const payload = {
    email: document.getElementById("emailInput").value,
    code: document.getElementById("codeInput").value,
    displayName: document.getElementById("nameInput").value,
  };
  const session = await api("/api/auth/email/verify", { method: "POST", body: JSON.stringify(payload) });
  state.token = session.token;
  state.user = session.user;
  localStorage.setItem("cocosgram.token", state.token);
  connectSocket();
  await loadFeed();
  render();
}

async function loadFeed() {
  const data = await api("/api/feed");
  state.feed = data.posts || [];
}

async function loadChats() {
  state.chats = await api("/api/chats");
}

async function setTab(tab) {
  state.tab = tab;
  if (tab === "feed") await loadFeed();
  if (tab === "messages") await loadChats();
  render();
}

async function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text || !state.activeChat) return;
  await api(`/api/chats/${state.activeChat}/messages`, { method: "POST", body: JSON.stringify({ text }) });
  input.value = "";
}

async function saveUsername() {
  const username = document.getElementById("usernameInput").value;
  state.user = await api("/api/me/username", { method: "PUT", body: JSON.stringify({ username }) });
  toast("Username сохранен");
  render();
}

async function togglePrivacy() {
  const privacy = { ...(state.user.privacy || {}), privateProfile: !state.user.privacy?.privateProfile };
  state.user = await api("/api/me/privacy", { method: "PUT", body: JSON.stringify({ privacy }) });
  render();
}

async function applyVerification() {
  const reason = document.getElementById("verifyReason").value;
  const links = document.getElementById("verifyLinks").value.split(",").map(x => x.trim()).filter(Boolean);
  await api("/api/verification/apply", { method: "POST", body: JSON.stringify({ reason, links }) });
  toast("Заявка отправлена");
}

function connectSocket() {
  if (state.socket) state.socket.close();
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  state.socket = new WebSocket(`${protocol}://${location.host}/ws?token=${encodeURIComponent(state.token)}`);
  state.socket.onmessage = async (event) => {
    const message = JSON.parse(event.data);
    if (message.eventName === "message.created") {
      await loadChats();
      if (state.activeChat === message.payload.chatId) {
        state.messages = await api(`/api/chats/${state.activeChat}/messages`);
      }
      render();
    }
  };
}

function logout() {
  localStorage.removeItem("cocosgram.token");
  state.token = "";
  state.user = null;
  state.socket?.close();
  state.socket = null;
  render();
}

function toggleTheme() {
  document.documentElement.dataset.theme = document.documentElement.dataset.theme === "dark" ? "" : "dark";
}

function navButton(tab, label) {
  return `<button data-nav="${tab}" class="${state.tab === tab ? "active" : ""}">${label}</button>`;
}

function renderPost(post) {
  return `
    <article class="card post">
      <header class="post-head">
        <div class="row">${avatar(post.author)}<div>${nameLine(post.author)}<div class="muted">@${post.author.username}</div></div></div>
        <span class="muted">${new Date(post.createdAtUtc).toLocaleDateString()}</span>
      </header>
      <div class="post-body">${escapeHtml(post.text)}</div>
      <footer class="post-actions">
        <button class="icon-btn">♡ ${post.likesCount}</button>
        <button class="icon-btn">Ответить</button>
      </footer>
    </article>
  `;
}

function renderPerson(user) {
  return `
    <article class="card person">
      <div class="row">${avatar(user)}<div>${nameLine(user)}<div class="muted">@${user.username}</div></div></div>
      <button class="btn primary" data-open-user="${user.id}">Написать</button>
    </article>
  `;
}

function renderChat(chat) {
  return `
    <button class="chat ${state.activeChat === chat.id ? "active" : ""}" data-chat="${chat.id}" style="width:100%;border:0;border-bottom:1px solid var(--line);background:transparent;text-align:left">
      <div class="row">${avatar(chat.peer)}<div>${nameLine(chat.peer)}<div class="muted">${chat.lastMessage ? escapeHtml(chat.lastMessage.text) : "Нет сообщений"}</div></div></div>
    </button>
  `;
}

function renderMessage(message) {
  return `<div class="bubble ${message.sender.id === state.user.id ? "mine" : ""}">${escapeHtml(message.text)}<div class="muted" style="font-size:11px;margin-top:6px">${new Date(message.createdAtUtc).toLocaleTimeString()}</div></div>`;
}

function avatar(user) {
  return `<img class="avatar" src="${escapeAttr(user.avatarUrl || "/assets/avatar.svg")}" alt="">`;
}

function nameLine(user) {
  return `<div class="name-line">${escapeHtml(user.displayName)}${user.isVerified ? `<span class="verified">✓</span>` : ""}</div>`;
}

function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

function toast(text) {
  let node = document.querySelector(".toast");
  if (!node) {
    node = document.createElement("div");
    node.className = "toast";
    document.body.appendChild(node);
  }
  node.textContent = text;
  node.classList.add("show");
  setTimeout(() => node.classList.remove("show"), 2200);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[ch]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
