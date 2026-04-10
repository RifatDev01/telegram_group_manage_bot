const { Telegraf, Markup } = require('telegraf');
const http = require('http');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const appStartTime = Date.now();

function formatUptime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];

  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(' ');
}

// ====== MASTER USER CONFIGURATION ======
const MASTER_USER_ID = 6954490579; // Admin/Manager user

// Store group settings (in production, use a database)
const groupSettings = {};

// Track link violations per user (userId -> count)
const linkViolations = {};

// Track mute messages - map message ID to user ID being muted
const muteMessages = {};

// ====== GROUP MANAGEMENT SYSTEM ======
const groupData = {}; // Store group info: { groupId: { name, botAdded, credits, linksRemoved, joinedDate } }

const DEFAULT_CREDITS = 100; // Credits per group
const CREDITS_PER_GROUP = 100;
const LINK_REMOVAL_COST = 0.2; // Cost per link removed
const ID_COST = 0.1; // Cost per /id command

// Function to check credits and send message if depleted
function checkCredits(ctx, groupId, requiredCredits = 0) {
  if (!groupData[groupId]) {
    groupData[groupId] = {
      name: ctx.chat.title || 'Unknown',
      botAdded: true,
      credits: DEFAULT_CREDITS,
      linksRemoved: 0,
      joinedDate: Date.now()
    };
  }

  // Round credits to 2 decimal places to avoid floating point errors
  groupData[groupId].credits = parseFloat(groupData[groupId].credits.toFixed(2));

  if (groupData[groupId].credits <= 0) {
    ctx.reply('❌ **ক্রেডিট শেষ!**\n\nএই গ্রুপের ক্রেডিট শেষ হয়ে গেছে। @Rifat204BD এর সাথে contact করুন।', { parse_mode: 'Markdown' });
    return false;
  }

  if (requiredCredits > 0 && groupData[groupId].credits < requiredCredits) {
    ctx.reply(`❌ **ক্রেডিট পর্যাপ্ত নয়!**\n\nপ্রয়োজন: ${requiredCredits} ক্রেডিট\nআছে: ${groupData[groupId].credits.toFixed(2)} ক্রেডিট\n\n@Rifat204BD এর সাথে contact করুন।`, { parse_mode: 'Markdown' });
    return false;
  }

  return true;
}

// Welcome message
bot.start((ctx) => {
  // Check if this is a private chat (direct message)
  if (ctx.chat.type === 'private') {
    // Only show dashboard for master user
    if (ctx.from.id === MASTER_USER_ID) {
      ctx.reply(`
🤖 **Bot Management Dashboard**

Welcome Master! You can manage all bot instances here.

Commands:
/dashboard - View all groups and stats
/groups - List all active groups
/stats - Overall statistics
/credits - Check credits system

Type /help for all commands.
      `, { parse_mode: 'Markdown' });
    } else {
      ctx.reply(`
👋 হ্যালো!

এই বট গ্রুপ ম্যানেজমেন্টের জন্য। 

একটি গ্রুপে যোগ করুন এবং `/help` দিন।
      `);
    }
  } else {
    // Group message
    ctx.reply(
      `👋 Welcome to Group Management Bot!\n\nI can help manage your Telegram groups with commands like:\n/ban - Ban a user\n/kick - Kick a user\n/mute - Mute a user\n/unmute - Unmute a user\n/warn - Warn a user\n/help - Show all commands`,
      Markup.keyboard([
        ['/help', '/settings'],
        ['/ban', '/kick'],
        ['/mute', '/unmute']
      ]).resize()
    );
  }
});

