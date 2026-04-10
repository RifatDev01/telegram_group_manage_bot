# Telegram Group Management Bot

A powerful **Telegram Group Management Bot** built with Node.js.
This bot helps administrators manage their Telegram groups efficiently with moderation tools like banning, kicking, muting users, and warning systems.

---

## ⚠️ License & Usage

This project is licensed under the MIT License.

You are free to use this bot, but **you must give proper credit to the original author**.

Author: **MD Rifat Sarkar**

Unauthorized redistribution or selling of this bot without credit is not allowed.

---

# 🚀 Features

### 👮 User Moderation

* Ban users from group
* Kick users instantly
* Mute users temporarily
* Warning system (Auto kick after 3 warnings)

### 📊 Group Management

* Welcome new members
* Track member joins and leaves
* Group rules command
* Group settings system

### ⚡ Easy Commands

* Simple command based system
* Reply based moderation
* Fast response
* Error handling included

---

# 📦 Requirements

* Node.js v14 or higher
* npm or yarn
* Telegram Bot Token

---

# 🤖 Create Telegram Bot

1. Open Telegram
2. Search **@BotFather**
3. Send command

/newbot

4. Follow instructions
5. Copy your **BOT TOKEN**

---

# ⚙️ Installation

Clone the repository:

```
git clone https://github.com/yourusername/telegram_group_manage_bot.git
```

Go to project folder:

```
cd telegram_group_manage_bot
```

Install dependencies:

```
npm install
```

---

# 🔐 Environment Setup

Create a `.env` file in the root directory.

Example:

```
BOT_TOKEN=your_bot_token_here
NODE_ENV=production
```

---

# ▶️ Run the Bot

Development mode:

```
npm run dev
```

Production mode:

```
npm start
```

---

# 📜 Available Commands

### Moderation Commands

/ban – Ban a user
/kick – Kick a user
/mute – Mute a user for 1 hour
/warn – Warn a user (Auto kick after 3 warnings)

### Information Commands

/help – Show help menu
/settings – Group settings
/rules – Show group rules
/about – About this bot

---

# 👑 Bot Setup in Group

1. Add the bot to your Telegram group
2. Promote the bot as **Administrator**
3. Enable permissions:

* Delete messages
* Ban users
* Restrict members
* Manage messages

---

# 📁 Project Structure

```
telegram-group-bot
│
├── bot.js
├── package.json
├── .env.example
├── .env
└── README.md
```

---

# 🛠 Future Improvements

* Database support (MySQL)
* Dashboard panel
* Anti-spam system
* Auto moderation
* Advanced logging

---

# 👨‍💻 Author

**MD Rifat Sarkar**
Github: https://github.com/RifatDev01
Telegram: https://t.me/Rifat204BD

---

# ⭐ Support

If you like this project, consider giving it a **star on GitHub**.
