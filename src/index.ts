import { Client } from "discord.js"
import { commands } from "./commands"
import { config } from "./config"
import { deployCommands } from "./deploy-commands"
import { get } from "./sql"
import { saveLog } from "./utils/file"

const client = new Client({
  intents: ["Guilds", "GuildMessages", "DirectMessages"],
})

client.once("ready", () => {
  console.log("Discord bot is ready! 🤖")
})

client.on("guildCreate", async (guild) => {
  await deployCommands({ guildId: guild.id })
})

client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isCommand()) {
      return
    }

    const { commandName } = interaction
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, "0")
    const minutes = now.getMinutes().toString().padStart(2, "0")
    const seconds = now.getSeconds().toString().padStart(2, "0")
    const timestamp = `${hours}:${minutes}:${seconds}`

    console.log(`[${timestamp}] Running command ${commandName}`)
    saveLog(`Running command ${commandName}`)
    if (commands[commandName as keyof typeof commands]) {
      commands[commandName as keyof typeof commands].execute(interaction)
      console.log(`Finished command ${commandName}`)
      saveLog(`Finished command ${commandName}`)
    }
  } catch (error) {
    console.error(error)
    saveLog((error as Error).message, true)
  }
})

client.on("messageCreate", async (message) => {
  try {
    // Ignore messages from bots and kirb
    if (
      !client.user ||
      message.author.bot ||
      message.author.id === "765061967961784321" ||
      !message.guild
    )
      return

    const {
      messages: words,
      chance,
      channels,
    } = (await get(message.guild?.id)) || {
      messages: "L",
      chance: 1,
      channels: null,
    }

    // 1% chance of being triggered when chance is 1
    if (Math.random() < chance / 100) {
      if (channels && channels[message.channelId] === true) {
        // Pick random word from the list
        const word = words[Math.floor(Math.random() * words.length)]
        await message.channel.send(word)
      }
    }

    // If the user is 631578250144907269 and the message mentions the bot and includes "leave"
    if (
      message.author.id === "631578250144907269" &&
      message.mentions.has(client.user) &&
      message.content.toLowerCase().includes("leave")
    ) {
      // Leave the server
      if (message.guild) {
        await message.reply("Fine! I'm leaving")
        await message.guild.leave()
      }
    }
  } catch (error) {
    console.error(error)
  }
})

client.login(config.DISCORD_TOKEN)
