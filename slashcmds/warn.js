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
        const type="Warn";
        const db=await client.db.collection('Infractions');
        console.log(`${ chalk.greenBright('[EVENT ACKNOWLEDGED]') } interactionCreate with command warn`);
        const mem=await interaction.options.getMember('member')||null;
        const reason=await interaction.options.getString('reason')||'No reason specified.';
        const moderator=interaction.user.tag;
        const time=Math.floor((new Date()).getTime()/1000);

        if (!interaction.member.permissions.has('MANAGE_MESSAGES')||!interaction.guild.me.permissions.has('MANAGE_MESSAGES')) {
            interaction.reply({
                embeds: [{
                    description: "You are not a moderator!",
                }]
            });
            return;
        }

        interaction.reply({
            embeds: [{
                description: `<@${ mem.id }> has been warned! \nReason: ${ reason }`,
                footer: {
                    text: `Moderator: ${ moderator }`
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
                    "infractions": {
                        [mem.user.id]: [
                            {type, reason, time, moderator}
                        ]
                    },
                    "config": {
                        "automod": {
                            "status": false,
                            "warn": false
                        },
                        "verify": {
                            "status": false,
                            "channel": null,
                            "role": null
                        },
                        "logging": {
                            "status": false,
                            "channel": null,
                            "level": null
                        }
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
        const logging=await db.findOne({
            'guild.id': interaction.guild.id,
            [`guild.config.logging`]: {
                $exists: true
            }
        });

        if (logging.guild.config.logging.status===true) {
            const channel=client.channels.cache.get(logging.guild.config.logging.channel);
            channel.send({
                embeds: [{
                    title: `Warn`,
                    fields: [
                        {name: "Member:", value: `<@${ mem.id }>`, inline: true},
                        {name: "Reason:", value: reason, inline: true},
                        {name: "Time:", value: `<t:${ time }:f>`},
                    ],
                    footer: {
                        text: `Moderator: ${ interaction.user.tag }`
                    },
                    color: 'GREEN'

                }]
            });
        }

        try {
            await mem.send({
                embeds: [{
                    title: `You have been warned in ${ interaction.guild.name }.`,
                    fields: [
                        {name: "Reason:", value: reason}
                    ],
                }]
            });
        } catch (error) {
            return error;
        }
    }
};
