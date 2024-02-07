const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageActionRow, MessageButton } = require("discord.js");
const chalk = require("chalk");
module.exports = {
    data: new SlashCommandBuilder()
        .setName("newconfig")
        .setDescription("Change bot configurations."),

    async execute(interaction, client) {
        const db = await client.db.collection("Infractions");
        console.log(
            `${chalk.greenBright(
                "[EVENT ACKNOWLEDGED]"
            )} interactionCreate with command newconfig`
        );

        const moderator = interaction.user.tag;
        const found = await db.findOne({ "guild.id": interaction.guild.id });

        if (
            !interaction.member.permissions.has("ADMINISTRATOR") ||
            !interaction.guild.members.me.permissions.has("ADMINISTRATOR")
        ) {
            interaction.reply({
                embeds: [
                    {
                        description: "You are not a moderator!",
                        footer: {
                            text: "This requires the Administrator permission.",
                        },
                    },
                ],
            });
            return;
        }

        if (!found) {
            await db.insertOne({
                guild: {
                    id: interaction.guild.id,
                    infractions: {},
                    config: {
                        automod: {
                            status: false,
                            warn: null,
                        },
                        verify: {
                            status: false,
                            channel: null,
                            role: null,
                        },
                        logging: {
                            status: false,
                            channel: null,
                            level: null,
                        },
                    },
                },
            });
        }
        const buttons = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId("verify")
                    .setLabel("Verification")
                    .setStyle("SUCCESS")
            )
            .addComponents(
                new MessageButton()
                    .setCustomId("automod")
                    .setLabel("Automod")
                    .setStyle("SUCCESS")
            )
            .addComponents(
                new MessageButton()
                    .setCustomId("logging")
                    .setLabel("Logging")
                    .setStyle("SUCCESS")
            )
            .addComponents(
                new MessageButton()
                    .setCustomId("cancel")
                    .setLabel("Cancel")
                    .setStyle("DANGER")
            );

        interaction.reply({
            embeds: [
                {
                    fields: [
                        {
                            name: "Verification",
                            value: "Select Verification to enable/modify server verification on member join.",
                            inline: true,
                        },
                        {
                            name: "Automod",
                            value: "Select Automod to enable/modify this server's automatic moderation strictness",
                            inline: true,
                        },
                        {
                            name: "Logging",
                            value: "Select logging to enable/modify this server's logging strictness.",
                            inline: true,
                        },
                    ],
                    footer: {
                        text: "Select cancel to end this interaction.",
                    },
                },
            ],
            components: [buttons],
            ephemeral: true,
        });

        const response1 = await interaction.channel
            .awaitMessageComponent({
                filter: (i) => {
                    return (
                        i.customId === "verify" ||
                        i.customId === "automod" ||
                        i.customId === "logging" ||
                        i.customId === "cancel"
                    );
                },
                time: 30_000,
            })
            .catch(() => null);

        if (response1 === null) {
            await interaction
                .editReply({
                    embeds: [
                        {
                            title: "This command has expired.",
                        },
                    ],
                    components: [],
                })
                .catch();
            return;
        }

        const automod = await db.findOne({
            "guild.id": interaction.guild.id,
            [`guild.config.automod`]: {
                $exists: true,
            },
        });
        const logging = await db.findOne({
            "guild.id": interaction.guild.id,
            [`guild.config.logging`]: {
                $exists: true,
            },
        });

        if (response1.customId === "verify") {
            interaction.editReply({
                embeds: [
                    {
                        title: "You selected Verify.",
                    },
                ],
                components: [],
            });
        }

        if (response1.customId === "automod") {
            let statusButton;
            if (automod.guild.config.automod.status === true) {
                statusButton = "Enable";
            } else {
                statusButton = "Disable";
            }

            let fresh;
            if (automod.guild.config.automod.status === true) {
                fresh = "Disable";
            } else {
                fresh = "Enable";
            }

            // FIRST SET OF BUTTONS AND HANDLING
            const firstSet = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId("Modify")
                        .setLabel("Modify")
                        .setStyle("SUCCESS")
                )
                .addComponents(
                    new MessageButton()
                        .setCustomId(fresh)
                        .setLabel(fresh)
                        .setStyle("DANGER")
                );
            interaction.editReply({
                embeds: [
                    {
                        title: `Automod is currently set to ${statusButton}d.`,
                    },
                ],
                components: [firstSet],
            });

            const freshResponse = await interaction.channel
                .awaitMessageComponent({
                    filter: (i) => {
                        return i.customId === "Modify" || i.customId === fresh;
                    },
                    time: 30_000,
                })
                .catch(() => null);

            if (freshResponse === null) {
                await interaction
                    .editReply({
                        embeds: [
                            {
                                title: "This command has expired.",
                            },
                        ],
                        components: [],
                    })
                    .catch();
                return;
            }
            if (freshResponse.customId === fresh) {
                // DB SET TO FRESH
                interaction.editReply({
                    embeds: [
                        {
                            title: "wtf",
                        },
                    ],
                    components: [],
                });
            }
        }

        if (response1.customId === "logging") {
            interaction.editReply({
                embeds: [
                    {
                        title: "You selected Logging.",
                    },
                ],
                components: [],
            });
        }
        if (response1.customId === "cancel") {
            interaction.editReply({
                embeds: [
                    {
                        title: "You cancelled this interaction.",
                    },
                ],
                components: [],
            });
            return;
        }
    },
};
