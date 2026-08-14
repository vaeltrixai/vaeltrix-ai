// VaeltrixAI — Settings: theme/font/lang, API keys, premium, plan UI, free-tier reset

// ================================================================
// ============================ SETTINGS =========================
// (Profile, AI Model, Account Security/PIN, Feedback, Memory Space,
//  Play Voice, Theme, Font Size, Language, Feature Management,
//  Notification Settings, About & Check for Updates)
// ================================================================

// ---- Profile ----
function getProfile() {
  try { return JSON.parse(localStorage.getItem("vaeltrix_profile") || '{"name":"Vaeltrix User","email":"","username":"","photo":""}'); }
  catch { return { name: "Vaeltrix User", email: "", username: "", photo: "" }; }
}
function saveProfileData(p) {
  localStorage.setItem("vaeltrix_profile", JSON.stringify(p));
  updateProfileUI();
}
function updateProfileUI() {
  const p = getProfile();
  const nameEl = document.getElementById("settings-profile-name");
  const emailEl = document.getElementById("settings-profile-email");
  const avatarEl = document.getElementById("settings-avatar-initial");
  const displayName = p.name || "Vaeltrix User";
  if (nameEl) nameEl.textContent = displayName;
  if (emailEl) emailEl.textContent = (p.username ? "@" + p.username : "") || p.email || "Belum Ada Email Tersimpan";
  if (avatarEl) {
    if (p.photo) {
      avatarEl.innerHTML = `<img src="${p.photo}" alt="Foto Profil">`;
    } else {
      avatarEl.textContent = (displayName.trim().charAt(0) || "V").toUpperCase();
    }
  }
}

// ---- Edit Profile Sheet ----
let editProfilePendingPhoto = null;
function openEditProfileModal() {
  const p = getProfile();
  editProfilePendingPhoto = p.photo || null;
  document.getElementById("edit-profile-name-input").value = p.name || "";
  document.getElementById("edit-profile-username-input").value = p.username || "";
  renderEditProfileAvatar(p.photo, p.name);
  document.getElementById("edit-profile-backdrop").classList.add("show");
}
function closeEditProfileModal() {
  document.getElementById("edit-profile-backdrop").classList.remove("show");
}
function renderEditProfileAvatar(photo, name) {
  const el = document.getElementById("edit-profile-avatar-preview");
  if (!el) return;
  if (photo) el.innerHTML = `<img src="${photo}" alt="Foto Profil">`;
  else el.textContent = ((name || "V").trim().charAt(0) || "V").toUpperCase();
}
async function handleProfilePhotoSelect(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  try {
    const dataUrl = await readAsDataURL(file);
    editProfilePendingPhoto = dataUrl;
    renderEditProfileAvatar(dataUrl, null);
  } catch (e) { showToast("Gagal Memuat Foto", true); }
  event.target.value = "";
}
function saveProfile() {
  const name = document.getElementById("edit-profile-name-input").value.trim();
  const username = document.getElementById("edit-profile-username-input").value.trim().replace(/\s+/g, "");
  if (!name) { showToast("Nama Tidak Boleh Kosong", true); return; }
  const p = getProfile();
  p.name = name;
  p.username = username;
  if (editProfilePendingPhoto !== null) p.photo = editProfilePendingPhoto;
  saveProfileData(p);
  closeEditProfileModal();
  showToast("Profil Tersimpan");
}

// ---- AI Model label ----
function getModeDisplayName(mode) {
  const names = { flash: "Vaeltrix Flash", lite: "Vaeltrix Lite", code: "Vaeltrix Code", maxs: "Vaeltrix Maxs", research: "Vaeltrix Deep Research" };
  return names[mode] || "Vaeltrix Flash";
}

