import { Client } from "discord.js";
import { config } from "./config";
import { commands } from "./commands";
import { deployCommands } from "./deploy-commands";
import { get } from "./sql";

const client = new Client({
  intents: ["Guilds", "GuildMessages", "DirectMessages"],
});

client.once("ready", () => {
  console.log("Discord bot is ready! 🤖");
});

client.on("guildCreate", async (guild) => {
  await deployCommands({ guildId: guild.id });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }

  const { commandName } = interaction;
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const timestamp = `${hours}:${minutes}:${seconds}`;

  console.log(`[${timestamp}] Running command ${commandName}`);
  if (commands[commandName as keyof typeof commands]) {
    commands[commandName as keyof typeof commands].execute(interaction);
  }
});

client.on("messageCreate", async (message) => {
  // Ignore messages from bots and kirb
  if (message.author.bot || message.author.id === '765061967961784321') return;

  const { messages: words, chance, channels } = await get(message.guild?.id!) || { messages: "L", chance: 1, channels: null };

  // 1% chance of being triggered when chance is 1
  if (Math.random() < chance / 100) {
    if (channels && channels[message.channelId] === true) {
      // Pick random word from the list
      const word = words[Math.floor(Math.random() * words.length)];
      await message.channel.send(word);
    }
  }

  // If the user is 631578250144907269 and the message mentions the bot and includes "leave"
  if (message.author.id === '631578250144907269' && message.mentions.has(client.user!) && message.content.toLowerCase().includes('leave')) {
    // Leave the server
    if (message.guild) {
      await message.reply("Fine! I'm leaving");
      await message.guild.leave();
    }
  }
});

client.login(config.DISCORD_TOKEN);