// Help command
bot.command('help', (ctx) => {
  const groupId = ctx.chat.id;
  
  // Check credits before processing
  if (!checkCredits(ctx, groupId, 0.1)) {
    return; // Don't process if no credits
  }

  // Check if this is a private chat
  if (ctx.chat.type === 'private' && ctx.from.id === MASTER_USER_ID) {
    ctx.reply(`
📋 মাস্টার ড্যাশবোর্ড কমান্ড:

📊 *ম্যানেজমেন্ট:*
/dashboard - সম্পূর্ণ ড্যাশবোর্ড দেখুন
/groups - সব গ্রুপের তালিকা
/stats - সামগ্রিক পরিসংখ্যান
/credits - ক্রেডিট সিস্টেম তথ্য
/debug - কাঁচা ডাটা দেখুন

💳 *ক্রেডিট ম্যানেজমেন্ট:*
/addcredit <groupId> <amount> - ক্রেডিট যোগ করুন
/reducecredit <groupId> <amount> - ক্রেডিট কমান
/setcredit <groupId> <amount> - ক্রেডিট নির্ধারণ করুন

🔍 *অন্যান্য:*
/checkmaster - আপনার ID চেক করুন

    `);
  } else {
    ctx.reply(`
📋 উপলব্ধ কমান্ড:

🛡️ *ইউজার ম্যানেজমেন্ট:*
/ban - ইউজার ব্যান করুন (রিপ্লাই)
/kick - ইউজার কিক করুন (রিপ্লাই)
/mute - ইউজার মিউট করুন (রিপ্লাই)
/unmute @username - মিউট খুলুন
/warn - ওয়ার্নিং দিন (রিপ্লাই)

⚙️ *গ্রুপ সেটিংস:*
/settings - গ্রুপ সেটিংস দেখুন
/antispam - অ্যান্টি-স্প্যাম সেটিংস
/rules - গ্রুপ নিয়ম দেখুন

ℹ️ *তথ্য:*
/id - আপনার ID দেখুন
/about - বট সম্পর্কে

    `);
  }
  
  // Deduct credits
  groupData[groupId].credits -= 0.1;
  groupData[groupId].credits = parseFloat(groupData[groupId].credits.toFixed(2));
});

