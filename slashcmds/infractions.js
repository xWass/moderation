// INCOMPLETE FILE
const {SlashCommandBuilder}=require('@discordjs/builders');
const chalk=require('chalk');
module.exports={
    data: new SlashCommandBuilder()
        .setName('infractions')
        .setDescription("View a member's infractions.")
        .addUserOption((option) => option
            .setName('member')
            .setRequired(true)
            .setDescription('The member whos infractions you want to view.')),

    async execute(interaction, client) {

        const db=await client.db.collection('Warns');
        console.log(`${ chalk.greenBright('[EVENT ACKNOWLEDGED]') } interactionCreate with command infractions`);
        const mem=await interaction.options.getMember('member')||null;

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

        const warned=await db.findOne({"guild.id": interaction.guild.id});
        if (!warned) {
            interaction.reply({
                embeds: [{
                    title: "Nobody has been warned in this server..."
                }],
                ephemeral: true
            });
            return;
        } else {
            const memm=await db.findOne({
                'guild.id': interaction.guild.id,
                [`guild.warns.${ mem.user.id }`]: {
                    $exists: true
                }
            });

            console.log(memm);
            if (!memm) {
                interaction.reply({
                    embeds: [{
                        title: "This member has no infractions"
                    }],
                    ephemeral: true
                });
                return;
            }
            interaction.reply({
                embeds: [{
                    title: "yes"
                }]
            });
        }
    }
};
