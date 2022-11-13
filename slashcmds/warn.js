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

    async execute(interaction, client) {

        const db=await client.db.collection('Warns');
        console.log(`${ chalk.greenBright('[EVENT ACKNOWLEDGED]') } interactionCreate with command warn`);
        const mem=await interaction.options.getMember('member')||null;
        const reason=await interaction.options.getString('reason')||'No reason specified.';
        /*
        const time=new Date.now()
        console.log(time)
        */
        const time=Math.floor((new Date()).getTime()/1000);

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

        interaction.reply({
            embeds: [{
                description: `<@${ mem.id }> has been warned! \nReason: ${ reason }`,
                footer: {
                    text: `Moderator: ${ interaction.user.tag }`
                },
                color: 'GREEN'
            }],
        });

        // db stuff
        const warned=await db.findOne({"guild.id": interaction.guild.id});
        if (!warned) {
            await db.insertOne({
                "guild": {
                    "id": interaction.guild.id,
                    "warns": {
                        [mem.user.id]: [
                            {reason, time}
                        ]
                    }
                }
            });
        } else {
            await db.updateOne({
                "guild.id": interaction.guild.id,
            }, {
                $push: {
                    [`guild.warns.${ [mem.user.id] }`]: {reason, time}
                }
            });
        }
        try {
            await mem.send({
                embeds: [{
                    description: `You have been warned in ${ interaction.guild.name }.`,
                    fields: [{
                        name: "Reason:",
                        value: reason
                    }],
                }]
            });
        } catch (error) {
            return error;
        }
    }
};
