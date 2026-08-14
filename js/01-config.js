// VaeltrixAI — Config: model registry, endpoints, quick prompts, global state

// init
// ⚠️ KEAMANAN: JANGAN taruh API key asli langsung di source code client-side seperti ini.
// File .html ini bisa dibaca siapa aja lewat "View Source"/DevTools begitu di-hosting/dibagikan,
// jadi key apapun yang ditulis di sini otomatis BOCOR ke publik dan bisa disalahgunakan orang lain
// sampai kena limit/tagihan. Isi key kamu sendiri lewat Settings > "Custom API Keys" di dalam app —
// key itu kesimpen aman di localStorage browser kamu sendiri, gak pernah ikut ke file ini.
const DEFAULT_KEY = "___";  // Gemini key 1 — isi lewat Settings > Custom API Keys
const DEFAULT_KEY2 = "___"; // Gemini key 2 — isi lewat Settings > Custom API Keys
const GROQ_KEY = "___";     // Groq API key — isi lewat Settings > Custom API Keys
const _k = 0;
const _ec = [0];
const PREMIUM_CODES = _ec.map(e => e.map(c => String.fromCharCode(c ^ _k)).join(''));
const FREE_LIMIT = 20;     // Free: 20 pesan per window reset
const PREMIUM_LIMIT = 60;  // Premium: 60 pesan per window reset (bukan lagi unlimited)
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions";
// Edit Foto: endpoint OpenAI-compatible Pollinations yang beneran support image-to-image editing
// (bukan endpoint /image/prompt lama yang cuma text-to-image). Butuh API key pk_ (publishable,
// aman ditaruh client-side) dari enter.pollinations.ai — beda dari endpoint generate foto biasa
// yang gratis tanpa key.
const POLLINATIONS_EDIT_BASE = "https://gen.pollinations.ai/v1/images/edits";
const TAVILY_KEY = "___"; // Tavily key — isi lewat Settings > Custom API Keys. Kosong = otomatis fallback ke DuckDuckGo

// ElevenLabs TTS — GAK ADA default key sengaja (beda dari GROQ_KEY/TAVILY_KEY di atas), karena ini
// fitur opt-in berbayar. Kosong = "Play Voice" otomatis tetap pakai Web Speech API browser (gratis,
// kayak semula). Isi key sendiri lewat Settings > Custom API Keys buat upgrade ke suara ElevenLabs.
const ELEVENLABS_TTS_BASE = "https://api.elevenlabs.io/v1/text-to-speech";
// Flash v2.5: latency paling rendah & ~separuh biaya credit dibanding Multilingual v2, tapi tetap
// full support Bahasa Indonesia — pilihan paling hemat buat baca-in balasan chat yang bisa panjang.
const ELEVENLABS_MODEL = "eleven_flash_v2_5";
// 6 suara premade ElevenLabs paling stabil & teruji (bukan community voice yang kualitasnya naik-turun) —
// 3 cewek, 3 cowok, biar user punya pilihan tanpa harus scroll ribuan suara di Voice Library mereka.
const ELEVENLABS_VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", gender: "f", desc: "Tenang & Natural — Cocok Buat Narasi" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella",  gender: "f", desc: "Lembut & Hangat" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli",   gender: "f", desc: "Ekspresif & Ceria" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam",   gender: "m", desc: "Dalam & Berwibawa" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", gender: "m", desc: "Profesional & Ramah" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh",   gender: "m", desc: "Tegas & Meyakinkan" },
];

