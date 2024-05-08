import { SlashCommandBuilder } from "discord.js"
import type { CommandInteraction } from "discord.js"

export const data = new SlashCommandBuilder()
  .setName("timestamp")
  .setDescription("Get timestamp <t:{unix}>")
  .addStringOption((option) =>
    option
      .setName("date")
      .setDescription("Date in the format YYYY-MM-DD or MM-DD"),
  )
  .addStringOption((option) =>
    option.setName("time").setDescription("Time in the format HH:MM"),
  )
  .addIntegerOption((option) =>
    option
      .setName("timezone")
      .setDescription("Timezone offset from UTC in hours (+13 for NZ time)")
      .setRequired(false),
  )
  .addStringOption((option) =>
    option
      .setName("format")
      .setDescription("Timestamp format")
      .setRequired(false)
      .addChoices(
        { name: "Default", value: "default" },
        { name: "Short Time", value: "t" },
        { name: "Long Time", value: "T" },
        { name: "Short Date", value: "d" },
        { name: "Long Date", value: "D" },
        { name: "Short Date/Time", value: "f" },
        { name: "Long Date/Time", value: "F" },
        { name: "Relative Time", value: "R" },
      ),
  )

export async function execute(interaction: CommandInteraction) {
  if (!interaction.isChatInputCommand()) return

  const { options } = interaction
  const timezone = options.getInteger("timezone") ?? 0
  let dateInput = options.getString("date")
  let timeInput = options.getString("time")
  const format = options.getString("format") ?? "default"
  const current = new Date()
  const currentYear = current.getFullYear()

  if (!dateInput) dateInput = current.toISOString().substring(0, 10)
  if (!timeInput) {
    const hours = current.getUTCHours().toString().padStart(2, "0")
    const minutes = current.getUTCMinutes().toString().padStart(2, "0")
    timeInput = `${hours}:${minutes}`
  }

  const dateParts = dateInput.split("-")
  if (dateParts.length !== 3) dateInput = `${currentYear}-${dateInput}`

  const [year, month, day] = dateInput.split("-").map(Number)
  const [hour, minute] = timeInput.split(":").map(Number)

  let date: Date
  try {
    date = new Date(Date.UTC(year, month - 1, day, hour - timezone, minute))
  } catch (error) {
    console.log((error as Error).message)
    return interaction.reply(`Error: ${(error as Error).message}`)
  }

  const timestamp = Math.floor(date.getTime() / 1000)

  await interaction.reply(
    format === "default" ? `<t:${timestamp}>` : `<t:${timestamp}:${format}>`,
  )
}
