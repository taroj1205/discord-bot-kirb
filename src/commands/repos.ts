import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import axios, { AxiosResponse } from 'axios';

export const data = new SlashCommandBuilder()
  .setName('getrepos')
  .setDescription('Get a list of repositories for a GitHub user')
  .addStringOption(option => 
    option.setName('username')
      .setDescription('GitHub username')
      .setRequired(true));

interface Repo {
  name: string;
  html_url: string;
}

export async function execute(interaction: CommandInteraction) {
  try {
    const username = interaction.options.get('username')?.value as string;
    const embed = await getRepos(username)

    return interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.log((error as Error).message);
    return interaction.reply(`Error: ${(error as Error).message}`);
  }
}

export async function getRepos(username: string): Promise<EmbedBuilder> {
  const response: AxiosResponse = await axios.get(`https://api.github.com/users/${username}/repos`);

  const embed = new EmbedBuilder()
    .setTitle(`${username}'s GitHub Repositories`)
    .setDescription(response.data.map((repo: Repo) => `[${repo.name}](${repo.html_url})`).join('\n'))
    .setColor('#0099ff');
  
  return embed;
}