// ---- Settings Sheet ----
function openSettingsModal() {
  document.getElementById("more-menu")?.classList.remove("open");
  if (!isDesktopLayout()) closeSidebar();
  updateProfileUI();
  document.getElementById("settings-val-model").textContent = getModeDisplayName(currentMode);
  document.getElementById("settings-val-security").textContent = getPin() ? "PIN Aktif" : "Standard";
  document.getElementById("settings-val-memory").textContent = isMemoryAutoSaveOn() ? "Auto-Save On" : "Auto-Save Off";
  document.getElementById("settings-val-voice").textContent = getVoiceLabel();
  document.getElementById("settings-val-theme").textContent = getThemeLabel();
  document.getElementById("settings-val-font").textContent = getFontSizeLabel();
  document.getElementById("settings-val-effort").textContent = getEffortLabel();
  document.getElementById("settings-val-lang").textContent = getLanguage() === "en" ? "English" : "Indonesia";
  document.getElementById("settings-val-beta").textContent = isBetaEnabled() ? "Beta On" : "Beta Off";
  document.getElementById("settings-val-notif").textContent = isNotifEnabled() ? "On" : "Off";
  document.getElementById("settings-backdrop").classList.add("show");
}
function closeSettingsModal() { document.getElementById("settings-backdrop").classList.remove("show"); }

// ---- Account Security (App Lock PIN, lokal di device) ----
function getPin() { return localStorage.getItem("vaeltrix_pin") || ""; }
function openAccountSecurity() {
  const has = !!getPin();
  document.getElementById("pin-modal-title").textContent = has ? "UBAH PIN" : "ACCOUNT SECURITY";
  document.getElementById("pin-modal-sub").textContent = has
    ? "PIN Kamu Lagi Aktif. Masukkan PIN Baru Buat Ganti, Atau Matikan Di Bawah."
    : "Amankan VaeltrixAI Kamu Dengan PIN 4-6 Digit. PIN Ini Cuma Tersimpan Di Device Ini, Bukan Di Server.";
  document.getElementById("pin-input-1").value = "";
  document.getElementById("pin-input-2").value = "";
  document.getElementById("pin-modal-error").textContent = "";
  document.getElementById("pin-remove-btn").style.display = has ? "block" : "none";
  document.getElementById("pin-modal").style.display = "flex";
}
function closePinModal() { document.getElementById("pin-modal").style.display = "none"; }
function savePinSecurity() {
  const p1 = document.getElementById("pin-input-1").value.trim();
  const p2 = document.getElementById("pin-input-2").value.trim();
  const err = document.getElementById("pin-modal-error");
  if (!/^\d{4,6}$/.test(p1)) { err.textContent = "PIN Harus 4-6 Digit Angka."; return; }
  if (p1 !== p2) { err.textContent = "PIN Gak Sama, Coba Lagi."; return; }
  localStorage.setItem("vaeltrix_pin", p1);
  const secEl = document.getElementById("settings-val-security");
  if (secEl) secEl.textContent = "PIN Aktif";
  closePinModal();
  showToast("PIN Diaktifkan — VaeltrixAI Kamu Sekarang Lebih Aman");
}
function removePinSecurity() {
  localStorage.removeItem("vaeltrix_pin");
  const secEl = document.getElementById("settings-val-security");
  if (secEl) secEl.textContent = "Standard";
  closePinModal();
  showToast("PIN Dimatikan");
}
function checkAppLock() {
  if (getPin()) document.getElementById("applock-screen").classList.add("show");
}
function tryUnlockApp() {
  const input = document.getElementById("applock-input");
  const err = document.getElementById("applock-error");
  if (input.value.trim() === getPin()) {
    document.getElementById("applock-screen").classList.remove("show");
    input.value = ""; err.textContent = "";
  } else {
    err.textContent = "PIN Salah, Coba Lagi.";
    input.value = "";
    input.focus();
  }
}

