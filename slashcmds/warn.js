// this is where funi db stuff gets involved i hate it 
const {SlashCommandBuilder}=require('@discordjs/builders');
const chalk=require('chalk');

module.exports={
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription("Warn a member.")
        .addUserOption((option) => option
            .setName('member')
            .setRequired(true)
            .setDescription('The member to warn.'))
        .addStringOption((option) => option
            .setName('reason')
            .setRequired(true)
            .setDescription('Reason for warning this user.')),

    async execute(interaction) {
        console.log(`${ chalk.greenBright('[EVENT ACKNOWLEDGED]') } interactionCreate with command warn`);
        const mem=await interaction.options.getMember('member')||null;
        const res=await interaction.options.getString('reason')||'No reason specified.';

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

        try {
            interaction.reply({
                embeds: [{
                    description: `<@${ mem.id }> has been warned! \nReason: ${ res }`,
                    footer: {
                        text: `Moderator: ${ interaction.user.tag }`
                    },
                    color: 'GREEN'
                }],
            });
            mem.send({
                embeds: [{
                    description: `You have been warned in ${ interaction.guild.name }.`,
                    fields: [{
                        name: "Reason:",
                        value: res
                    }],
                }]
            })
        } catch (err) {
            interaction.reply({
                embeds: [{
                    description: `I could not message this user`
                }],
                ephemeral: true
            });
        }
    }
};
