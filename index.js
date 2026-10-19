const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID || "";
const FILE = path.join(__dirname, "config.json");
if (!TOKEN) { console.error("Configure DISCORD_TOKEN no Railway."); process.exit(1); }
function load() { try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return { protectedChannels: {} }; } }
const config = load();
function save() { fs.writeFileSync(FILE, JSON.stringify(config, null, 2)); }

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });
const cmd = new SlashCommandBuilder().setName("antiself").setDescription("Configura o painel Anti-Self").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addChannelOption(o => o.setName("canal").setDescription("Canal protegido").addChannelTypes(ChannelType.GuildText).setRequired(true));

async function register() {
  if (!CLIENT_ID) throw new Error("Falta a variável CLIENT_ID (ID da aplicação do bot).");
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  const body = [cmd.toJSON()];
  if (GUILD_ID) await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body });
  else await rest.put(Routes.applicationCommands(CLIENT_ID), { body });
}
client.once("ready", async () => { console.log(`Bot online: ${client.user.tag}`); try { await register(); console.log("Comando /antiself registrado."); } catch (e) { console.error("Erro ao registrar /antiself:", e); } });

client.on("interactionCreate", async i => {
  try {
    if (i.isChatInputCommand() && i.commandName === "antiself") {
      if (!i.memberPermissions?.has(PermissionFlagsBits.Administrator)) return i.reply({ content: "Apenas administradores podem configurar o Anti-Self.", ephemeral: true });
      const channel = i.options.getChannel("canal", true);
      const modal = new ModalBuilder().setCustomId(`antiself_setup:${channel.id}`).setTitle("Configurar Anti-Self");
      const img = new TextInputBuilder().setCustomId("image_url").setLabel("Link da imagem (opcional)").setPlaceholder("https://exemplo.com/imagem.png").setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(500);
      const txt = new TextInputBuilder().setCustomId("panel_text").setLabel("Texto que aparecerá no painel").setPlaceholder("Digite o texto do Anti-Self...").setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(3500);
      modal.addComponents(new ActionRowBuilder().addComponents(img), new ActionRowBuilder().addComponents(txt));
      return i.showModal(modal);
    }
    if (i.isModalSubmit() && i.customId.startsWith("antiself_setup:")) {
      if (!i.memberPermissions?.has(PermissionFlagsBits.Administrator)) return i.reply({ content: "Apenas administradores podem configurar o Anti-Self.", ephemeral: true });
      const channelId = i.customId.split(":")[1];
      const channel = await i.guild.channels.fetch(channelId).catch(() => null);
      if (!channel || channel.type !== ChannelType.GuildText) return i.reply({ content: "Não encontrei esse canal.", ephemeral: true });
      const imageUrl = i.fields.getTextInputValue("image_url").trim();
      const panelText = i.fields.getTextInputValue("panel_text").trim();
      if (imageUrl && !/^https?:\/\/\S+/i.test(imageUrl)) return i.reply({ content: "O link da imagem precisa começar com http:// ou https://.", ephemeral: true });
      const embed = new EmbedBuilder().setColor(0xD62828).setTitle("🛡️ Anti-Self").setDescription(panelText).setFooter({ text: "Canal protegido pelo Anti-Self" }).setTimestamp();
      if (imageUrl) embed.setImage(imageUrl);
      const panel = await channel.send({ embeds: [embed] });
      config.protectedChannels[channel.id] = { enabled: true, panelMessageId: panel.id, configuredBy: i.user.id };
      save();
      return i.reply({ content: `Painel publicado em ${channel}. O canal agora está protegido. Administradores são ignorados; outros membros podem receber ban se o Discord permitir.`, ephemeral: true });
    }
  } catch (e) {
    console.error("Erro de interação:", e);
    if (i.isRepliable() && !i.replied && !i.deferred) await i.reply({ content: "Erro ao configurar. Confira as permissões e os logs do Railway.", ephemeral: true }).catch(() => {});
  }
});

client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot || message.webhookId) return;
  if (!config.protectedChannels[message.channelId]?.enabled) return;
  if (message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;
  try {
    await message.delete().catch(() => {});
    const member = await message.guild.members.fetch(message.author.id).catch(() => null);
    if (!member) return;
    await member.ban({ reason: "Anti-Self: mensagem enviada no canal protegido." });
    console.log(`Ban Anti-Self: ${message.author.tag} (${message.author.id})`);
  } catch (e) {
    console.error(`Não foi possível banir ${message.author.tag}; verifique a hierarquia do cargo do bot.`, e);
  }
});
client.login(TOKEN);