// ---- Feedback (tersimpan lokal, siap dikembangkan ke backend nanti) ----
function openFeedbackModal() {
  document.getElementById("feedback-input").value = "";
  document.getElementById("feedback-error").textContent = "";
  document.getElementById("feedback-modal").style.display = "flex";
}
function closeFeedbackModal() { document.getElementById("feedback-modal").style.display = "none"; }
function sendFeedback() {
  const text = document.getElementById("feedback-input").value.trim();
  const err = document.getElementById("feedback-error");
  if (!text) { err.textContent = "Tulis Dulu Feedback Kamu, Tuan."; return; }
  try {
    const stored = JSON.parse(localStorage.getItem("vaeltrix_feedback") || "[]");
    stored.push({ text, at: Date.now() });
    localStorage.setItem("vaeltrix_feedback", JSON.stringify(stored));
  } catch {}
  closeFeedbackModal();
  showToast("Makasih Feedback-nya, Tuan!");
}

// ---- Memory Space (Auto-Save toggle, gerbangnya ada di addMemoryFacts) ----
function isMemoryAutoSaveOn() { return localStorage.getItem("vaeltrix_memory_autosave") !== "0"; }

// ---- Play Voice ----
function getVoiceURI() { return localStorage.getItem("vaeltrix_voice_uri") || ""; }
// Provider: "browser" (Web Speech API, gratis, default/fallback) atau "elevenlabs" (natural, butuh API key)
function getVoiceProvider() { return localStorage.getItem("vaeltrix_voice_provider") || "browser"; }
function setVoiceProvider(p) { localStorage.setItem("vaeltrix_voice_provider", p); }
function getElevenLabsKey() { return localStorage.getItem("vaeltrix_elevenlabs_key") || ""; }
function getElevenLabsVoiceId() { return localStorage.getItem("vaeltrix_elevenlabs_voice_id") || ELEVENLABS_VOICES[0].id; }
function getVoiceLabel() {
  if (getVoiceProvider() === "elevenlabs") {
    const v = ELEVENLABS_VOICES.find(v => v.id === getElevenLabsVoiceId());
    return (v ? v.name : "Rachel") + " (ElevenLabs)";
  }
  const uri = getVoiceURI();
  if (!uri) return "Default";
  if (!("speechSynthesis" in window)) return "Default";
  const v = (speechSynthesis.getVoices() || []).find(v => v.voiceURI === uri);
  return v ? v.name : "Default";
}

// ---- Theme ----
function getTheme() { return localStorage.getItem("vaeltrix_theme") || "auto"; }
function resolveTheme(t) {
  if (t === "auto") {
    return (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) ? "light" : "dark";
  }
  return t;
}
function applyTheme(t) {
  const resolved = resolveTheme(t);
  document.body.classList.toggle("theme-light", resolved === "light");
  localStorage.setItem("vaeltrix_theme", t);
}
if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
    if (getTheme() === "auto") applyTheme("auto");
  });
}
function getThemeLabel(t) {
  const v = t ?? getTheme();
  return v === "light" ? "Light" : v === "auto" ? "Auto" : "Dark";
}

// ---- Font Size ----
function getFontSize() { return localStorage.getItem("vaeltrix_font_size") || "standard"; }
function getFontSizeLabel() {
  const f = getFontSize();
  return f === "small" ? "Small" : f === "large" ? "Large" : "Standard";
}
function applyFontSize(f) {
  document.body.classList.remove("font-size-small", "font-size-large");
  if (f === "small") document.body.classList.add("font-size-small");
  if (f === "large") document.body.classList.add("font-size-large");
  localStorage.setItem("vaeltrix_font_size", f);
}

// ---- Upaya (Reasoning Effort) ----
// Cuma 3 tingkat (Rendah/Sedang/Tinggi) — BUKAN 5 kayak Claude (Rendah/Sedang/Tinggi/Ekstra/Maks).
// Ini sengaja jujur ke kemampuan API asli: Gemini 3.x (thinkingLevel) & GPT-OSS di Groq
// (reasoning_effort) SAMA-SAMA cuma nyediain 3 tingkat low/medium/high di API mereka. Nambahin
// 2 tingkat "ekstra" lagi cuma bakal jadi tombol kosong yang gak ngubah apa-apa di baliknya.
function getEffort() { return localStorage.getItem("vaeltrix_effort") || "medium"; }
function getEffortLabel() {
  const e = getEffort();
  return e === "low" ? "Rendah" : e === "high" ? "Tinggi" : "Sedang";
}
function applyEffort(e) { localStorage.setItem("vaeltrix_effort", e); }

