const {SlashCommandBuilder}=require('@discordjs/builders');
const {MessageActionRow, MessageButton}=require('discord.js');
const chalk=require('chalk');
module.exports={
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription("Change bot configurations."),

    async execute(interaction, client) {
        const db=await client.db.collection('Infractions');
        console.log(`${ chalk.greenBright('[EVENT ACKNOWLEDGED]') } interactionCreate with command test`);

        const moderator=interaction.user.tag;
        const found=await db.findOne({"guild.id": interaction.guild.id});

        if (!interaction.member.permissions.has('ADMINISTRATOR')||!interaction.guild.me.permissions.has('ADMINISTRATOR')) {
            interaction.reply({
                embeds: [{
                    description: "You are not a moderator!",
                    footer: {
                        text: "This requires the Administrator permission."
                    }
                }]
            });
            return;
        }

        if (!found) {
            await db.insertOne({
                "guild": {
                    "id": interaction.guild.id,
                    "infractions": {
                    },
                    "config": {
                        "automod": {
                            "status": false,
                            "warn": null
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
        }
        const buttons=new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('verify')
                    .setLabel('Verification')
                    .setStyle('SUCCESS'),
            )
            .addComponents(
                new MessageButton()
                    .setCustomId('automod')
                    .setLabel('Automod')
                    .setStyle('SUCCESS'),
            )
            .addComponents(
                new MessageButton()
                    .setCustomId('logging')
                    .setLabel('Logging')
                    .setStyle('SUCCESS'),
            )
            .addComponents(
                new MessageButton()
                    .setCustomId('cancel')
                    .setLabel('Cancel')
                    .setStyle('DANGER'),
            );

        interaction.reply({
            embeds: [{
                title: "test",
                fields: [
                    {name: "Verification", value: "Select Verification to enable/modify server verification on member join.", inline: true},
                    {name: "Automod", value: "Select Automod to enable/modify this server's automatic moderation strictness", inline: true},
                    {name: "Logging", value: "Select logging to enable/modify this server's logging strictness.", inline: true}
                ]
            }],
            components: [buttons]
        });


    }
};
