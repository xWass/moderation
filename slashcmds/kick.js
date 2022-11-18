const {SlashCommandBuilder}=require('@discordjs/builders');
const chalk=require('chalk');

module.exports={
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription("Kick a member.")
        .addUserOption((option) => option
            .setName('member')
            .setRequired(true)
            .setDescription('The member to kick.'))
        .addStringOption((option) => option
            .setName('reason')
            .setDescription('Reason for kicking this user.')),

    async execute(interaction, client) {
        const type="Kick";
        const db=await client.db.collection('Infractions');
        console.log(`${ chalk.greenBright('[EVENT ACKNOWLEDGED]') } interactionCreate with command kick`);
        const mem=await interaction.options.getMember('member')||null;
        const res=await interaction.options.getString('reason')||'No reason specified.';
        const moderator=interaction.user.tag;
        const time=Math.floor((new Date()).getTime()/1000);


        if (!interaction.member.permissions.has('KICK_MEMBERS')||!interaction.guild.me.permissions.has('KICK_MEMBERS')) {
            interaction.reply({
                embeds: [{
                    description: "Either you or I are missing the correct permissions (KICK_MEMBERS) to perform this action",
                    footer: {
                        text: "Check my role's permissions and make sure I have the permission to Ban Members"
                    }
                }]
            });
            return;
        }

        if (!mem.kickable) {
            interaction.reply({
                embeds: [{
                    description: "Something went wrong! Check your server's role order, or stop trying to kick the owner!",
                    footer: {
                        text: "Make sure my highest role is above whoever you are trying to unmute."
                    }
                }]
            });
            return;
        }
        const warned=await db.findOne({"guild.id": interaction.guild.id});
        if (!warned) {
            await db.insertOne({
                "guild": {
                    "id": interaction.guild.id,
                    "infractions": {
                        [mem.user.id]: [
                            {type, reason, time, moderator}
                        ]
                    },
                    "config": {
                        "automod": false,
                        "verify": false
                    }
                }
            });
        } else {
            await db.updateOne({
                "guild.id": interaction.guild.id,
            }, {
                $push: {
                    [`guild.infractions.${ [mem.user.id] }`]: {type, reason, time, moderator}
                }
            });
        }

        try {
            await mem.kick(res);
            interaction.reply({
                embeds: [{
                    description: `<@${ mem.id }> has been kicked! \nReason: ${ res }`,
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
