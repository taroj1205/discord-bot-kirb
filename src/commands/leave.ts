import { type CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
	.setName("leave")
	.setDescription("Leaves the server");

export async function execute(interaction: CommandInteraction) {
	if (interaction.member?.user.id !== "631578250144907269") {
		await interaction.reply({
			content: "You do not have permission to use this command",
			ephemeral: true,
		});
	} else {
		await interaction.reply({ content: "Leaving server", ephemeral: true });
		await interaction.guild?.leave();
	}
}
