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
            .setColor('Green');
        for (command of client.SlashCommands) {
            if (!command[1].description) command[1].description="No description";
            embed.addField(`${ command[1].name }`, `${command[1].description} \n </${command[1].name}:${command[1].id}>`);
        }

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
