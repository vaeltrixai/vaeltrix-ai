// VaeltrixAI — Export, backup/restore, share, feedback, stats, referral & rewards

// ============ VAELTRIX STATS ============
function trackStat(mode) {
  vStats.totalMsgs++;
  vStats.modeUsage[mode] = (vStats.modeUsage[mode] || 0) + 1;
  localStorage.setItem("vaeltrix_stats", JSON.stringify(vStats));
}
function trackNewChatStat() {
  vStats.totalChats++;
  localStorage.setItem("vaeltrix_stats", JSON.stringify(vStats));
}
function openStatsModal() {
  document.getElementById("more-menu").classList.remove("open");
  document.getElementById("stat-total-chats").textContent = vStats.totalChats;
  document.getElementById("stat-total-msgs").textContent = vStats.totalMsgs;
  const labels = { flash: "Flash 1.5", lite: "Lite 1.5", code: "Code", maxs: "Maxs", research: "Research" };
  const max = Math.max(1, ...Object.values(vStats.modeUsage));
  document.getElementById("stat-mode-bars").innerHTML = Object.keys(labels).map(m => {
    const v = vStats.modeUsage[m] || 0;
    const pct = Math.round((v / max) * 100);
    return `<div class="mode-bar-row">
      <div class="mode-bar-label">${labels[m]}</div>
      <div class="mode-bar-track"><div class="mode-bar-fill" style="width:${pct}%"></div></div>
      <div class="mode-bar-val">${v}</div>
    </div>`;
  }).join("");
  document.getElementById("stats-backdrop").classList.add("show");
}
function closeStatsModal() { document.getElementById("stats-backdrop").classList.remove("show"); }


// ============ REFERRAL & REWARDS ============
function initReferral() {
  if (!referralCode) {
    referralCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    localStorage.setItem("vaeltrix_referral_code", referralCode);
  }
  const disp = document.getElementById("ref-code-display");
  if (disp) disp.textContent = referralCode;
}
function openReferralModal() {
  document.getElementById("more-menu").classList.remove("open");
  document.getElementById("ref-status").textContent = "";
  document.getElementById("ref-backdrop").classList.add("show");
}
function closeReferralModal() { document.getElementById("ref-backdrop").classList.remove("show"); }
// Helper clipboard yang aman — navigator.clipboard butuh secure context (https/localhost),
// kalau gagal/tidak tersedia, fallback ke cara lama biar tetap bisa disalin
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error("execCommand gagal"));
    } catch (e) { reject(e); }
  });
}

function copyReferralLink() {
  const link = `${location.origin}${location.pathname}?ref=${referralCode}`;
  copyToClipboard(link).then(() => showToast("Link Referral Disalin!"))
    .catch(() => showToast("Gagal Menyalin Link", true));
}
function redeemReferral() {
  const code = document.getElementById("ref-input").value.trim().toUpperCase();
  const st = document.getElementById("ref-status");
  if (!code) { st.style.color = "#ff8080"; st.textContent = "Masukkan Kode Referral Dulu."; return; }
  if (code === referralCode) { st.style.color = "#ff8080"; st.textContent = "Gak Bisa Pakai Kode Sendiri"; return; }
  if (localStorage.getItem("vaeltrix_referral_redeemed") === "true") {
    st.style.color = "#ff8080"; st.textContent = "Kamu Sudah Pernah Klaim Bonus Referral.";
    return;
  }
  const BONUS_DAYS = 3;
  trialExpiry = Math.max(trialExpiry, Date.now()) + BONUS_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem("vaeltrix_trial_expiry", trialExpiry);
  localStorage.setItem("vaeltrix_referral_redeemed", "true");
  isPremium = isPremiumActive();
  updatePlanUI(); updateCounter();
  st.style.color = "#4ade80";
  st.textContent = `Berhasil! Kamu Dapat ${BONUS_DAYS} Hari Trial Premium.`;
  showToast(`+${BONUS_DAYS} Hari Trial Premium Aktif!`);
}

// ============ VAELTRIX EXPORT ============
function openExportModal() { document.getElementById("more-menu").classList.remove("open"); document.getElementById("export-backdrop").classList.add("show"); }
function closeExportModal() { document.getElementById("export-backdrop").classList.remove("show"); }
function exportChat(format) {
  if (!currentSession || !currentSession.messages.length) { showToast("Belum Ada Chat Untuk Diexport", true); return; }
  const title = currentSession.title || "Chat Vaeltrix";
  if (format === "md") {
    let md = `# ${title}\n\n_Diexport dari VaeltrixAI pada ${new Date().toLocaleString("id-ID")}_\n\n---\n\n`;
    currentSession.messages.forEach(m => {
      md += `**${m.role === "user" ? "" : "Vaeltrix ─ AI"}:**\n\n${m.content}\n\n---\n\n`;
    });
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title.replace(/[^a-z0-9]/gi, "_").slice(0,40)}.md`;
    a.click();
    showToast("Chat Diexport Ke Markdown");
  } else if (format === "pdf") {
    const w = window.open("", "_blank");
    const bodyHtml = currentSession.messages.map(m =>
      `<div style="margin-bottom:16px;"><div style="font-weight:700;font-size:12px;color:${m.role==='user' ? '#0057FF' : '#333'};margin-bottom:4px;">${m.role === "user" ? "" : "Vaeltrix ─ AI"}</div><div style="white-space:pre-wrap;line-height:1.6;">${escHtml(m.content)}</div></div>`
    ).join("<hr style='border:none;border-top:1px solid #ddd;margin:14px 0;'>");
    w.document.write(`<html><head><title>${escHtml(title)}</title><meta charset="utf-8"></head>
      <body style="font-family:Arial,sans-serif;max-width:720px;margin:30px auto;color:#111;">
      <h2>${escHtml(title)}</h2>
      <p style="color:#888;font-size:11px;">Diexport dari VaeltrixAI &middot; ${new Date().toLocaleString("id-ID")}</p>
      <hr style="border:none;border-top:1px solid #ddd;margin:14px 0;">
      ${bodyHtml}
      </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
  }
  closeExportModal();
}