// ---- Pemikiran Terang-Terangan (Force Thinking) ----
// PENTING — ini bedanya sama "Upaya": Upaya (thinkingLevel/reasoning_effort) ngatur SEBERAPA DALAM
// model mikir secara internal (ngaruh ke kualitas jawaban), tapi hasil mikirnya gak pernah
// ditampilin ke user sebelumnya — dulu ada UI "Berpikir" di kode, tapi gak kepakai sama sekali
// karena callback-nya gak pernah kesambung ke provider manapun (ketauan pas riset fitur ini).
// Toggle ini yang beneran nampilin proses mikirnya (kayak Grok/Claude/Kimi), bukan cuma
// ngatur kualitasnya doang.
function isForceThinkingEnabled() { return localStorage.getItem("vaeltrix_force_thinking") === "1"; }
function toggleForceThinking(on) {
  localStorage.setItem("vaeltrix_force_thinking", on ? "1" : "0");
  showToast(on ? "Pemikiran Terang-Terangan Diaktifkan" : "Pemikiran Terang-Terangan Dimatikan");
}

// ---- Language (bahasa jawaban AI, bukan bahasa UI) ----
function getLanguage() { return localStorage.getItem("vaeltrix_language") || "id"; }
function applyLanguage(l) { localStorage.setItem("vaeltrix_language", l); }
function getLanguageAddon() {
  return getLanguage() === "en"
    ? "\n\nPENTING SOAL BAHASA: User Sudah Atur Preferensi Bahasa Jawaban Ke Bahasa Inggris. Jawab SELALU Dalam Bahasa Inggris (English), Apapun Bahasa Yang Dipakai User Untuk Bertanya."
    : "";
}

// ---- Feature Management (Beta) ----
function isBetaEnabled() { return localStorage.getItem("vaeltrix_beta") === "1"; }
function toggleFeatureManagement() {
  const now = !isBetaEnabled();
  localStorage.setItem("vaeltrix_beta", now ? "1" : "0");
  const el = document.getElementById("settings-val-beta");
  if (el) el.textContent = now ? "Beta On" : "Beta Off";
  document.querySelectorAll(".beta-badge").forEach(b => b.style.display = now ? "inline" : "none");
  showToast(now ? "Fitur Beta Diaktifkan — Fitur Baru Ditandai Badge BETA" : "Fitur Beta Dimatikan");
}

// ---- Notification Settings ----
function isNotifEnabled() { return localStorage.getItem("vaeltrix_notif") === "1"; }
function toggleNotificationSettings() {
  if (!("Notification" in window)) { showToast("Browser Kamu Gak Support Notifikasi", true); return; }
  if (isNotifEnabled()) {
    localStorage.setItem("vaeltrix_notif", "0");
    const el = document.getElementById("settings-val-notif");
    if (el) el.textContent = "Off";
    showToast("Notifikasi Dimatikan");
    return;
  }
  Notification.requestPermission().then(perm => {
    if (perm === "granted") {
      localStorage.setItem("vaeltrix_notif", "1");
      const el = document.getElementById("settings-val-notif");
      if (el) el.textContent = "On";
      showToast("Notifikasi Diaktifkan — Vaeltrix Bakal Ngingetin Kalau Jawaban Udah Siap");
    } else {
      showToast("Izin Notifikasi Ditolak Browser", true);
    }
  });
}
function notifyIfBackground(title, body) {
  if (!isNotifEnabled() || document.visibilityState === "visible") return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try { new Notification(title, { body }); } catch {}
}

