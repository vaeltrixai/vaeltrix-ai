// VaeltrixAI — Sidebar: sessions, folders, search chat, smart titles

// ============ SIDEBAR ============
const DESKTOP_BREAKPOINT = 900;
function isDesktopLayout() { return window.innerWidth > DESKTOP_BREAKPOINT; }

function toggleSidebar() {
  const sb = document.getElementById("sidebar");
  sb.classList.toggle("hidden");
  const isHidden = sb.classList.contains("hidden");
  if (isDesktopLayout()) {
    localStorage.setItem("vaeltrix_sidebar_collapsed", isHidden ? "true" : "false");
    document.getElementById("overlay").classList.remove("show");
  } else {
    document.getElementById("overlay").classList.toggle("show", !isHidden);
  }
}
function closeSidebar() {
  document.getElementById("sidebar").classList.add("hidden");
  document.getElementById("overlay").classList.remove("show");
  if (isDesktopLayout()) localStorage.setItem("vaeltrix_sidebar_collapsed", "true");
}
function openSidebar() {
  document.getElementById("sidebar").classList.remove("hidden");
  if (isDesktopLayout()) {
    localStorage.setItem("vaeltrix_sidebar_collapsed", "false");
  } else {
    document.getElementById("overlay").classList.add("show");
  }
}
function applyInitialSidebarState() {
  const sb = document.getElementById("sidebar");
  if (isDesktopLayout()) {
    const collapsed = localStorage.getItem("vaeltrix_sidebar_collapsed") === "true";
    sb.classList.toggle("hidden", collapsed);
  } else {
    sb.classList.add("hidden"); // Mobile/tablet: drawer selalu mulai tertutup
  }
  document.getElementById("overlay").classList.remove("show");
}
// Jaga konsistensi state saat window di-resize melewati breakpoint desktop/mobile
let _wasDesktopLayout = isDesktopLayout();
window.addEventListener("resize", () => {
  const nowDesktop = isDesktopLayout();
  if (nowDesktop !== _wasDesktopLayout) {
    _wasDesktopLayout = nowDesktop;
    applyInitialSidebarState();
  }
});
// Swipe kiri sederhana buat nutup sidebar di mobile
(function initSidebarSwipe() {
  const sb = document.getElementById("sidebar");
  let touchStartX = null;
  sb.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  sb.addEventListener("touchend", (e) => {
    if (touchStartX === null || isDesktopLayout()) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (dx < -50) closeSidebar();
    touchStartX = null;
  }, { passive: true });
})();

function togglePanel(id) { document.getElementById(id).classList.toggle("open"); }

// ============ MORE MENU ============
function toggleMoreMenu(e) {
  e.stopPropagation();
  document.getElementById("more-menu").classList.toggle("open");
}


// ============ JUDUL CHAT PINTAR (AI-GENERATED) ============
async function generateSmartTitle(session) {
  if (!session || session.titleGenerated) return;
  const userMsg = session.messages.find(m => m.role === "user")?.content || "";
  const aiMsg = session.messages.find(m => m.role === "ai")?.content || "";
  if (!userMsg) return;
  try {
    const groqKey = localStorage.getItem("vaeltrix_groq_key") || GROQ_KEY;
    const res = await fetch(GROQ_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: "Buat judul chat SANGAT singkat (maksimal 5 kata, bahasa Indonesia) yang merangkum topik percakapan berikut. Balas HANYA judulnya — tanpa tanda kutip, tanpa titik di akhir, tanpa penjelasan tambahan." },
          { role: "user", content: `Pesan User: ${userMsg.slice(0, 300)}\n\nBalasan AI: ${aiMsg.slice(0, 300)}` }
        ],
        max_tokens: 20, temperature: 0.4
      })
    });
    const data = await res.json();
    let title = (data?.choices?.[0]?.message?.content || "").trim();
    title = title.replace(/^["'“”*]+|["'”*]+$/g, "").replace(/\.$/, "").trim();
    if (title.length >= 3 && title.length <= 60) {
      session.title = title.slice(0, 48);
      session.titleGenerated = true;
      saveSessions();
      renderHistory();
    }
  } catch (e) { /* biarin, fallback judul potongan pesan pertama tetep ada */ }
}

function getMemoryBlock() {
  if (!vMemory.length) return "";
  return `\n\nKONTEKS DARI SESI SEBELUMNYA (Vaeltrix Memory) — gunakan kalau relevan:\n${vMemory.map(m => "- " + m).join("\n")}`;
}


// ============ CARI CHAT (SEARCH) ============
// Debounce 200ms — daripada scan SELURUH riwayat chat tiap 1 huruf diketik (bisa berasa lag
// di HP kalau riwayatnya udah banyak), tunggu user berhenti ngetik sebentar dulu baru search.
let searchDebounceTimer = null;
function debouncedSearch() {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(performSearch, 200);
}

