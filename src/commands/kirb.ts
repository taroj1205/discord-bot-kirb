import { type CommandInteraction, SlashCommandBuilder } from "discord.js"

export const data = new SlashCommandBuilder()
  .setName("kirb")
  .setDescription("Pings Kirb!")

export async function execute(interaction: CommandInteraction) {
  return interaction.reply("<@765061967961784321>")
}
