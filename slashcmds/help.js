const {MessageEmbed}=require('discord.js')
const {SlashCommandBuilder}=require('@discordjs/builders');
const chalk=require('chalk');

module.exports={
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription("This message."),
    
    async execute(interaction, client) {
        console.log(`${ chalk.greenBright('[EVENT ACKNOWLEDGED]') } interactionCreate with command help`);
        let embed=new MessageEmbed()
            .setTitle(`Commands`)
            .setColor('GREEN');
        for (command of client.SlashCommands) {
            if (!command[1].data.description) command[1].data.description="No description";
            embed.addField(`${ command[1].data.name }`, `${command[1].data.description} \n </${command[1].data.name}:${command[1].data.id}>`);
        }

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