function openSearchModal() {
  document.getElementById("more-menu").classList.remove("open");
  if (!isDesktopLayout()) closeSidebar();
  document.getElementById("search-input").value = "";
  document.getElementById("search-results-list").innerHTML = "";
  document.getElementById("search-backdrop").classList.add("show");
  setTimeout(() => document.getElementById("search-input").focus(), 150);
}
function closeSearchModal() { document.getElementById("search-backdrop").classList.remove("show"); }

function performSearch() {
  const q = document.getElementById("search-input").value.trim().toLowerCase();
  const list = document.getElementById("search-results-list");
  if (!q) { list.innerHTML = ""; return; }

  const results = [];
  sessions.forEach(s => {
    (s.messages || []).forEach(m => {
      const lower = (m.content || "").toLowerCase();
      const pos = lower.indexOf(q);
      if (pos !== -1) {
        const start = Math.max(0, pos - 40);
        const end = Math.min(m.content.length, pos + q.length + 60);
        let snippet = (start > 0 ? "…" : "") + m.content.slice(start, end) + (end < m.content.length ? "…" : "");
        results.push({ sessionId: s.id, sessionTitle: s.title, msgId: m.id, snippet });
      }
    });
  });

  if (!results.length) {
    list.innerHTML = `<div class="search-empty">Tidak Ada Hasil Untuk "${escHtml(document.getElementById("search-input").value)}"</div>`;
    return;
  }

  list.innerHTML = results.slice(0, 40).map(r => {
    const safeSnippet = escHtml(r.snippet);
    const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escapedQ, "ig");
    const highlighted = safeSnippet.replace(re, (m) => `<mark>${m}</mark>`);
    return `<div class="search-result-item" onclick="jumpToSearchResult(${r.sessionId}, '${r.msgId}')">
      <div class="search-result-title">${escHtml(r.sessionTitle)}</div>
      <div class="search-result-snippet">${highlighted}</div>
    </div>`;
  }).join("");
}

function jumpToSearchResult(sessionId, msgId) {
  closeSearchModal();
  if (currentSession?.id !== sessionId) loadSession(sessionId);
  setTimeout(() => {
    const bubble = document.getElementById(`bubble-${msgId}`);
    if (bubble) {
      bubble.scrollIntoView({ behavior: "smooth", block: "center" });
      bubble.classList.add("search-highlight");
      setTimeout(() => bubble.classList.remove("search-highlight"), 1700);
    }
  }, 200);
}


// ============ SESSIONS ============
function newChat() {
  currentSession = { id: Date.now(), title: "Chat Baru", messages: [], mode: "lite" };
  sessions.unshift(currentSession);
  setMode("lite");
  pendingAttachments = []; renderAttachmentChips();
  trackNewChatStat();
  saveSessions(); renderHistory(); renderChat();
  localStorage.setItem("vaeltrix_last_session_id", currentSession.id);
  restoreDraft();
  if (!isDesktopLayout()) closeSidebar();
}

function loadSession(id) {
  currentSession = sessions.find(s => s.id === id);
  if (currentSession?.mode) setMode(currentSession.mode);
  pendingAttachments = []; renderAttachmentChips();
  renderHistory(); renderChat();
  if (currentSession) localStorage.setItem("vaeltrix_last_session_id", currentSession.id);
  restoreDraft();
  if (!isDesktopLayout()) closeSidebar();
}

function deleteSession(id, e) {
  e.stopPropagation();
  const s = sessions.find(s => s.id === id);
  const title = s?.title || "chat ini";
  if (!confirm(`Hapus "${title}"? Riwayat pesan di dalamnya bakal hilang permanen.`)) return;
  sessions = sessions.filter(s => s.id !== id);
  if (currentSession?.id === id) {
    currentSession = null;
    localStorage.removeItem("vaeltrix_last_session_id");
    renderChat();
  }
  saveSessions(); renderHistory();
}

function saveSessions() {
  // Jaga-jaga: kalau isPremium entah kenapa belum siap (race condition/cache lama), jangan sampai
  // nge-throw dan bikin fitur lain (termasuk Vaeltrix Live) macet cuma gara-gara nyimpen sesi gagal.
  const premiumSafe = (typeof isPremium !== "undefined") ? isPremium : false;
  localStorage.setItem("vaeltrix_sessions", JSON.stringify(sessions.slice(0, premiumSafe ? 100 : 15)));
}

