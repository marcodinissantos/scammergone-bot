// bot.js - ScammerGone Discord Bot
const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ]
});

// Configuration and data storage
let config = {};
let learningData = {
    confirmedScams: [],
    falsePositives: [],
    customPatterns: []
};
let userViolations = new Map(); // Track user violations

// Scam detection patterns
const SCAM_PATTERNS = {
    crypto: {
        keywords: [
            'free bitcoin', 'free crypto', 'free btc', 'free eth',
            'double your', 'investment opportunity', 'guaranteed profit',
            'crypto giveaway', 'airdrop', 'free coins'
        ],
        weight: 30,
        description: 'Crypto scams'
    },
    nitro: {
        keywords: [
            'free nitro', 'discord nitro', 'free discord',
            'claim nitro', 'nitro gift', 'get nitro'
        ],
        weight: 35,
        description: 'Discord Nitro scams'
    },
    phishing: {
        keywords: [
            'verify account', 'verify your', 'click here to verify',
            'urgent action', 'account suspended', 'confirm identity',
            'unusual activity', 'security alert'
        ],
        weight: 40,
        description: 'Phishing attempts'
    },
    gaming: {
        keywords: [
            'free steam', 'free games', 'free skins',
            'cs:go free', 'valorant free', 'fortnite free'
        ],
        weight: 30,
        description: 'Gaming scams'
    },
    general: {
        keywords: [
            'get rich quick', 'make money fast', 'earn $$',
            'click here now', 'limited time', 'act now',
            'congratulations you won', 'prize wheel', 'spin to win'
        ],
        weight: 25,
        description: 'General scams'
    }
};

// Suspicious URL patterns
const SUSPICIOUS_URL_PATTERNS = [
    /bit\.ly/i,
    /tinyurl/i,
    /discord.*nitro/i,
    /steam.*community/i,
    /disc0rd/i,
    /discordapp/i,
    /dlscord/i
];

// Load configuration
async function loadConfig() {
    try {
        const data = await fs.readFile('config.json', 'utf-8');
        config = JSON.parse(data);
        console.log('✅ Configuration loaded');
        return true;
    } catch (error) {
        console.error('❌ Failed to load config.json. Please run: npm run setup');
        console.error(error.message);
        return false;
    }
}

// Load learning data
async function loadLearningData() {
    try {
        const data = await fs.readFile('learning_data.json', 'utf-8');
        learningData = JSON.parse(data);
        console.log(`📚 Loaded ${learningData.confirmedScams.length} confirmed scams and ${learningData.falsePositives.length} false positives`);
    } catch (error) {
        // Create new learning data file if it doesn't exist
        await saveLearningData();
        console.log('📚 Created new learning data file');
    }
}

// Save learning data
async function saveLearningData() {
    try {
        await fs.writeFile('learning_data.json', JSON.stringify(learningData, null, 2));
    } catch (error) {
        console.error('❌ Failed to save learning data:', error);
    }
}

// Analyze message for scam content
function analyzeMessage(content) {
    const lowerContent = content.toLowerCase();
    let confidence = 0;
    let detectedTypes = [];
    let reasons = [];

    // Check against known patterns
    for (const [type, pattern] of Object.entries(SCAM_PATTERNS)) {
        const matches = pattern.keywords.filter(keyword => 
            lowerContent.includes(keyword.toLowerCase())
        );
        
        if (matches.length > 0) {
            confidence += pattern.weight * matches.length;
            detectedTypes.push(pattern.description);
            reasons.push(`Contains: ${matches.join(', ')}`);
        }
    }

    // Check for suspicious URLs
    const suspiciousUrls = SUSPICIOUS_URL_PATTERNS.filter(pattern => 
        pattern.test(content)
    );
    
    if (suspiciousUrls.length > 0) {
        confidence += 20 * suspiciousUrls.length;
        detectedTypes.push('Suspicious URLs');
        reasons.push('Contains suspicious links');
    }

    // Check against confirmed scams (learning data)
    for (const scam of learningData.confirmedScams) {
        const similarity = calculateSimilarity(lowerContent, scam.toLowerCase());
        if (similarity > 0.7) {
            confidence += 40;
            detectedTypes.push('Learned pattern');
            reasons.push('Similar to confirmed scam');
            break;
        }
    }

    // Check against false positives (reduce confidence)
    for (const falsePos of learningData.falsePositives) {
        const similarity = calculateSimilarity(lowerContent, falsePos.toLowerCase());
        if (similarity > 0.7) {
            confidence -= 50;
            break;
        }
    }

    // Custom patterns from learning
    for (const customPattern of learningData.customPatterns) {
        if (lowerContent.includes(customPattern.toLowerCase())) {
            confidence += 30;
            detectedTypes.push('Custom pattern');
            reasons.push(`Matches: ${customPattern}`);
        }
    }

    // Cap confidence at 100
    confidence = Math.min(100, Math.max(0, confidence));

    return {
        isScam: confidence >= config.confidenceThreshold,
        confidence: Math.round(confidence),
        types: [...new Set(detectedTypes)],
        reasons: reasons
    };
}

