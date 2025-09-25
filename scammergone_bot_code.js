    // Handle channels command
    async handleChannelsCommand(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildConfig = this.getGuildConfig(interaction.guildId);

        switch (subcommand) {
            case 'list':
                await this.listMonitoredChannels(interaction);
                break;
            case 'add':
                const channelToAdd = interaction.options.getChannel('channel');
                if (!guildConfig.monitoredChannels.includes(channelToAdd.id)) {
                    guildConfig.monitoredChannels.push(channelToAdd.id);
                    guildConfig.monitorAllChannels = false;
                    await this.saveGuildConfig(interaction.guildId);
                    await interaction.reply({
                        content: `✅ Added ${channelToAdd} to monitored channels.`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: `❌ ${channelToAdd} is already being monitored.`,
                        ephemeral: true
                    });
                }
                break;
            case 'remove':
                const channelToRemove = interaction.options.getChannel('channel');
                const index = guildConfig.monitoredChannels.indexOf(channelToRemove.id);
                if (index > -1) {
                    guildConfig.monitoredChannels.splice(index, 1);
                    await this.saveGuildConfig(interaction.guildId);
                    await interaction.reply({
                        content: `✅ Removed ${channelToRemove} from monitored channels.`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: `❌ ${channelToRemove} is not being monitored.`,
                        ephemeral: true
                    });
                }
                break;
            case 'all':
                const enableAll = interaction.options.getBoolean('enable');
                guildConfig.monitorAllChannels = enableAll;
                await this.saveGuildConfig(interaction.guildId);
                await interaction.reply({
                    content: `✅ ${enableAll ? 'Enabled' : 'Disabled'} monitoring all channels.`,
                    ephemeral: true
                });
                break;
        }
    }

    // List monitored channels
    async listMonitoredChannels(interaction) {
        const guildConfig = this.getGuildConfig(interaction.guildId);
        
        const embed = new EmbedBuilder()
            .setColor(0x667eea)
            .setTitle('📺 Monitored Channels')
            .setTimestamp();

        if (guildConfig.monitorAllChannels) {
            embed.setDescription('// ScammerGone Discord Bot - Main Bot Code
// This connects to your ScammerGone dashboard and provides the actual Discord functionality

const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

class ScammerGone {
    constructor() {
        // Initialize Discord client with required intents
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildMembers
            ]
        });

        // Bot configuration (loaded from config.json or dashboard)
        this.config = {
            token: process.env.DISCORD_TOKEN || '',
            monitoredChannels: [],
            logChannelId: '',
            sensitivity: 'medium',
            confidenceThreshold: 75,
            banThreshold: 3,
            whitelistedRoles: [],
            adminRoles: ['Admin', 'Moderator'],
            logLevel: 'all',
            logFormat: 'detailed',
            monitorAllChannels: true,
            enableLearning: true
        };

        // Statistics tracking
        this.stats = {
            scamsDetected: 0,
            messagesDeleted: 0,
            usersBanned: 0,
            learningEvents: 0,
            messagesScanned: 0,
            logsSent: 0,
            logErrors: 0,
            uptime: Date.now()
        };

        // Learning data storage
        this.learningData = {
            confirmedScams: [],
            falsePositives: [],
            patterns: new Map(),
            userViolations: new Map()
        };

        // Scam detection patterns
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

// ScammerGone Discord Bot - Main Bot Code with Slash Commands
// This connects to your ScammerGone dashboard and provides the actual Discord functionality

const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

class ScammerGone {
    constructor() {
        // Initialize Discord client with required intents
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildMembers
            ]
        });

        // Bot configuration (loaded from config.json or slash commands)
        this.config = {
            token: process.env.DISCORD_TOKEN || '',
            monitoredChannels: [],
            logChannelId: '',
            sensitivity: 'medium',
            confidenceThreshold: 75,
            banThreshold: 3,
            whitelistedRoles: [],
            adminRoles: ['Admin', 'Moderator'],
            logLevel: 'all',
            logFormat: 'detailed',
            monitorAllChannels: true,
            enableLearning: true,
            autoDeleteScams: true,
            dmWarnings: true,
            enabled: true
        };

        // Per-guild configurations
        this.guildConfigs = new Map();

        // Statistics tracking
        this.stats = {
            scamsDetected: 0,
            messagesDeleted: 0,
            usersBanned: 0,
            learningEvents: 0,
            messagesScanned: 0,
            logsSent: 0,
            logErrors: 0,
            uptime: Date.now()
        };

        // Learning data storage
        this.learningData = {
            confirmedScams: [],
            falsePositives: [],
            patterns: new Map(),
            userViolations: new Map()
        };

        // Scam detection patterns
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
        this.registerSlashCommands();
    }

    // Register all slash commands
    async registerSlashCommands() {
        const commands = [
            // Main management command
            new SlashCommandBuilder()
                .setName('scammergone')
                .setDescription('ScammerGone bot management')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('status')
                        .setDescription('Show bot status and statistics'))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('config')
                        .setDescription('Open configuration panel'))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('enable')
                        .setDescription('Enable ScammerGone protection'))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('disable')
                        .setDescription('Disable ScammerGone protection'))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('test')
                        .setDescription('Test scam detection')
                        .addStringOption(option =>
                            option.setName('message')
                                .setDescription('Message to test for scam detection')
                                .setRequired(true)))
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

            // Channel management
            new SlashCommandBuilder()
                .setName('channels')
                .setDescription('Manage monitored channels')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('list')
                        .setDescription('List monitored channels'))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('add')
                        .setDescription('Add channel to monitoring')
                        .addChannelOption(option =>
                            option.setName('channel')
                                .setDescription('Channel to monitor')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('remove')
                        .setDescription('Remove channel from monitoring')
                        .addChannelOption(option =>
                            option.setName('channel')
                                .setDescription('Channel to stop monitoring')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('all')
                        .setDescription('Monitor all channels')
                        .addBooleanOption(option =>
                            option.setName('enable')
                                .setDescription('Enable monitoring all channels')
                                .setRequired(true)))
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

            // Learning management
            new SlashCommandBuilder()
                .setName('learning')
                .setDescription('Manage AI learning system')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('stats')
                        .setDescription('Show learning statistics'))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('patterns')
                        .setDescription('View learned patterns'))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('export')
                        .setDescription('Export learning data'))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('clear')
                        .setDescription('Clear all learning data'))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('train')
                        .setDescription('Train AI on a message')
                        .addStringOption(option =>
                            option.setName('message')
                                .setDescription('Message to train on')
                                .setRequired(true))
                        .addBooleanOption(option =>
                            option.setName('is_scam')
                                .setDescription('Is this message a scam?')
                                .setRequired(true)))
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

            // Settings management
            new SlashCommandBuilder()
                .setName('settings')
                .setDescription('Configure ScammerGone settings')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('sensitivity')
                        .setDescription('Set detection sensitivity')
                        .addStringOption(option =>
                            option.setName('level')
                                .setDescription('Sensitivity level')
                                .setRequired(true)
                                .addChoices(
                                    { name: 'Low (Conservative)', value: 'low' },
                                    { name: 'Medium (Balanced)', value: 'medium' },
                                    { name: 'High (Aggressive)', value: 'high' }
                                )))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('banthreshold')
                        .setDescription('Set ban threshold (violations before ban)')
                        .addIntegerOption(option =>
                            option.setName('violations')
                                .setDescription('Number of violations before ban (1-10)')
                                .setRequired(true)
                                .setMinValue(1)
                                .setMaxValue(10)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('logchannel')
                        .setDescription('Set log channel')
                        .addChannelOption(option =>
                            option.setName('channel')
                                .setDescription('Channel for logging ScammerGone activities')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('adminroles')
                        .setDescription('Set admin roles for learning feedback'))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('whitelist')
                        .setDescription('Manage whitelisted roles'))
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

            // User management
            new SlashCommandBuilder()
                .setName('violations')
                .setDescription('Manage user violations')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('check')
                        .setDescription('Check user violations')
                        .addUserOption(option =>
                            option.setName('user')
                                .setDescription('User to check violations for')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('clear')
                        .setDescription('Clear user violations')
                        .addUserOption(option =>
                            option.setName('user')
                                .setDescription('User to clear violations for')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('list')
                        .setDescription('List users with violations'))
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        ];

        // Register commands
        const rest = new REST({ version: '10' }).setToken(this.config.token);

        try {
            console.log('🔄 Started refreshing application (/) commands.');
            await rest.put(Routes.applicationCommands(this.client.user.id), { body: commands });
            console.log('✅ Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error('❌ Error registering slash commands:', error);
        }
    }

    setupEventHandlers() {
        // Bot ready event
        this.client.once('ready', async () => {
            console.log(`✅ ScammerGone is online as ${this.client.user.tag}!`);
            console.log(`🛡️ Protecting ${this.client.guilds.cache.size} servers`);
            
            this.client.user.setActivity('🛡️ /scammergone for help', { type: 'WATCHING' });
            await this.loadConfig();
            await this.loadLearningData();
            await this.registerSlashCommands();
        });

        // Slash command handling
        this.client.on('interactionCreate', async (interaction) => {
            if (interaction.isChatInputCommand()) {
                await this.handleSlashCommand(interaction);
            } else if (interaction.isButton()) {
                await this.handleButtonInteraction(interaction);
            } else if (interaction.isStringSelectMenu()) {
                await this.handleSelectMenuInteraction(interaction);
            } else if (interaction.isModalSubmit()) {
                await this.handleModalSubmit(interaction);
            }
        });

        // Message events
        this.client.on('messageCreate', (message) => this.handleMessage(message));
        this.client.on('messageReactionAdd', (reaction, user) => this.handleReaction(reaction, user, 'add'));
        
        // Error handling
        this.client.on('error', (error) => {
            console.error('Discord client error:', error);
            this.logError(error);
        });
    }

    // Handle slash commands
    async handleSlashCommand(interaction) {
        if (!this.isAdmin(interaction.member)) {
            return await interaction.reply({
                content: '❌ You need admin permissions to use ScammerGone commands.',
                ephemeral: true
            });
        }

        const { commandName, options } = interaction;

        try {
            switch (commandName) {
                case 'scammergone':
                    await this.handleScammerGoneCommand(interaction);
                    break;
                case 'channels':
                    await this.handleChannelsCommand(interaction);
                    break;
                case 'learning':
                    await this.handleLearningCommand(interaction);
                    break;
                case 'settings':
                    await this.handleSettingsCommand(interaction);
                    break;
                case 'violations':
                    await this.handleViolationsCommand(interaction);
                    break;
            }
        } catch (error) {
            console.error('Error handling slash command:', error);
            await interaction.reply({
                content: '❌ An error occurred while processing your command.',
                ephemeral: true
            });
        }
    }

    // Main ScammerGone command handler
    async handleScammerGoneCommand(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildConfig = this.getGuildConfig(interaction.guildId);

        switch (subcommand) {
            case 'status':
                await this.showStatus(interaction);
                break;
            case 'config':
                await this.showConfigPanel(interaction);
                break;
            case 'enable':
                guildConfig.enabled = true;
                await this.saveGuildConfig(interaction.guildId);
                await interaction.reply({
                    content: '✅ ScammerGone protection **enabled** for this server!',
                    ephemeral: true
                });
                break;
            case 'disable':
                guildConfig.enabled = false;
                await this.saveGuildConfig(interaction.guildId);
                await interaction.reply({
                    content: '⏸️ ScammerGone protection **disabled** for this server.',
                    ephemeral: true
                });
                break;
            case 'test':
                await this.testScamDetection(interaction);
                break;
        }
    }

    // Show bot status
    async showStatus(interaction) {
        const guildConfig = this.getGuildConfig(interaction.guildId);
        const uptime = Math.floor((Date.now() - this.stats.uptime) / 1000);
        
        const statusEmbed = new EmbedBuilder()
            .setColor(guildConfig.enabled ? 0x00FF00 : 0xFF4444)
            .setTitle('🛡️ ScammerGone Status')
            .setDescription(guildConfig.enabled ? '**🟢 Protection Active**' : '**🔴 Protection Disabled**')
            .addFields(
                { name: '📊 Statistics', value: `Scams Detected: **${this.stats.scamsDetected}**\nMessages Deleted: **${this.stats.messagesDeleted}**\nUsers Banned: **${this.stats.usersBanned}**\nLearning Events: **${this.stats.learningEvents}**`, inline: true },
                { name: '⚙️ Configuration', value: `Sensitivity: **${guildConfig.sensitivity}**\nBan Threshold: **${guildConfig.banThreshold}** violations\nMonitoring: **${guildConfig.monitorAllChannels ? 'All Channels' : guildConfig.monitoredChannels.length + ' Channels'}**\nLog Channel: ${guildConfig.logChannelId ? `<#${guildConfig.logChannelId}>` : '**Not Set**'}`, inline: true },
                { name: '🧠 Learning', value: `Confirmed Scams: **${this.learningData.confirmedScams.length}**\nLearned Patterns: **${this.learningData.patterns.size}**\nFalse Positives: **${this.learningData.falsePositives.length}**`, inline: true },
                { name: '⏱️ Uptime', value: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`, inline: true },
                { name: '🌐 Global Stats', value: `Servers Protected: **${this.client.guilds.cache.size}**\nTotal Users: **${this.client.users.cache.size}**`, inline: true }
            )
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_panel')
                    .setLabel('⚙️ Configure')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('test_detection')
                    .setLabel('🧪 Test Detection')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('export_data')
                    .setLabel('📁 Export Data')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            embeds: [statusEmbed],
            components: [actionRow],
            ephemeral: true
        });
    }

    // Show configuration panel
    async showConfigPanel(interaction) {
        const guildConfig = this.getGuildConfig(interaction.guildId);
        
        const configEmbed = new EmbedBuilder()
            .setColor(0x667eea)
            .setTitle('⚙️ ScammerGone Configuration Panel')
            .setDescription('Use the buttons below to configure ScammerGone for your server.')
            .addFields(
                { name: '🎯 Detection Settings', value: `**Sensitivity:** ${guildConfig.sensitivity}\n**Confidence Threshold:** ${guildConfig.confidenceThreshold}%\n**Auto-delete:** ${guildConfig.autoDeleteScams ? 'Enabled' : 'Disabled'}`, inline: true },
                { name: '👮 Moderation Settings', value: `**Ban Threshold:** ${guildConfig.banThreshold} violations\n**DM Warnings:** ${guildConfig.dmWarnings ? 'Enabled' : 'Disabled'}\n**Learning:** ${guildConfig.enableLearning ? 'Enabled' : 'Disabled'}`, inline: true },
                { name: '📺 Channel Monitoring', value: guildConfig.monitorAllChannels ? '**All Channels**' : `**${guildConfig.monitoredChannels.length} Selected Channels**`, inline: true }
            );

        const configRow1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_detection')
                    .setLabel('🎯 Detection Settings')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('config_moderation')
                    .setLabel('👮 Moderation Settings')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('config_channels')
                    .setLabel('📺 Channel Settings')
                    .setStyle(ButtonStyle.Primary)
            );

        const configRow2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_roles')
                    .setLabel('👥 Role Settings')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('config_logging')
                    .setLabel('📋 Logging Settings')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('config_learning')
                    .setLabel('🧠 Learning Settings')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            embeds: [configEmbed],
            components: [configRow1, configRow2],
            ephemeral: true
        });
    }

    // Test scam detection
    async testScamDetection(interaction) {
        const testMessage = interaction.options.getString('message');
        
        await interaction.deferReply({ ephemeral: true });
        
        try {
            // Create a mock message object for testing
            const mockMessage = {
                content: testMessage,
                author: { id: interaction.user.id, tag: interaction.user.tag },
                guild: interaction.guild,
                channel: interaction.channel
            };

            const analysis = await this.analyzeMessage(mockMessage);
            
            const testEmbed = new EmbedBuilder()
                .setColor(analysis.isScam ? 0xFF4444 : 0x00FF00)
                .setTitle(`🧪 Scam Detection Test ${analysis.isScam ? '🚫' : '✅'}`)
                .setDescription(`**Message:** "${testMessage}"`)
                .addFields(
                    { name: '🎯 Result', value: analysis.isScam ? '**SCAM DETECTED**' : '**Safe Message**', inline: true },
                    { name: '📊 Confidence', value: `**${analysis.confidence}%**`, inline: true },
                    { name: '🏷️ Scam Type', value: `**${analysis.scamType}**`, inline: true },
                    { name: '⚠️ Risk Factors', value: analysis.riskFactors.length > 0 ? analysis.riskFactors.slice(0, 5).join('\n') : 'None detected', inline: false },
                    { name: '🧠 Reasoning', value: analysis.reasoning, inline: false }
                );

            if (analysis.isScam && analysis.confidence >= this.getGuildConfig(interaction.guildId).confidenceThreshold) {
                testEmbed.addFields({
                    name: '⚡ Action', 
                    value: '**This message would be deleted and user warned/banned**', 
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [testEmbed] });
            
        } catch (error) {
            console.error('Error testing scam detection:', error);
            await interaction.editReply({
                content: '❌ Error occurred during scam detection test.'
            });
        }
    }

    // Handle button interactions
    async handleButtonInteraction(interaction) {
        const { customId } = interaction;
        
        switch (customId) {
            case 'config_panel':
                await this.showConfigPanel(interaction);
                break;
            case 'test_detection':
                await this.showTestModal(interaction);
                break;
            case 'export_data':
                await this.exportLearningData(interaction);
                break;
            case 'config_detection':
                await this.showDetectionConfig(interaction);
                break;
            case 'config_moderation':
                await this.showModerationConfig(interaction);
                break;
            case 'config_channels':
                await this.showChannelConfig(interaction);
                break;
            case 'config_roles':
                await this.showRoleConfig(interaction);
                break;
            case 'config_logging':
                await this.showLoggingConfig(interaction);
                break;
            case 'config_learning':
                await this.showLearningConfig(interaction);
                break;
        }
    }

    // Show test modal
    async showTestModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('test_modal')
            .setTitle('🧪 Test Scam Detection');

        const messageInput = new TextInputBuilder()
            .setCustomId('test_message')
            .setLabel('Message to test')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Enter a message to test for scam detection...')
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(messageInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
    }

    // Show detection configuration
    async showDetectionConfig(interaction) {
        const guildConfig = this.getGuildConfig(interaction.guildId);
        
        const embed = new EmbedBuilder()
            .setColor(0x667eea)
            .setTitle('🎯 Detection Settings')
            .setDescription('Configure how ScammerGone detects scams')
            .addFields(
                { name: 'Current Sensitivity', value: guildConfig.sensitivity, inline: true },
                { name: 'Confidence Threshold', value: `${guildConfig.confidenceThreshold}%`, inline: true },
                { name: 'Auto-delete Scams', value: guildConfig.autoDeleteScams ? 'Enabled' : 'Disabled', inline: true }
            );

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('sensitivity_select')
            .setPlaceholder('Choose detection sensitivity')
            .addOptions([
                {
                    label: 'Low (Conservative)',
                    description: '85% threshold - fewer false positives',
                    value: 'low',
                    default: guildConfig.sensitivity === 'low'
                },
                {
                    label: 'Medium (Balanced)',
                    description: '75% threshold - recommended setting',
                    value: 'medium',
                    default: guildConfig.sensitivity === 'medium'
                },
                {
                    label: 'High (Aggressive)',
                    description: '60% threshold - catches more scams',
                    value: 'high',
                    default: guildConfig.sensitivity === 'high'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });
    }

    // Handle select menu interactions
    async handleSelectMenuInteraction(interaction) {
        const { customId, values } = interaction;
        const guildConfig = this.getGuildConfig(interaction.guildId);

        switch (customId) {
            case 'sensitivity_select':
                const sensitivity = values[0];
                const thresholds = { low: 85, medium: 75, high: 60 };
                
                guildConfig.sensitivity = sensitivity;
                guildConfig.confidenceThreshold = thresholds[sensitivity];
                
                await this.saveGuildConfig(interaction.guildId);
                
                await interaction.reply({
                    content: `✅ Detection sensitivity set to **${sensitivity}** (${thresholds[sensitivity]}% threshold)`,
                    ephemeral: true
                });
                break;
        }
    }

    // Handle modal submissions
    async handleModalSubmit(interaction) {
        const { customId } = interaction;

        switch (customId) {
            case 'test_modal':
                const testMessage = interaction.fields.getTextInputValue('test_message');
                await interaction.deferReply({ ephemeral: true });
                
                // Create mock message and test
                const mockMessage = {
                    content: testMessage,
                    author: { id: interaction.user.id, tag: interaction.user.tag },
                    guild: interaction.guild,
                    channel: interaction.channel
                };

                const analysis = await this.analyzeMessage(mockMessage);
                
                const resultEmbed = new EmbedBuilder()
                    .setColor(analysis.isScam ? 0xFF4444 : 0x00FF00)
                    .setTitle(`🧪 Test Result: ${analysis.isScam ? 'SCAM DETECTED 🚫' : 'Safe Message ✅'}`)
                    .addFields(
                        { name: 'Confidence', value: `${analysis.confidence}%`, inline: true },
                        { name: 'Scam Type', value: analysis.scamType, inline: true },
                        { name: 'Reasoning', value: analysis.reasoning, inline: false }
                    );

                await interaction.editReply({ embeds: [resultEmbed] });
                break;
        }
    }
        // Bot ready event
        this.client.once('ready', () => {
            console.log(`✅ ScammerGone is online as ${this.client.user.tag}!`);
            console.log(`🛡️ Protecting ${this.client.guilds.cache.size} servers`);
            
            this.client.user.setActivity('🛡️ Hunting Scammers', { type: 'WATCHING' });
            this.loadConfig();
            this.loadLearningData();
        });

        // Message events
        this.client.on('messageCreate', (message) => this.handleMessage(message));
        this.client.on('messageReactionAdd', (reaction, user) => this.handleReaction(reaction, user, 'add'));
        
        // Error handling
        this.client.on('error', (error) => {
            console.error('Discord client error:', error);
            this.logError(error);
        });

        // Guild events for logging
        this.client.on('guildCreate', (guild) => {
            console.log(`✅ Joined new server: ${guild.name} (${guild.memberCount} members)`);
        });

        this.client.on('guildDelete', (guild) => {
            console.log(`❌ Left server: ${guild.name}`);
        });
    }

    // Main message handler
    async handleMessage(message) {
        // Skip bots, system messages, and DMs
        if (message.author.bot || !message.guild || message.system) return;

        // Check if we should monitor this channel
        if (!this.shouldMonitorChannel(message.channel.id)) return;

        // Skip whitelisted roles
        if (this.isWhitelisted(message.member)) return;

        this.stats.messagesScanned++;

        try {
            // Analyze message for scam content
            const analysis = await this.analyzeMessage(message);
            
            if (analysis.isScam && analysis.confidence >= this.config.confidenceThreshold) {
                await this.handleScamDetection(message, analysis);
            }

        } catch (error) {
            console.error('Error processing message:', error);
            await this.logError(error, message);
        }
    }

    // Advanced scam detection with AI and patterns
    async analyzeMessage(message) {
        const content = message.content.toLowerCase();
        
        // Basic pattern matching
        const patternMatches = this.scamPatterns.filter(pattern => pattern.test(content));
        let confidence = patternMatches.length * 20;

        // Check against learned patterns
        const learnedMatches = this.checkLearnedPatterns(content);
        confidence += learnedMatches.length * 15;

        // Analyze message characteristics
        const characteristics = this.analyzeMessageCharacteristics(message);
        confidence += characteristics.suspicionScore;

        // URL analysis
        const urlAnalysis = this.analyzeUrls(content);
        confidence += urlAnalysis.suspicionScore;

        // Check against false positives
        if (this.isSimilarToFalsePositive(content)) {
            confidence = Math.max(0, confidence - 30);
        }

        const isScam = confidence >= this.config.confidenceThreshold;

        return {
            isScam,
            confidence: Math.min(confidence, 100),
            scamType: this.determineScamType(content, patternMatches),
            riskFactors: [
                ...patternMatches.map(p => p.toString()),
                ...learnedMatches,
                ...characteristics.factors,
                ...urlAnalysis.factors
            ],
            reasoning: this.generateReasoning(patternMatches, learnedMatches, characteristics)
        };
    }

    // Handle detected scam messages
    async handleScamDetection(message, analysis) {
        this.stats.scamsDetected++;
        
        try {
            // Delete the scam message
            await message.delete();
            this.stats.messagesDeleted++;

            // Track user violations
            const userId = message.author.id;
            const violations = this.getUserViolations(userId) + 1;
            this.learningData.userViolations.set(userId, violations);

            // Check if user should be banned
            if (violations >= this.config.banThreshold) {
                await this.banUser(message, violations, analysis);
            } else {
                // Warn the user
                await this.warnUser(message, violations, analysis);
            }

            // Log the detection
            await this.logScamDetection(message, analysis, violations);

        } catch (error) {
            console.error('Error handling scam detection:', error);
            await this.logError(error, message);
        }
    }

    // Ban user for repeated violations
    async banUser(message, violations, analysis) {
        try {
            const reason = `ScammerGone: ${violations} scam violations - Latest: ${analysis.scamType}`;
            
            await message.guild.members.ban(message.author.id, { 
                reason: reason,
                deleteMessageDays: 1 
            });

            this.stats.usersBanned++;

            // Send ban notification to log channel
            const embed = new EmbedBuilder()
                .setColor(0xFF4444)
                .setTitle('⚠️ User Banned for Scamming')
                .setDescription(`**${message.author.tag}** has been permanently banned`)
                .addFields(
                    { name: 'User ID', value: message.author.id, inline: true },
                    { name: 'Violations', value: violations.toString(), inline: true },
                    { name: 'Channel', value: message.channel.toString(), inline: true },
                    { name: 'Scam Type', value: analysis.scamType, inline: true },
                    { name: 'Confidence', value: `${analysis.confidence}%`, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();

            await this.sendLogMessage(embed);

        } catch (error) {
            console.error('Error banning user:', error);
        }
    }

    // Warn user for scam attempt
    async warnUser(message, violations, analysis) {
        try {
            // Try to DM the user
            const warningEmbed = new EmbedBuilder()
                .setColor(0xFF8800)
                .setTitle('⚠️ Warning: Potential Scam Content Detected')
                .setDescription('Your message was automatically deleted for containing potential scam content.')
                .addFields(
                    { name: 'Server', value: message.guild.name, inline: true },
                    { name: 'Violations', value: `${violations}/${this.config.banThreshold}`, inline: true },
                    { name: 'Next Violation', value: 'Will result in automatic ban', inline: false }
                )
                .setFooter({ text: 'If this was a mistake, contact server moderators' })
                .setTimestamp();

            try {
                await message.author.send({ embeds: [warningEmbed] });
            } catch {
                // If DM fails, log it instead
                console.log(`Could not DM warning to ${message.author.tag}`);
            }

        } catch (error) {
            console.error('Error warning user:', error);
        }
    }

    // Handle admin reactions for learning
    async handleReaction(reaction, user, action) {
        // Skip if not an admin reaction
        if (!this.isAdmin(user, reaction.message.guild)) return;

        // Skip if bot reaction or not the learning emoji
        if (user.bot) return;

        const emoji = reaction.emoji.name;
        
        if (emoji === '🙅‍♀️' || emoji === 'neko_no') {
            // Admin marked this as a scam
            await this.learnFromScamMessage(reaction.message, user);
        } else if (emoji === '✅') {
            // Admin marked this as false positive
            await this.learnFromFalsePositive(reaction.message, user);
        }
    }

    // Learn from admin-confirmed scam messages
    async learnFromScamMessage(message, admin) {
        const scamData = {
            content: message.content,
            timestamp: new Date(),
            confirmedBy: admin.tag,
            channel: message.channel.id,
            guild: message.guild.id
        };

        this.learningData.confirmedScams.push(scamData);
        
        // Extract and learn patterns
        const patterns = this.extractPatterns(message.content);
        patterns.forEach(pattern => {
            const count = this.learningData.patterns.get(pattern) || 0;
            this.learningData.patterns.set(pattern, count + 1);
        });

        this.stats.learningEvents++;
        await this.saveLearningData();

        // Log learning event
        const embed = new EmbedBuilder()
            .setColor(0x4488FF)
            .setTitle('🧠 Learning Event: Scam Confirmed')
            .setDescription(`Admin ${admin.tag} confirmed scam message`)
            .addFields(
                { name: 'Message Preview', value: `"${message.content.substring(0, 100)}..."`, inline: false },
                { name: 'Patterns Learned', value: patterns.length.toString(), inline: true },
                { name: 'Total Learning Events', value: this.stats.learningEvents.toString(), inline: true }
            )
            .setTimestamp();

        await this.sendLogMessage(embed);
    }

    // Learn from false positives
    async learnFromFalsePositive(message, admin) {
        const fpData = {
            content: message.content,
            timestamp: new Date(),
            confirmedBy: admin.tag,
            channel: message.channel.id,
            guild: message.guild.id
        };

        this.learningData.falsePositives.push(fpData);
        this.stats.learningEvents++;
        await this.saveLearningData();

        // Log false positive correction
        const embed = new EmbedBuilder()
            .setColor(0x44FF44)
            .setTitle('✅ Learning Event: False Positive Corrected')
            .setDescription(`Admin ${admin.tag} marked detection as false positive`)
            .addFields(
                { name: 'Message Preview', value: `"${message.content.substring(0, 100)}..."`, inline: false },
                { name: 'Admin', value: admin.tag, inline: true },
                { name: 'AI Training', value: 'Updated to avoid similar messages', inline: true }
            )
            .setTimestamp();

        await this.sendLogMessage(embed);
    }

    // Extract patterns from messages for learning
    extractPatterns(content) {
        const patterns = [];
        const words = content.toLowerCase().split(/\s+/);
        
        // Extract word combinations (bigrams)
        for (let i = 0; i < words.length - 1; i++) {
            const bigram = `${words[i]} ${words[i + 1]}`;
            if (bigram.length > 5 && bigram.length < 30) {
                patterns.push(bigram);
            }
        }

        // Extract suspicious domains
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = content.match(urlRegex);
        if (urls) {
            urls.forEach(url => {
                try {
                    const domain = new URL(url).hostname;
                    patterns.push(`domain:${domain}`);
                } catch (e) {
                    // Invalid URL, skip
                }
            });
        }

        // Extract formatting patterns
        if (content.match(/[A-Z]{4,}/)) patterns.push('excessive_caps');
        if (content.match(/!{3,}/)) patterns.push('excessive_exclamation');
        if (content.match(/\${2,}/)) patterns.push('money_symbols');
        if (content.match(/🎉{2,}/)) patterns.push('excessive_party_emoji');

        return patterns;
    }

    // Check message against learned patterns
    checkLearnedPatterns(content) {
        const matches = [];
        
        for (const [pattern, frequency] of this.learningData.patterns.entries()) {
            if (frequency >= 2 && content.includes(pattern.toLowerCase())) {
                matches.push(pattern);
            }
        }
        
        return matches;
    }

    // Analyze message characteristics for suspicion
    analyzeMessageCharacteristics(message) {
        const content = message.content;
        let suspicionScore = 0;
        const factors = [];

        // Check caps ratio
        const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
        if (capsRatio > 0.5) {
            suspicionScore += 15;
            factors.push('excessive_capitals');
        }

        // Check exclamation marks
        const exclamations = (content.match(/!/g) || []).length;
        if (exclamations > 3) {
            suspicionScore += 10;
            factors.push('excessive_exclamation');
        }

        // Check emojis
        const emojiCount = (content.match(/[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}]/gu) || []).length;
        if (emojiCount > 5) {
            suspicionScore += 8;
            factors.push('excessive_emojis');
        }

        // Check message length vs caps (short messages with all caps are more suspicious)
        if (content.length < 50 && capsRatio > 0.7) {
            suspicionScore += 12;
            factors.push('short_caps_message');
        }

        // Check for DM requests
        if (/dm\s+me|message\s+me|pm\s+me/i.test(content)) {
            suspicionScore += 20;
            factors.push('dm_request');
        }

        return { suspicionScore, factors };
    }

    // Analyze URLs in messages
    analyzeUrls(content) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = content.match(urlRegex) || [];
        
        let suspicionScore = 0;
        const factors = [];
        
        // Suspicious TLDs
        const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.click', '.download'];
        
        urls.forEach(url => {
            try {
                const urlObj = new URL(url);
                const domain = urlObj.hostname.toLowerCase();
                
                // Check for suspicious TLDs
                if (suspiciousTlds.some(tld => domain.endsWith(tld))) {
                    suspicionScore += 25;
                    factors.push('suspicious_tld');
                }
                
                // Check for URL shorteners
                const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'ow.ly', 'short.link'];
                if (shorteners.some(shortener => domain.includes(shortener))) {
                    suspicionScore += 15;
                    factors.push('url_shortener');
                }
                
                // Check for suspicious keywords in domain
                const suspiciousKeywords = ['free', 'win', 'prize', 'gift', 'money', 'crypto', 'bitcoin'];
                if (suspiciousKeywords.some(keyword => domain.includes(keyword))) {
                    suspicionScore += 20;
                    factors.push('suspicious_domain_keyword');
                }
                
            } catch (e) {
                // Invalid URL
                suspicionScore += 10;
                factors.push('malformed_url');
            }
        });
        
        return { suspicionScore, factors };
    }

    // Check if message is similar to known false positives
    isSimilarToFalsePositive(content) {
        return this.learningData.falsePositives.some(fp => {
            const similarity = this.calculateStringSimilarity(content, fp.content.toLowerCase());
            return similarity > 0.7;
        });
    }

    // Calculate string similarity (simple implementation)
    calculateStringSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    // Levenshtein distance calculation
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    // Determine scam type based on content
    determineScamType(content, matches) {
        if (matches.some(m => /crypto|bitcoin|btc|ethereum|eth/i.test(m.toString()))) return 'crypto';
        if (matches.some(m => /nitro|discord|steam/i.test(m.toString()))) return 'giveaway';
        if (matches.some(m => /invest|double|profit|return/i.test(m.toString()))) return 'investment';
        if (matches.some(m => /verify|account|urgent|click/i.test(m.toString()))) return 'phishing';
        if (matches.some(m => /free|win|prize|congratulations/i.test(m.toString()))) return 'prize_scam';
        return 'other';
    }

    // Generate reasoning for detection
    generateReasoning(patternMatches, learnedMatches, characteristics) {
        const reasons = [];
        
        if (patternMatches.length > 0) {
            reasons.push(`Matched ${patternMatches.length} known scam patterns`);
        }
        
        if (learnedMatches.length > 0) {
            reasons.push(`Matched ${learnedMatches.length} learned scam patterns`);
        }
        
        if (characteristics.factors.length > 0) {
            reasons.push(`Suspicious characteristics: ${characteristics.factors.join(', ')}`);
        }
        
        return reasons.join('; ') || 'Pattern-based detection';
    }

    // Utility functions
    shouldMonitorChannel(channelId) {
        if (this.config.monitorAllChannels) return true;
        return this.config.monitoredChannels.includes(channelId);
    }

    isWhitelisted(member) {
        if (!member || !member.roles) return false;
        return this.config.whitelistedRoles.some(role => 
            member.roles.cache.some(r => r.name === role)
        );
    }

    isAdmin(user, guild) {
        const member = guild.members.cache.get(user.id);
        if (!member) return false;
        
        return this.config.adminRoles.some(role => 
            member.roles.cache.some(r => r.name === role)
        ) || member.permissions.has(PermissionFlagsBits.Administrator);
    }

    getUserViolations(userId) {
        return this.learningData.userViolations.get(userId) || 0;
    }

    // Logging functions
    async logScamDetection(message, analysis, violations) {
        const embed = new EmbedBuilder()
            .setColor(0xFF4444)
            .setTitle('🚫 Scam Message Detected & Deleted')
            .setDescription(`Deleted scam message from ${message.author.tag}`)
            .addFields(
                { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
                { name: 'Channel', value: message.channel.toString(), inline: true },
                { name: 'Confidence', value: `${analysis.confidence}%`, inline: true },
                { name: 'Scam Type', value: analysis.scamType, inline: true },
                { name: 'Violations', value: `${violations}/${this.config.banThreshold}`, inline: true },
                { name: 'Risk Factors', value: analysis.riskFactors.slice(0, 3).join(', ') || 'Pattern match', inline: false },
                { name: 'Message Preview', value: `\`\`\`${message.content.substring(0, 200)}${message.content.length > 200 ? '...' : ''}\`\`\``, inline: false }
            )
            .setTimestamp();

        await this.sendLogMessage(embed);
    }

    async sendLogMessage(embed) {
        if (!this.config.logChannelId) return;

        try {
            const logChannel = this.client.channels.cache.get(this.config.logChannelId);
            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send({ embeds: [embed] });
                this.stats.logsSent++;
            }
        } catch (error) {
            console.error('Error sending log message:', error);
            this.stats.logErrors++;
        }
    }

    async logError(error, context = null) {
        console.error('ScammerGone Error:', error);
        
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('❌ ScammerGone Error')
            .setDescription(`\`\`\`${error.message}\`\`\``)
            .addFields(
                { name: 'Error Type', value: error.name, inline: true },
                { name: 'Timestamp', value: new Date().toISOString(), inline: true }
            );

        if (context) {
            embed.addFields(
                { name: 'Context', value: `Guild: ${context.guild?.name || 'Unknown'}\nChannel: ${context.channel?.name || 'Unknown'}`, inline: false }
            );
        }

        await this.sendLogMessage(embed);
    }

    // Configuration management
    async loadConfig() {
        try {
            const configPath = path.join(__dirname, 'config.json');
            const configData = await fs.readFile(configPath, 'utf8');
            this.config = { ...this.config, ...JSON.parse(configData) };
            console.log('✅ Configuration loaded');
        } catch (error) {
            console.log('⚠️ No config file found, using defaults');
            await this.saveConfig();
        }
    }

    async saveConfig() {
        try {
            const configPath = path.join(__dirname, 'config.json');
            await fs.writeFile(configPath, JSON.stringify(this.config, null, 2));
            console.log('✅ Configuration saved');
        } catch (error) {
            console.error('❌ Error saving config:', error);
        }
    }

    async loadLearningData() {
        try {
            const dataPath = path.join(__dirname, 'learning_data.json');
            const data = await fs.readFile(dataPath, 'utf8');
            const parsed = JSON.parse(data);
            
            this.learningData = {
                ...this.learningData,
                ...parsed,
                patterns: new Map(parsed.patterns || []),
                userViolations: new Map(parsed.userViolations || [])
            };
            
            console.log(`✅ Learning data loaded: ${this.learningData.confirmedScams.length} confirmed scams, ${this.learningData.patterns.size} patterns`);
        } catch (error) {
            console.log('⚠️ No learning data found, starting fresh');
        }
    }

    async saveLearningData() {
        try {
            const dataPath = path.join(__dirname, 'learning_data.json');
            const dataToSave = {
                ...this.learningData,
                patterns: Array.from(this.learningData.patterns.entries()),
                userViolations: Array.from(this.learningData.userViolations.entries())
            };
            
            await fs.writeFile(dataPath, JSON.stringify(dataToSave, null, 2));
        } catch (error) {
            console.error('❌ Error saving learning data:', error);
        }
    }

    // API for dashboard integration
    getStats() {
        return {
            ...this.stats,
            uptime: Date.now() - this.stats.uptime,
            guilds: this.client.guilds.cache.size,
            users: this.client.users.cache.size,
            confirmedScams: this.learningData.confirmedScams.length,
            learnedPatterns: this.learningData.patterns.size
        };
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.saveConfig();
    }

    // Start the bot
    async start() {
        if (!this.config.token) {
            console.error('❌ Discord bot token not provided! Set DISCORD_TOKEN environment variable or add it to config.json');
            process.exit(1);
        }

        try {
            await this.client.login(this.config.token);
        } catch (error) {
            console.error('❌ Failed to start bot:', error);
            process.exit(1);
        }
    }

    // Graceful shutdown
    async shutdown() {
        console.log('🛡️ ScammerGone shutting down...');
        await this.saveLearningData();
        await this.saveConfig();
        this.client.destroy();
        process.exit(0);
    }
}

// Handle process signals for graceful shutdown
const bot = new ScammerGone();

process.on('SIGINT', () => bot.shutdown());
process.on('SIGTERM', () => bot.shutdown());

// Start the bot
bot.start();

module.exports = ScammerGone;