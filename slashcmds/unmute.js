const {SlashCommandBuilder}=require('@discordjs/builders');
const chalk=require('chalk');

module.exports={
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription("Unmute a member.")
        .addUserOption((option) => option
            .setName('member')
            .setRequired(true)
            .setDescription('The member to unmute.'))
        .addStringOption((option) => option
            .setName('reason')
            .setDescription('Reason for muting this user.')),

    async execute(interaction) {
        console.log(`${ chalk.greenBright('[EVENT ACKNOWLEDGED]') } interactionCreate with command unmute`);
        const mem=await interaction.options.getMember('member')||null;
        const res=await interaction.options.getString('reason')||'No reason specified.';

        if (!interaction.member.permissions.has('MODERATE_MEMBERS')||!interaction.guild.me.permissions.has('MODERATE_MEMBERS')) {
            interaction.reply({
                embeds: [{
                    description: "Either you or I are missing the correct permissions (MODERATE_MEMBERS) to perform this action",
                    footer: {
                        text: "Check my role's permissions and make sure I have the permission to Timeout Members"
                    }
                }]
            });
            return;
        }

        if (!mem.moderatable) {
            interaction.reply({
                embeds: [{
                    description: "Something went wrong! Check your server's role order, or stop trying to mute the owner!",
                    footer: {
                        text: "Make sure my highest role is above whoever you are trying to unmute."
                    }
                }]
            });
            return;
        }

        try {
            await mem.timeout(0, res);
            interaction.reply({
                embeds: [{
                    description: `<@${ mem.id }> has been unmuted! \nReason: ${ res }`,
                    footer: {
                        text: `Moderator: ${ interaction.user.tag }`
                    },
                    color: 'GREEN'

                }],
            });
        } catch (err) {
            interaction.reply({
                embeds: [{
                    description: `Something went very wrong. Send this error to xWass#0001! \n\`\`\`${ err }\`\`\``
                }]
            });
        }
    }
};