// Calculate similarity between two strings (simple implementation)
function calculateSimilarity(str1, str2) {
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
}

// Check if user has admin role
function isAdmin(member) {
    if (!member) return false;
    return config.adminRoles.some(role => 
        member.roles.cache.some(r => r.name === role)
    );
}

// Check if user has whitelisted role
function isWhitelisted(member) {
    if (!member || !config.whitelistedRoles || config.whitelistedRoles.length === 0) {
        return false;
    }
    return config.whitelistedRoles.some(role => 
        member.roles.cache.some(r => r.name === role)
    );
}

// Send log to log channel
async function sendLog(embed) {
    try {
        const logChannel = await client.channels.fetch(config.logChannelId);
        
        if (!logChannel) {
            console.error(`❌ Log channel not found. Channel ID: ${config.logChannelId}`);
            console.error('   Please check your config.json and ensure the channel ID is correct.');
            return;
        }

        // Check if bot has permission to send messages
        if (logChannel.guild) {
            const permissions = logChannel.permissionsFor(client.user);
            if (!permissions.has(PermissionFlagsBits.ViewChannel)) {
                console.error(`❌ Bot cannot view log channel: ${logChannel.name}`);
                console.error('   Please ensure the bot has "View Channel" permission.');
                return;
            }
            if (!permissions.has(PermissionFlagsBits.SendMessages)) {
                console.error(`❌ Bot cannot send messages in log channel: ${logChannel.name}`);
                console.error('   Please ensure the bot has "Send Messages" permission.');
                return;
            }
        }

        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        if (error.code === 50001) {
            console.error(`❌ Missing Access to log channel (ID: ${config.logChannelId})`);
            console.error('   The bot needs the following permissions in the log channel:');
            console.error('   • View Channel');
            console.error('   • Send Messages');
            console.error('   • Embed Links');
            console.error('\n   To fix: Right-click the channel → Edit Channel → Permissions → Add your bot role');
        } else if (error.code === 10003) {
            console.error(`❌ Log channel not found (ID: ${config.logChannelId})`);
            console.error('   Please update config.json with a valid channel ID.');
        } else {
            console.error('❌ Failed to send log:', error.message);
        }
    }
}

