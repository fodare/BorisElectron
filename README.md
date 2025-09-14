[![build_and_publish_snap](https://github.com/fodare/BorisElectron/actions/workflows/ci-cd.yaml/badge.svg)](https://github.com/fodare/BorisElectron/actions/workflows/ci-cd.yaml)

# 🔐 Boris

A secure, offline-first desktop app built with **Electron** to help manage **passwords/accounts**, track **finances**, and take **personal notes** — all encrypted and stored locally.

This project is a updated version of my initial [tk-inter implementation](https://github.com/fodare/Boris).

## ✨ Features

- 🔐 **Master Password Login** – Secure all access behind a master password with strong encryption.
- 📦 **Credential Manager** – CRUD credentials.
- 🖱️ **Mouse & Keyboard Shortcuts** – Double-click, copy, delete, esc and more.
- 📁 **100% Offline** – Files are stored locally on your machine.
- 💰 **Finance Tracker (Coming Soon)**
- ✍️ **Secure Notes (Planned)**

---

## 🔁 User Interactions & Shortcuts

- **Mouse**
  - 🔁 *Double-click* a credential row → Opens the update modal
  - 🖱 *Click* a table cell → Selects for interaction

- **Keyboard**

  - ⌘/Ctrl + **C** → Copies selected cell (clipboard auto-clears in 3 seconds)
  - **Delete** → Deletes selected entry after confirmation
  - **ESC** → Closes focused window except main window.

## 📸 Screenshots

> *Coming soon!*

## 🛠️ Tech Stack

- **Electron** – Cross-platform desktop shell
- **Node.js** – Runtime & backend logic
- **Preload Scripts** – Secure IPC communication
- **AES-GCM Encryption** – Local encryption using `crypto` module
- **Vanilla HTML/CSS/JS** – Clean and simple UI layer

## 🚀 Getting Started

### Local development

#### 1. Clone the repository

```bash
git clone https://github.com/fodare/BorisElectron.git
cd BorisElectron
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Lauch the app

```bash
npm run start
# For automatic re-reun on file changes, run...
npm run watch
```

### Installation

[![Get it from the Snap Store](https://snapcraft.io/en/dark/install.svg)](https://snapcraft.io/openops-boris)

## 🔒 Security Overview

This is a personal-use app. For production-scale use, consider a full security audit.

## 📌 Roadmap

- [x] Master password authentication.
- [x] Add/update/delete credentials.
- [x] Local AES encryption.
- [x] Hotkey support.
- [ ] Secure notes (Markdown editor).
- [x] Local finance tracker.
- [ ] Export/import (encrypted backup).
- [x] Auto-lock on inactivity (5 min inactivity trigger).
- [ ] Dark mode toggle.

## 🤝 Contributing

Pull requests, feedback, and ideas are welcome. If you’d like to collaborate, feel free to fork the repo and open an issue or PR.

## 📄 License

This project is licensed under the MIT License. Feel free to use, modify, and distribute as needed.