const MODELS = {
  // Flash: Seimbang antara kecepatan dan kecerdasan buat chat biasa
  flash:  { api: "gemini", models: ["gemini-3.6-flash"] },
  
  // Lite-1.5: Groq adalah raja speed. GPT-OSS 120B/20B gantiin Llama 3.1/3.3 yang udah di-deprecate Groq
  lite: { api: "groq", models: ["openai/gpt-oss-120b", "openai/gpt-oss-20b"] },
  
  // Code: Butuh logika tingkat tinggi. Wajib pakai seri Pro — TAPI gemini-3.1-pro-preview gak
  // punya free tier sama sekali di Gemini API (konfirmasi dari dokumentasi resmi Google, Agustus
  // 2026), dan sebelumnya array ini cuma 1 model doang alias GAK ADA fallback kalau key yang
  // dipakai gak billing-enabled atau lagi kena limit. Ditambahin gemini-3.6-flash sebagai
  // fallback terakhir — kualitas turun dikit, tapi mode Code tetap jalan daripada user
  // premium malah dapet error total.
  code:    { api: "gemini", models: ["gemini-3.1-pro", "gemini-3.6-flash"] },
  
  // Maxs: Butuh context window raksasa & analisis berat (juga pakai Pro). Sama kayak Code,
  // ditambahin fallback bertingkat — pro-preview dulu (paling pintar tapi paid-only), turun ke
  // pro biasa, baru ke flash kalau dua-duanya gagal.
  maxs:    { api: "gemini", models: ["gemini-3.1-pro-preview", "gemini-3.1-pro", "gemini-3.6-flash"] },

  // Deep Research: Riset Mendalam multi-sudut. Utamakan Pro Preview, otomatis fallback ke Pro
  // biasa kalau gagal, lalu Flash sebagai jaring pengaman terakhir biar riset tetap bisa jalan.
  research: { api: "gemini", models: ["gemini-3.1-pro-preview", "gemini-3.1-pro", "gemini-3.6-flash"] },

  // Offline: Jalan 100% LOKAL di browser lewat WebGPU (WebLLM) — gak ada fetch() ke server sama
  // sekali pas generate jawaban, jadi beneran tetap kepake walau device gak ada internet.
  // Konsekuensinya: model kecil (3B) dan jauh lebih terbatas dibanding Flash/Code/Maxs yang di cloud.
  // Model didownload sekali dari CDN Hugging Face pas pertama kali dipakai (~2GB), abis itu
  // di-cache browser (Cache Storage) jadi load berikutnya cepat & gak perlu internet lagi.
  offline: { api: "webllm", models: ["Llama-3.2-3B-Instruct-q4f16_1-MLC"] }
};

// ============ MODEL ENDPOINT REGISTRY ============
// Tiap model punya baris config sendiri (endpoint + max output token) — mau nambah model baru,
// ganti model, atau numpangin satu model ke endpoint/proxy lain, tinggal ubah/tambah baris di
// sini aja, gak perlu ngoprek fungsi callGroq/callGeminiAPI.
// Catatan jujur: endpoint Groq itu SATU URL yang sama buat semua model chat-nya (model dipilih
// lewat field "model" di body, bukan lewat URL) — beda sama Gemini yang emang selalu punya URL
// per-model. Jadi baris "endpoint" di bawah tetap dipisah per model biar gampang dioprek satu-satu,
// walau nilainya kebetulan sama buat semua model Groq.
const MODEL_ENDPOINTS = {
  "gemini-3.6-flash":        { provider: "gemini", endpoint: GEMINI_BASE, maxTokens: 9281 },
  "gemini-3.1-pro":          { provider: "gemini", endpoint: GEMINI_BASE, maxTokens: 9282 },
  "gemini-3.1-pro-preview":  { provider: "gemini", endpoint: GEMINI_BASE, maxTokens: 9281 },
  "openai/gpt-oss-120b":     { provider: "groq",   endpoint: GROQ_BASE,   maxTokens: 4096 },
  "openai/gpt-oss-20b":      { provider: "groq",   endpoint: GROQ_BASE,   maxTokens: 4096 },
};

// Model vision Groq buat gambar/foto (Vaeltrix Vision)
const VISION_MODEL = "qwen/qwen3.6-27b";

