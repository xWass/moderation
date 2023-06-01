const { SlashCommandBuilder } = require("@discordjs/builders");
const chalk = require("chalk");
const ms = require("ms");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("mute")
        .setDescription("Mute a member.")
        .addUserOption((option) =>
            option
                .setName("member")
                .setRequired(true)
                .setDescription("The member to mute.")
        )
        .addStringOption((option) =>
            option
                .setName("timee")
                .setRequired(true)
                .setDescription(
                    "Time to mute for. (1m, 1h, 1d, 1w. 28 days max)"
                )
        )
        .addStringOption((option) =>
            option
                .setName("reason")
                .setDescription("Reason for muting this user.")
        ),

    async execute(interaction, client) {
        const type = "Mute";
        const db = await client.db.collection("Infractions");
        console.log(
            `${chalk.greenBright(
                "[EVENT ACKNOWLEDGED]"
            )} interactionCreate with command mute`
        );
        const mem = (await interaction.options.getMember("member")) || null;
        const reason =
            (await interaction.options.getString("reason")) ||
            "No reason specified.";
        const timee = await interaction.options.getString("timee");
        const formattedTime = ms(timee);
        const moderator = interaction.user.tag;
        const time = Math.floor(new Date().getTime() / 1000);

        if (
            !interaction.member.permissions.has("MODERATE_MEMBERS") ||
            !interaction.guild.me.permissions.has("MODERATE_MEMBERS")
        ) {
            interaction.reply({
                embeds: [
                    {
                        description:
                            "Either you or I are missing the correct permissions (MODERATE_MEMBERS) to perform this action",
                        footer: {
                            text: "Check my role's permissions and make sure I have the permission to Timeout Members",
                        },
                    },
                ],
            });
            return;
        }

        if (!mem.moderatable) {
            interaction.reply({
                embeds: [
                    {
                        description:
                            "Something went wrong! Check your server's role order, or stop trying to mute the owner!",
                        footer: {
                            text: "Make sure my highest role is above whoever you are trying to mute.",
                        },
                    },
                ],
            });
            return;
        }
        const warned = await db.findOne({ "guild.id": interaction.guild.id });
        if (!warned) {
            await db.insertOne({
                guild: {
                    id: interaction.guild.id,
                    infractions: {
                        [mem.user.id]: [{ type, reason, time, moderator }],
                    },
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
                            status: false,
                            channel: null,
                            level: null,
                        },
                    },
                },
            });
        } else {
            await db.updateOne(
                {
                    "guild.id": interaction.guild.id,
                },
                {
                    $push: {
                        [`guild.infractions.${[mem.user.id]}`]: {
                            type,
                            reason,
                            time,
                            moderator,
                        },
                    },
                }
            );
        }

        try {
            await mem.timeout(formattedTime, reason);
            const logging = await db.findOne({
                "guild.id": interaction.guild.id,
                [`guild.config.logging`]: {
                    $exists: true,
                },
            });

            if (logging.guild.config.logging.status === true) {
                const channel = client.channels.cache.get(
                    logging.guild.config.logging.channel
                );
                channel.send({
                    embeds: [
                        {
                            title: `Mute`,
                            fields: [
                                {
                                    name: "Member:",
                                    value: `<@${mem.id}>`,
                                    inline: true,
                                },
                                {
                                    name: "Reason:",
                                    value: reason,
                                    inline: true,
                                },
                                {
                                    name: "Duration:",
                                    value: timee,
                                    inline: true,
                                },
                                { name: "Time:", value: `<t:${time}:f>` },
                            ],
                            footer: {
                                text: `Moderator: ${interaction.user.tag}`,
                            },
                            color: "GREEN",
                        },
                    ],
                });
            }

            interaction.reply({
                embeds: [
                    {
                        description: `<@${mem.id}> has been muted for ${timee}! \nReason: ${reason}`,
                        footer: {
                            text: `Moderator: ${interaction.user.tag}`,
                        },
                        color: "GREEN",
                    },
                ],
            });
        } catch (err) {
            interaction.reply({
                embeds: [
                    {
                        description: `Something went very wrong. Send this error to xWass#0001! \n\`\`\`${err}\`\`\``,
                    },
                ],
            });
        }
    },
};
