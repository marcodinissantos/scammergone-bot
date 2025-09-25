// setup.js - Interactive setup for ScammerGone
const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function setupBot() {
    console.log(`
🛡️  SCAMMERGONE BOT SETUP
========================

Welcome to ScammerGone! Let's get your bot configured.
You'll need your Discord bot token and channel IDs.

`);

    try {
        // Get bot token
        const token = await question('Enter your Discord bot token: ');
        
        if (!token || token.length < 50) {
            console.log('❌ Invalid token. Please restart setup with a valid Discord bot token.');
            process.exit(1);
        }

        // Get log channel ID
        const logChannelId = await question('Enter log channel ID (where ScammerGone will send alerts): ');
        
        // Get monitoring mode
        console.log('\nMonitoring Options:');
        console.log('1. Monitor all channels (recommended)');
        console.log('2. Monitor specific channels only');
        const monitorChoice = await question('Choose monitoring mode (1 or 2): ');
        
        let monitoredChannels = [];
        let monitorAllChannels = true;
        
        if (monitorChoice === '2') {
            monitorAllChannels = false;
            console.log('\nEnter channel IDs to monitor (one per line, press Enter twice when done):');
            
            while (true) {
                const channelId = await question('Channel ID (or press Enter to finish): ');
                if (!channelId) break;
                monitoredChannels.push(channelId);
            }
        }

        // Get admin roles
        const adminRoles = await question('Enter admin roles (comma-separated, default: Admin,Moderator): ') || 'Admin,Moderator';
        
        // Get sensitivity
        console.log('\nDetection Sensitivity:');
        console.log('1. Low (Conservative - fewer false positives)');
        console.log('2. Medium (Balanced - recommended)');
        console.log('3. High (Aggressive - catches more scams)');
        const sensitivityChoice = await question('Choose sensitivity (1, 2, or 3): ') || '2';
        
        const sensitivityMap = { '1': 'low', '2': 'medium', '3': 'high' };
        const sensitivity = sensitivityMap[sensitivityChoice] || 'medium';

        // Create config
        const config = {
            token: token,
            logChannelId: logChannelId,
            monitoredChannels: monitoredChannels,
            monitorAllChannels: monitorAllChannels,
            adminRoles: adminRoles.split(',').map(r => r.trim()),
            sensitivity: sensitivity,
            confidenceThreshold: sensitivityChoice === '1' ? 85 : sensitivityChoice === '3' ? 60 : 75,
            banThreshold: 3,
            whitelistedRoles: [],
            logLevel: 'all',
            logFormat: 'detailed',
            enableLearning: true
        };

        // Save config
        await fs.writeFile('config.json', JSON.stringify(config, null, 2));
        
        // Create .env file
        const envContent = `# ScammerGone Environment Variables
DISCORD_TOKEN=${token}
NODE_ENV=production
LOG_LEVEL=info
`;
        
        await fs.writeFile('.env', envContent);

        console.log(`
✅ Setup Complete!

Configuration saved to config.json
Environment variables saved to .env

Next steps:
1. Run: npm start
2. Check your log channel for the "Bot Online" message
3. Test with: react 🙅‍♀️ to any message to train the AI
4. Use the dashboard to monitor and configure

🛡️ ScammerGone is ready to protect your server!
`);

    } catch (error) {
        console.error('❌ Setup failed:', error);
    } finally {
        rl.close();
    }
}

setupBot();

// ---

// .env.example
/*
# Copy this file to .env and fill in your values

# Discord Bot Token (required)
DISCORD_TOKEN=your_bot_token_here

# Environment
NODE_ENV=production

# Logging
LOG_LEVEL=info

# Optional: Dashboard API settings
DASHBOARD_PORT=3001
DASHBOARD_HOST=localhost
*/

// ---