// ---- About / Check for Updates ----
function openAboutModal() { document.getElementById("about-modal").style.display = "flex"; }
function closeAboutModal() { document.getElementById("about-modal").style.display = "none"; }
function checkForUpdates() { showToast("Kamu Sudah Pakai Versi Terbaru VaeltrixAI (1.5-Update)"); }

// ---- Generic Option Picker (dipakai Play Voice / Theme / Font Size / Language) ----
function openOptionPicker(kind) {
  const title = document.getElementById("option-picker-title");
  const sub = document.getElementById("option-picker-sub");
  const list = document.getElementById("option-picker-list");
  list.innerHTML = "";
  let options = [];

  if (kind === "theme") {
    title.textContent = "PENGATURAN TEMA";
    sub.textContent = "Pilih Tampilan VaeltrixAI Kamu.";
    options = [
      { value: "auto", label: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:6px;"><rect x="2" y="4" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="18" x2="12" y2="21"/></svg>Auto (Ikut Sistem)', active: getTheme() === "auto" },
      { value: "dark", label: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:6px;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>Dark', active: getTheme() === "dark" },
      { value: "light", label: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:6px;"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>Light', active: getTheme() === "light" }
    ];
  } else if (kind === "font") {
    title.textContent = "FONT SIZE";
    sub.textContent = "Atur Ukuran Teks Chat Biar Nyaman Dibaca.";
    options = [
      { value: "small", label: "Small", active: getFontSize() === "small" },
      { value: "standard", label: "Standard", active: getFontSize() === "standard" },
      { value: "large", label: "Large", active: getFontSize() === "large" }
    ];
  } else if (kind === "effort") {
    title.textContent = "UPAYA";
    sub.textContent = "Seberapa Dalam Vaeltrix Mikir Sebelum Jawab. Makin Tinggi, Makin Lambat Tapi Lebih Teliti.";
    options = [
      { value: "low", label: "Rendah — Balasan Cepat Buat Pertanyaan Sederhana", active: getEffort() === "low" },
      { value: "medium", label: "Sedang — Seimbang Buat Percakapan Sehari-Hari", active: getEffort() === "medium" },
      { value: "high", label: "Tinggi — Mikir Lebih Dalam, Cocok Buat Soal Rumit", active: getEffort() === "high" }
    ];
  } else if (kind === "lang") {
    title.textContent = "LANGUAGE";
    sub.textContent = "Bahasa Jawaban Vaeltrix (Bukan Bahasa Tampilan Aplikasi).";
    const globeSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:6px;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
    options = [
      { value: "id", label: globeSvg + "Indonesia", active: getLanguage() === "id" },
      { value: "en", label: globeSvg + "English", active: getLanguage() === "en" }
    ];
  } else if (kind === "voice") {
    title.textContent = "PLAY VOICE";
    const micSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="vertical-align:-2px;margin-right:6px;"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4"/></svg>';
    if (getVoiceProvider() === "elevenlabs") {
      sub.textContent = getElevenLabsKey()
        ? "Suara ElevenLabs (Lebih Natural). Butuh API Key & Kredit — Isi/Cek Di Custom API Keys."
        : "API Key ElevenLabs Belum Diisi — Buka Custom API Keys Dulu, Kalau Kosong Otomatis Balik Ke Suara Browser.";
      options = ELEVENLABS_VOICES.map(v => ({
        value: "el:" + v.id,
        label: (v.gender === "f" ? "♀ " : "♂ ") + `<b>${v.name}</b> — ${v.desc}`,
        active: getElevenLabsVoiceId() === v.id
      }));
      options.push({ value: "__switch_browser__", label: micSvg + "Balik Ke Suara Browser (Gratis)", active: false });
    } else {
      sub.textContent = "Pilih Suara Buat Fitur Baca-Kan Jawaban (Text-To-Speech).";
      const voices = ("speechSynthesis" in window) ? speechSynthesis.getVoices() : [];
      const idVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith("id"));
      const shown = (idVoices.length ? idVoices : voices).slice(0, 12);
      options = [{ value: "", label: "Default (Otomatis)", active: !getVoiceURI() }];
      shown.forEach(v => options.push({ value: v.voiceURI, label: `${v.name} (${v.lang})`, active: getVoiceURI() === v.voiceURI }));
      if (!voices.length) sub.textContent = "Daftar Suara Browser Kamu Belum Siap. Coba Buka Lagi Sebentar.";
      options.push({ value: "__switch_elevenlabs__", label: micSvg + "Coba Suara ElevenLabs (Lebih Natural)", active: false });
    }
  } else if (kind === "folder") {
    title.textContent = "PINDAH KE FOLDER";
    sub.textContent = "Kelompokkan Chat Ini Biar Sidebar Lebih Rapi.";
    const s = sessions.find(s => s.id === folderPickerTargetId);
    const current = s?.folder || "";
    options = [{ value: "__none__", label: "Tanpa Folder", active: !current }];
    vaeltrixFolders.forEach(f => options.push({ value: f, label: escHtml(f), active: current === f }));
  }

  options.forEach(o => {
    const btn = document.createElement("button");
    btn.className = "panel-btn blue";
    btn.style.cssText = "width:100%;text-align:left;display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;" +
      (o.active ? "border-color:var(--blue);background:rgba(0,168,255,0.18);" : "");
    btn.innerHTML = `<span>${o.label}</span>` + (o.active ? '<span style="color:var(--blue);display:inline-flex;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>' : "");
    btn.onclick = () => selectOption(kind, o.value);
    list.appendChild(btn);
  });

  if (kind === "folder") {
    const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:6px;margin-top:4px;";
    row.innerHTML = `<input type="text" class="panel-input" id="new-folder-input" placeholder="Nama Folder Baru..." style="margin:0;flex:1;">
      <button class="panel-btn blue" style="width:auto;padding:0 14px;" onclick="createFolderFromPicker()">+</button>`;
    list.appendChild(row);
    row.querySelector("input").addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); createFolderFromPicker(); } });
  }

  document.getElementById("option-picker-backdrop").classList.add("show");
}
function closeOptionPicker() { document.getElementById("option-picker-backdrop").classList.remove("show"); }
function selectOption(kind, value) {
  if (kind === "theme") {
    applyTheme(value);
    document.getElementById("settings-val-theme").textContent = getThemeLabel(value);
    showToast(value === "light" ? "Tema Terang Aktif" : value === "auto" ? "Tema Auto Aktif (Ikut Sistem)" : "Tema Gelap Aktif");
  } else if (kind === "font") {
    applyFontSize(value);
    document.getElementById("settings-val-font").textContent = getFontSizeLabel();
    showToast("Ukuran Font Diubah Ke " + getFontSizeLabel());
  } else if (kind === "effort") {
    applyEffort(value);
    document.getElementById("settings-val-effort").textContent = getEffortLabel();
    const modeSheetEffortEl = document.getElementById("mode-sheet-effort-val");
    if (modeSheetEffortEl) modeSheetEffortEl.textContent = getEffortLabel();
    showToast("Upaya Vaeltrix Diubah Ke " + getEffortLabel());
  } else if (kind === "lang") {
    applyLanguage(value);
    document.getElementById("settings-val-lang").textContent = value === "en" ? "English" : "Indonesia";
    showToast(value === "en" ? "Vaeltrix Akan Jawab Pakai Bahasa Inggris" : "Vaeltrix Akan Jawab Pakai Bahasa Indonesia");
  } else if (kind === "voice") {
    if (value === "__switch_elevenlabs__" || value === "__switch_browser__") {
      setVoiceProvider(value === "__switch_elevenlabs__" ? "elevenlabs" : "browser");
      document.getElementById("settings-val-voice").textContent = getVoiceLabel();
      openOptionPicker("voice"); // refresh isi picker ke provider baru, jangan ditutup dulu
      return;
    } else if (value.startsWith("el:")) {
      localStorage.setItem("vaeltrix_elevenlabs_voice_id", value.slice(3));
    } else {
      localStorage.setItem("vaeltrix_voice_uri", value);
    }
    document.getElementById("settings-val-voice").textContent = getVoiceLabel();
    showToast("Voice Diganti Ke " + getVoiceLabel());
  } else if (kind === "folder") {
    const s = sessions.find(s => s.id === folderPickerTargetId);
    if (s) {
      s.folder = value === "__none__" ? null : value;
      saveSessions(); renderHistory();
      showToast(value === "__none__" ? "Folder Dilepas" : `Dipindah Ke Folder "${value}"`);
    }
  }
  closeOptionPicker();
}
if ("speechSynthesis" in window) {
  speechSynthesis.onvoiceschanged = () => { /* daftar suara siap dipakai saat Play Voice dibuka */ };
}

