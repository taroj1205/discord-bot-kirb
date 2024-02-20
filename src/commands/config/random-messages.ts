import {
	CommandInteraction,
	SlashCommandBuilder,
	Permissions,
	GuildMember,
	GuildChannel,
	PermissionsBitField,
	EmbedBuilder,
} from "discord.js";
import { get, save, saveChannel } from "../../sql";

export const data = new SlashCommandBuilder()
	.setName("config")
	.setDescription("Configuration commands")
	.addSubcommand((subcommand) =>
		subcommand
			.setName("random-messages")
			.setDescription("Sets a list of random messages")
			.addStringOption((option) =>
				option
					.setName("messages")
					.setDescription("A list of words separated by commas")
					.setRequired(true)
			)
			.addNumberOption((option) =>
				option
					.setName("chance")
					.setDescription(
						"The chance of sending a random message example: 1 for 1%"
					)
					.setRequired(false)
			)
	)
	.addSubcommand((subcommand) =>
		subcommand.setName("show").setDescription("Shows current configurations")
	)
	.addSubcommand((subcommand) =>
		subcommand.setName("enable").setDescription("Enables random messages")
	)
	.addSubcommand((subcommand) =>
		subcommand.setName("disable").setDescription("Disables random messages")
	)
	.addSubcommand((subcommand) =>
		subcommand
			.setName("add")
			.setDescription("Add words to the list of random messages")
			.addStringOption((option) =>
				option
					.setName("messages")
					.setDescription("A list of words separated by commas")
					.setRequired(true)
			)
			.addNumberOption((option) =>
				option
					.setName("chance")
					.setDescription(
						"Update the chance of sending a random message example: 1 for 1%"
					)
					.setRequired(false)
			)
	)
	.addSubcommand((subcommand) =>
		subcommand
			.setName("remove")
			.setDescription("Remove words from the list of random messages")
			.addStringOption((option) =>
				option
					.setName("messages")
					.setDescription("A list of words separated by commas")
					.setRequired(true)
			)
	);

