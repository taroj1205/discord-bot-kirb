import { CommandInteraction, SlashCommandBuilder, Permissions, GuildMember, GuildChannel, PermissionsBitField, EmbedBuilder } from 'discord.js';
import { get, save } from '../sql';

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
  );

export async function execute(interaction: CommandInteraction) {
  try {
    if (!interaction.isChatInputCommand()) return;

    // Check if the user has admin permissions
    if (!(interaction.member instanceof GuildMember) || !(interaction.channel instanceof GuildChannel) || !interaction.member.permissionsIn(interaction.channel).has(PermissionsBitField.Flags.Administrator)) {
      await interaction.reply({content: 'You are not permitted to use this command.', ephemeral: true});
      return;
    }
    
    if (interaction.options.getSubcommand() === 'random-messages') {
      const messages = interaction.options.getString('messages');
      if (!messages) throw new Error('No messages provided');

      const messageList = messages.split(',').map(message => message.trim());

      // Check if there's an empty item in the list
      if (messageList.some(message => message === '')) {
        throw new Error('Wrong format. Messages should be separated by commas and should not be empty. Example: "Hello,World,How are you"');
      }

      console.log(`Set random messages to: ${messages}`);

      const chance = interaction.options.getNumber('chance') || 0.01;

      await save(interaction.guildId!, messageList.join(','), chance);

      await interaction.reply(`Set random messages to: ${messageList.join(', ')}`);
    } else if (interaction.options.getSubcommand() === 'show') {
      const { messages, chance } = await get(interaction.guildId!);

      const embed = new EmbedBuilder()
        .setTitle('Random Messages Configuration')
        .addFields({name: 'Messages', value: messages.join(', '), inline: true}, {name: 'Chance', value: chance.toString(), inline: true})
        .setColor('#0099ff');

      await interaction.reply({ embeds: [embed] });
    }
  } catch (error) {
    console.log((error as Error).message);
    await interaction.reply(`Error: ${(error as Error).message}`);
  }
}