// Handle detected scam
async function handleScam(message, analysis) {
    try {
        const member = message.member;
        const userId = message.author.id;

        // Don't act on admins or whitelisted users
        if (isAdmin(member) || isWhitelisted(member)) {
            return;
        }

        // Increment violation count
        const violations = (userViolations.get(userId) || 0) + 1;
        userViolations.set(userId, violations);

        // Delete the message
        await message.delete();

        // Create log embed
        const logEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🚨 Scam Detected')
            .setDescription(`Message from ${message.author.tag} was deleted`)
            .addFields(
                { name: 'User', value: `<@${userId}> (${message.author.tag})`, inline: true },
                { name: 'Channel', value: `<#${message.channelId}>`, inline: true },
                { name: 'Confidence', value: `${analysis.confidence}%`, inline: true },
                { name: 'Violations', value: `${violations}/${config.banThreshold}`, inline: true },
                { name: 'Detected Types', value: analysis.types.join(', ') || 'Unknown', inline: false },
                { name: 'Message Content', value: message.content.substring(0, 1000), inline: false }
            )
            .setTimestamp();

        // Add reaction instructions
        logEmbed.setFooter({ text: 'React with 🙅‍♀️ to confirm scam or ✅ if false positive' });

        // Send log
        const logMessage = await sendLog(logEmbed);

        // Warn user
        if (violations === 1) {
            try {
                await message.channel.send(
                    `⚠️ <@${userId}> Your message was removed for suspected scam content. This is your first warning.`
                );
            } catch (err) {
                console.error('Could not send warning:', err);
            }
        }

        // Ban if threshold reached
        if (violations >= config.banThreshold) {
            try {
                await member.ban({ reason: `Repeated scam violations (${violations} times)` });
                
                const banEmbed = new EmbedBuilder()
                    .setColor('#000000')
                    .setTitle('🔨 User Banned')
                    .setDescription(`${message.author.tag} has been banned for repeated scam violations`)
                    .addFields(
                        { name: 'User ID', value: userId, inline: true },
                        { name: 'Total Violations', value: violations.toString(), inline: true }
                    )
                    .setTimestamp();
                
                await sendLog(banEmbed);
                userViolations.delete(userId);
            } catch (error) {
                console.error('Failed to ban user:', error);
            }
        }

    } catch (error) {
        console.error('Error handling scam:', error);
    }
}

// Bot ready event
client.once('clientReady', async () => {
    console.log(`
🛡️  SCAMMERGONE BOT ONLINE
========================
Logged in as: ${client.user.tag}
Monitoring: ${config.monitorAllChannels ? 'All Channels' : config.monitoredChannels.length + ' channels'}
Sensitivity: ${config.sensitivity} (${config.confidenceThreshold}% threshold)
Learning: ${config.enableLearning ? 'Enabled' : 'Disabled'}
Log Channel: ${config.logChannelId}

Admin Controls:
  🙅‍♀️ React to any message → Ban user + Delete 7 days of messages + Learn pattern
  ✅ React to any message → Mark as safe (prevents false positives)
    `);

    // Send startup message to log channel
    const startupEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🛡️ ScammerGone Online')
        .setDescription('Bot is now monitoring for scam messages')
        .addFields(
            { name: 'Monitoring Mode', value: config.monitorAllChannels ? 'All Channels' : 'Selected Channels', inline: true },
            { name: 'Sensitivity', value: config.sensitivity.toUpperCase(), inline: true },
            { name: 'Learning', value: config.enableLearning ? 'Enabled ✅' : 'Disabled ❌', inline: true },
            { name: 'Admin Controls', value: '🙅‍♀️ = Ban user + Delete messages\n✅ = Mark as safe', inline: false }
        )
        .setTimestamp();
    
    // Try to send startup log, but don't crash if it fails
    sendLog(startupEmbed).catch(() => {
        console.log('\n⚠️  Note: Could not send startup message to log channel.');
        console.log('   The bot will still work, but you need to fix log channel permissions.');
        console.log('   See error details above for instructions.\n');
    });
});

// Message create event
client.on('messageCreate', async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;

    // Check if should monitor this channel
    if (!config.monitorAllChannels && !config.monitoredChannels.includes(message.channelId)) {
        return;
    }

    // Analyze message
    const analysis = analyzeMessage(message.content);

    // If scam detected, handle it
    if (analysis.isScam) {
        await handleScam(message, analysis);
    }
});

