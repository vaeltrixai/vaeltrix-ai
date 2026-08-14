// VaeltrixAI — Vaeltrix Artifact
// Panel terpisah buat kode/dokumen panjang yang bisa diedit & di-preview live (khusus HTML),
// mirip Artifacts di Claude. SENGAJA ditambahin SEBAGAI TOMBOL BARU di toolbar code block yang
// udah ada (lihat 08-markdown.js) — bukan ganti sistem Salin/Perbesar/Preview bawaan — jadi kalau
// ada bug di sini, fitur kode yang lama tetap jalan normal seperti sebelumnya.

let artifactPanelState = { sessionId: null, msgId: null, idx: null, tab: "code" };

// Ekstrak SEMUA fenced code block dari sebuah teks pesan, urutannya harus PERSIS sama kayak
// loop code block di parseMarkdown() (08-markdown.js) — index dipakai buat nyambungin tombol
// "Buka Artifact" di bubble ke entry yang bener di array ini.
function extractArtifacts(text) {
  const out = [];
  if (!text) return out;
  const re = /```(\w*)\n?([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(text))) {
    const lang = (m[1] || "").toLowerCase();
    const code = (m[2] || "").trim();
    out.push({ language: lang || "text", code, isHtml: isArtifactHtml(lang, code), edited: false });
  }
  return out;
}

// Heuristik "boleh di-preview sebagai HTML" — dipakai bareng oleh parseMarkdown() (buat tombol
// mata/preview yang udah ada) dan extractArtifacts() di sini, biar 2 tempat itu gak pernah beda pendapat.
function isArtifactHtml(lang, code) {
  return lang === "html" ||
    code.includes("<!DOCTYPE") || code.includes("<html") || code.includes("<body") ||
    ((code.includes("<style") || code.includes("<script")) && code.includes("<div")) ||
    (code.includes("function") && code.includes("<canvas")) ||
    code.includes("<canvas") || code.includes("getElementById");
}

function guessArtifactTitle(language) {
  const map = { html: "HTML Preview", javascript: "JavaScript", js: "JavaScript", jsx: "React Component",
    python: "Python", py: "Python", css: "CSS", json: "JSON", svg: "SVG Image", markdown: "Markdown",
    md: "Markdown", typescript: "TypeScript", ts: "TypeScript", bash: "Script Shell", sh: "Script Shell" };
  return map[language] || (language && language !== "text" ? language.toUpperCase() : "Kode");
}

// Ambil (dan kalau belum ada, hitung + simpan sekali) array artifacts milik sebuah message.
// Fallback ini PENTING buat chat lama yang udah kesimpen sebelum fitur ini ada — kode block-nya
// tetep bisa dibuka jadi Artifact tanpa perlu migrasi data apapun.
function getMessageArtifacts(msg) {
  if (!msg) return [];
  if (!msg.artifacts) {
    msg.artifacts = extractArtifacts(msg.content || "");
    saveSessions();
  }
  return msg.artifacts;
}

function findSessionAndMessage(sessionId, msgId) {
  const s = sessions.find(s => s.id === sessionId) || (currentSession?.id === sessionId ? currentSession : null);
  if (!s) return { session: null, msg: null };
  const msg = s.messages.find(m => m.id === msgId);
  return { session: s, msg };
}

function openArtifactPanel(msgId, idx) {
  if (!currentSession) return;
  const msg = currentSession.messages.find(m => m.id === msgId);
  if (!msg) return;
  const arts = getMessageArtifacts(msg);
  const art = arts[idx];
  if (!art) { showToast("Artifact Gak Ketemu", true); return; }

  artifactPanelState = { sessionId: currentSession.id, msgId, idx, tab: art.isHtml ? "preview" : "code" };

  document.getElementById("artifact-panel-title").textContent = guessArtifactTitle(art.language);
  const editor = document.getElementById("artifact-code-editor");
  editor.value = art.code;

  const previewTabBtn = document.getElementById("artifact-tab-preview");
  previewTabBtn.style.display = art.isHtml ? "inline-flex" : "none";

  switchArtifactTab(artifactPanelState.tab);
  document.getElementById("artifact-panel").classList.add("show");
}

function closeArtifactPanel() {
  document.getElementById("artifact-panel").classList.remove("show");
  document.getElementById("artifact-preview-frame").srcdoc = "";
}

function switchArtifactTab(tab) {
  artifactPanelState.tab = tab;
  const editor = document.getElementById("artifact-code-editor");
  const frame = document.getElementById("artifact-preview-frame");
  document.getElementById("artifact-tab-code").classList.toggle("active", tab === "code");
  document.getElementById("artifact-tab-preview").classList.toggle("active", tab === "preview");
  if (tab === "preview") {
    editor.style.display = "none";
    frame.style.display = "block";
    frame.srcdoc = editor.value;
  } else {
    frame.style.display = "none";
    editor.style.display = "block";
  }
}

function getCurrentArtifactEntry() {
  const { sessionId, msgId, idx } = artifactPanelState;
  const { msg } = findSessionAndMessage(sessionId, msgId);
  if (!msg || !msg.artifacts) return null;
  return msg.artifacts[idx] || null;
}

function saveArtifactCode() {
  const art = getCurrentArtifactEntry();
  if (!art) { showToast("Gagal Nyimpen — Artifact Gak Ketemu", true); return; }
  art.code = document.getElementById("artifact-code-editor").value;
  art.edited = true;
  saveSessions();
  if (artifactPanelState.tab === "preview") document.getElementById("artifact-preview-frame").srcdoc = art.code;
  showToast("Perubahan Artifact Tersimpan");
}

function resetArtifactCode() {
  const { sessionId, msgId, idx } = artifactPanelState;
  const { msg } = findSessionAndMessage(sessionId, msgId);
  if (!msg) return;
  const original = extractArtifacts(msg.content || "")[idx];
  if (!original) { showToast("Versi Asli Gak Ketemu", true); return; }
  document.getElementById("artifact-code-editor").value = original.code;
  if (artifactPanelState.tab === "preview") document.getElementById("artifact-preview-frame").srcdoc = original.code;
  showToast("Dikembalikan Ke Versi Asli Dari Vaeltrix (Belum Disimpan)");
}

function copyArtifactCode() {
  const code = document.getElementById("artifact-code-editor").value;
  copyToClipboard(code).then(() => showToast("Kode Artifact Disalin")).catch(() => showToast("Gagal Salin", true));
}

function downloadArtifactCode() {
  const art = getCurrentArtifactEntry();
  const code = document.getElementById("artifact-code-editor").value;
  const extMap = { html: "html", javascript: "js", js: "js", jsx: "jsx", python: "py", py: "py",
    css: "css", json: "json", svg: "svg", typescript: "ts", ts: "ts", markdown: "md", md: "md",
    bash: "sh", sh: "sh" };
  const ext = extMap[art?.language] || "txt";
  const blob = new Blob([code], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `vaeltrix-artifact.${ext}`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// ============ ARTIFACTS LIST (Tombol Sidebar) ============
function openArtifactsListPanel() {
  const wrap = document.getElementById("artifacts-list");
  wrap.innerHTML = "";
  const rows = [];
  sessions.forEach(s => {
    s.messages.forEach(m => {
      if (m.role !== "ai") return;
      const arts = (m.artifacts) ? m.artifacts : extractArtifacts(m.content || "").filter(a => a.code.length >= ARTIFACT_MIN_LEN);
      arts.forEach((a, idx) => {
        if (a.code.length < ARTIFACT_MIN_LEN) return;
        rows.push({ sessionId: s.id, sessionTitle: s.title, msgId: m.id, idx, art: a });
      });
    });
  });
  if (!rows.length) {
    wrap.innerHTML = `<div class="search-empty">Belum Ada Artifact. Artifact Otomatis Muncul Kalau Vaeltrix Ngasih Kode/Dokumen Yang Cukup Panjang — Tinggal Tap "Buka Artifact" Di Bubble Jawabannya.</div>`;
  } else {
    rows.reverse().forEach(r => {
      const d = document.createElement("div");
      d.className = "export-opt";
      d.onclick = () => {
        closeArtifactsListPanel();
        if (currentSession?.id !== r.sessionId) loadSession(r.sessionId);
        setTimeout(() => openArtifactPanel(r.msgId, r.idx), currentSession?.id === r.sessionId ? 0 : 250);
      };
      d.innerHTML = `
        <div class="qp-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>
        <div><div class="qp-title">${escHtml(guessArtifactTitle(r.art.language))}</div><div class="qp-desc">${escHtml(r.sessionTitle)}</div></div>`;
      wrap.appendChild(d);
    });
  }
  document.getElementById("artifacts-list-backdrop").classList.add("show");
  if (!isDesktopLayout()) closeSidebar();
}
function closeArtifactsListPanel() {
  document.getElementById("artifacts-list-backdrop").classList.remove("show");
}

// Nempelin kartu "Buka Artifact" ke bubble jawaban AI yang punya code block layak-artifact.
// Dipanggil dari appendBubble() & finalizeBubble() (06-chat-core.js) — DIBUNGKUS try/catch di
// sisi pemanggil biar kalaupun ada error di sini, alur render chat utama tetep jalan normal.
function attachArtifactButtons(wrap, msgId) {
  if (!wrap) return;
  wrap.querySelectorAll(".code-block-wrap").forEach(cb => {
    const idx = cb.dataset.artifactIdx;
    if (idx === undefined) return;
    if (cb.querySelector(".artifact-open-btn")) return; // udah ada, jangan dobel
    const actions = cb.querySelector(".code-block-actions");
    if (!actions) return;
    const btn = document.createElement("button");
    btn.className = "code-icon-btn artifact-open-btn";
    btn.title = "Buka Sebagai Artifact";
    btn.setAttribute("aria-label", "Buka Sebagai Artifact");
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>`;
    btn.addEventListener("click", (e) => { e.stopPropagation(); openArtifactPanel(msgId, Number(idx)); });
    actions.appendChild(btn);
  });
}