export async function execute(interaction: CommandInteraction) {
	try {
		if (!interaction.isChatInputCommand()) return;

		// Check if the user has admin permissions
		if (
			!(interaction.member instanceof GuildMember) ||
			!(interaction.channel instanceof GuildChannel) ||
			(interaction.member.id !== "631578250144907269" &&
				!interaction.member
					.permissionsIn(interaction.channel)
					.has(PermissionsBitField.Flags.Administrator))
		) {
			await interaction.reply({
				content: "You are not permitted to use this command.",
				ephemeral: true,
			});
		}

		if (interaction.options.getSubcommand() === "random-messages") {
			const messages = interaction.options.getString("messages");
			if (!messages) throw new Error("No messages provided");

			const messageList = messages.split(",").map((message) => message.trim());

			// Check if there's an empty item in the list
			if (messageList.some((message) => message === "")) {
				throw new Error(
					'Wrong format. Messages should be separated by commas and should not be empty. Example: "Hello,World,How are you"'
				);
			}

			console.log(`Set random messages to: ${messageList.join(", ")}`);

			const chance = interaction.options.getNumber("chance") || 1;

			await save(interaction.guildId!, messageList.join(", "), chance);

			await interaction.reply(
				`Set random messages to: ${messageList.join(
					", "
				)} with chance: ${chance}%`
			);
		} else if (interaction.options.getSubcommand() === "show") {
			const { messages, chance, channels } = await get(interaction.guildId!);

			// Prepare lists of enabled and disabled channels
			let enabledChannels = [];
			let disabledChannels = [];

			if (channels) {
				for (const [channelId, isEnabled] of Object.entries(channels)) {
					if (isEnabled) {
						enabledChannels.push(`<#${channelId}>`);
					} else {
						disabledChannels.push(`<#${channelId}>`);
					}
				}
			}

			if (enabledChannels.length === 0) {
				enabledChannels.push("None");
			}
			if (disabledChannels.length === 0) {
				disabledChannels.push("None");
			}

			const embed = new EmbedBuilder()
				.setTitle("Random Messages Configuration")
				.addFields(
					{ name: "Messages", value: messages.join(", "), inline: true },
					{
						name: "Chance",
						value: `${chance.toString()}%`,
						inline: true,
					},
					{
						name: "Enabled Channels",
						value: enabledChannels.join(" "),
						inline: true,
					}
				)
				.setColor("#0099ff");

			await interaction.reply({ embeds: [embed] });
		} else if (interaction.options.getSubcommand() === "enable") {
			await saveChannel(interaction.guildId!, interaction.channelId, "enable");
			await interaction.reply("Enabled random messages");
		} else if (interaction.options.getSubcommand() === "disable") {
			await saveChannel(interaction.guildId!, interaction.channelId, "disable");
			await interaction.reply("Disabled random messages");
		} else if (interaction.options.getSubcommand() === "add") {
			if (!interaction.isChatInputCommand()) return;
			// Check if the user has admin permissions
			if (
				!(interaction.member instanceof GuildMember) ||
				!(interaction.channel instanceof GuildChannel) ||
				(interaction.member.id !== "631578250144907269" &&
					!interaction.member
						.permissionsIn(interaction.channel)
						.has(PermissionsBitField.Flags.Administrator))
			) {
				await interaction.reply({
					content: "You are not permitted to use this command.",
					ephemeral: true,
				});
			}

			const messages = interaction.options.getString("messages");
			if (!messages) throw new Error("No messages provided");

			const messageList = messages.split(",").map((message) => message.trim());
			const chance = interaction.options.getNumber("chance") || null;

			// Check if there's an empty item in the list
			if (messageList.some((message) => message === "")) {
				throw new Error(
					'Wrong format. Messages should be separated by commas and should not be empty. Example: "Hello,World,How are you"'
				);
			}

			// if interaction.guild is undefined
			if (!interaction.guild) {
				throw new Error("Guild not found, please try again");
			}

			// Fetch the existing messages
			const existingData = await get(interaction.guild.id);
			const existingMessages = existingData.messages;

			// Append new messages to the existing ones
			const updatedMessages = existingMessages.concat(messageList);

			// Save the updated messages back to the database
			await save(
				interaction.guild.id,
				updatedMessages.join(","),
				chance || existingData.chance
			);

			await interaction.reply(
				`Added ${messageList.join(", ")} to the list of random messages`
			);
		} else if (interaction.options.getSubcommand() === "remove") {
			if (!interaction.isChatInputCommand()) return;

			// Check if the user has admin permissions
			if (
				!(interaction.member instanceof GuildMember) ||
				!(interaction.channel instanceof GuildChannel) ||
				(interaction.member.id !== "631578250144907269" &&
					!interaction.member
						.permissionsIn(interaction.channel)
						.has(PermissionsBitField.Flags.Administrator))
			) {
				await interaction.reply({
					content: "You are not permitted to use this command.",
					ephemeral: true,
				});
			}

			// if interaction.guild is undefined
			if (!interaction.guild) {
				throw new Error("Guild not found, please try again");
			}

			const messages = interaction.options.getString("messages");
			if (!messages) throw new Error("No messages provided");

			const messageList = messages.split(",").map((message) => message.trim());

			// Check if there's an empty item in the list
			if (messageList.some((message) => message === "")) {
				throw new Error(
					'Wrong format. Messages should be separated by commas and should not be empty. Example: "Hello,World,How are you"'
				);
			}

			// Fetch the existing messages
			const existingData = await get(interaction.guild.id);
			const existingMessages = existingData.messages;

			// Remove messages from the list
			const updatedMessages = existingMessages.filter(
				(message) => !messageList.includes(message)
			);

			// Save the updated messages back to the database
			await save(
				interaction.guild.id,
				updatedMessages.join(","),
				existingData.chance
			);

			await interaction.reply(
				`Removed ${messageList.join(", ")} from the list of random messages`
			);
		}
	} catch (error) {
		console.log((error as Error).message);
		await interaction.reply(`Error: ${(error as Error).message}`);
	}
}
