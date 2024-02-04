import { CommandInteraction, SlashCommandBuilder, Permissions, GuildMember, GuildChannel, PermissionsBitField, EmbedBuilder } from 'discord.js';
import { get, save, saveChannel } from '../../sql';

export const data = new SlashCommandBuilder()
  .setName('config')
  .setDescription('Configuration commands')
  .addSubcommand(subcommand =>
    subcommand
      .setName('random-messages')
      .setDescription('Sets a list of random messages')
      .addStringOption(option =>
        option
          .setName('messages')
          .setDescription('A list of words separated by commas')
          .setRequired(true)
      )
      .addNumberOption(option =>
        option
          .setName('chance')
          .setDescription('The chance of sending a random message example: 0.01')
          .setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('show')
      .setDescription('Shows current configurations')
)
  .addSubcommand(subcommand =>
    subcommand
      .setName('enable')
      .setDescription('Enables random messages'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('disable')
      .setDescription('Disables random messages'));


export async function execute(interaction: CommandInteraction) {
  try {
    if (!interaction.isChatInputCommand()) return;

    // Check if the user has admin permissions
    if (!(interaction.member instanceof GuildMember) || !(interaction.channel instanceof GuildChannel) || interaction.member.id !== '631578250144907269' && (!interaction.member.permissionsIn(interaction.channel).has(PermissionsBitField.Flags.Administrator))) {
      await interaction.reply({ content: 'You are not permitted to use this command.', ephemeral: true });
    }

    if (interaction.options.getSubcommand() === 'random-messages') {
      const messages = interaction.options.getString('messages');
      if (!messages) throw new Error('No messages provided');

      const messageList = messages.split(',').map(message => message.trim());

      // Check if there's an empty item in the list
      if (messageList.some(message => message === '')) {
        throw new Error('Wrong format. Messages should be separated by commas and should not be empty. Example: "Hello,World,How are you"');
      }

      console.log(`Set random messages to: ${messageList.join(', ')}`);

      const chance = interaction.options.getNumber('chance') || 0.01;

      await save(interaction.guildId!, messageList.join(', '), chance);

      await interaction.reply(`Set random messages to: ${messageList.join(', ')} with chance: ${chance * 100}%`);
    } else if (interaction.options.getSubcommand() === 'show') {
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
        enabledChannels.push('None');
      }
      if (disabledChannels.length === 0) {
        disabledChannels.push('None');
      }

      const embed = new EmbedBuilder()
        .setTitle('Random Messages Configuration')
        .addFields(
          { name: 'Messages', value: messages.join(', '), inline: true },
          { name: 'Chance', value: `${(chance * 100).toString()}%`, inline: true },
          { name: 'Enabled Channels', value: enabledChannels.join(' '), inline: true },
          { name: 'Disabled Channels', value: disabledChannels.join(' '), inline: true }
        )
        .setColor('#0099ff');

      await interaction.reply({ embeds: [embed] });
    } else if (interaction.options.getSubcommand() === 'enable') {
      await saveChannel(interaction.guildId!, interaction.channelId, 'enable');
      await interaction.reply('Enabled random messages');
    } else if (interaction.options.getSubcommand() === 'disable') {
      await saveChannel(interaction.guildId!, interaction.channelId, 'disable');
      await interaction.reply('Disabled random messages');
    }
  } catch (error) {
    console.log((error as Error).message);
    await interaction.reply(`Error: ${(error as Error).message}`);
  }
}