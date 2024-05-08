import { type CommandInteraction, SlashCommandBuilder } from "discord.js"

export const data = new SlashCommandBuilder()
  .setName("invite")
  .setDescription("Generates an invite link")

export async function execute(interaction: CommandInteraction) {
  return interaction.reply(
    "https://discord.com/api/oauth2/authorize?client_id=736355385988087899&permissions=929927597120&scope=bot",
  )
}