// Reaction add event (for learning and manual moderation)
client.on('messageReactionAdd', async (reaction, user) => {
    // Ignore bot reactions
    if (user.bot) return;

    // Fetch full message if partial
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Error fetching reaction:', error);
            return;
        }
    }

    const message = reaction.message;
    const adminMember = await message.guild.members.fetch(user.id);

    // Only admins can use moderation reactions
    if (!isAdmin(adminMember)) return;

    // Check for scam confirmation reaction
    if (reaction.emoji.name === '🙅‍♀️' || reaction.emoji.name === '🙅') {
        console.log(`\n🚨 Admin ${user.tag} marked message as SCAM - Taking action!`);
        
        const scamAuthor = message.author;
        const scamMember = message.member;
        
        // Learn the pattern
        if (config.enableLearning && !learningData.confirmedScams.includes(message.content)) {
            learningData.confirmedScams.push(message.content);
            await saveLearningData();
            console.log(`📚 Learned new scam pattern`);
        }

        // Don't ban other admins or whitelisted users
        if (isAdmin(scamMember)) {
            await message.react('⚠️');
            console.log(`⚠️  Cannot ban ${scamAuthor.tag} - user is an admin`);
            return;
        }

        if (isWhitelisted(scamMember)) {
            await message.react('⚠️');
            console.log(`⚠️  Cannot ban ${scamAuthor.tag} - user is whitelisted`);
            return;
        }

        try {
            // Initialize counter for all deleted messages
            let totalDeleted = 0;
            
            // Delete the scam message first (if possible)
            try {
                await message.delete();
                totalDeleted++; // Count the original message
                console.log(`🗑️  Deleted scam message from ${scamAuthor.tag}`);
            } catch (deleteError) {
                if (deleteError.code === 10008) {
                    console.log(`ℹ️  Message already deleted from ${scamAuthor.tag}`);
                } else if (deleteError.code === 50013) {
                    console.log(`⚠️  Cannot delete message from ${scamAuthor.tag} - missing permissions`);
                } else {
                    console.log(`⚠️  Could not delete message: ${deleteError.message}`);
                }
                // Continue anyway - we'll still ban and purge other messages
            }

            // Purge all messages from this user in the past 7 days
            const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

            // Get all text channels in the guild
            const channels = message.guild.channels.cache.filter(
                channel => channel.isTextBased() && !channel.isThread()
            );

            console.log(`🔍 Searching for messages from ${scamAuthor.tag} in ${channels.size} channels...`);

            for (const [channelId, channel] of channels) {
                try {
                    // Check bot permissions for this channel
                    const permissions = channel.permissionsFor(client.user);
                    if (!permissions) {
                        console.log(`  ⚠️  Skipping #${channel.name} - cannot check permissions`);
                        continue;
                    }
                    
                    if (!permissions.has(PermissionFlagsBits.ViewChannel)) {
                        console.log(`  ⚠️  Skipping #${channel.name} - cannot view channel`);
                        continue;
                    }
                    
                    if (!permissions.has(PermissionFlagsBits.ReadMessageHistory)) {
                        console.log(`  ⚠️  Skipping #${channel.name} - cannot read history`);
                        continue;
                    }
                    
                    if (!permissions.has(PermissionFlagsBits.ManageMessages)) {
                        console.log(`  ⚠️  Skipping #${channel.name} - cannot manage messages`);
                        continue;
                    }
                    
                    // Fetch recent messages
                    const messages = await channel.messages.fetch({ limit: 100 });
                    
                    // Filter messages from the scammer within 7 days
                    const userMessages = messages.filter(msg => 
                        msg.author.id === scamAuthor.id && 
                        msg.createdTimestamp > sevenDaysAgo
                    );

                    if (userMessages.size > 0) {
                        console.log(`  Found ${userMessages.size} messages in #${channel.name}`);
                        
                        // Delete each message
                        let deletedInChannel = 0;
                        for (const [, msg] of userMessages) {
                            try {
                                await msg.delete();
                                deletedInChannel++;
                                totalDeleted++;
                                // Small delay to avoid rate limits
                                await new Promise(resolve => setTimeout(resolve, 100));
                            } catch (err) {
                                console.log(`    ❌ Failed to delete message in #${channel.name}: ${err.message} (Code: ${err.code})`);
                            }
                        }
                        console.log(`  ✅ Successfully deleted ${deletedInChannel}/${userMessages.size} messages in #${channel.name}`);
                    }
                } catch (err) {
                    console.log(`  ❌ Error accessing #${channel.name}: ${err.message}`);
                }
            }

            console.log(`🗑️  Deleted ${totalDeleted} total messages from ${scamAuthor.tag}`);

            // Ban the user
            try {
                await scamMember.ban({ 
                    reason: `Scam detected by admin ${user.tag}. Message: "${message.content.substring(0, 100)}"`,
                    deleteMessageSeconds: 0 // We already deleted messages manually
                });

                console.log(`🔨 Banned ${scamAuthor.tag}`);
            } catch (banError) {
                if (banError.code === 50013) {
                    console.error(`❌ Cannot ban ${scamAuthor.tag} - bot lacks permissions or user has higher role`);
                    
                    // Send error log
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#FFA500')
                        .setTitle('⚠️ Ban Failed - Permission Issue')
                        .setDescription(`Could not ban ${scamAuthor.tag}`)
                        .addFields(
                            { name: 'Reason', value: 'Bot lacks permissions or user has higher role', inline: false },
                            { name: 'Messages Deleted', value: `${totalDeleted} messages`, inline: true },
                            { name: 'Attempted By', value: user.tag, inline: true },
                            { name: 'Fix', value: 'Move bot role above user\'s highest role in Server Settings → Roles', inline: false }
                        )
                        .setTimestamp();
                    
                    await sendLog(errorEmbed);
                    await message.react('⚠️');
                    return;
                } else {
                    throw banError; // Re-throw if it's a different error
                }
            }

            // Send detailed log
            const logEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔨 Manual Ban - Scammer Removed')
                .setDescription(`Admin ${user.tag} confirmed scam and user was banned`)
                .addFields(
                    { name: 'Banned User', value: `${scamAuthor.tag} (${scamAuthor.id})`, inline: true },
                    { name: 'Banned By', value: user.tag, inline: true },
                    { name: 'Messages Deleted', value: `${totalDeleted} messages (7 days)`, inline: true },
                    { name: 'Original Message', value: message.content.substring(0, 1000) || 'No text content', inline: false },
                    { name: 'Channel', value: `<#${message.channelId}>`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Pattern added to learning data' });

            await sendLog(logEmbed);

            // Notify in channel
            try {
                await message.channel.send(`✅ **${scamAuthor.tag}** has been banned for scamming. ${totalDeleted} messages deleted.`);
            } catch (err) {
                // Channel might not be accessible
            }

            // React with success
            try {
                await reaction.message.react('✅');
            } catch (err) {
                // Can't react
            }

        } catch (error) {
            console.error('❌ Error during ban/delete:', error);
            
            // Try to notify admin of failure
            try {
                await message.react('❌');
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Ban Process Failed')
                    .setDescription(`Failed to complete ban process for ${scamAuthor.tag}`)
                    .addFields(
                        { name: 'Error', value: error.message || 'Unknown error' },
                        { name: 'Error Code', value: error.code ? `${error.code}` : 'N/A', inline: true },
                        { name: 'Attempted By', value: user.tag, inline: true }
                    )
                    .setTimestamp();
                
                await sendLog(errorEmbed);
            } catch (err) {
                // Can't send error notification
            }
        }

    } else if (reaction.emoji.name === '✅') {
        // Mark as false positive (no ban, just learn)
        if (config.enableLearning && !learningData.falsePositives.includes(message.content)) {
            learningData.falsePositives.push(message.content);
            await saveLearningData();
            
            await message.react('📝');
            console.log(`📚 Learned false positive from ${user.tag}`);
            
            const logEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ False Positive Marked')
                .setDescription(`Admin marked message as safe`)
                .addFields(
                    { name: 'Admin', value: user.tag, inline: true },
                    { name: 'Message Author', value: message.author.tag, inline: true },
                    { name: 'Message', value: message.content.substring(0, 1000) || 'No text content' }
                )
                .setTimestamp();
            
            await sendLog(logEmbed);
        }
    }
});

// Error handling
client.on('error', error => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Start the bot
async function start() {
    const configLoaded = await loadConfig();
    if (!configLoaded) {
        process.exit(1);
    }

    await loadLearningData();

    try {
        await client.login(config.token);
    } catch (error) {
        console.error('❌ Failed to login. Please check your bot token in config.json');
        console.error(error.message);
        process.exit(1);
    }
}

start();
