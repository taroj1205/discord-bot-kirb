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
  console.log(`Running command ${commandName}`);
  if (commands[commandName as keyof typeof commands]) {
    commands[commandName as keyof typeof commands].execute(interaction);
  }
});

client.on("messageCreate", async (message) => {
  // Ignore messages from bots and kirb
  if (message.author.bot || message.author.id === '765061967961784321') return;

  const { messages: words, chance } = await get(message.guild?.id!) || { messages: ["L"], chance: 0.01 };

  // 1% chance of being triggered
  if (Math.random() < chance) {
    // Pick random word from the list
    const word = words[Math.floor(Math.random() * words.length)];
    await message.reply(word);
  }
})

client.login(config.DISCORD_TOKEN);