import { SlashCommandBuilder } from "discord.js";
import { CommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
	.setName("timestamp")
	.setDescription("Get timestamp <t:{unix}>")
	.addStringOption((option) =>
		option
			.setName("date")
			.setDescription("Date in the format YYYY-MM-DD or MM-DD")
			.setRequired(true)
	)
	.addStringOption((option) =>
		option
			.setName("time")
			.setDescription("Time in the format HH:MM")
			.setRequired(true)
	)
	.addIntegerOption((option) =>
		option
			.setName("timezone")
			.setDescription("Timezone offset from UTC in hours (+13 for NZ time)")
			.setRequired(false)
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
				{ name: "Relative Time", value: "R" }
			)
	);
  
export async function execute(interaction: CommandInteraction) {
	if (!interaction.isChatInputCommand()) return;
	try {
		const timezone = interaction.options.getInteger("timezone") || 0;
		const dateInput = interaction.options.getString("date");
    const timeInput = interaction.options.getString("time");
    const format = interaction.options.getString("format") || "default";
		if (!dateInput || !timeInput)
			throw new Error("Timezone, date, and time are required");

		const date = new Date(
			Date.UTC(
				parseInt(dateInput.split("-")[0]),
				parseInt(dateInput.split("-")[1]) - 1,
				parseInt(dateInput.split("-")[2]),
				parseInt(timeInput.split(":")[0]) - timezone,
				parseInt(timeInput.split(":")[1])
			)
		);

		const timestamp = Math.floor(date.getTime() / 1000);

		await interaction.reply(
			format === "default" ? `<t:${timestamp}>` : `<t:${timestamp}:${format}>`
		);
	} catch (error) {
		console.log((error as Error).message);
		return interaction.reply(`Error: ${(error as Error).message}`);
	}
}
