import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, EmbedBuilder, MessageComponentInteraction, SlashCommandBuilder } from 'discord.js';
import axios, { AxiosResponse } from 'axios';
import { getRepos } from './repos';

export const data = new SlashCommandBuilder()
  .setName('github')
  .setDescription('Get GitHub stats for a user')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('GitHub username')
      .setRequired(true));

interface GitHubUser {
  login: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export async function execute(interaction: CommandInteraction) {
  try {
    const username = interaction.options.get('username')?.value as string;
    const profileEmbed = await getUserProfile(username);
    let reposEmbed = null;
    let embed = profileEmbed;

    let button = new ButtonBuilder()
      .setCustomId('getrepos')
      .setLabel('Repositories')
      .setStyle(ButtonStyle.Primary);

    let row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(button);

    let reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    while (true) {
      const collectorFilter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id && (i.customId === 'getrepos' || i.customId === 'profile');

      try {
        const buttonClick = await reply.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
        await buttonClick.deferReply();

        if (buttonClick.customId === 'getrepos') {
          if (!reposEmbed) {
            reposEmbed = await getRepos(username);
          }
          embed = reposEmbed;
          button.setCustomId('profile').setLabel('Profile');
        } else if (buttonClick.customId === 'profile') {
          embed = profileEmbed;
          button.setCustomId('getrepos').setLabel('Repositories');
        }

        row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(button);

        reply = await buttonClick.editReply({ embeds: [embed], components: [row] });
      } catch (error) {
        console.log((error as Error).message);
        return;
      }
    }

  } catch (error) {
    console.log((error as Error).message);
    return interaction.reply(`Error: ${(error as Error).message}`);
  }
}

export async function getUserProfile(username: string) {
  const response: AxiosResponse<GitHubUser> = await axios.get(`https://api.github.com/users/${username}`);
  const embed = new EmbedBuilder()
    .setTitle(`${username}'s GitHub Profile`)
    .addFields(
      { name: 'Public Repositories', value: response.data.public_repos.toString(), inline: true },
      { name: 'Followers', value: response.data.followers.toString(), inline: true },
      { name: 'Following', value: response.data.following.toString(), inline: true },
      { name: 'Account Created At', value: new Date(response.data.created_at).toLocaleDateString(), inline: true }
    )
    .setColor('#0099ff');
  return embed;
}