// ============ PLAN UI ============
function updatePlanUI() {
  const badge = document.getElementById("plan-badge");
  const label = document.getElementById("plan-label");
  const icon = document.getElementById("plan-badge-icon");
  if (isPremium) {
    badge.className = "plan-badge premium";
    label.innerHTML = "<b>Premium</b>";
    if (icon) icon.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    document.getElementById("input-hint").textContent = "Vaeltrix Premium · Semua Fitur Aktif";
  } else {
    badge.className = "plan-badge free";
    label.innerHTML = "<b>Free Plans</b>";
    if (icon) icon.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    document.getElementById("input-hint").textContent = "Vaeltrix Adalah AI. Dan Bisa Keliru Periksa Kembali Respons Nya.";
  }
}

function updateCounter() {
  const el = document.getElementById("chat-counter");
  // Dulu: Premium gak ditampilin sama sekali (karena unlimited). Sekarang Premium juga
  // punya limit (60/jam), jadi tetep ditampilin biar user premium tau sisa kuotanya juga.
  const limit = isPremium ? PREMIUM_LIMIT : FREE_LIMIT;
  const rem = Math.max(0, limit - freeCount);
  el.className = rem <= 3 ? "warn" : "";
  el.innerHTML = `Sisa Chat ${isPremium ? "Premium" : "Gratis"}: <span>${rem}</span>/${limit} <span class="reset-note">&middot; Reset ${formatResetCountdown()}</span>`;
}

