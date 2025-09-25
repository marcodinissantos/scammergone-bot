// ScammerGone Discord Bot v2.0 - Complete Slash Command Implementation
// Save as: bot.js

const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

class ScammerGone {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildMembers
            ]
        });

        // Default configuration
        this.config = {
            token: process.env.DISCORD_TOKEN || '',
            clientId: process.env.CLIENT_ID || ''
        };

        // Per-guild configurations
        this.guildConfigs = new Map();
        
        // Statistics
        this.stats = {
            scamsDetected: 0,
            messagesDeleted: 0,
            usersBanned: 0,
            learningEvents: 0,
            messagesScanned: 0,
            uptime: Date.now()
        };

        // Learning data
        this.learningData = {
            confirmedScams: [],
            falsePositives: [],
            patterns: new Map(),
            userViolations: new Map()
        };

        // Scam patterns
        this.scamPatterns = [
            /free\s+(bitcoin|crypto|money|cash)/i,
            /click\s+here\s+to\s+(win|claim|get)/i,
            /limited\s+time\s+offer/i,
            /double\s+your\s+(bitcoin|crypto|investment)/i,
            /urgent\s+action\s+required/i,
            /verify\s+your\s+account\s+now/i,
            /congratulations\s+you\s+won/i,
            /(discord|steam|amazon)\s*nitro\s*free/i,
            /investment\s+opportunity\s+guaranteed/i,
            /send\s+\$\d+\s+get\s+\$\d+/i,
            /dm\s+me\s+for\s+(free|cheap)/i,
            /check\s+my\s+bio\s+for/i,
            /crypto\s+giveaway/i,
            /prize\s+wheel\s+spin/i
        ];

        this.setupEventHandlers();
    }

    // Get or create guild configuration
    getGuildConfig(guildId) {
        if (!this.guildConfigs.has(guildId)) {
            this.guildConfigs.set(guildId, {
                enabled: true,
                monitorAllChannels: true,
                monitoredChannels: [],
                logChannelId: '',
                sensitivity: 'medium',
                confidenceThreshold: 75,
                banThreshold: 3,
                adminRoles: ['Admin', 'Moderator'],
                whitelistedRoles: [],
                autoDeleteScams: true,
                dmWarnings: true,
                enableLearning: true,
                logFormat: 'detailed'
            });
        }
        return this.guildConfigs.get(guildId);
    }

    setupEventHandlers() {
        this.client.once('ready', async () => {
            console.log(`✅ ScammerGone is online as ${this.client.user.tag}!`);
            console.log(`🛡️ Protecting ${this.client.guilds.cache.size} servers`);
            
            this.client.user.setActivity('🛡️ Use /scammergone for help', { type: 'WATCHING' });
            
            await this.registerSlashCommands();
            await this.loadAllData();
        });

        // Handle interactions
        this.client.on('interactionCreate', async (interaction) => {
            try {
                if (interaction.isChatInputCommand()) {
                    await this.handleSlashCommand(interaction);
                } else if (interaction.isButton()) {
                    await this.handleButtonInteraction(interaction);
                } else if (interaction.isStringSelectMenu()) {
                    await this.handleSelectMenu(interaction);
                } else if (interaction.isModalSubmit()) {
                    await this.handleModal(interaction);
                }
            } catch (error) {
                console.error('Interaction error:', error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ An error occurred.', ephemeral: true });
                }
            }
        });

        // Handle messages
        this.client.on('messageCreate', (message) => this.handleMessage(message));
        
        // Handle reactions for learning
        this.client.on('messageReactionAdd', (reaction, user) => this.handleReaction(reaction, user));
    }

    async registerSlashCommands() {
        const commands = [
            new SlashCommandBuilder()
                .setName('scammergone')
                .setDescription('ScammerGone bot management')
                .addSubcommand(sub => sub.setName('status').setDescription('Show bot status'))
                .addSubcommand(sub => sub.setName('config').setDescription('Open configuration panel'))
                .addSubcommand(sub => sub.setName('enable').setDescription('Enable protection'))
                .addSubcommand(sub => sub.setName('disable').setDescription('Disable protection'))
                .addSubcommand(sub => sub
                    .setName('test')
                    .setDescription('Test scam detection')
                    .addStringOption(opt => opt.setName('message').setDescription('Test message').setRequired(true)))
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

            new SlashCommandBuilder()
                .setName('channels')
                .setDescription('Manage monitored channels')
                .addSubcommand(sub => sub.setName('list').setDescription('List monitored channels'))
                .addSubcommand(sub => sub
                    .setName('add')
                    .setDescription('Add channel to monitor')
                    .addChannelOption(opt => opt.setName('channel').setDescription('Channel to add').setRequired(true)))
                .addSubcommand(sub => sub
                    .setName('remove')
                    .setDescription('Remove channel from monitoring')
                    .addChannelOption(opt => opt.setName('channel').setDescription('Channel to remove').setRequired(true)))
                .addSubcommand(sub => sub
                    .setName('all')
                    .setDescription('Toggle monitor all channels')
                    .addBooleanOption(opt => opt.setName('enabled').setDescription('Monitor all channels').setRequired(true)))
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

            new SlashCommandBuilder()
                .setName('settings')
                .setDescription('Configure bot settings')
                .addSubcommand(sub => sub
                    .setName('sensitivity')
                    .setDescription('Set detection sensitivity')
                    .addStringOption(opt => opt
                        .setName('level')
                        .setDescription('Sensitivity level')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Low (Conservative)', value: 'low' },
                            { name: 'Medium (Balanced)', value: 'medium' },
                            { name: 'High (Aggressive)', value: 'high' }
                        )))
                .addSubcommand(sub => sub
                    .setName('banthreshold')
                    .setDescription('Set violations before ban')
                    .addIntegerOption(opt => opt
                        .setName('count')
                        .setDescription('Number of violations (1-10)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(10)))
                .addSubcommand(sub => sub
                    .setName('logchannel')
                    .setDescription('Set logging channel')
                    .addChannelOption(opt => opt.setName('channel').setDescription('Log channel').setRequired(true)))
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

            new SlashCommandBuilder()
                .setName('learning')
                .setDescription('Manage AI learning')
                .addSubcommand(sub => sub.setName('stats').setDescription('Show learning statistics'))
                .addSubcommand(sub => sub.setName('export').setDescription('Export learning data'))
                .addSubcommand(sub => sub.setName('clear').setDescription('Clear all learning data'))
                .addSubcommand(sub => sub
                    .setName('train')
                    .setDescription('Train on message')
                    .addStringOption(opt => opt.setName('message').setDescription('Message content').setRequired(true))
                    .addBooleanOption(opt => opt.setName('is_scam').setDescription('Is this a scam?').setRequired(true)))
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

            new SlashCommandBuilder()
                .setName('violations')
                .setDescription('Manage user violations')
                .addSubcommand(sub => sub
                    .setName('check')
                    .setDescription('Check user violations')
                    .addUserOption(opt => opt.setName('user').setDescription('User to check').setRequired(true)))
                .addSubcommand(sub => sub
                    .setName('clear')
                    .setDescription('Clear user violations')
                    .addUserOption(opt => opt.setName('user').setDescription('User to clear').setRequired(true)))
                .addSubcommand(sub => sub.setName('list').setDescription('List all violations'))
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        ];

        const rest = new REST({ version: '10' }).setToken(this.config.token);
        
        try {
            console.log('🔄 Registering slash commands...');
            await rest.put(
                Routes.applicationCommands(this.client.user.id),
                { body: commands }
            );
            console.log('✅ Slash commands registered!');
        } catch (error) {
            console.error('❌ Failed to register commands:', error);
        }
    }

    async handleSlashCommand(interaction) {
        if (!this.isAdmin(interaction.member)) {
            return await interaction.reply({
                content: '❌ You need admin permissions to use this command.',
                ephemeral: true
            });
        }

        const { commandName } = interaction;

        switch (commandName) {
            case 'scammergone':
                await this.handleMainCommand(interaction);
                break;
            case 'channels':
                await this.handleChannelsCommand(interaction);
                break;
            case 'settings':
                await this.handleSettingsCommand(interaction);
                break;
            case 'learning':
                await this.handleLearningCommand(interaction);
                break;
            case 'violations':
                await this.handleViolationsCommand(interaction);
                break;
        }
    }

    async handleMainCommand(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const config = this.getGuildConfig(interaction.guildId);

        switch (subcommand) {
            case 'status':
                await this.showStatus(interaction);
                break;
            case 'config':
                await this.showConfigPanel(interaction);
                break;
            case 'enable':
                config.enabled = true;
                await this.saveGuildConfig(interaction.guildId);
                await interaction.reply({ content: '✅ Protection enabled!', ephemeral: true });
                break;
            case 'disable':
                config.enabled = false;
                await this.saveGuildConfig(interaction.guildId);
                await interaction.reply({ content: '⏸️ Protection disabled!', ephemeral: true });
                break;
            case 'test':
                await this.testMessage(interaction);
                break;
        }
    }

    async showStatus(interaction) {
        const config = this.getGuildConfig(interaction.guildId);
        const uptime = Math.floor((Date.now() - this.stats.uptime) / 1000);

        const embed = new EmbedBuilder()
            .setColor(config.enabled ? 0x00FF00 : 0xFF4444)
            .setTitle('🛡️ ScammerGone Status')
            .setDescription(config.enabled ? '**🟢 Active**' : '**🔴 Disabled**')
            .addFields(
                { name: '📊 Stats', value: `Scams: **${this.stats.scamsDetected}**\nDeleted: **${this.stats.messagesDeleted}**\nBanned: **${this.stats.usersBanned}**\nLearning: **${this.stats.learningEvents}**`, inline: true },
                { name: '⚙️ Config', value: `Sensitivity: **${config.sensitivity}**\nBan Threshold: **${config.banThreshold}**\nChannels: **${config.monitorAllChannels ? 'All' : config.monitoredChannels.length}**`, inline: true },
                { name: '🧠 AI', value: `Patterns: **${this.learningData.patterns.size}**\nScams: **${this.learningData.confirmedScams.length}**\nFalse+: **${this.learningData.falsePositives.length}**`, inline: true },
                { name: '⏱️ Uptime', value: `${Math.floor(uptime/3600)}h ${Math.floor((uptime%3600)/60)}m`, inline: true }
            )
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('open_config')
                    .setLabel('⚙️ Configure')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('test_detection')
                    .setLabel('🧪 Test')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    async showConfigPanel(interaction) {
        const config = this.getGuildConfig(interaction.guildId);

        const embed = new EmbedBuilder()
            .setColor(0x667eea)
            .setTitle('⚙️ Configuration Panel')
            .setDescription('Configure ScammerGone settings')
            .addFields(
                { name: '🎯 Detection', value: `**${config.sensitivity}** sensitivity\n**${config.confidenceThreshold}%** threshold`, inline: true },
                { name: '👮 Moderation', value: `**${config.banThreshold}** violation ban\n${config.autoDeleteScams ? '✅' : '❌'} Auto-delete`, inline: true },
                { name: '📺 Channels', value: config.monitorAllChannels ? '**All channels**' : `**${config.monitoredChannels.length}** selected`, inline: true }
            );

        const rows = [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('config_detection').setLabel('🎯 Detection').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('config_moderation').setLabel('👮 Moderation').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('config_channels').setLabel('📺 Channels').setStyle(ButtonStyle.Primary)
            ),
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('config_logging').setLabel('📋 Logging').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('config_learning').setLabel('🧠 Learning').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('config_roles').setLabel('👥 Roles').setStyle(ButtonStyle.Secondary)
            )
        ];

        await interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
    }

    async handleChannelsCommand(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const config = this.getGuildConfig(interaction.guildId);

        switch (subcommand) {
            case 'list':
                const embed = new EmbedBuilder()
                    .setColor(0x667eea)
                    .setTitle('📺 Monitored Channels')
                    .setDescription(config.monitorAllChannels ? 
                        '**Monitoring ALL channels**' : 
                        config.monitoredChannels.length > 0 ?
                            config.monitoredChannels.map(id => `<#${id}>`).join('\n') :
                            'No specific channels monitored'
                    );
                await interaction.reply({ embeds: [embed], ephemeral: true });
                break;
                
            case 'add':
                const channelAdd = interaction.options.getChannel('channel');
                if (!config.monitoredChannels.includes(channelAdd.id)) {
                    config.monitoredChannels.push(channelAdd.id);
                    config.monitorAllChannels = false;
                    await this.saveGuildConfig(interaction.guildId);
                    await interaction.reply({ content: `✅ Added ${channelAdd} to monitoring`, ephemeral: true });
                } else {
                    await interaction.reply({ content: `❌ Already monitoring ${channelAdd}`, ephemeral: true });
                }
                break;
                
            case 'remove':
                const channelRemove = interaction.options.getChannel('channel');
                const index = config.monitoredChannels.indexOf(channelRemove.id);
                if (index > -1) {
                    config.monitoredChannels.splice(index, 1);
                    await this.saveGuildConfig(interaction.guildId);
                    await interaction.reply({ content: `✅ Removed ${channelRemove} from monitoring`, ephemeral: true });
                } else {
                    await interaction.reply({ content: `❌ Not monitoring ${channelRemove}`, ephemeral: true });
                }
                break;
                
            case 'all':
                const enabled = interaction.options.getBoolean('enabled');
                config.monitorAllChannels = enabled;
                await this.saveGuildConfig(interaction.guildId);
                await interaction.reply({ content: `✅ ${enabled ? 'Enabled' : 'Disabled'} monitoring all channels`, ephemeral: true });
                break;
        }
    }

    async handleSettingsCommand(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const config = this.getGuildConfig(interaction.guildId);

        switch (subcommand) {
            case 'sensitivity':
                const level = interaction.options.getString('level');
                const thresholds = { low: 85, medium: 75, high: 60 };
                config.sensitivity = level;
                config.confidenceThreshold = thresholds[level];
                await this.saveGuildConfig(interaction.guildId);
                await interaction.reply({ content: `✅ Sensitivity set to **${level}** (${thresholds[level]}%)`, ephemeral: true });
                break;
                
            case 'banthreshold':
                const count = interaction.options.getInteger('count');
                config.banThreshold = count;
                await this.saveGuildConfig(interaction.guildId);
                await interaction.reply({ content: `✅ Ban threshold set to **${count}** violations`, ephemeral: true });
                break;
                
            case 'logchannel':
                const logChannel = interaction.options.getChannel('channel');
                config.logChannelId = logChannel.id;
                await this.saveGuildConfig(interaction.guildId);
                await interaction.reply({ content: `✅ Log channel set to ${logChannel}`, ephemeral: true });
                
                // Send test message
                const testEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('🛡️ ScammerGone Logging Enabled')
                    .setDescription('This channel will receive all ScammerGone alerts and logs.')
                    .setTimestamp();
                await logChannel.send({ embeds: [testEmbed] });
                break;
        }
    }

    async testMessage(interaction) {
        const message = interaction.options.getString('message');
        const analysis = await this.analyzeMessage({
            content: message,
            author: interaction.user,
            guild: interaction.guild,
            channel: interaction.channel
        });

        const embed = new EmbedBuilder()
            .setColor(analysis.isScam ? 0xFF4444 : 0x00FF00)
            .setTitle(`🧪 Test Result: ${analysis.isScam ? '🚫 SCAM' : '✅ SAFE'}`)
            .setDescription(`**Message:** "${message}"`)
            .addFields(
                { name: 'Confidence', value: `${analysis.confidence}%`, inline: true },
                { name: 'Type', value: analysis.scamType, inline: true },
                { name: 'Reasoning', value: analysis.reasoning || 'Pattern analysis', inline: false }
            );

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Message handling for scam detection
    async handleMessage(message) {
        if (message.author.bot || !message.guild) return;
        
        const config = this.getGuildConfig(message.guild.id);
        if (!config.enabled) return;
        
        if (!this.shouldMonitorChannel(message.channel.id, config)) return;
        if (this.isWhitelisted(message.member, config)) return;

        this.stats.messagesScanned++;

        try {
            const analysis = await this.analyzeMessage(message);
            
            if (analysis.isScam && analysis.confidence >= config.confidenceThreshold) {
                await this.handleScamMessage(message, analysis, config);
            }
        } catch (error) {
            console.error('Message processing error:', error);
        }
    }

    async analyzeMessage(message) {
        const content = message.content.toLowerCase();
        
        // Pattern matching
        const matches = this.scamPatterns.filter(pattern => pattern.test(content));
        let confidence = matches.length * 25;

        // Learned patterns
        const learnedMatches = [];
        for (const [pattern, freq] of this.learningData.patterns.entries()) {
            if (freq >= 2 && content.includes(pattern.toLowerCase())) {
                learnedMatches.push(pattern);
                confidence += 20;
            }
        }

        // Characteristics analysis
        const characteristics = this.analyzeCharacteristics(content);
        confidence += characteristics.score;

        // Check against false positives
        if (this.isSimilarToFalsePositive(content)) {
            confidence = Math.max(0, confidence - 30);
        }

        const isScam = confidence >= 50;

        return {
            isScam,
            confidence: Math.min(confidence, 100),
            scamType: this.determineScamType(content, matches),
            reasoning: `${matches.length} patterns, ${learnedMatches.length} learned, ${characteristics.factors.join(', ')}`
        };
    }

    analyzeCharacteristics(content) {
        let score = 0;
        const factors = [];

        // Excessive caps
        const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
        if (capsRatio > 0.3) {
            score += 15;
            factors.push('caps');
        }

        // Excessive punctuation
        const exclamations = (content.match(/!/g) || []).length;
        if (exclamations > 2) {
            score += 10;
            factors.push('exclamation');
        }

        // Money symbols
        if (/\$|\€|£|₿/.test(content)) {
            score += 5;
            factors.push('money');
        }

        return { score, factors };
    }

    determineScamType(content, matches) {
        if (matches.some(m => /crypto|bitcoin/i.test(m.toString()))) return 'crypto';
        if (matches.some(m => /nitro|discord/i.test(m.toString()))) return 'giveaway';
        if (matches.some(m => /invest|double/i.test(m.toString()))) return 'investment';
        if (matches.some(m => /verify|urgent/i.test(m.toString()))) return 'phishing';
        return 'general';
    }

    async handleScamMessage(message, analysis, config) {
        this.stats.scamsDetected++;
        
        // Delete message if enabled
        if (config.autoDeleteScams) {
            try {
                await message.delete();
                this.stats.messagesDeleted++;
            } catch (error) {
                console.error('Failed to delete message:', error);
            }
        }

        // Track violations
        const userId = message.author.id;
        const violations = this.getUserViolations(userId) + 1;
        this.learningData.userViolations.set(userId, violations);

        // Ban or warn user
        if (violations >= config.banThreshold) {
            await this.banUser(message, violations, analysis, config);
        } else {
            await this.warnUser(message, violations, analysis, config);
        }

        // Log the event
        await this.logScamDetection(message, analysis, violations, config);
        await this.saveLearningData();
    }

    async banUser(message, violations, analysis, config) {
        try {
            await message.guild.members.ban(message.author.id, {
                reason: `ScammerGone: ${violations} scam violations`,
                deleteMessageDays: 1
            });
            this.stats.usersBanned++;
        } catch (error) {
            console.error('Failed to ban user:', error);
        }
    }

    async warnUser(message, violations, analysis, config) {
        if (!config.dmWarnings) return;
        
        try {
            const embed = new EmbedBuilder()
                .setColor(0xFF8800)
                .setTitle('⚠️ Scam Content Warning')
                .setDescription('Your message was flagged as potential scam content.')
                .addFields(
                    { name: 'Server', value: message.guild.name },
                    { name: 'Violations', value: `${violations}/${config.banThreshold}` },
                    { name: 'Next Violation', value: 'May result in ban' }
                );
            await message.author.send({ embeds: [embed] });
        } catch (error) {
            // DM failed, ignore
        }
    }

    async logScamDetection(message, analysis, violations, config) {
        if (!config.logChannelId) return;

        const embed = new EmbedBuilder()
            .setColor(0xFF4444)
            .setTitle('🚫 Scam Detected')
            .addFields(
                { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
                { name: 'Channel', value: message.channel.toString(), inline: true },
                { name: 'Confidence', value: `${analysis.confidence}%`, inline: true },
                { name: 'Violations', value: `${violations}/${config.banThreshold}`, inline: true },
                { name: 'Type', value: analysis.scamType, inline: true },
                { name: 'Action', value: violations >= config.banThreshold ? 'Banned' : 'Warned', inline: true },
                { name: 'Message', value: `\`\`\`${message.content.substring(0, 500)}\`\`\``, inline: false }
            )
            .setTimestamp();

        try {
            const logChannel = this.client.channels.cache.get(config.logChannelId);
            if (logChannel) await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to send log:', error);
        }
    }

    // Handle reactions for learning
    async handleReaction(reaction, user) {
        if (user.bot) return;
        
        const guild = reaction.message.guild;
        if (!guild) return;
        
        const member = guild.members.cache.get(user.id);
        if (!this.isAdmin(member)) return;

        const emoji = reaction.emoji.name;
        
        if (emoji === '🙅‍♀️' || emoji === '🙅') {
            await this.learnFromMessage(reaction.message, true, user);
        } else if (emoji === '✅') {
            await this.learnFromMessage(reaction.message, false, user);
        }
    }

    async learnFromMessage(message, isScam, admin) {
        const data = {
            content: message.content,
            timestamp: new Date(),
            confirmedBy: admin.tag,
            guild: message.guild.id
        };

        if (isScam) {
            this.learningData.confirmedScams.push(data);
            const patterns = this.extractPatterns(message.content);
            patterns.forEach(pattern => {
                const count = this.learningData.patterns.get(pattern) || 0;
                this.learningData.patterns.set(pattern, count + 1);
            });
        } else {
            this.learningData.falsePositives.push(data);
        }

        this.stats.learningEvents++;
        await this.saveLearningData();

        try {
            await message.react(isScam ? '🧠' : '💚');
        } catch (error) {
            // Ignore reaction errors
        }
    }

    extractPatterns(content) {
        const patterns = [];
        const words = content.toLowerCase().split(/\s+/);
        
        for (let i = 0; i < words.length - 1; i++) {
            const bigram = `${words[i]} ${words[i + 1]}`;
            if (bigram.length > 5 && bigram.length < 30) {
                patterns.push(bigram);
            }
        }

        return patterns;
    }

    // Utility functions
    shouldMonitorChannel(channelId, config) {
        return config.monitorAllChannels || config.monitoredChannels.includes(channelId);
    }

    isWhitelisted(member, config) {
        if (!member || !member.roles) return false;
        return config.whitelistedRoles.some(roleName => 
            member.roles.cache.some(role => role.name === roleName)
        );
    }

    isAdmin(member) {
        if (!member) return false;
        return member.permissions.has(PermissionFlagsBits.ManageGuild) ||
               member.permissions.has(PermissionFlagsBits.Administrator);
    }

    getUserViolations(userId) {
        return this.learningData.userViolations.get(userId) || 0;
    }

    isSimilarToFalsePositive(content) {
        return this.learningData.falsePositives.some(fp => 
            this.similarity(content, fp.content.toLowerCase()) > 0.7
        );
    }

    similarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        if (longer.length === 0) return 1.0;
        return (longer.length - this.editDistance(longer, shorter)) / longer.length;
    }

    editDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill(0));
        
        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
        
        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                if (str1[i - 1] === str2[j - 1]) {
                    matrix[j][i] = matrix[j - 1][i - 1];
                } else {
                    matrix[j][i] = Math.min(
                        matrix[j - 1][i - 1] + 1,
                        matrix[j - 1][i] + 1,
                        matrix[j][i - 1] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    // Data management
    async loadAllData() {
        await this.loadGuildConfigs();
        await this.loadLearningData();
    }

    async loadGuildConfigs() {
        try {
            const data = await fs.readFile('guild_configs.json', 'utf8');
            const configs = JSON.parse(data);
            this.guildConfigs = new Map(Object.entries(configs));
            console.log('✅ Guild configs loaded');
        } catch (error) {
            console.log('⚠️ No guild configs found, using defaults');
        }
    }

    async saveGuildConfig(guildId) {
        try {
            const configs = Object.fromEntries(this.guildConfigs.entries());
            await fs.writeFile('guild_configs.json', JSON.stringify(configs, null, 2));
        } catch (error) {
            console.error('❌ Failed to save guild config:', error);
        }
    }

    async loadLearningData() {
        try {
            const data = await fs.readFile('learning_data.json', 'utf8');
            const parsed = JSON.parse(data);
            
            this.learningData = {
                ...this.learningData,
                ...parsed,
                patterns: new Map(parsed.patterns || []),
                userViolations: new Map(parsed.userViolations || [])
            };
            
            console.log(`✅ Learning data loaded: ${this.learningData.patterns.size} patterns`);
        } catch (error) {
            console.log('⚠️ No learning data found, starting fresh');
        }
    }

    async saveLearningData() {
        try {
            const dataToSave = {
                ...this.learningData,
                patterns: Array.from(this.learningData.patterns.entries()),
                userViolations: Array.from(this.learningData.userViolations.entries())
            };
            
            await fs.writeFile('learning_data.json', JSON.stringify(dataToSave, null, 2));
        } catch (error) {
            console.error('❌ Failed to save learning data:', error);
        }
    }

    // Button interactions
    async handleButtonInteraction(interaction) {
        switch (interaction.customId) {
            case 'open_config':
                await this.showConfigPanel(interaction);
                break;
            case 'test_detection':
                const modal = new ModalBuilder()
                    .setCustomId('test_modal')
                    .setTitle('🧪 Test Scam Detection');

                const input = new TextInputBuilder()
                    .setCustomId('test_message')
                    .setLabel('Message to test')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                const row = new ActionRowBuilder().addComponents(input);
                modal.addComponents(row);

                await interaction.showModal(modal);
                break;
            default:
                await interaction.reply({ content: 'Feature coming soon!', ephemeral: true });
        }
    }

    async handleSelectMenu(interaction) {
        await interaction.deferUpdate();
    }

    async handleModal(interaction) {
        if (interaction.customId === 'test_modal') {
            const message = interaction.fields.getTextInputValue('test_message');
            
            const analysis = await this.analyzeMessage({
                content: message,
                author: interaction.user,
                guild: interaction.guild,
                channel: interaction.channel
            });

            const embed = new EmbedBuilder()
                .setColor(analysis.isScam ? 0xFF4444 : 0x00FF00)
                .setTitle(`🧪 Test Result: ${analysis.isScam ? '🚫 SCAM' : '✅ SAFE'}`)
                .setDescription(`**Message:** "${message}"`)
                .addFields(
                    { name: 'Confidence', value: `${analysis.confidence}%`, inline: true },
                    { name: 'Type', value: analysis.scamType, inline: true },
                    { name: 'Reasoning', value: analysis.reasoning, inline: false }
                );

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }

    // Stub implementations for other commands
    async handleLearningCommand(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'stats':
                const embed = new EmbedBuilder()
                    .setColor(0x4488ff)
                    .setTitle('🧠 Learning Statistics')
                    .addFields(
                        { name: 'Confirmed Scams', value: this.learningData.confirmedScams.length.toString(), inline: true },
                        { name: 'False Positives', value: this.learningData.falsePositives.length.toString(), inline: true },
                        { name: 'Learned Patterns', value: this.learningData.patterns.size.toString(), inline: true },
                        { name: 'Total Events', value: this.stats.learningEvents.toString(), inline: true }
                    );
                await interaction.reply({ embeds: [embed], ephemeral: true });
                break;
            default:
                await interaction.reply({ content: 'Learning feature coming soon!', ephemeral: true });
        }
    }

    async handleViolationsCommand(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'check':
                const user = interaction.options.getUser('user');
                const violations = this.getUserViolations(user.id);
                await interaction.reply({ 
                    content: `**${user.tag}** has **${violations}** violations.`, 
                    ephemeral: true 
                });
                break;
            case 'clear':
                const userToClear = interaction.options.getUser('user');
                this.learningData.userViolations.delete(userToClear.id);
                await this.saveLearningData();
                await interaction.reply({ 
                    content: `✅ Cleared violations for **${userToClear.tag}**`, 
                    ephemeral: true 
                });
                break;
            default:
                await interaction.reply({ content: 'Violations feature coming soon!', ephemeral: true });
        }
    }

    // Start the bot
    async start() {
        require('dotenv').config();
        
        this.config.token = process.env.DISCORD_TOKEN;
        this.config.clientId = process.env.CLIENT_ID;

        if (!this.config.token) {
            console.error('❌ DISCORD_TOKEN not found in environment variables!');
            console.error('   Create a .env file with your bot token');
            process.exit(1);
        }

        try {
            await this.client.login(this.config.token);
        } catch (error) {
            console.error('❌ Failed to login:', error);
            process.exit(1);
        }
    }

    // Graceful shutdown
    async shutdown() {
        console.log('🛡️ ScammerGone shutting down...');
        await this.saveLearningData();
        
        // Save all guild configs
        for (const guildId of this.guildConfigs.keys()) {
            await this.saveGuildConfig(guildId);
        }
        
        this.client.destroy();
        process.exit(0);
    }
}

// Start the bot
const bot = new ScammerGone();

// Handle shutdown signals
process.on('SIGINT', () => bot.shutdown());
process.on('SIGTERM', () => bot.shutdown());

// Start
bot.start().catch(console.error);

module.exports = ScammerGone;