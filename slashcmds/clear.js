// this is where funi db stuff gets involved i hate it 
const {SlashCommandBuilder}=require('@discordjs/builders');
const chalk=require('chalk');

module.exports={
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription("Clear messages from a channel.")
        .addIntegerOption((option) => option
            .setName('amount')
            .setRequired(true)
            .setDescription('Amount of messages to clear.')),

    async execute(interaction) {
        console.log(`${ chalk.greenBright('[EVENT ACKNOWLEDGED]') } interactionCreate with command clear`);
        const amount=await interaction.options.getInteger('amount')||null;

        if (!interaction.member.permissions.has('MANAGE_MESSAGES')||!interaction.guild.me.permissions.has('MANAGE_MESSAGES')) {
            interaction.reply({
                embeds: [{
                    description: "Either you or I are missing the correct permissions (MANAGE_MESSAGES) to perform this action",
                    footer: {
                        text: "Check my role's permissions and make sure I have the permission to Ban Members"
                    }
                }]
            });
            return;
        }
        if (amount>100) {
            interaction.reply({
                embeds: [{
                    description: "You can only delete 100 messages for now..."
                }]
            });
            return;

        }
        
        try {
            interaction.channel.bulkDelete(amount, true);
            interaction.reply({
                embeds: [{
                    description: `${ amount } messages cleared!`,
                    footer: {
                        text: `Moderator: ${ interaction.user.tag }`
                    },
                    color: 'GREEN'
                }],
            });
            setTimeout(() => {
                interaction.deleteReply();
            }, 5000);

        } catch (err) {
            interaction.reply({
                embeds: [{
                    description: `Something went very wrong. Send this error to xWass#0001! \n\`\`\`${ err }\`\`\``
                }],
                ephemeral: true
            });
        }
    }
};
