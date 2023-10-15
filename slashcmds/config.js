/** @format */

const { SlashCommandBuilder } = require("@discordjs/builders");
const chalk = require("chalk");
module.exports = {
    data: new SlashCommandBuilder()
        .setName("config")
        .setDescription("Change bot configurations.")
        .addSubcommand((sub) =>
            sub
                .setName("verify")
                .setDescription("Modifies server verification.")
                .addStringOption((option) =>
                    option
                        .setName("modify")
                        .setDescription("Enable or Disable?")
                        .addChoices(
                            { name: "Enable", value: "Enable" },
                            { name: "Disable", value: "Disable" }
                        )
                        .setRequired(true)
                )
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setDescription("Channel to use for verification.")
                        .setRequired(true)
                )
                .addRoleOption((option) =>
                    option
                        .setName("role")
                        .setDescription(
                            "The role that the bot gives to verified users."
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("logging")
                .setDescription("Modifies logging.")
                .addStringOption((option) =>
                    option
                        .setName("modify")
                        .setDescription("Enable or Disable?")
                        .addChoices(
                            { name: "Enable", value: "Enable" },
                            { name: "Disable", value: "Disable" }
                        )
                        .setRequired(true)
                )
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setDescription("Channel to use for logging.")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("level")
                        .setDescription(
                            "Set logging level. Low for moderation only, high for everything."
                        )
                        .addChoices(
                            { name: "Low", value: "Low" },
                            { name: "High", value: "High" }
                        )
                        .setRequired(true)
                )
        ),

    async execute(interaction, client) {
        const db = await client.db.collection("Infractions");
        console.log(
            `${chalk.greenBright(
                "[EVENT ACKNOWLEDGED]"
            )} interactionCreate with command config`
        );
        const moderator = interaction.user.tag;
        // use modify and chan for logging
        const modify = await interaction.options.getString("modify");
        const chan = await interaction.options.getChannel("channel");
        const warn = await interaction.options.getString("warn");
        const role = await interaction.options.getRole("role");
        // __
        const level = await interaction.options.getString("level");
        let value;
        if (modify === "Enable") value = true;
        if (modify === "Disable") value = false;
        let enableWarn;
        if (warn === "Enable") enableWarn = true;
        if (warn === "Disable") enableWarn = false;

        const found = await db.findOne({ "guild.id": interaction.guild.id });
        if (
            !interaction.member.permissions.has("MANAGE_SERVER") ||
            !interaction.guild.me.permissions.has("MANAGE_SERVER")
        ) {
            interaction.reply({
                embeds: [
                    {
                        description: "You are not a moderator!",
                        footer: {
                            text: "This requires the Manage Server permission.",
                        },
                    },
                ],
            });
            return;
        }

        const chosen = await interaction.options.getSubcommand();
        if (chosen === "verify") {
            if (!found) {
                await db.insertOne({
                    guild: {
                        id: interaction.guild.id,
                        infractions: {},
                        config: {
                            automod: {
                                status: false,
                                warn: false,
                            },
                            verify: {
                                status: value,
                                channel: chan.id,
                                role: role.id,
                            },
                            logging: {
                                status: false,
                                channel: null,
                                level: null,
                            },
                        },
                    },
                });
                try {
                    await chan.permissionOverwrites.set([
                        {
                            id: role.id,
                            allow: "VIEW_CHANNEL",
                        },
                        {
                            id: interaction.guild.id,
                            deny: "VIEW_CHANNEL",
                        },
                    ]);
                } catch (err) {
                    interaction.reply({
                        embeds: [
                            {
                                title: `I can't change permissions in #${chan.name}`,
                                description: `\`\`\`${err}\`\`\``,
                                footer: {
                                    text: "I require the Manage Permissions role, and for my highest role to be above the verification role",
                                },
                            },
                        ],
                    });
                    return;
                }

                try {
                    chan.send({
                        embeds: [
                            {
                                description:
                                    "To verify, click this and press enter: </verify:1042262928969170944>",
                            },
                        ],
                    });
                } catch (err) {
                    interaction.reply({
                        embeds: [
                            {
                                title: `I do not have access to #${chan.name}`,
                                description: `\`\`\`${err}\`\`\``,
                                footer: {
                                    text: "Role permissions were successfully changed.",
                                },
                            },
                        ],
                    });
                    return;
                }

                interaction.reply({
                    embeds: [
                        {
                            description: `Verify has been set to \`${modify}d\` \nVerify Channel: <#${chan.id}> \nVerify Role: <@&${role.id}>`,
                            footer: {
                                text: `Moderator: ${moderator}`,
                            },
                            color: "GREEN",
                        },
                    ],
                });

                return;
            } else {
                if (value === true) {
                    await db.updateOne(
                        {
                            "guild.id": interaction.guild.id,
                        },
                        {
                            $set: {
                                "guild.config.verify.status": value,
                                "guild.config.verify.channel": chan.id,
                                "guild.config.verify.role": role.id,
                            },
                        }
                    );
                    try {
                        await chan.permissionOverwrites.set([
                            {
                                id: role.id,
                                allow: "VIEW_CHANNEL",
                            },
                            {
                                id: interaction.guild.id,
                                deny: "VIEW_CHANNEL",
                            },
                        ]);
                    } catch (err) {
                        interaction.reply({
                            embeds: [
                                {
                                    title: `I can't change permissions in #${chan.name}`,
                                    description: `\`\`\`${err}\`\`\``,
                                    footer: {
                                        text: "I require the Manage Permissions role, and for my highest role to be above the verification role",
                                    },
                                },
                            ],
                        });
                        return;
                    }

                    try {
                        chan.send({
                            embeds: [
                                {
                                    description:
                                        "To verify, click this and press enter: </verify:1042262928969170944>",
                                },
                            ],
                        });
                    } catch (err) {
                        interaction.reply({
                            embeds: [
                                {
                                    title: `I do not have access to #${chan.name}`,
                                    description: `\`\`\`${err}\`\`\``,
                                    footer: {
                                        text: "Role permissions were successfully changed.",
                                    },
                                },
                            ],
                        });
                        return;
                    }

                    interaction.reply({
                        embeds: [
                            {
                                description: `Verify has been set to \`${modify}d\` \nVerify Channel: <#${chan.id}> \nVerify Role: <@&${role.id}>`,
                                footer: {
                                    text: `Moderator: ${moderator}`,
                                },
                                color: "GREEN",
                            },
                        ],
                    });
                } else if (value === false) {
                    await db.updateOne(
                        {
                            "guild.id": interaction.guild.id,
                        },
                        {
                            $set: {
                                "guild.config.verify.status": value,
                                "guild.config.verify.channel": null,
                                "guild.config.verify.role": null,
                            },
                        }
                    );
                    interaction.reply({
                        embeds: [
                            {
                                description: `Verify has been set to \`${modify}d\``,
                                footer: {
                                    text: `Moderator: ${moderator}`,
                                },
                                color: "GREEN",
                            },
                        ],
                    });
                }
            }
        } else if (chosen === "logging") {
            if (value === false) {
                if (!found) {
                    await db.insertOne({
                        guild: {
                            id: interaction.guild.id,
                            infractions: {},
                            config: {
                                automod: {
                                    status: false,
                                    warn: false,
                                },
                                verify: {
                                    status: false,
                                    channel: null,
                                    role: null,
                                },
                                logging: {
                                    status: value,
                                    channel: null,
                                    level: null,
                                },
                            },
                        },
                    });
                    interaction.reply({
                        embeds: [
                            {
                                description: `Logging has been set to \`${modify}d\``,
                                footer: {
                                    text: `Moderator: ${moderator}`,
                                },
                                color: "GREEN",
                            },
                        ],
                    });
                } else {
                    await db.updateOne(
                        {
                            "guild.id": interaction.guild.id,
                        },
                        {
                            $set: {
                                "guild.config.logging.status": value,
                                "guild.config.logging.channel": null,
                                "guild.config.logging.level": null,
                            },
                        }
                    );
                    interaction.reply({
                        embeds: [
                            {
                                description: `Logging has been set to \`${modify}d\``,
                                footer: {
                                    text: `Moderator: ${moderator}`,
                                },
                                color: "GREEN",
                            },
                        ],
                    });
                }
            } else if (value === true) {
                if (!found) {
                    await db.insertOne({
                        guild: {
                            id: interaction.guild.id,
                            infractions: {},
                            config: {
                                automod: {
                                    status: false,
                                    warn: false,
                                },
                                verify: {
                                    status: false,
                                    channel: null,
                                    role: null,
                                },
                                logging: {
                                    status: value,
                                    channel: chan.id,
                                    level: level,
                                },
                            },
                        },
                    });
                    interaction.reply({
                        embeds: [
                            {
                                description: `Logging has been set to \`${modify}d\` \nLogging Channel: <#${chan.id}> \nLogging level: ${level}`,
                                footer: {
                                    text: `Moderator: ${moderator}`,
                                },
                                color: "GREEN",
                            },
                        ],
                    });
                } else {
                    await db.updateOne(
                        {
                            "guild.id": interaction.guild.id,
                        },
                        {
                            $set: {
                                "guild.config.logging.status": value,
                                "guild.config.logging.channel": chan.id,
                                "guild.config.logging.level": level,
                            },
                        }
                    );
                    interaction.reply({
                        embeds: [
                            {
                                description: `Logging has been set to \`${modify}d\` \nLogging Channel: <#${chan.id}> \nLogging level: ${level}`,
                                footer: {
                                    text: `Moderator: ${moderator}`,
                                },
                                color: "GREEN",
                            },
                        ],
                    });
                }
            } else {
                console.log("what the fuck");
            }
        }
    },
};
