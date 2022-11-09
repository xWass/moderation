const {SlashCommandBuilder}=require('@discordjs/builders');
const chalk=require('chalk');
const ms=require('ms');

module.exports={
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription("Mute a member.")
        .addUserOption((option) => option
            .setName('member')
            .setRequired(true)
            .setDescription('The member to mute.'))
        .addStringOption((option) => option
            .setName('time')
            .setRequired(true)
            .setDescription('Time to mute for. (1m, 1h, 1d, 1w. 28 days max)'))
        .addStringOption((option) => option
            .setName('reason')
            .setDescription('Reason for muting this user.')),

    async execute(interaction) {
        console.log(`${ chalk.greenBright('[EVENT ACKNOWLEDGED]') } interactionCreate with command mute`);
        const mem=await interaction.options.getMember('member')||null;
        const res=await interaction.options.getString('reason')||'No reason specified.';
        const time=await interaction.options.getString('time');
        const formattedTime=ms(time);

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
                    description: "Something went wrong! Check your server's role order, or stop trying to ban the owner!",
                    footer: {
                        text: "Make sure my highest role is above whoever you are trying to mute."
                    }
                }]
            });
            return;
        }

        try {
            await mem.timeout(formattedTime, res);
            interaction.reply({
                embeds: [{
                    description: `<@${ mem.id }> has been muted for ${ time }! \nReason: ${ res }`,
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
