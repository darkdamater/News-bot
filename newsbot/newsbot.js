const BASE_URL      = "https://newsapi.org/v2/everything";
const HEADLINES_URL = "https://newsapi.org/v2/top-headlines";
const API_KEY = "da8cb35579b94a03954700a9b6b78a6a";

const chatOutput   = document.getElementById("chat-output");
const userInput    = document.getElementById("user-input");
const sendBtn      = document.getElementById("send-btn");
const modal        = document.getElementById("article-modal");
const modalTitle   = document.getElementById("modal-title");
const modalSource  = document.getElementById("modal-source");
const modalAuthor  = document.getElementById("modal-author");
const modalImage   = document.getElementById("modal-image");
const modalDesc    = document.getElementById("modal-description");
const modalContent = document.getElementById("modal-content");
const modalTime    = document.getElementById("modal-time");
const modalLink    = document.getElementById("modal-link");
const modalClose   = document.getElementById("modal-close");

//Stars on the background
const canvas = document.getElementById("stars");
const ctx    = canvas.getContext("2d");
let stars    = [];

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

function initStars() {
  stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.2,
      a: Math.random(),
      s: Math.random() * 0.3 + 0.1,
      d: Math.random() > 0.5 ? 1 : -1
    });
  }
}

function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach(s => {
    s.a += s.s * 0.008 * s.d;
    if (s.a >= 1 || s.a <= 0.05) s.d *= -1;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180, 220, 255, ${s.a})`;
    ctx.fill();
  });
  requestAnimationFrame(drawStars);
}

resizeCanvas();
initStars();
drawStars();
window.addEventListener("resize", () => { resizeCanvas(); initStars(); });

// ── CLOCK ──────────────────────────────────────────────
function updateClock() {
  const el = document.getElementById("clock");
  if (!el) return;
  const now = new Date();
  el.textContent = now.toUTCString().replace("GMT", "GST");
}
updateClock();
setInterval(updateClock, 1000);

// ── TAG HINTS ─────────────────────────────────────────
document.querySelectorAll(".tag").forEach(tag => {
  tag.addEventListener("click", () => {
    userInput.value = tag.textContent;
    userInput.focus();
  });
});

// ── TOP HEADLINES ON LOAD ──────────────────────────────
async function loadHeadlines() {
  const loadingEl = addLoadingMessage("INITIALISING LIVE FEED — fetching top transmissions");
  try {
    const url = `${HEADLINES_URL}?language=en&pageSize=6&apiKey=${API_KEY}`;
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const articles = data.articles.filter(a => a.title && a.title !== "[Removed]").slice(0, 6);
    chatOutput.removeChild(loadingEl);
    addBotMessage(articles, "🛰 TOP HEADLINES — LIVE BROADCAST");
  } catch (err) {
    chatOutput.removeChild(loadingEl);
    addBotMessage(null);
  }
}

loadHeadlines();

// ── SEND HANDLERS ─────────────────────────────────────
sendBtn.addEventListener("click", handleUserInput);
userInput.addEventListener("keyup", e => {
  if (e.key === "Enter") handleUserInput();
});

async function handleUserInput() {
  const topic = userInput.value.trim();
  if (!topic) return;

  addUserMessage(topic);
  userInput.value = "";

  const loadingEl = addLoadingMessage();
  const articles  = await fetchNews(topic);
  chatOutput.removeChild(loadingEl);
  addBotMessage(articles);
}

// ── USER MESSAGE ───────────────────────────────────────
function addUserMessage(text) {
  const wrap = document.createElement("div");
  wrap.classList.add("message", "user-message");

  const bubble = document.createElement("div");
  bubble.classList.add("user-bubble");
  bubble.textContent = text;

  wrap.appendChild(bubble);
  chatOutput.appendChild(wrap);
  scrollDown();
}

// ── LOADING ────────────────────────────────────────────
function addLoadingMessage(text = "Retrieving transmissions from the grid") {
  const wrap = document.createElement("div");
  wrap.classList.add("message", "bot-message");
  wrap.innerHTML = `
    <div class="bot-avatar">◈</div>
    <div class="bot-content">
      <p class="sys-label">SCANNING</p>
      <div class="loading-msg">
        ${text}
        <div class="loading-dots"><span></span><span></span><span></span></div>
      </div>
    </div>`;
  chatOutput.appendChild(wrap);
  scrollDown();
  return wrap;
}

// ── FETCH ──────────────────────────────────────────────
async function fetchNews(topic) {
  const url = `${BASE_URL}?q=${encodeURIComponent(topic)}&apiKey=${API_KEY}&pageSize=5`;
  try {
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.articles.slice(0, 5);
  } catch (err) {
    console.error(err);
    return null;
  }
}

// ── BOT MESSAGE ────────────────────────────────────────
function addBotMessage(articles, customLabel = null) {
  const wrap = document.createElement("div");
  wrap.classList.add("message", "bot-message");

  const avatar = document.createElement("div");
  avatar.classList.add("bot-avatar");
  avatar.textContent = "◈";

  const content = document.createElement("div");
  content.classList.add("bot-content");

  const label = document.createElement("p");
  label.classList.add("sys-label");

  if (articles === null) {
    label.textContent = "ERROR";
    const msg = document.createElement("p");
    msg.classList.add("error-msg");
    msg.textContent = "Signal lost. Unable to retrieve transmissions. Check your API credentials.";
    content.appendChild(label);
    content.appendChild(msg);
  } else if (articles.length === 0) {
    label.textContent = "EMPTY SECTOR";
    const msg = document.createElement("p");
    msg.textContent = "No transmissions found for that topic. Try a different signal.";
    content.appendChild(label);
    content.appendChild(msg);
  } else {
    label.textContent = customLabel || `${articles.length} TRANSMISSIONS RECEIVED`;
    content.appendChild(label);

    const list = document.createElement("ul");
    list.classList.add("article-list");

    articles.forEach(article => {
      const li = document.createElement("li");

      const link = document.createElement("a");
      link.href   = article.url;
      link.target = "_blank";
      link.rel    = "noopener noreferrer";
      link.textContent = article.title;

      const desc = document.createElement("p");
      desc.classList.add("description");
      desc.textContent = article.description || "No description available.";

      const src = document.createElement("p");
      src.classList.add("source");
      src.textContent = article.source.name;

      li.appendChild(link);
      li.appendChild(desc);
      li.appendChild(src);

      li.addEventListener("click", () => showArticleDetails(article));
      link.addEventListener("click", e => e.stopPropagation());

      list.appendChild(li);
    });

    content.appendChild(list);
  }

  wrap.appendChild(avatar);
  wrap.appendChild(content);
  chatOutput.appendChild(wrap);
  scrollDown();
}

function scrollDown() {
  chatOutput.scrollTop = chatOutput.scrollHeight;
}

function formatPublishedDate(value) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  return date.toUTCString().replace("GMT", "GST");
}

function showArticleDetails(article) {
  modalTitle.textContent = article.title || "Untitled transmission";
  modalSource.textContent = article.source?.name ? `SOURCE: ${article.source.name}` : "SOURCE: UNKNOWN";
  modalAuthor.textContent = `${article.author || article.source?.name || "Unknown reporter"} · ${formatPublishedDate(article.publishedAt)}`;
  modalDesc.textContent = article.description || "No synopsis available.";
  modalContent.textContent = article.content || "Full content is unavailable. Use the link below to read the complete story.";
  modalTime.textContent = article.publishedAt ? `Published: ${formatPublishedDate(article.publishedAt)}` : "Published date unavailable.";
  modalLink.href = article.url || "#";

  if (article.urlToImage) {
    modalImage.src = article.urlToImage;
    modalImage.style.display = "block";
  } else {
    modalImage.style.display = "none";
  }

  modal.classList.add("active");
}

function hideArticleDetails() {
  modal.classList.remove("active");
}

modalClose.addEventListener("click", hideArticleDetails);
modal.addEventListener("click", event => {
  if (event.target === modal) hideArticleDetails();
});