// ============ QUICK PROMPTS ============
const QUICK_PROMPTS = [
  { icon: "email", title: "Draft Email", desc: "Bikinin Email Profesional Buat...", text: "Tolong bikinin draft email profesional untuk: " },
  { icon: "cv", title: "Bikin CV / Resume", desc: "Susun CV Rapi Berdasarkan Pengalaman Kamu", text: "Bantu saya bikin CV/resume rapi berdasarkan pengalaman ini: " },
  { icon: "translate", title: "Translate Teks", desc: "Terjemahin Teks Ke Bahasa Lain", text: "Tolong terjemahkan teks berikut ke Bahasa Inggris: " },
  { icon: "summary", title: "Ringkas Teks", desc: "Rangkum Artikel/Dokumen Panjang", text: "Tolong ringkas teks berikut jadi poin-poin penting: " },
  { icon: "idea", title: "Ide Konten", desc: "Cariin Ide Konten Yang Menarik", text: "Kasih saya 10 ide konten menarik tentang: " },
  { icon: "code", title: "Review Kode", desc: "Cek Bug & Kasih Saran Perbaikan", text: "Tolong review kode berikut, cari bug dan kasih saran perbaikan:\n\n" },
];

// ============ STATE ============
let sessions    = JSON.parse(localStorage.getItem("vaeltrix_sessions") || "[]");
let currentSession = null;
let currentMode = "flash";
let vaeltrixFolders = JSON.parse(localStorage.getItem("vaeltrix_folders") || "[]");
let folderPickerTargetId = null;
function saveFolders() { localStorage.setItem("vaeltrix_folders", JSON.stringify(vaeltrixFolders)); }
let freeCount   = parseInt(localStorage.getItem("vaeltrix_free_count") || "0");
let isTyping    = false;
let imageGenMode = false; // Mode "Buat Photo" — pesan berikutnya jadi prompt generate gambar (Pollinations)
let imageEditMode = false; // Mode "Edit Foto" — pesan berikutnya jadi instruksi edit buat gambar yang udah dilampirkan
let currentAbortController = null;
let draftSaveTimer = null;

// Vaeltrix Memory — inget preferensi/konteks user lintas sesi
let vMemory = JSON.parse(localStorage.getItem("vaeltrix_memory") || "[]");

// Vaeltrix Stats
let vStats = JSON.parse(localStorage.getItem("vaeltrix_stats") || '{"totalChats":0,"totalMsgs":0,"modeUsage":{"flash":0,"lite":0,"code":0,"maxs":0,"research":0,"offline":0}}');

// Feedback thumbs up/down (per message id)
let vFeedback = JSON.parse(localStorage.getItem("vaeltrix_feedback") || "{}");

// Referral
let referralCode = localStorage.getItem("vaeltrix_referral_code");
let trialExpiry  = parseInt(localStorage.getItem("vaeltrix_trial_expiry") || "0");

// Free tier reset (usage-based)
let resetAt = parseInt(localStorage.getItem("vaeltrix_reset_at") || "0");
let resetTimerHandle = null;

// Attachments (Vaeltrix Vision / File Upload)
let pendingAttachments = []; // { name, type, dataUrl?, textContent?, isImage }

// Voice
let recognition = null;
let isRecording = false;
let currentSpeakUtterance = null;
let currentElevenAudio = null; // <audio> yang lagi diputer pas Play Voice pakai provider ElevenLabs

// Vaeltrix Artifact — panjang minimum (karakter) isi ``` ``` biar dianggap layak dibuka sebagai
// Artifact (kode pendek gak worth-it, cukup lewat tombol Salin/Perbesar bawaan yang udah ada).
const ARTIFACT_MIN_LEN = 180;

// Vaeltrix Projects/Workspace — grup chat + instruksi khusus + file referensi
let projects = JSON.parse(localStorage.getItem("vaeltrix_projects") || "[]");
let projectDetailId = null; // project yang lagi kebuka detailnya di panel

// Vaeltrix Live — voice mode dua arah (dengar -> jawab -> ngomong -> ulang)
let liveModeOpen = false;
let liveRecognition = null;
let liveState = "idle"; // idle | listening | thinking | speaking
let liveMuted = false;
let liveStopRequested = false;
let liveConsecutiveFails = 0; // hitungan gagal beruntun (buat cegah loop restart tanpa henti)
let liveRestartTimer = null;

// Shared/read-only mode
let isSharedView = false;

// Premium = kode aktivasi permanen ATAU lagi dalam masa trial referral
function isPremiumActive() {
  if (localStorage.getItem("vaeltrix_premium") === "true") return true;
  return trialExpiry > Date.now();
}
let isPremium = isPremiumActive();


