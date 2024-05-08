import axios, { type AxiosResponse } from "axios"
import {
  type CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js"

const githubToken = process.env.GITHUB_TOKEN

export const data = new SlashCommandBuilder()
  .setName("github")
  .setDescription("Get GitHub stats for a user")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("profile")
      .setDescription("Get GitHub profile for a user")
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("GitHub username")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("repos")
      .setDescription("Get a list of repositories for a GitHub user")
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("GitHub username")
          .setRequired(true),
      ),
  )

interface GitHubUser {
  login: string
  public_repos: number
  followers: number
  following: number
  created_at: string
}

interface Repo {
  name: string
  html_url: string
}

export async function execute(interaction: CommandInteraction) {
  if (!interaction.isChatInputCommand()) return
  try {
    const username = interaction.options.getString("username")
    if (!username) throw new Error("Username is required")
    if (interaction.options.getSubcommand() === "profile") {
      const profileEmbed = await getUserProfile(username)
      await interaction.reply({ embeds: [profileEmbed] })
    }
    if (interaction.options.getSubcommand() === "repos") {
      const reposEmbed = await getRepos(username)
      await interaction.reply({ embeds: [reposEmbed] })
    }
  } catch (error) {
    console.log((error as Error).message)
    return interaction.reply(`Error: ${(error as Error).message}`)
  }
}

export async function getUserProfile(username: string) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: GitHubUser = await response.json()

    const embed = new EmbedBuilder()
      .setTitle(`${username}'s GitHub Profile`)
      .addFields(
        {
          name: "Public Repositories",
          value: data.public_repos.toString(),
          inline: true,
        },
        {
          name: "Followers",
          value: data.followers.toString(),
          inline: true,
        },
        {
          name: "Following",
          value: data.following.toString(),
          inline: true,
        },
        {
          name: "Account Created At",
          value: `<t:${Math.floor(
            new Date(data.created_at).getTime() / 1000,
          )}:D>`,
          inline: true,
        },
      )
      .setColor("#0099ff")
    return embed
  } catch (error) {
    console.log((error as Error).message)
    return new EmbedBuilder().setDescription(
      `Error: ${(error as Error).message}`,
    )
  }
}

export async function getRepos(username: string): Promise<EmbedBuilder> {
  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos`,
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    const embed = new EmbedBuilder()
      .setTitle(`${username}'s GitHub Repositories`)
      .setDescription(
        data.map((repo: Repo) => `[${repo.name}](${repo.html_url})`).join("\n"),
      )
      .setColor("#0099ff")

    return embed
  } catch (error) {
    console.log((error as Error).message)
    return new EmbedBuilder().setDescription(
      `Error: ${(error as Error).message}`,
    )
  }
}
