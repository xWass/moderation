const {SlashCommandBuilder}=require('@discordjs/builders');
const chalk=require('chalk');
module.exports={
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription("Change bot configurations.")
        .addSubcommand(sub =>
            sub
                .setName('automod')
                .setDescription('Enables or disables automod.')
                .addStringOption((stringOption) =>
                    stringOption
                        .setName("modify")
                        .setDescription("Enable or Disable?")
                        .addChoices(
                            {name: 'Enable', value: 'Enable'},
                            {name: 'Disable', value: 'Disable'},
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('verify')
                .setDescription('Changes the prefix of the bot in your server.')
                .addStringOption(option =>
                    option
                        .setName("modify")
                        .setDescription("Enable or Disable?")
                        .addChoices(
                            {name: 'Enable', value: 'Enable'},
                            {name: 'Disable', value: 'Disable'},
                        )
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option
                        .setName("channel")
                        .setDescription("Channel to use for verification.")
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option
                        .setName("role")
                        .setDescription("The role that the bot gives to verified users.")
                        .setRequired(true))
        ),

    async execute(interaction, client) {
        const db=await client.db.collection('Infractions');
        console.log(`${ chalk.greenBright('[EVENT ACKNOWLEDGED]') } interactionCreate with command config`);
        const moderator=interaction.user.tag;
        const modify=await interaction.options.getString('modify');
        const chan=await interaction.options.getChannel('channel');
        const role=await interaction.options.getRole('role');
        let value;
        if (modify==="Enable") value=true;
        if (modify==="Disable") value=false;

        const found=await db.findOne({"guild.id": interaction.guild.id});

        if (!interaction.member.permissions.has('MANAGE_SERVER')||!interaction.guild.me.permissions.has('MANAGE_SERVER')) {
            interaction.reply({
                embeds: [{
                    description: "You are not a moderator!",
                    footer: {
                        text: "This requires the Manage Server permission."
                    }
                }]
            });
            return;
        }

        const chosen=await interaction.options.getSubcommand();
        if (chosen==="automod") {
            if (!found) {
                await db.insertOne({
                    "guild": {
                        "id": interaction.guild.id,
                        "infractions": {
                        },
                        "config": {
                            "automod": value,
                            "verify": false
                        }
                    }
                });
                interaction.reply({
                    embeds: [{
                        description: `Automod has been set to \`${ modify }d\``,
                        footer: {
                            text: `Moderator: ${ moderator }`
                        },
                        color: 'GREEN'
                    }],
                });
            } else {
                await db.updateOne({
                    "guild.id": interaction.guild.id,
                }, {
                    $set: {
                        "guild.config.automod": value // pulled from subcommand
                    }
                });
                interaction.reply({
                    embeds: [{
                        description: `Automod has been set to \`${ modify }d\``,
                        footer: {
                            text: `Moderator: ${ moderator }`
                        },
                        color: 'GREEN'
                    }],
                });
            }

        } else if (chosen==="verify") {
            if (!found) {
                await db.insertOne({
                    "guild": {
                        "id": interaction.guild.id,
                        "infractions": {
                        },
                        "config": {
                            "automod": false,
                            "verify": value
                        }
                    }
                });
                interaction.reply({
                    embeds: [{
                        description: `Verify has been set to \`${ modify }d\`in channel <#${ chan.id }>`,
                        footer: {
                            text: `Moderator: ${ moderator }`
                        },
                        color: 'GREEN'
                    }],
                });
                if (value===true) {
                    try {
                        await chan.permissionOverwrites.set([
                            {
                                id: role.id,
                                allow: VIEW_CHANNEL
                            },
                            {
                                id: interaction.guild.id,
                                deny: VIEW_CHANNEL
                            }
                        ]);
                    } catch (err) {
                        interaction.followUp({
                            embeds: [{
                                title: `I can't change permissions in #${ chan.name }`,
                                description: `\`\`\`${ err }\`\`\``,
                                footer: {
                                    text: "I require the Manage Permissions role, and for my highest role to be above the verification role"
                                }
                            }]
                        });
                    }

                    try {
                        chan.send({
                            embeds: [{
                                title: "Type `!verify` to verify in this server",
                            }]
                        });
                    } catch {
                        interaction.followUp({
                            embeds: [{
                                title: `I do not have access to #${ chan.name }`,
                                footer: {
                                    text: "Role permissions were successfully changed."
                                }
                            }]
                        });
                    }

                }

            } else {
                if (value===true) {
                    try {
                        await chan.permissionOverwrites.set([
                            {
                                id: role.id,
                                allow: "VIEW_CHANNEL"
                            },
                            {
                                id: interaction.guild.id,
                                deny: "VIEW_CHANNEL"
                            }
                        ]);
                    } catch (err) {
                        interaction.reply({
                            embeds: [{
                                title: `I can't change permissions in #${ chan.name }`,
                                description: `\`\`\`${ err }\`\`\``,
                                footer: {
                                    text: "I require the Manage Permissions role, and for my highest role to be above the verification role"
                                }
                            }]
                        });
                        return
                    }

                    try {
                        chan.send({
                            embeds: [{
                                title: "Type `!verify` to verify in this server",
                            }]
                        });
                    } catch (err) {
                        interaction.reply({
                            embeds: [{
                                title: `I do not have access to #${ chan.name }`,
                                description: `\`\`\`${ err }\`\`\``,
                                footer: {
                                    text: "Role permissions were successfully changed."
                                }
                            }]
                        });
                        return;
                    }

                }
                interaction.reply({
                    embeds: [{
                        description: `Verify has been set to \`${ modify }d\``,
                        footer: {
                            text: `Moderator: ${ moderator }`
                        },
                        color: 'GREEN'
                    }],
                });
                await db.updateOne({
                    "guild.id": interaction.guild.id,
                }, {
                    $set: {
                        "guild.config.verify": value
                    }
                });
            }
        }
    }
};
