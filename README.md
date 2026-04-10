# Telegram Group Management Bot

A powerful Node.js bot for managing Telegram groups with features like banning, kicking, muting users, and issuing warnings.

## 🚀 Deploy to Render

### Step 1: Create Bot Token
1. Go to [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow instructions
3. Copy the bot token

### Step 2: Deploy on Render
1. Go to [Render.com](https://render.com) and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository (or upload files)
4. Configure:
   - **Name:** `telegram-group-bot`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

### Step 3: Set Environment Variables
In Render dashboard, go to **Environment** and add:
```
BOT_TOKEN=your_bot_token_here
NODE_ENV=production
RENDER_EXTERNAL_URL=https://your-app-name.onrender.com
```

### Step 4: Deploy
Click **"Create Web Service"** and wait for deployment.

## Features

✅ **User Management**
- Ban users from groups
- Kick users from groups
- Mute users (silence for 1 hour)
- Warning system (auto-kick after 3 warnings)

✅ **Group Features**
- Welcome new members
- Track member departures
- Store group settings
- Display group rules

✅ **Easy to Use**
- Simple command-based interface
- Inline keyboard support
- Error handling

## Requirements

- Node.js (v14 or higher)
- npm or yarn
- A Telegram Bot Token (get from @BotFather)

## Installation

1. Clone or download this project:
```bash
cd /path/to/group
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Edit `.env` and add your bot token:
```
BOT_TOKEN=your_token_here
```

## Getting Your Bot Token

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Follow the instructions to create a new bot
4. Copy the token and paste it in your `.env` file

## Running the Bot

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

## Available Commands

### User Management
- `/ban` - Ban a user (reply to their message)
- `/kick` - Kick a user (reply to their message)
- `/mute` - Mute a user for 1 hour (reply to their message)
- `/warn` - Warn a user (auto-kick after 3 warnings)

### Group Info
- `/help` - Show all available commands
- `/settings` - View group settings
- `/rules` - Display group rules
- `/about` - About the bot

## How to Use

1. Add the bot to your Telegram group
2. Make the bot an **Administrator** with the following permissions:
   - Delete messages
   - Ban users
   - Restrict users
   - Manage messages

3. Use commands by replying to messages:
   - Reply to a user's message and type `/ban` to ban them
   - Reply to a user's message and type `/kick` to kick them
   - Reply to a user's message and type `/mute` to mute them
   - Reply to a user's message and type `/warn` to warn them

## Project Structure

```
group/
├── bot.js           # Main bot logic
├── package.json     # Project dependencies
├── .env             # Environment variables (create this)
├── .env.example     # Example environment file
└── README.md        # This file
```

## Database Integration (Optional)

Currently, the bot stores data in memory. For production use, consider integrating:
- MongoDB
- PostgreSQL
- Redis
- Firebase

## Troubleshooting

### Bot doesn't respond
- Ensure the bot token is correct
- Check that the bot is added to the group
- Verify the bot has admin permissions

### Commands don't work
- Make sure the bot is an administrator in the group
- Check that you're replying to a user's message when using moderation commands
- Ensure required permissions are granted

## Contributing

Feel free to modify and enhance the bot with new features!

## License

ISC

## Support

For issues or questions, refer to:
- [Telegraf Documentation](https://telegraf.js.org/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
