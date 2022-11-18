const {SlashCommandBuilder}=require('@discordjs/builders');
const chalk=require('chalk');

module.exports={
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription("Unban a member.")
        .addUserOption((option) => option
            .setName('user')
            .setRequired(true)
            .setDescription('The user you wish to unban. (This takes IDs as well)'))
        .addStringOption((option) => option
            .setName('reason')
            .setDescription('Reason for unbanning this user.')),

    async execute(interaction, client) {
        console.log(`${ chalk.greenBright('[EVENT ACKNOWLEDGED]') } interactionCreate with command unban`);
        const users=await interaction.options.getUser('user');
        const res=await interaction.options.getString('reason')||'No reason specified.';

        if (!interaction.member.permissions.has('BAN_MEMBERS')||!interaction.guild.me.permissions.has('BAN_MEMBERS')) {
            interaction.reply({
                embeds: [{
                    description: "Either you or I are missing the correct permissions (BAN_MEMBERS) to perform this action",
                    footer: {
                        text: "Check my role's permissions and make sure I have the permission to Ban Members"
                    }
                }]
            });
            return;
        }


        try {
            await interaction.guild.members.unban(users);
            interaction.reply({
                embeds: [{
                    description: `${ users.tag } has been unbanned! \nReason: ${ res }`,
                    footer: {
                        text: `Moderator: ${ interaction.user.tag }`
                    },
                    color: 'GREEN'

                }],
            });
        } catch (err) {
            interaction.reply({
                embeds: [{
                    description: `Something went very wrong. Send this error to xWass#5848! \n\`\`\`${ err }\`\`\``
                }]
            });
        }
    }
};