// ============ USAGE-BASED FREE TIER RESET ============
function initResetTimer() {
  const now = Date.now();
  if (!resetAt || now >= resetAt) {
    resetAt = now + 60 * 60 * 1000; // Direset dari 24 jam -> 1 jam sesuai request
    freeCount = 0;
    localStorage.setItem("vaeltrix_reset_at", resetAt);
    localStorage.setItem("vaeltrix_free_count", "0");
  }
  if (resetTimerHandle) clearInterval(resetTimerHandle);
  resetTimerHandle = setInterval(() => {
    if (Date.now() >= resetAt) initResetTimer();
    // Cek juga kalau trial referral premium sudah habis masanya
    const stillPremium = isPremiumActive();
    if (stillPremium !== isPremium) {
      isPremium = stillPremium;
      updatePlanUI();
      if (!isPremium) showToast("Masa Trial Premium Kamu Sudah Berakhir.");
    }
    updateCounter();
  }, 60 * 1000);
}

function formatResetCountdown() {
  const ms = Math.max(0, resetAt - Date.now());
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h <= 0 && m <= 0) return "Sebentar Lagi";
  if (h <= 0) return `Dalam ${m}M`;
  return `Dalam ${h}j ${m}M`;
}


// ============ API KEY ============
function saveApiKey() {
  const val = document.getElementById("api-key-input").value.trim();
  const st  = document.getElementById("api-status");
  if (val) { localStorage.setItem("vaeltrix_user_key", val); st.textContent = "Gemini Key Tersimpan!"; st.style.color = "#4ade80"; }
  else     { localStorage.removeItem("vaeltrix_user_key");    st.textContent = "Gemini Key Dihapus."; st.style.color = "var(--muted)"; }
  setTimeout(() => st.textContent = "", 2500);
}

