import {
  type CommandInteraction,
  type CommandInteractionOption,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js"
import { addToNZ, getNZ, removeFromNZ } from "../sql"

export const data = new SlashCommandBuilder()
  .setName("nz")
  .setDescription("Command specific to people from New Zealand")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("add")
      .setDescription("add user to the list")
      .addUserOption((option) =>
        option.setName("user").setDescription("User to add").setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("remove")
      .setDescription("remove user from the list")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("User to remove")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("list").setDescription("list users in the list"),
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("ping").setDescription("ping people from NZ"),
  )

export async function execute(interaction: CommandInteraction) {
  try {
    if (!interaction.isChatInputCommand() || !interaction.guildId) return
    if (interaction.options.getSubcommand() === "add") {
      const user = interaction.options.getUser(
        "user",
      ) as CommandInteractionOption["user"]
      if (!user) {
        throw new Error("User is required")
      }
      await addToNZ(interaction.guildId, user.id)
      await interaction.reply(`Added ${user.username} to the list`)
    } else if (interaction.options.getSubcommand() === "remove") {
      const user = interaction.options.getUser(
        "user",
      ) as CommandInteractionOption["user"]
      if (!user) {
        throw new Error("User is required")
      }
      await removeFromNZ(interaction.guildId, user.id)
      await interaction.reply(`Removed ${user.username} from the list`)
    } else if (interaction.options.getSubcommand() === "list") {
      const userIds = await getNZ(interaction.guildId)
      if (!userIds || userIds.length === 0) {
        throw new Error("There are no users in the list")
      }
      await interaction.reply({ embeds: [createEmbed(userIds)] })
    } else if (interaction.options.getSubcommand() === "ping") {
      const userIds = await getNZ(interaction.guildId)
      if (!userIds || userIds.length === 0) {
        throw new Error("There are no users in the list")
      }
      await interaction.reply(
        userIds.map((user) => userPingString(user)).join(" "),
      )
    }
  } catch (error) {
    console.log((error as Error).message)
    return interaction.reply(`Error: ${(error as Error).message}`)
  }
}

const userPingString = (id: string) => {
  return `<@${id}>`
}

const createEmbed = (userIds: string[]) => {
  const embed = new EmbedBuilder()
    .setTitle("Users in the list")
    .setDescription(userIds.map((user) => userPingString(user)).join(" "))
  return embed
}
