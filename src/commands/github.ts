import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, EmbedBuilder, MessageComponentInteraction, SlashCommandBuilder } from 'discord.js';
import axios, { AxiosResponse } from 'axios';

const githubToken = process.env.GITHUB_TOKEN;

export const data = new SlashCommandBuilder()
  .setName('github')
  .setDescription('Get GitHub stats for a user')
  .addSubcommand(subcommand =>
    subcommand
      .setName('profile')
      .setDescription('Get GitHub profile for a user')
      .addStringOption(option =>
        option.setName('username')
          .setDescription('GitHub username')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('repos')
      .setDescription('Get a list of repositories for a GitHub user')
      .addStringOption(option => 
        option.setName('username')
          .setDescription('GitHub username')
          .setRequired(true)));

interface GitHubUser {
  login: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

interface Repo {
  name: string;
  html_url: string;
}

export async function execute(interaction: CommandInteraction) {
  if (!interaction.isChatInputCommand()) return;
  try {
    const username = interaction.options.getString('username');
    if (!username) throw new Error('Username is required');
    if (interaction.options.getSubcommand() === 'profile') {
      const profileEmbed = await getUserProfile(username);
      // const button = new ButtonBuilder()
      //   .setCustomId('getrepos')
      //   .setLabel('Get Repositories')
      //   .setStyle(ButtonStyle.Primary);
      // const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
      return await interaction.reply({ embeds: [profileEmbed] });
    } else if (interaction.options.getSubcommand() === 'repos') {
      const reposEmbed = await getRepos(username);
      // const button = new ButtonBuilder()
      //   .setCustomId('getprofile')
      //   .setLabel('Get Profile')
      //   .setStyle(ButtonStyle.Success);
      // const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
      return await interaction.reply({ embeds: [reposEmbed] });
    }
  } catch (error) {
    console.log((error as Error).message);
    return interaction.reply(`Error: ${(error as Error).message}`);
  }
}

export async function getUserProfile(username: string) {
  const response: AxiosResponse<GitHubUser> = await axios.get(`https://api.github.com/users/${username}`, {
    headers: {
      Authorization: `token ${githubToken}`
    }
  });
  const embed = new EmbedBuilder()
    .setTitle(`${username}'s GitHub Profile`)
    .addFields(
      { name: 'Public Repositories', value: response.data.public_repos.toString(), inline: true },
      { name: 'Followers', value: response.data.followers.toString(), inline: true },
      { name: 'Following', value: response.data.following.toString(), inline: true },
      { name: 'Account Created At', value: `<t:${Math.floor(new Date(response.data.created_at).getTime() / 1000)}:D>`, inline: true }
    )
    .setColor('#0099ff');
  return embed;
}

export async function getRepos(username: string): Promise<EmbedBuilder> {
  const response: AxiosResponse = await axios.get(`https://api.github.com/users/${username}/repos`, {
    headers: {
      Authorization: `token ${githubToken}`
    }
  });

  const embed = new EmbedBuilder()
    .setTitle(`${username}'s GitHub Repositories`)
    .setDescription(response.data.map((repo: Repo) => `[${repo.name}](${repo.html_url})`).join('\n'))
    .setColor('#0099ff');

  return embed;
}