function saveGroqKey() {
  const val = document.getElementById("groq-key-input").value.trim();
  const st  = document.getElementById("api-status");
  if (val) { localStorage.setItem("vaeltrix_groq_key", val); st.textContent = "Groq Key Tersimpan!"; st.style.color = "#4ade80"; }
  else     { localStorage.removeItem("vaeltrix_groq_key");    st.textContent = "Groq Key Dihapus."; st.style.color = "var(--muted)"; }
  setTimeout(() => st.textContent = "", 2500);
}

function saveTavilyKey() {
  const val = document.getElementById("tavily-key-input").value.trim();
  const st  = document.getElementById("api-status");
  if (val) { localStorage.setItem("vaeltrix_tavily_key", val); st.textContent = "Tavily Key Tersimpan!"; st.style.color = "#4ade80"; }
  else     { localStorage.removeItem("vaeltrix_tavily_key");    st.textContent = "Tavily key dihapus, pakai DuckDuckGo aja."; st.style.color = "var(--muted)"; }
  setTimeout(() => st.textContent = "", 2500);
}

function saveElevenLabsKey() {
  const val = document.getElementById("elevenlabs-key-input").value.trim();
  const st  = document.getElementById("api-status");
  if (val) { localStorage.setItem("vaeltrix_elevenlabs_key", val); st.textContent = "ElevenLabs Key Tersimpan!"; st.style.color = "#4ade80"; }
  else     { localStorage.removeItem("vaeltrix_elevenlabs_key"); st.textContent = "ElevenLabs Key Dihapus, Play Voice Balik Ke Browser."; st.style.color = "var(--muted)"; }
  setTimeout(() => st.textContent = "", 3000);
}

function savePollinationsKey() {
  const val = document.getElementById("pollinations-key-input").value.trim();
  const st  = document.getElementById("api-status");
  if (val && val.startsWith("sk_")) {
    // Key sk_ (secret) sengaja ditolak di sini — itu buat backend, kalau nempel di app client-side
    // kayak gini bisa disedot siapa aja lewat View Source, persis kasus DEFAULT_KEY/GROQ_KEY yang lama.
    st.textContent = "Jangan Pakai Key sk_ Di Sini, Pakai Yang pk_ (Publishable)."; st.style.color = "var(--danger)";
  } else if (val) {
    localStorage.setItem("vaeltrix_pollinations_key", val); st.textContent = "Pollinations Key Tersimpan!"; st.style.color = "#4ade80";
  } else {
    localStorage.removeItem("vaeltrix_pollinations_key"); st.textContent = "Pollinations Key Dihapus."; st.style.color = "var(--muted)";
  }
  setTimeout(() => st.textContent = "", 3000);
}

// ============ PREMIUM ============
function openPremiumModal() {
  document.getElementById("premium-modal").classList.add("show");
  document.getElementById("modal-error").textContent = "";
  document.getElementById("premium-code-input").value = "";
  if (!isDesktopLayout()) closeSidebar();
  setTimeout(() => document.getElementById("premium-code-input").focus(), 350);
}
function closePremiumModal() { document.getElementById("premium-modal").classList.remove("show"); }

function activatePremium() {
  const code  = document.getElementById("premium-code-input").value.trim().toUpperCase();
  const errEl = document.getElementById("modal-error");
  if (!code) { errEl.textContent = "Please Input Your Code For Acces Premium Plans."; return; }
  if (PREMIUM_CODES.map(c => c.toUpperCase()).includes(code)) {
    isPremium = true;
    localStorage.setItem("vaeltrix_premium", "true");
    closePremiumModal();
    updatePlanUI();
    updateCounter();
    showToast("Premium Aktif! Welcome.", false);
  } else {
    errEl.textContent = "Kode Salah Atau Sudah Kadaluarsa";
    const inp = document.getElementById("premium-code-input");
    inp.style.borderColor = "rgba(255,100,100,0.6)";
    setTimeout(() => inp.style.borderColor = "", 1500);
  }
}


