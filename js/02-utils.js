// VaeltrixAI — Utils: toast, scroll-to-bottom, offline indicator

// ============ SCROLL KE BAWAH ============
function scrollChatToBottom() {
  const chat = document.getElementById("chat");
  if (chat) chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
}
function updateScrollBtnVisibility() {
  const chat = document.getElementById("chat");
  const btn = document.getElementById("scroll-bottom-btn");
  if (!chat || !btn) return;
  const distanceFromBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight;
  btn.classList.toggle("show", distanceFromBottom > 200);
}

// ============ INDIKATOR KONEKSI TERPUTUS ============
function setOfflineBanner(isOffline) {
  let banner = document.getElementById("offline-banner");
  if (isOffline) {
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "offline-banner";
      banner.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg> Koneksi Terputus — Cek Internet Kamu`;
      document.body.appendChild(banner);
    }
    requestAnimationFrame(() => banner.classList.add("show"));
  } else if (banner) {
    banner.classList.remove("show");
    showToast("Koneksi Kembali Normal...");
  }
}

function showToast(msg, isError = false) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = isError ? "show error" : "show";
  setTimeout(() => t.className = "", 3500);
}