// README.md content
const README_CONTENT = `# 🛡️ ScammerGone Discord Bot

AI-powered Discord scam detection bot with learning capabilities and beautiful dashboard.

## Features

✨ **Advanced AI Detection**
- Pattern-based scam detection
- Learning from admin feedback
- Confidence scoring
- Multiple scam type recognition

🧠 **Machine Learning**
- Learns from admin reactions (🙅‍♀️ = scam, ✅ = false positive)
- Builds custom patterns for your server
- Improves accuracy over time
- Export/import learning data

📊 **Professional Dashboard**
- Real-time statistics
- Channel monitoring management
- Learning data visualization
- Discord log preview

🔧 **Flexible Configuration**
- Monitor all channels or selected channels
- Configurable sensitivity levels
- Custom admin roles
- Whitelist trusted roles

## Quick Start

### 1. Clone and Install
\`\`\`bash
git clone https://github.com/your-username/scammergone-bot
cd scammergone-bot
npm install
\`\`\`

### 2. Create Discord Bot
1. Go to https://discord.com/developers/applications
2. Create New Application → "ScammerGone"
3. Go to Bot section → Add Bot
4. Copy the bot token
5. Enable these intents:
   - Message Content Intent ✅
   - Server Members Intent ✅

### 3. Invite Bot to Server
Use this URL (replace YOUR_BOT_ID):
\`\`\`
https://discord.com/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=1342565446&scope=bot%20applications.commands
\`\`\`

Required permissions:
- Read Messages/View Channels
- Send Messages
- Manage Messages (delete scam messages)
- Ban Members (ban repeat scammers)
- Add Reactions
- Embed Links
- Read Message History

### 4. Configure Bot
\`\`\`bash
npm run setup
\`\`\`

Or manually create \`config.json\`:
\`\`\`json
{
  "token": "your_bot_token_here",
  "logChannelId": "123456789012345678",
  "monitorAllChannels": true,
  "monitoredChannels": [],
  "adminRoles": ["Admin", "Moderator"],
  "sensitivity": "medium",
  "confidenceThreshold": 75,
  "banThreshold": 3,
  "enableLearning": true
}
\`\`\`

### 5. Start Bot
\`\`\`bash
npm start
\`\`\`

## Usage

### Training the AI
React to messages with:
- 🙅‍♀️ (\`:neko_no:\`) - Mark as scam (bot learns)
- ✅ - Mark as false positive (bot avoids)

### Dashboard
Open \`dashboard.html\` in your browser to:
- View real-time statistics
- Manage monitored channels
- Configure detection settings
- Export learning data

### Commands
The bot automatically:
- Scans all messages in monitored channels
- Deletes detected scam messages
- Warns users for first violations
- Bans users after repeated violations
- Logs all actions to your log channel

## Configuration

### Sensitivity Levels
- **Low (Conservative)**: 85% confidence threshold, fewer false positives
- **Medium (Balanced)**: 75% confidence threshold, recommended
- **High (Aggressive)**: 60% confidence threshold, catches more scams

### Channel Monitoring
- **All Channels**: Monitor every channel the bot can see
- **Selected Only**: Monitor specific channels (trading, marketplace, etc.)

### Ban Threshold
- Default: 3 violations = permanent ban
- Configurable from 1-10 violations
- Each scam message = 1 violation

## Scam Types Detected

🪙 **Crypto Scams**
- Free Bitcoin/crypto giveaways
- Investment "opportunities"
- Fake exchange links

🎮 **Gaming Scams**
- Free Discord Nitro
- Free Steam games/keys
- Fake game item giveaways

📧 **Phishing**
- Account verification requests
- Urgent action required messages
- Suspicious links

💰 **General Scams**
- Get rich quick schemes
- Prize wheel spins
- DM for free items

## Files Structure

\`\`\`
scammergone-bot/
├── bot.js              # Main bot code
├── dashboard.html      # Web dashboard
├── config.json         # Bot configuration
├── learning_data.json  # AI learning data
├── package.json        # Dependencies
├── setup.js            # Interactive setup
└── README.md          # This file
\`\`\`

## Development

\`\`\`bash
# Development with auto-reload
npm run dev

# View logs
npm start | grep "ScammerGone"
\`\`\`

## Troubleshooting

### Bot not responding?
1. Check bot token in config.json
2. Verify bot has required permissions
3. Check console for error messages
4. Ensure bot is online in Discord

### Not detecting scams?
1. Check sensitivity setting
2. Train the AI with admin reactions
3. Verify monitored channels are configured
4. Check confidence threshold setting

### Dashboard not connecting?
1. Dashboard is static HTML - no server needed
2. Check browser console for errors
3. Verify configuration is saved

## Support

- GitHub Issues: Report bugs and feature requests
- Discord: Join our support server
- Documentation: Full guides and examples

## License

MIT License - feel free to modify and distribute!

---

🛡️ **ScammerGone** - Making Discord safer, one scam at a time.
`;

// Write README
fs.writeFile('README.md', README_CONTENT).then(() => {
    console.log('📄 README.md created');
});

// Docker support
const DOCKERFILE_CONTENT = \`FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]\`;

fs.writeFile('Dockerfile', DOCKERFILE_CONTENT).then(() => {
    console.log('🐳 Dockerfile created');
});

// Docker Compose
const DOCKER_COMPOSE_CONTENT = \`version: '3.8'

services:
  scammergone:
    build: .
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    volumes:
      - ./config.json:/app/config.json
      - ./learning_data.json:/app/learning_data.json
    env_file:
      - .env
\`;

fs.writeFile('docker-compose.yml', DOCKER_COMPOSE_CONTENT).then(() => {
    console.log('🐳 docker-compose.yml created');
});