// VaeltrixAI — Init: app bootstrap (window.onload), onboarding

// ============ INIT ============
window.onload = () => {
  // Cek dulu apakah ini link Share (read-only) sebelum render normal
  if (location.hash.startsWith("#share=")) {
    renderSharedView();
    return;
  }

  updatePlanUI();
  checkInterruptedMessages();
  renderHistory();
  initResetTimer();
  updateCounter();
  renderQuickPrompts();
  renderQpBar();
  renderMemoryList();
  initReferral();

  // Pulihkan chat terakhir yang aktif (persist lintas reload)
  const lastId = parseInt(localStorage.getItem("vaeltrix_last_session_id") || "0", 10);
  const lastSession = sessions.find(s => s.id === lastId);
  if (lastSession) {
    currentSession = lastSession;
    if (currentSession.mode) setMode(currentSession.mode);
    renderHistory();
  }
  renderChat();
  restoreDraft();
  renderPersonaList();

  const saved = localStorage.getItem("vaeltrix_user_key");
  if (saved) {
    document.getElementById("api-key-input").value = saved;
    document.getElementById("api-status").textContent = "Key Tersimpan.";
    document.getElementById("api-status").style.color = "#4ade80";
  }
  const savedGroq = localStorage.getItem("vaeltrix_groq_key");
  if (savedGroq) {
    document.getElementById("groq-key-input").value = savedGroq;
  }
  const savedTavily = localStorage.getItem("vaeltrix_tavily_key");
  if (savedTavily) {
    document.getElementById("tavily-key-input").value = savedTavily;
  }
  const savedEleven = localStorage.getItem("vaeltrix_elevenlabs_key");
  if (savedEleven) {
    document.getElementById("elevenlabs-key-input").value = savedEleven;
  }
  // Sidebar: permanen di desktop (sesuai preferensi tersimpan), drawer tertutup di mobile
  applyInitialSidebarState();

  // Info shortcut keyboard cuma relevan buat desktop (mobile: Enter = baris baru)
  if (!isTouchDevice()) {
    const hint = document.getElementById("input-hint");
    if (hint) hint.innerHTML += ' &middot; <span style="opacity:0.8;">Enter Kirim, Shift+Enter Baris Baru</span>';
  }

  document.getElementById("premium-code-input").addEventListener("keydown", e => {
    if (e.key === "Enter") activatePremium();
  });

  // Tutup more-menu kalau klik di luar
  document.addEventListener("click", (e) => {
    const wrap = document.getElementById("more-menu-wrap");
    if (wrap && !wrap.contains(e.target)) document.getElementById("more-menu").classList.remove("open");
  });

  // Aksesibilitas: tombol Escape menutup modal/sheet yang lagi kebuka
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    document.getElementById("more-menu")?.classList.remove("open");
    ["qp-backdrop","stats-backdrop","ref-backdrop","export-backdrop","share-backdrop","search-backdrop","onboard-backdrop"].forEach(id => {
      document.getElementById(id)?.classList.remove("show");
    });
    if (document.getElementById("premium-modal")?.classList.contains("show")) closePremiumModal();
    if (document.getElementById("preview-modal")?.classList.contains("show")) closePreview();
    if (document.getElementById("code-expand-modal")?.classList.contains("show")) closeCodeExpand();
    if (!isDesktopLayout() && !document.getElementById("sidebar").classList.contains("hidden")) closeSidebar();
  });

  // Keyboard shortcut buat pengguna desktop: Ctrl/Cmd+K = Cari Chat, Ctrl/Cmd+N = Chat Baru
  document.addEventListener("keydown", (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const key = e.key.toLowerCase();
    if (key === "k") { e.preventDefault(); openSearchModal(); }
    else if (key === "n") { e.preventDefault(); newChat(); }
  });

  // Tombol scroll-ke-bawah — muncul kalau posisi baca udah jauh dari pesan terbaru
  document.getElementById("chat")?.addEventListener("scroll", updateScrollBtnVisibility);
  updateScrollBtnVisibility();

  // Indikator koneksi terputus
  window.addEventListener("offline", () => setOfflineBanner(true));
  window.addEventListener("online", () => setOfflineBanner(false));
  if (!navigator.onLine) setOfflineBanner(true);

  // Service Worker — biar VaeltrixAI bisa di-install sebagai app & tetap kebuka pas offline
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch((err) => {
        console.warn("VaeltrixAI: Service Worker Gagal Didaftarkan.", err);
      });
    });
  }

  // Onboarding — cuma muncul sekali di kunjungan pertama
  if (localStorage.getItem("vaeltrix_onboarded") !== "true") {
    setTimeout(() => document.getElementById("onboard-backdrop")?.classList.add("show"), 500);
  }

  // Kalau dibuka lewat link referral teman (?ref=KODE), auto-isi di kolom klaim
  const params = new URLSearchParams(location.search);
  const refFromLink = params.get("ref");
  if (refFromLink && refFromLink !== referralCode) {
    setTimeout(() => {
      openReferralModal();
      document.getElementById("ref-input").value = refFromLink.toUpperCase();
    }, 500);
  }

  // ==== Init Settings (Theme, Font Size, Language, App Lock, Profil) ====
  applyTheme(getTheme());
  applyFontSize(getFontSize());
  updateProfileUI();
  checkAppLock();
  document.querySelectorAll(".beta-badge").forEach(b => b.style.display = isBetaEnabled() ? "inline" : "none");
};


