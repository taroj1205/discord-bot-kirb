import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("dice")
  .setDescription("Rolls a dice that is heavily rigged towards 5");

export async function execute(interaction: CommandInteraction) {
  const roll = Math.random() < 0.8 ? 5 : Math.floor(Math.random() * 6) + 1;
  return interaction.reply(`You rolled a ${roll}`);
}