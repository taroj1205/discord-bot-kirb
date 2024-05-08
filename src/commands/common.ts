import {
  type CommandInteraction,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js"

export const data = new SlashCommandBuilder()
  .setName("common")
  .setDescription(
    "Replies with the top 5 most common words (last 100 messages)",
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("words")
      .setDescription(
        "Replies with the top 5 most common words (last 100 messages)",
      ),
  )

export async function execute(interaction: CommandInteraction) {
  try {
    if (!interaction.isChatInputCommand()) return
    const wordCounts: { [key: string]: number } = {}

    const messages = await interaction.channel?.messages.fetch({
      limit: 100,
    })

    if (messages) {
      for (const message of messages.values()) {
        const words = message.content
          .split(/\s+/)
          .filter((word) => word.length > 0)
        for (let i = 0; i < words.length; i++) {
          const word = words[i]
          wordCounts[word] = (wordCounts[word] || 0) + 1
        }
      }
    }

    const topWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, count]) => `${word}: ${count}`)

    return interaction.reply(topWords.join("\n"))
  } catch (error) {
    console.log(error)
  }
}