// ============ TOAST ============
// ============ ONBOARDING ============
function onboardGoTo(i) {
  document.querySelectorAll(".onboard-slide").forEach(s => s.classList.toggle("active", parseInt(s.dataset.slide, 10) === i));
  document.querySelectorAll(".onboard-dot").forEach(d => d.classList.toggle("active", parseInt(d.dataset.dot, 10) === i));
  const skipBtn = document.getElementById("onboard-skip-btn");
  if (skipBtn) skipBtn.style.display = (i === 3) ? "none" : "";
}
function closeOnboarding() {
  localStorage.setItem("vaeltrix_onboarded", "true");
  document.getElementById("onboard-backdrop")?.classList.remove("show");
}

// ============ PEMULIHAN RESPONS TERPUTUS ============
// PENTING BUAT DIPAHAMI: VaeltrixAI itu app statis client-side murni (gak ada server sendiri),
// manggil Gemini/Groq LANGSUNG dari browser. Kalau app/tab BENERAN ditutup total (bukan cuma
// diminimize) di tengah proses generate jawaban, request yang lagi jalan di JS ikut mati —
// GAK ADA cara bikin dia "tetap jalan di background" beneran dan nunggu buat dipulihin, karena
// gak ada proses server yang megang & nerusin kerjaannya. Itu beda cerita kalau app ini punya
// backend sendiri (lihat obrolan kita soal Cloudflare Worker) — baru di situ generate beneran
// bisa lanjut walau app di-close total, karena yang kerja adalah SERVER, bukan tab browser user.
//
// Yang REALISTIS bisa dijamin app client-side kayak gini:
// 1. Kalau tab/app cuma di-MINIMIZE/pindah app sebentar (bukan di-force-close) — proses JS-nya
//    masih hidup, jawaban tetap keproses, dan notifyIfBackground() bakal munculin notifikasi pas
//    kelar. Ini udah jalan.
// 2. Kalau app BENERAN ditutup di tengah proses — jawabannya emang hilang/gagal, TAPI daripada
//    pesan itu ilang tanpa jejak (kayak sebelumnya), sekarang dikasih tau jujur & bisa dikirim
//    ulang. Fungsi ini yang ngecek itu, dipanggil sekali tiap app dibuka/di-reload.
function checkInterruptedMessages() {
  let found = 0;
  sessions.forEach(s => {
    (s.messages || []).forEach(m => {
      if (m.pending) {
        m.content = "⚠️ **Respons Terputus**\n\nApp Sempat Ditutup Atau Di-Reload Saat VaeltrixAI Masih Memproses Jawaban Ini, Jadi Prosesnya Ikut Terhenti. Kirim Ulang Pesan Sebelumnya Ya, Tuan.";
        m.interrupted = true;
        delete m.pending;
        found++;
      }
    });
  });
  if (found > 0) saveSessions();
}


