// VaeltrixAI — Web search, deep research, offline mode

// ============ PENCARIAN WEB (Tavily → fallback DuckDuckGo) ============
function isWebSearchEnabled() { return localStorage.getItem("vaeltrix_websearch") === "1"; }
function toggleWebSearch(on) {
  localStorage.setItem("vaeltrix_websearch", on ? "1" : "0");
  showToast(on ? "Pencarian Web Diaktifkan" : "Pencarian Web Dimatikan");
}

// ============ OFFLINE MODE (PREMIUM) ============
// Chat & sesi Vaeltrix sudah tersimpan lokal di device (localStorage). Kalau fitur ini aktif dan
// koneksi internet lagi putus saat kirim pesan, Vaeltrix gak akan gagal/nge-hang — pesan disimpan
// aman dan user ditawarin kirim ulang otomatis begitu koneksi balik.
function isOfflineModeEnabled() { return localStorage.getItem("vaeltrix_offline_mode") === "1"; }
function toggleOfflineMode(el) {
  if (el.checked && !isPremium) {
    el.checked = false;
    closeAttachMenu();
    openPremiumModal();
    return;
  }
  localStorage.setItem("vaeltrix_offline_mode", el.checked ? "1" : "0");
  showToast(el.checked ? "Offline Mode Aktif — Chat Kamu Tetap Aman Walau Tanpa Internet" : "Offline Mode Dimatikan");
}
window.addEventListener("online", () => {
  if (isOfflineModeEnabled() && isPremium) showToast("Internet Kembali — Vaeltrix Siap Lagi, Tuan", false);
});

// ============ DEEP RESEARCH (PREMIUM) ============
function tryDeepResearch() {
  if (!isPremium) { closeAttachMenu(); openPremiumModal(); return; }
  setMode("research");
  closeAttachMenu();
  showToast("Deep Research Aktif — Vaeltrix Analisis Lebih Mendalam");
}

async function tavilySearch(query) {
  const key = localStorage.getItem("vaeltrix_tavily_key") || TAVILY_KEY;
  if (!key) throw new Error("Tavily Key Kosong");
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: key, query, search_depth: "basic", max_results: 5, include_answer: true })
  });
  if (!res.ok) throw new Error(`Tavily HTTP ${res.status}`);
  const data = await res.json();
  let out = "";
  if (data.answer) out += `Ringkasan: ${data.answer}\n\n`;
  (data.results || []).slice(0, 5).forEach(r => {
    out += `- ${r.title}: ${(r.content || "").slice(0, 300)} (${r.url})\n`;
  });
  if (!out.trim()) throw new Error("Tavily Respons Kosong");
  return out.trim();
}

async function duckduckgoSearch(query) {
  const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
  if (!res.ok) throw new Error(`DuckDuckGo HTTP ${res.status}`);
  const data = await res.json();
  let out = "";
  if (data.AbstractText) out += `${data.AbstractText} (${data.AbstractURL || ""})\n\n`;
  (data.RelatedTopics || []).slice(0, 5).forEach(t => {
    if (t.Text) out += `- ${t.Text}\n`;
  });
  if (!out.trim()) throw new Error("DuckDuckGo Respons Kosong");
  return out.trim();
}

async function performWebSearch(query) {
  try {
    return await tavilySearch(query);
  } catch (e) {
    console.warn("Tavily Gagal, Fallback Ke DuckDuckGo:", e.message);
    return await duckduckgoSearch(query); // biarin error-nya nembus kalau ini juga gagal
  }
}