// ID command - Get user's own ID
bot.command('id', (ctx) => {
  const groupId = ctx.chat.id;
  
  // Check credits before processing
  if (!checkCredits(ctx, groupId, ID_COST)) {
    return; // Don't process if no credits
  }

  const userId = ctx.from.id;
  const username = ctx.from.username ? `@${ctx.from.username}` : 'N/A';
  const firstName = (ctx.from.first_name || 'N/A').replace(/[*_`\[\]()~>#+-=|{}.!\\"]/g, '\\$&');
  
  // Deduct credits
  groupData[groupId].credits -= ID_COST;
  groupData[groupId].credits = parseFloat(groupData[groupId].credits.toFixed(2));
  
  ctx.reply(
    `👤 Your User Info:\n\nID: <code>${userId}</code>\nUsername: ${username}\nName: ${firstName}`,
    { parse_mode: 'HTML' }
  );
});

// ====== MASTER USER COMMANDS ======

// Master check command - To get and verify master user ID
bot.command('checkmaster', async (ctx) => {
  const userId = ctx.from.id;
  const isMaster = userId === MASTER_USER_ID;
  
  ctx.reply(`
👤 User Information:

Your ID: <code>${userId}</code>
Master ID: <code>${MASTER_USER_ID}</code>
Status: ${isMaster ? '✅ Master User' : '❌ Not Master'}

${!isMaster ? `\n⚠️ To make you master, update bot.js:\nChange MASTER_USER_ID to ${userId}` : ''}
  `, { parse_mode: 'HTML' });
});

// Debug command - Show raw group data
bot.command('debug', async (ctx) => {
  const userId = ctx.from.id;
  const isMaster = userId === MASTER_USER_ID;
  
  if (!isMaster) {
    return ctx.reply('❌ শুধুমাত্র মাস্টার কমান্ড ব্যবহার করতে পারবে।');
  }

  const data = {
    masterUserId: MASTER_USER_ID,
    yourId: userId,
    totalGroups: Object.keys(groupData).length,
    groups: groupData,
    linkViolations: Object.keys(linkViolations).length
  };

  ctx.reply(`<pre>${JSON.stringify(data, null, 2)}</pre>`, { parse_mode: 'HTML' });
});

// Add credit command
bot.command('addcredit', async (ctx) => {
  const userId = ctx.from.id;
  if (userId !== MASTER_USER_ID) {
    return ctx.reply('❌ শুধুমাত্র মাস্টার কমান্ড ব্যবহার করতে পারবে।');
  }

  const args = ctx.message.text.split(' ');
  if (args.length < 3) {
    return ctx.reply('📝 ব্যবহার: /addcredit <groupId> <amount>\n\nউদাহরণ: /addcredit -1003608995770 50');
  }

  const groupId = args[1];
  const amount = parseInt(args[2]);

  if (isNaN(amount)) {
    return ctx.reply('❌ সঠিক সংখ্যা দিন।');
  }

  if (!groupData[groupId]) {
    return ctx.reply(`❌ গ্রুপ ${groupId} পাওয়া যায় নি।`);
  }

  groupData[groupId].credits += amount;
  ctx.reply(`✅ ${groupData[groupId].name} এ ${amount} ক্রেডিট যোগ করা হয়েছে।\n\nনতুন ক্রেডিট: ${groupData[groupId].credits.toFixed(2)}`);
  console.log(`✅ Added ${amount} credits to ${groupData[groupId].name}`);
});

// Reduce credit command
bot.command('reducecredit', async (ctx) => {
  const userId = ctx.from.id;
  if (userId !== MASTER_USER_ID) {
    return ctx.reply('❌ শুধুমাত্র মাস্টার কমান্ড ব্যবহার করতে পারবে।');
  }

  const args = ctx.message.text.split(' ');
  if (args.length < 3) {
    return ctx.reply('📝 ব্যবহার: /reducecredit <groupId> <amount>\n\nউদাহরণ: /reducecredit -1003608995770 20');
  }

  const groupId = args[1];
  const amount = parseInt(args[2]);

  if (isNaN(amount)) {
    return ctx.reply('❌ সঠিক সংখ্যা দিন।');
  }

  if (!groupData[groupId]) {
    return ctx.reply(`❌ গ্রুপ ${groupId} পাওয়া যায় নি।`);
  }

  groupData[groupId].credits -= amount;
  
  if (groupData[groupId].credits < 0) {
    groupData[groupId].credits = 0;
  }

  ctx.reply(`✅ ${groupData[groupId].name} থেকে ${amount} ক্রেডিট কমানো হয়েছে।\n\nবাকি ক্রেডিট: ${groupData[groupId].credits.toFixed(2)}`);
  console.log(`✅ Reduced ${amount} credits from ${groupData[groupId].name}`);
});

// Set credit command
bot.command('setcredit', async (ctx) => {
  const userId = ctx.from.id;
  if (userId !== MASTER_USER_ID) {
    return ctx.reply('❌ শুধুমাত্র মাস্টার কমান্ড ব্যবহার করতে পারবে।');
  }

  const args = ctx.message.text.split(' ');
  if (args.length < 3) {
    return ctx.reply('📝 ব্যবহার: /setcredit <groupId> <amount>\n\nউদাহরণ: /setcredit -1003608995770 150');
  }

  const groupId = args[1];
  const amount = parseInt(args[2]);

  if (isNaN(amount)) {
    return ctx.reply('❌ সঠিক সংখ্যা দিন।');
  }

  if (!groupData[groupId]) {
    return ctx.reply(`❌ গ্রুপ ${groupId} পাওয়া যায় নি।`);
  }

  groupData[groupId].credits = amount;
  ctx.reply(`✅ ${groupData[groupId].name} এর ক্রেডিট ${amount} সেট করা হয়েছে।`);
  console.log(`✅ Set ${amount} credits for ${groupData[groupId].name}`);
});

// Dashboard command - Master user only
bot.command('dashboard', async (ctx) => {
  try {
    // Accept both master user and show info for now
    const isMaster = ctx.from.id === MASTER_USER_ID;
    
    if (!isMaster && ctx.chat.type === 'private') {
      return ctx.reply(`
❌ আপনি মাস্টার ইউজার নন।

আপনার ID: ${ctx.from.id}
মাস্টার ID: ${MASTER_USER_ID}

অ্যাডমিন কে আপনার ID পাঠান।
      `);
    }

    if (!isMaster) {
      return ctx.reply('❌ শুধুমাত্র মাস্টার ইউজার এই কমান্ড ব্যবহার করতে পারবে।');
    }

    const groupCount = Object.keys(groupData).length;
    let totalLinks = 0;
    let totalCreditsUsed = 0;

    let message = `
📊 Bot Management Dashboard

Overview:
- Active Groups: ${groupCount}
`;

    if (groupCount > 0) {
      message += `\nGroups:\n`;
      
      for (const [groupId, data] of Object.entries(groupData)) {
        totalLinks += data.linksRemoved || 0;
        totalCreditsUsed += (data.linksRemoved || 0) * LINK_REMOVAL_COST;
        
        const creditStatus = data.credits > 20 ? '✅' : data.credits > 0 ? '⚠️' : '❌';
        message += `\n${creditStatus} ${data.name} (${groupId})
  Links Removed: ${data.linksRemoved || 0}
  Credits: ${data.credits.toFixed(2)}/${DEFAULT_CREDITS}
  Added: ${new Date(data.joinedDate).toLocaleDateString()}`;
      }
    }

    message += `\n\nStatistics:
- Total Links Removed: ${totalLinks}
- Total Credits Used: ${totalCreditsUsed.toFixed(2)}/${groupCount * DEFAULT_CREDITS}
    `;

    ctx.reply(message);
  } catch (err) {
    console.error('Dashboard error:', err);
    ctx.reply(`❌ Error loading dashboard: ${err.message}`);
  }
});

// Groups command - List all groups
bot.command('groups', async (ctx) => {
  if (ctx.from.id !== MASTER_USER_ID) {
    return ctx.reply('❌ Access denied.');
  }

  if (Object.keys(groupData).length === 0) {
    return ctx.reply('No active groups yet.');
  }

  let message = '📋 **Active Groups:**\n';
  
  for (const [groupId, data] of Object.entries(groupData)) {
    message += `\n🔹 ${data.name}
  ID: \`${groupId}\`
  Status: ${data.credits > 0 ? '✅ Active' : '❌ No Credits'}
  `;
  }

  ctx.reply(message, { parse_mode: 'Markdown' });
});

// Stats command - Overall statistics
bot.command('stats', async (ctx) => {
  if (ctx.from.id !== MASTER_USER_ID) {
    return ctx.reply('❌ Access denied.');
  }

  const groupCount = Object.keys(groupData).length;
  let totalLinks = 0;
  let totalCreditsLeft = 0;

  for (const data of Object.values(groupData)) {
    totalLinks += data.linksRemoved || 0;
    totalCreditsLeft += data.credits || 0;
  }

  const message = `
📈 **Bot Statistics**

Groups: ${groupCount}
Total Links Removed: ${totalLinks}
Credits Remaining: ${totalCreditsLeft}/${groupCount * DEFAULT_CREDITS}
  `;

  ctx.reply(message, { parse_mode: 'Markdown' });
});

// Credits command
bot.command('credits', async (ctx) => {
  if (ctx.from.id !== MASTER_USER_ID) {
    return ctx.reply('❌ Access denied.');
  }

  ctx.reply(`
💳 **Credit System Info**

Default Credits per Group: ${DEFAULT_CREDITS}
Cost per Link Removal: ${LINK_REMOVAL_COST}
Cost per /id command: ${ID_COST}
Cost per /ban, /kick, /mute: 1 credit
Cost per /unmute, /warn: 0.5 credits
Cost per /help, /rules, /antispam, /settings, /about: 0.1 credits

When credits reach 0, bot stops all actions in that group.
  `, { parse_mode: 'Markdown' });
});

// ====== END MASTER USER COMMANDS ======


// Ban command
bot.command('ban', (ctx) => {
  const groupId = ctx.chat.id;
  
  // Check credits before processing
  if (!checkCredits(ctx, groupId, 1)) {
    return; // Don't process if no credits
  }

  if (!ctx.message.reply_to_message) {
    return ctx.reply('❌ Please reply to a message to ban that user.');
  }

  const userId = ctx.message.reply_to_message.from.id;
  const username = ctx.message.reply_to_message.from.username || 'User';

  ctx.banChatMember(userId);
  ctx.reply(`🚫 User ${username} has been banned from the group.`);
  
  // Deduct credits
  groupData[groupId].credits -= 1;
  groupData[groupId].credits = parseFloat(groupData[groupId].credits.toFixed(2));
});

// Kick command
bot.command('kick', (ctx) => {
  const groupId = ctx.chat.id;
  
  // Check credits before processing
  if (!checkCredits(ctx, groupId, 1)) {
    return; // Don't process if no credits
  }

  if (!ctx.message.reply_to_message) {
    return ctx.reply('❌ Please reply to a message to kick that user.');
  }

  const userId = ctx.message.reply_to_message.from.id;
  const username = ctx.message.reply_to_message.from.username || 'User';

  ctx.kickChatMember(userId);
  ctx.reply(`👢 User ${username} has been kicked from the group.`);
  
  // Deduct credits
  groupData[groupId].credits -= 1;
  groupData[groupId].credits = parseFloat(groupData[groupId].credits.toFixed(2));
});

// Mute command
bot.command('mute', (ctx) => {
  const groupId = ctx.chat.id;
  
  // Check credits before processing
  if (!checkCredits(ctx, groupId, 1)) {
    return; // Don't process if no credits
  }

  if (!ctx.message.reply_to_message) {
    return ctx.reply('❌ Please reply to a message to mute that user.');
  }

  const userId = ctx.message.reply_to_message.from.id;
  const username = ctx.message.reply_to_message.from.username || 'User';

  // Mute for 1 hour (3600 seconds)
  ctx.restrictChatMember(userId, {
    permissions: {
      can_send_messages: false,
      can_send_media_messages: false,
      can_send_polls: false,
      can_add_web_page_previews: false
    },
    until_date: Math.floor(Date.now() / 1000) + 3600
  });

  ctx.reply(`🔇 User ${username} has been muted for 1 hour.`);
  
  // Deduct credits
  groupData[groupId].credits -= 1;
  groupData[groupId].credits = parseFloat(groupData[groupId].credits.toFixed(2));
});

// Unmute command
bot.command('unmute', async (ctx) => {
  const groupId = ctx.chat.id;
  
  // Check credits before processing
  if (!checkCredits(ctx, groupId, 0.5)) {
    return; // Don't process if no credits
  }

  try {
    // Check if user is admin
    const member = await ctx.getChatMember(ctx.from.id);
    const isAdmin = member.status === 'creator' || member.status === 'administrator';

    if (!isAdmin) {
      return ctx.reply('❌ Only admins can unmute users.');
    }

    let userId = null;
    let username = '';

    // Check if this is a reply to a mute message
    if (ctx.message.reply_to_message) {
      const repliedMessageId = ctx.message.reply_to_message.message_id;
      
      // Check if this message ID is in our mute messages map
      if (muteMessages[repliedMessageId]) {
        userId = muteMessages[repliedMessageId];
        username = `user (ID: ${userId})`;
      } else {
        return ctx.reply('❌ This is not a mute message. Please reply to a mute notification.');
      }
    } else {
      // Get the username or user ID from the command
      const args = ctx.message.text.split(' ');
      
      if (args.length < 2) {
        return ctx.reply('❌ Please provide a username, user ID, or reply to a mute message.\n\nUsage:\n/unmute @username\n/unmute 123456789\n\nOr reply to the mute message with /unmute');
      }

      username = args[1];

      // If it's a username (starts with @), try to find the user
      if (username.startsWith('@')) {
        const usernameClean = username.slice(1); // Remove @
        
        try {
          const chatMember = await ctx.getChatMember(usernameClean);
          userId = chatMember.user.id;
        } catch (err) {
          return ctx.reply(`❌ User ${username} not found. Please ensure the username is correct or use user ID.`);
        }
      } else {
        // It's a user ID
        userId = parseInt(username);
        if (isNaN(userId)) {
          return ctx.reply('❌ Invalid user ID. Usage: /unmute @username or /unmute 123456789');
        }
      }
    }

    if (!userId) {
      return ctx.reply('❌ Could not identify user. Please try again.');
    }

    // Unmute user - remove all restrictions
    await ctx.restrictChatMember(userId, {
      permissions: {
        can_send_messages: true,
        can_send_media_messages: true,
        can_send_polls: true,
        can_add_web_page_previews: true,
        can_send_other_messages: true
      }
    });

    ctx.reply(`🔊 User ${username} has been unmuted.`);
    console.log(`🔊 ${username} unmuted by admin`);
    
    // Deduct credits
    groupData[groupId].credits -= 0.5;
    groupData[groupId].credits = parseFloat(groupData[groupId].credits.toFixed(2));
  } catch (err) {
    console.error('Error unmuting user:', err.message);
    ctx.reply('❌ Error unmuting user. Please try again.');
  }
});

// Warn command
bot.command('warn', (ctx) => {
  const groupId = ctx.chat.id;
  
  // Check credits before processing
  if (!checkCredits(ctx, groupId, 0.5)) {
    return; // Don't process if no credits
  }

  if (!ctx.message.reply_to_message) {
    return ctx.reply('❌ Please reply to a message to warn that user.');
  }

  const userId = ctx.message.reply_to_message.from.id;
  const username = ctx.message.reply_to_message.from.username || 'User';

  // Initialize warning counter for user
  if (!groupSettings[userId]) {
    groupSettings[userId] = { warnings: 0 };
  }

  groupSettings[userId].warnings += 1;
  const warningCount = groupSettings[userId].warnings;

  ctx.reply(`⚠️ Warning issued to ${username}. (${warningCount}/3 warnings)`);

  if (warningCount >= 3) {
    ctx.kickChatMember(userId);
    ctx.reply(`👢 User ${username} has been kicked after 3 warnings.`);
    delete groupSettings[userId];
  }
  
  // Deduct credits
  groupData[groupId].credits -= 0.5;
  groupData[groupId].credits = parseFloat(groupData[groupId].credits.toFixed(2));
});

// Settings command
bot.command('settings', (ctx) => {
  const groupId = ctx.chat.id;
  
  // Check credits before processing
  if (!checkCredits(ctx, groupId, 0.1)) {
    return; // Don't process if no credits
  }

  ctx.reply(`
⚙️ **Group Settings:**

Members: Get info about group members
Admins: List current administrators
Rules: View group rules
Anti-Spam: Enabled ✅
  `, { parse_mode: 'Markdown' });
  
  // Deduct credits
  groupData[groupId].credits -= 0.1;
  groupData[groupId].credits = parseFloat(groupData[groupId].credits.toFixed(2));
});

bot.command('antispam', (ctx) => {
  const groupId = ctx.chat.id;
  
  // Check credits before processing
  if (!checkCredits(ctx, groupId, 0.1)) {
    return; // Don't process if no credits
  }

  ctx.reply(`
🚫 **Anti-Spam Settings:**

**Status:** ✅ ENABLED

**Rules:**
- ❌ Regular members CANNOT share links
- ✅ Admins CAN share links
- Messages with links will be deleted

**Violation Penalties:**
- 1st Link shared → Message deleted (no mute)
- 2nd Link shared → Message deleted (no mute - 2/3)
- 3rd Link shared → Message deleted + 5 min mute 🚫
- After mute expires → Violation counter resets

**Auto-reset:**
- If no link violations for 1 hour → Counter resets

**Blocked domains:**
- http://, https://
- www.
- t.me (Telegram links)
- discord., youtube.com, instagram.com

Type /rules to see all group rules.
  `, { parse_mode: 'Markdown' });
  
  // Deduct credits
  groupData[groupId].credits -= 0.1;
  groupData[groupId].credits = parseFloat(groupData[groupId].credits.toFixed(2));
});

// Rules command
bot.command('rules', (ctx) => {
  const groupId = ctx.chat.id;
  
  // Check credits before processing
  if (!checkCredits(ctx, groupId, 0.1)) {
    return; // Don't process if no credits
  }

  ctx.reply(`
📜 **Group Rules:**

1. Be respectful to all members
2. No spam or flooding
3. ❌ **NO LINKS ALLOWED** (only admins can share links)
4. Keep conversations on-topic
5. No hate speech or discrimination
6. Follow all Telegram terms of service

⚠️ Link Sharing Penalties:
- **1st violation:** Message deleted (no mute)
- **2nd violation:** Message deleted (no mute)
- **3rd violation:** Message deleted + 5 min mute 🚫
- Counter resets after 1 hour of no violations

Remember: Only admin users can share links!
  `);
  
  // Deduct credits
  groupData[groupId].credits -= 0.1;
  groupData[groupId].credits = parseFloat(groupData[groupId].credits.toFixed(2));
});

// About command
bot.command('about', (ctx) => {
  const groupId = ctx.chat.id;
  
  // Check credits before processing
  if (!checkCredits(ctx, groupId, 0.1)) {
    return; // Don't process if no credits
  }

  ctx.reply(`
🤖 **About This Bot:**

Group Management Bot v1.0
Created with ❤️ using Node.js and Telegraf

Features:
✅ User ban/kick functionality
✅ Muting system
✅ Warning system
✅ Group settings management
  `);
  
  // Deduct credits
  groupData[groupId].credits -= 0.1;
  groupData[groupId].credits = parseFloat(groupData[groupId].credits.toFixed(2));
});

// Anti-spam: Check for links
bot.on('message', async (ctx) => {
  const message = ctx.message;
  const text = message.text || message.caption || '';
  const groupId = ctx.chat.id;
  
  // Initialize group data if not exists
  if (!groupData[groupId]) {
    groupData[groupId] = {
      name: ctx.chat.title || 'Unknown',
      botAdded: true,
      credits: DEFAULT_CREDITS,
      linksRemoved: 0,
      joinedDate: Date.now()
    };
    console.log(`✅ New group registered: ${groupData[groupId].name}`);
  }

  // Check if group has credits left
  if (groupData[groupId].credits <= 0) {
    // No credits, skip all operations
    return;
  }
  
  // Check if message contains links
  const linkPattern = /(https?:\/\/|www\.|t\.me|discord\.|youtube\.com|instagram\.com)/gi;
  const hasLink = linkPattern.test(text);

  if (hasLink) {
    try {
      // Get chat member info to check if user is admin
      const member = await ctx.getChatMember(ctx.from.id);
      const isAdmin = member.status === 'creator' || member.status === 'administrator';

      if (!isAdmin) {
        // Get user's name (username if available, otherwise full name)
        const displayName = message.from.username 
          ? `@${message.from.username}` 
          : `${message.from.first_name}${message.from.last_name ? ' ' + message.from.last_name : ''}`;

        const userId = message.from.id;

        // Initialize violation counter if not exists
        if (!linkViolations[userId]) {
          linkViolations[userId] = { count: 0, lastViolation: Date.now() };
        }

        // Reset counter if last violation was more than 1 hour ago
        const timeSinceLastViolation = Date.now() - linkViolations[userId].lastViolation;
        if (timeSinceLastViolation > 3600000) { // 1 hour
          linkViolations[userId].count = 0;
        }

        // Increment violation counter
        linkViolations[userId].count += 1;
        linkViolations[userId].lastViolation = Date.now();

        const violationCount = linkViolations[userId].count;

        // Delete message with link
        ctx.deleteMessage();
        
        // Track statistics
        groupData[groupId].linksRemoved += 1;
        groupData[groupId].credits -= LINK_REMOVAL_COST;
        groupData[groupId].credits = parseFloat(groupData[groupId].credits.toFixed(2));

        if (violationCount < 3) {
          // First or second violation - only delete message, no mute
          ctx.reply(
            `⚠️ ${displayName}, links are not allowed!\n\nMessage deleted. (${violationCount}/3 violations)`
          );
          
          console.log(`⚠️ ${displayName} sent link - Violation ${violationCount}/3 (message deleted)`);
          
        } else {
          // Third violation and onwards - 5 minute mute
          const muteMsg = await ctx.reply(
            `🚫 ${displayName}, YOU HAVE REACHED 3 LINK VIOLATIONS!\n\n⏳ You are now muted for 5 minutes.\n\nRemember: Links are only allowed for admins!`
          );

          // Store mute message ID and user ID mapping
          muteMessages[muteMsg.message_id] = userId;

          const muteUntilDate = Math.floor(Date.now() / 1000) + 300; // 5 minutes

          try {
            await ctx.restrictChatMember(userId, {
              permissions: {
                can_send_messages: false,
                can_send_media_messages: false,
                can_send_polls: false,
                can_add_web_page_previews: false,
                can_send_other_messages: false
              },
              until_date: muteUntilDate
            });
            
            console.log(`🔇 ${displayName} muted for 5 minutes (3 link violations)`);
            
            // Unmute after 5 minutes
            setTimeout(async () => {
              try {
                await ctx.restrictChatMember(userId, {
                  permissions: {
                    can_send_messages: true,
                    can_send_media_messages: true,
                    can_send_polls: true,
                    can_add_web_page_previews: true,
                    can_send_other_messages: true
                  }
                });
                console.log(`🔊 ${displayName} unmuted after 5 minutes`);
                
                // Reset violation counter after unmuting
                linkViolations[userId].count = 0;
                console.log(`♻️ ${displayName}'s violation counter reset`);
              } catch (err) {
                console.error(`Error unmuting ${displayName}:`, err.message);
              }
            }, 300000); // 5 minutes in milliseconds
            
          } catch (err) {
            console.error(`Error muting ${displayName}:`, err.message);
          }
        }
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
    }
  }
});

// Store users who have left (to track rejoins)
const leftUsers = new Set();

// Handle new members
bot.on('new_chat_members', async (ctx) => {
  try {
    const newMembers = ctx.message.new_chat_members;
    console.log(`✅ ${newMembers.length} new member(s) joined the group`);
    
    for (const user of newMembers) {
      const userName = user.username ? `@${user.username}` : user.first_name;
      const isRejoin = leftUsers.has(user.id);
      
      const welcomeMessage = isRejoin 
        ? `👋 Welcome back ${userName}!\n\nGlad you're here again! 😊\n\nRemember: No links allowed (only admins). Type /rules for all guidelines.`
        : `👋 Welcome ${userName}!\n\nWelcome to our group! 🎉\n\nPlease follow our rules:\n✅ Be respectful to all members\n✅ Read the /rules\n✅ No links without admin permission\n✅ No spam or hate speech\n\nType /help to see commands.`;
      
      try {
        await ctx.reply(welcomeMessage);
        console.log(`✉️ Welcome message sent to ${userName}`);
        if (isRejoin) {
          leftUsers.delete(user.id);
        }
      } catch (err) {
        console.error(`❌ Failed to send welcome to ${userName}:`, err.message);
      }
    }
  } catch (err) {
    console.error('❌ Error in new_chat_members handler:', err);
  }
});

// Handle member leaving
bot.on('left_chat_member', (ctx) => {
  try {
    const leftMember = ctx.message.left_chat_member;
    const userName = leftMember.username ? `@${leftMember.username}` : leftMember.first_name;
    
    // Store this user as "left" so we can welcome them back if they rejoin
    leftUsers.add(leftMember.id);
    
    console.log(`👋 ${userName} left the group`);
  } catch (err) {
    console.error('❌ Error handling left member:', err);
  }
});

// Error handling
bot.catch((err, ctx) => {
  console.error('Error:', err);
  ctx.reply('❌ An error occurred. Please try again later.');
});

const PORT = process.env.PORT || 3000;
const WEBHOOK_PATH = '/webhook';
const externalUrl = process.env.RENDER_EXTERNAL_URL || process.env.WEBHOOK_URL || 'https://your-app-name.onrender.com';

function sendStatusPage(res) {
  const uptime = formatUptime(Date.now() - appStartTime);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bot Status</title>
  <style>
    body { margin: 0; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f3f6ff; color: #1f2937; }
    .page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { width: 100%; max-width: 620px; border-radius: 24px; background: #ffffff; box-shadow: 0 24px 64px rgba(15, 23, 42, 0.12); padding: 32px; text-align: center; }
    .badge { display: inline-flex; align-items: center; justify-content: center; padding: 10px 18px; border-radius: 999px; background: #10b981; color: white; font-weight: 700; margin-bottom: 20px; }
    h1 { margin: 0; font-size: 2rem; }
    p { margin: 16px 0 0; font-size: 1rem; line-height: 1.75; }
    footer { margin-top: 32px; color: #6b7280; font-size: 0.95rem; }
  </style>
</head>
<body>
  <div class="page">
    <div class="card" data-start-time="${appStartTime}">
      <div class="badge">Working</div>
      <h1>Bot is online</h1>
      <p>Running for: <strong id="uptime">${uptime}</strong></p>
      <footer>Developed by MD RIFAT SARKER</footer>
    </div>
  </div>
  <script>
    function formatUptime(ms) {
      const totalSeconds = Math.floor(ms / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const parts = [];
      if (days) parts.push(days + 'd');
      if (hours) parts.push(hours + 'h');
      if (minutes) parts.push(minutes + 'm');
      parts.push(seconds + 's');
      return parts.join(' ');
    }

    const uptimeEl = document.getElementById('uptime');
    const startTime = Number(document.querySelector('.card').dataset.startTime) || Date.now();

    setInterval(() => {
      const elapsed = Date.now() - startTime;
      uptimeEl.textContent = formatUptime(elapsed);
    }, 1000);
  </script>
</body>
</html>`;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (requestUrl.pathname === '/') {
    return sendStatusPage(res);
  }

  if (requestUrl.pathname === WEBHOOK_PATH && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      try {
        const update = JSON.parse(body || '{}');
        await bot.handleUpdate(update, res);
      } catch (error) {
        console.error('Webhook request failure:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Internal Server Error');
      }
    });
    req.on('error', (error) => {
      console.error('Request error:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal Server Error');
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`🌐 HTTP status page available on port ${PORT}`);

  if (process.env.NODE_ENV === 'production') {
    const webhookUrl = `${externalUrl}${WEBHOOK_PATH}`;
    bot.telegram.setWebhook(webhookUrl)
      .then(() => console.log(`🤖 Webhook configured: ${webhookUrl}`))
      .catch((err) => console.error('Webhook setup error:', err));
  } else {
    bot.launch()
      .then(() => console.log('🤖 Bot started in polling mode...'))
      .catch((err) => console.error('Bot launch error:', err));
  }
});

// Graceful shutdown
process.once('SIGINT', () => {
  bot.stop('SIGINT');
  server.close();
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  server.close();
});