// ============ BACKUP / RESTORE SEMUA RIWAYAT ============
function exportAllSessions() {
  if (!sessions.length) { showToast("Belum Ada Riwayat Untuk Dibackup", true); return; }
  const payload = {
    app: "VaeltrixAI",
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    sessions,
    memory: vMemory,
    stats: vStats
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const dateTag = new Date().toISOString().slice(0,10);
  a.download = `vaeltrix-backup-${dateTag}.json`;
  a.click();
  showToast("Backup Semua Riwayat Berhasil Disimpan");
  closeExportModal();
}

function handleImportFile(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    let payload;
    try { payload = JSON.parse(reader.result); }
    catch (e) { showToast("File Backup Tidak Valid Atau Rusak", true); return; }

    if (!payload || !Array.isArray(payload.sessions)) {
      showToast("Format Backup Tidak Dikenali", true); return;
    }

    const proceed = confirm(`Ditemukan ${payload.sessions.length} Sesi Chat Di Backup Ini. Gabungkan Dengan Riwayat Yang Ada Sekarang?`);
    if (!proceed) return;

    const existingIds = new Set(sessions.map(s => s.id));
    let added = 0;
    payload.sessions.forEach(s => {
      if (existingIds.has(s.id)) {
        // Hindari Bentrok ID — Import Sebagai Sesi Baru
        s = { ...s, id: Date.now() + Math.floor(Math.random()*100000) };
      }
      sessions.push(s);
      existingIds.add(s.id);
      added++;
    });

    if (Array.isArray(payload.memory) && payload.memory.length) {
      const existingFacts = new Set(vMemory);
      payload.memory.forEach(f => { if (!existingFacts.has(f)) vMemory.push(f); });
      localStorage.setItem("vaeltrix_memory", JSON.stringify(vMemory));
      renderMemoryList();
    }

    saveSessions(); renderHistory();
    closeExportModal();
    showToast(`${added} Sesi Chat Berhasil Diimport`);
  };
  reader.onerror = () => showToast("Gagal Membaca File", true);
  reader.readAsText(file);
}


// ============ VAELTRIX SHARE ============
function openShareModal() {
  document.getElementById("more-menu").classList.remove("open");
  document.getElementById("share-link-out").value = "";
  document.getElementById("share-status").textContent = "";
  document.getElementById("share-backdrop").classList.add("show");
}
function closeShareModal() { document.getElementById("share-backdrop").classList.remove("show"); }
function generateShareLink() {
  if (!currentSession || !currentSession.messages.length) { showToast("Belum Ada Chat Untuk Dibagikan", true); return; }
  const payload = { t: currentSession.title, m: currentSession.messages.map(m => ({ r: m.role, c: m.content })) };
  try {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    const link = `${location.origin}${location.pathname}#share=${encoded}`;
    document.getElementById("share-link-out").value = link;
    document.getElementById("share-status").style.color = "#4ade80";
    document.getElementById("share-status").textContent = "Link Siap! Siapapun Yang Buka Link Ini Bisa Lihat Chat (Read-Only).";
  } catch (e) {
    showToast("Chat Terlalu Panjang Untuk Dibagikan Via Link", true);
  }
}
function copyShareLink() {
  const val = document.getElementById("share-link-out").value;
  if (!val) { showToast("Buat Link Dulu", true); return; }
  copyToClipboard(val).then(() => showToast("Link Share Disalin!"))
    .catch(() => showToast("Gagal Menyalin", true));
}
function renderSharedView() {
  isSharedView = true;
  try {
    const encoded = decodeURIComponent(location.hash.replace("#share=", ""));
    const payload = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    document.getElementById("sidebar").classList.add("hidden");
    document.getElementById("input-area").style.display = "none";
    const chat = document.getElementById("chat");
    chat.innerHTML = `<div class="shared-banner"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:5px;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>Ini Percakapan Yang Dibagikan (Read-Only)<br>
      <button onclick="location.href = location.pathname">Buka VaeltrixAI Sendiri</button></div>`;
    payload.m.forEach(m => appendBubble(m.r, m.c, "flash", false));
    chat.scrollTop = 0;
  } catch (e) {
    document.body.innerHTML = "<p style='color:#fff;padding:40px;font-family:sans-serif;'>Link Share Tidak Valid Atau Rusak.</p>";
  }
}

// ============ FEEDBACK (THUMBS UP/DOWN) ============
function rateFeedback(msgId, rating, btn) {
  if (vFeedback[msgId] === rating) { delete vFeedback[msgId]; } else { vFeedback[msgId] = rating; }
  localStorage.setItem("vaeltrix_feedback", JSON.stringify(vFeedback));
  const wrap = btn.closest(".bubble-footer");
  wrap.querySelectorAll(".fb-btn").forEach(b => b.classList.remove("active-up", "active-down"));
  if (vFeedback[msgId] === "up") btn.classList.add("active-up");
  if (vFeedback[msgId] === "down") btn.classList.add("active-down");
  if (vFeedback[msgId]) showToast(rating === "up" ? "Terimakasih. Atas Umpan Balik Anda!" : "Makasih, Bakal Kami Perbaiki.");
}


