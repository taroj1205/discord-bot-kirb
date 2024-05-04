import {
	type CommandInteraction,
	SlashCommandBuilder,
	TextChannel,
} from "discord.js";

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
	);

export async function execute(interaction: CommandInteraction) {
	if (!interaction.isChatInputCommand()) return;
	const wordCounts: { [key: string]: number } = {};

	for (const channel of interaction.guild?.channels.cache.values() ?? []) {
		if (channel instanceof TextChannel) {
			const messages = await channel.messages.fetch({ limit: 100 });
			for (const message of messages.values()) {
				for (const word of message.content
					.split(/\s+/)
					.filter((word) => word.length > 0)) {
					wordCounts[word] = (wordCounts[word] || 0) + 1;
				}
			}
		}
	}

	const topWords = Object.entries(wordCounts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([word, count]) => `${word}: ${count}`);

	return interaction.reply(topWords.join("\n"));
}