function buildHistoryItem(s) {
  const d = document.createElement("div");
  d.className = "history-item" + (currentSession?.id === s.id ? " active" : "");
  d.id = `history-item-${s.id}`;
  d.setAttribute("role", "button");
  d.setAttribute("tabindex", "0");
  d.setAttribute("aria-current", currentSession?.id === s.id ? "true" : "false");
  d.setAttribute("aria-label", `Buka Chat: ${s.title}`);
  d.onclick = () => loadSession(s.id);
  d.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); loadSession(s.id); } };
  const historyIcon = s.projectId
    ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.6" style="color:var(--blue);"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>`
    : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  d.innerHTML = `${historyIcon}
    <span class="history-title-text" style="flex:1;overflow:hidden;text-overflow:ellipsis">${escHtml(s.title)}</span>
    <div class="history-item-actions">
      <button class="pin-btn${s.pinned ? " pinned" : ""}" onclick="togglePinSession(${s.id},event)" aria-label="${s.pinned ? "Lepas Sematan" : "Sematkan Chat"}" title="${s.pinned ? "Lepas Sematan" : "Sematkan Chat"}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="${s.pinned ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 3h6l-1 6 3 3v2H7v-2l3-3-1-6z"/></svg>
      </button>
      <button class="rename-btn" onclick="startRenameSession(${s.id},event)" aria-label="Ganti Nama Chat" title="Ganti Nama">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
      </button>
      <button class="folder-btn" onclick="openFolderPicker(${s.id},event)" aria-label="Pindah Ke Folder" title="Pindah Ke Folder">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>
      </button>
      <button class="del-btn" onclick="deleteSession(${s.id},event)" aria-label="Hapus Chat: ${escHtml(s.title)}" title="Hapus Chat">×</button>
    </div>`;
  return d;
}

function renderHistory() {
  const list = document.getElementById("history-list");
  list.innerHTML = "";
  if (!sessions.length) {
    list.innerHTML = `<div class="history-empty">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <div>Belum Ada Riwayat Chat</div>
      <div class="history-empty-sub">Mulai Chat Baru Buat Lihat Riwayatnya Di Sini</div>
    </div>`;
    return;
  }
  const pinned = sessions.filter(s => s.pinned);
  const rest = sessions.filter(s => !s.pinned);
  if (pinned.length) {
    const lbl = document.createElement("div");
    lbl.className = "history-section-label";
    lbl.textContent = "Disematkan...";
    list.appendChild(lbl);
    pinned.forEach(s => list.appendChild(buildHistoryItem(s)));
  }
  const grouped = new Set();
  vaeltrixFolders.forEach(folder => {
    const inFolder = rest.filter(s => s.folder === folder);
    if (!inFolder.length) return;
    const lbl = document.createElement("div");
    lbl.className = "history-section-label";
    lbl.style.cssText = "display:flex;align-items:center;gap:5px;";
    lbl.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg> ${escHtml(folder)}`;
    list.appendChild(lbl);
    inFolder.forEach(s => list.appendChild(buildHistoryItem(s)));
    grouped.add(folder);
  });
  const noFolder = rest.filter(s => !s.folder || !grouped.has(s.folder));
  if (noFolder.length) {
    if (pinned.length || grouped.size) {
      const lbl2 = document.createElement("div");
      lbl2.className = "history-section-label";
      lbl2.textContent = "Lainnya";
      list.appendChild(lbl2);
    }
    noFolder.forEach(s => list.appendChild(buildHistoryItem(s)));
  }
}

function openFolderPicker(id, e) {
  e.stopPropagation();
  folderPickerTargetId = id;
  openOptionPicker("folder");
}

function createFolderFromPicker() {
  const inp = document.getElementById("new-folder-input");
  if (!inp) return;
  const name = inp.value.trim();
  if (!name) return;
  if (!vaeltrixFolders.includes(name)) { vaeltrixFolders.push(name); saveFolders(); }
  const s = sessions.find(s => s.id === folderPickerTargetId);
  if (s) { s.folder = name; saveSessions(); renderHistory(); }
  closeOptionPicker();
  showToast(`Chat Dipindah Ke Folder "${name}"`);
}

function togglePinSession(id, e) {
  e.stopPropagation();
  const s = sessions.find(s => s.id === id);
  if (!s) return;
  s.pinned = !s.pinned;
  saveSessions(); renderHistory();
  showToast(s.pinned ? "Chat Disematkan" : "Sematan Dilepas");
}

function startRenameSession(id, e) {
  e.stopPropagation();
  const s = sessions.find(s => s.id === id);
  const item = document.getElementById(`history-item-${id}`);
  if (!s || !item) return;
  const titleSpan = item.querySelector(".history-title-text");
  if (!titleSpan) return;

  const input = document.createElement("input");
  input.type = "text";
  input.className = "history-rename-input";
  input.value = s.title;
  titleSpan.replaceWith(input);
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);

  const commit = () => {
    const val = input.value.trim();
    if (val) { s.title = val.slice(0, 60); saveSessions(); }
    renderHistory();
  };
  input.addEventListener("keydown", (ev) => {
    ev.stopPropagation();
    if (ev.key === "Enter") { ev.preventDefault(); commit(); }
    else if (ev.key === "Escape") { ev.preventDefault(); renderHistory(); }
  });
  input.addEventListener("blur", commit);
  input.addEventListener("click", (ev) => ev.stopPropagation());
}


