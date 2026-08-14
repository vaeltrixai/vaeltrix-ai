# VaeltrixAI
<div align="center">
  <img src="./app_logo.jpeg" alt="VaeltrixAI Logo" width="120" style="border-radius: 20px;">
  <h1>VaeltrixAI</h1>
  <p><strong>AI Assistant yang Powerful, Ringan, dan Bisa Dipasang di Homescreen 📱</strong></p>
  <p>
    <img src="https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white" alt="PWA">
    <img src="https://img.shields.io/badge/Vanilla-JS-F7DF1E?logo=javascript&logoColor=black" alt="Vanilla JS">
    <img src="https://img.shields.io/badge/Mobile-First-FF6B6B?logo=android&logoColor=white" alt="Mobile First">
    <img src="https://img.shields.io/badge/Open%20Source-%E2%9D%A4-3CB371" alt="Open Source">
  </p>
  <p><em>Built with ❤️ by RajaCoders × VaeltrixLabs</em></p>
</div>

---
**AI Assistant yang Powerful, Ringan, Modular, dan Bisa Dipasang di Homescreen 📱**

*Built with ❤️ by RajaCoders × VaeltrixLabs*

---

## 🚀 Apa itu VaeltrixAI?

**VaeltrixAI** adalah AI assistant berbasis web yang dirancang untuk berjalan cepat di perangkat apapun — dari HP entry-level sampai desktop. Dibangun sebagai **Progressive Web App (PWA)**, kamu bisa install langsung ke homescreen tanpa perlu download dari app store.

Versi ini sudah **modular** (CSS & JS terpisah), lebih maintainable, dan packed dengan fitur produktivitas.

> 💡 **Visi**: AI yang accessible untuk semua orang — tanpa perangkat mahal, tanpa install ribet, bahkan bisa jalan offline.

---

## ✨ Fitur Utama

| Fitur | Status | Keterangan |
|-------|--------|------------|
| ⚡ **PWA Ready** | ✅ | Install ke homescreen, works offline (setelah pertama kali dibuka) |
| 🎨 **UI Responsive + Theme** | ✅ | Mobile & desktop, light/dark, font size |
| 💾 **Local Storage** | ✅ | Session, memory, settings, projects tersimpan lokal |
| 🧠 **Multi Mode** | ✅ | Flash 1.5 · Lite 1.5 · Code · Maxs · Deep Research · **Offline (WebLLM)** |
| 👁️ **Vision** | ✅ | Upload gambar + analisis (model vision via Groq) |
| 🖼️ **Image Generation & Edit** | ✅ | Buat foto + Edit Foto (Pollinations) |
| 📎 **Attachments** | ✅ | Gambar, PDF (text extraction), clipboard |
| 🧩 **Artifacts** | ✅ | Kode panjang dibuka sebagai artifact interaktif |
| 📁 **Projects / Workspace** | ✅ | Grup chat + instruksi khusus + file referensi |
| 🧠 **Memory + Persona** | ✅ | Ingat preferensi user lintas sesi |
| 🎤 **Voice + Live Voice** | ✅ | Input suara, TTS (Web Speech / ElevenLabs), mode dua arah |
| 🔍 **Web Search** | ✅ | Tavily (primary) + DuckDuckGo fallback |
| 📝 **Markdown Rich** | ✅ | Code highlight, tabel, KaTeX/math |
| 🔒 **Premium + Referral** | ✅ | Limit free, kode aktivasi, trial referral |
| ⚙️ **Settings Lengkap** | ✅ | Custom API keys, theme, language, PIN lock, profile |
| 📊 **Statistics & Feedback** | ✅ | Usage stats + thumbs up/down |
| 🔗 **Share / Export-Import** | ✅ | Bagikan chat, backup data |

---

## 🛠 Tech Stack

```
├── HTML5 + CSS3 (modular)
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   ├── responsive.css
│   └── features.css
├── Vanilla JS (modular, no framework, no build step)
│   ├── 01-config.js
│   ├── 02-utils.js
│   ├── 03-init.js
│   ├── 04-settings.js
│   ├── 05-sidebar.js
│   ├── 06-chat-core.js
│   ├── 07-providers.js
│   ├── 08-markdown.js
│   ├── 09-attachments.js
│   ├── 10-memory-persona.js
│   ├── 11-voice.js
│   ├── 12-search.js
│   ├── 13-data.js
│   ├── 14-projects.js
│   ├── 15-artifacts.js
│   └── 16-live-voice.js
├── PWA (manifest.json + sw.js)
├── pdf.js, highlight.js, KaTeX, JSZip
└── Providers: Gemini · Groq · Pollinations · Tavily · WebLLM (offline) · ElevenLabs (opsional)
```

> Kenapa Vanilla JS? Ringan, cepat, **tidak perlu build step**. Bisa diedit langsung di browser.

---

## 📦 Cara Menjalankan

### 1. Clone / Download
```bash
git clone https://github.com/vaeltrixai/vaeltrix-ai.git
cd vaeltrix-ai
```

### 2. Jalankan di Local
Karena pure HTML/CSS/JS, cukup buka `index.html`:

```bash
# Opsi A: Direct
open index.html          # Mac
start index.html         # Windows

# Opsi B: Live Server (Recommended)
python -m http.server 8000
# atau
npx serve .
# atau
php -S localhost:8000
```

Lalu buka `http://localhost:8000`.

### 3. Install sebagai PWA
1. Buka di Chrome / Edge / Safari
2. Klik **Add to Home Screen** / **Install**
3. Selesai! 🎉

---

## ⚠️ Keamanan API Key (PENTING)

**Jangan** taruh API key asli langsung di source code (`js/01-config.js`).

File client-side bisa dibaca siapa saja lewat View Source / DevTools.  
Isi key kamu sendiri lewat **Settings → Custom API Keys** di dalam app.  
Key disimpan di `localStorage` browser kamu sendiri, tidak ikut ke file.

Default key di config hanya placeholder / untuk development lokal.

---

## 🗺 Roadmap

```
Q3 2026  →  Migrasi backend ke Supabase (cloud-native)
Q3 2026  →  Connector v1: Gmail & Google Calendar
Q4 2026  →  Connector v2: GitHub, Stripe, Notion
Q4 2026  →  Auth & Multi-device Sync
2027     →  Plugin Ecosystem (3rd party connectors)
```

---

## 🤝 Kontribusi

Kami terbuka untuk kontribusi!

1. Fork repo ini
2. Buat branch baru: `git checkout -b fitur-keren`
3. Commit: `git commit -m "feat: tambah fitur X"`
4. Push & buka Pull Request

### Area yang butuh bantuan
- 🎨 UI/UX improvements & animations
- 🔌 Connector integrations
- 🐛 Bug fixes & performance
- 📚 Documentation & translations
- 🧪 Offline mode (WebLLM) improvements

---

## 📄 Lisensi

[MIT License](LICENSE) — Bebas pakai, bebas modifikasi, bebas kontribusi.  
Jangan lupa kasih ⭐ kalau suka!

---

## 🙌 Credits

**RajaCoders × VaeltrixLabs**

From 0 to 741+ users and growing. Thank you for the support! 🚀

[⭐ Star this repo](https://github.com/vaeltrixai/vaeltrix-ai) ·  
[🐛 Report Bug](https://github.com/vaeltrixai/vaeltrix-ai/issues) ·  
[💬 Discussions](https://github.com/vaeltrixai/vaeltrix-ai/discussions)

---

Built with caffeine, curiosity, and a lot of `console.log()`
```
