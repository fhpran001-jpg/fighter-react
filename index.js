
require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const commands = [
  new SlashCommandBuilder().setName('help').setDescription('সব কমান্ড দেখুন'),
  new SlashCommandBuilder().setName('ping').setDescription('Bot latency দেখুন'),
  new SlashCommandBuilder().setName('react').setDescription('Auto reaction তথ্য'),
  new SlashCommandBuilder().setName('server').setDescription('Server তথ্য দেখুন'),
  new SlashCommandBuilder().setName('avatar').setDescription('Avatar দেখুন')
    .addUserOption(o => o.setName('member').setDescription('সদস্য').setRequired(false)),
  new SlashCommandBuilder().setName('kick').setDescription('সদস্যকে Kick করুন')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o => o.setName('member').setDescription('সদস্য').setRequired(true)),
  new SlashCommandBuilder().setName('ban').setDescription('সদস্যকে Ban করুন')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName('member').setDescription('সদস্য').setRequired(true)),
  new SlashCommandBuilder().setName('clear').setDescription('মেসেজ মুছুন')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(o => o.setName('amount').setDescription('১ থেকে ১০০').setMinValue(1).setMaxValue(100).setRequired(true))
].map(c => c.toJSON());

client.once(Events.ClientReady, async () => {
  console.log(`FiGHTeR React Online: ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );
    console.log('Slash commands registered!');
  } catch (err) {
    console.error('Command registration failed:', err);
  }
});

client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot) return;

  const targetId = process.env.TARGET_MEMBER_ID;
  if (targetId && message.mentions.users.has(targetId)) {
    try {
      await message.react('❤️');
    } catch (err) {
      console.error('Reaction failed:', err.message);
    }
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    if (commandName === 'help') {
      return interaction.reply({
        content: '**FiGHTeR React Commands**\n`/help` `/ping` `/react` `/server` `/avatar` `/kick` `/ban` `/clear`',
        ephemeral: true
      });
    }

    if (commandName === 'ping') {
      return interaction.reply(`🏓 Pong! Latency: ${client.ws.ping}ms`);
    }

    if (commandName === 'react') {
      return interaction.reply('❤️ নির্দিষ্ট Member-কে মেনশন করলে আমি Reaction দেব।');
    }

    if (commandName === 'server') {
      return interaction.reply(
        `🏠 Server: **${interaction.guild.name}**\nMembers: **${interaction.guild.memberCount}**`
      );
    }

    if (commandName === 'avatar') {
      const user = interaction.options.getUser('member') || interaction.user;
      return interaction.reply(user.displayAvatarURL({ size: 1024 }));
    }

    if (commandName === 'kick' || commandName === 'ban') {
      const user = interaction.options.getUser('member');
      const member = await interaction.guild.members.fetch(user.id);
      if (!member.moderatable) {
        return interaction.reply({ content: 'এই সদস্যকে Moderate করা যাচ্ছে না।', ephemeral: true });
      }

      if (commandName === 'kick') await member.kick();
      else await member.ban();

      return interaction.reply(`✅ ${user.tag} ${commandName === 'kick' ? 'Kick' : 'Ban'} করা হয়েছে।`);
    }

    if (commandName === 'clear') {
      const amount = interaction.options.getInteger('amount');
      const channel = interaction.channel;

      if (!channel || !channel.isTextBased() || !channel.bulkDelete) {
        return interaction.reply({ content: 'এই চ্যানেলে কাজটি করা যাবে না।', ephemeral: true });
      }

      const deleted = await channel.bulkDelete(amount, true);
      return interaction.reply({ content: `🧹 ${deleted.size}টি মেসেজ মুছে ফেলা হয়েছে।`, ephemeral: true });
    }
  } catch (error) {
    console.error(error);
    const reply = { content: '❌ কাজটি করা যায়নি। Bot permission ও role hierarchy পরীক্ষা করো।', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
