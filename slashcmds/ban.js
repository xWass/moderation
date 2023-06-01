const { SlashCommandBuilder } = require("@discordjs/builders");
const chalk = require("chalk");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription(
            "Ban a member. This also deletes the member's messages from the past hour"
        )
        .addUserOption((option) =>
            option
                .setName("member")
                .setRequired(true)
                .setDescription("The member to ban.")
        )
        .addStringOption((option) =>
            option
                .setName("reason")
                .setDescription("Reason for banning this user.")
        ),

    async execute(interaction, client) {
        const type = "Ban";
        const db = await client.db.collection("Infractions");
        console.log(
            `${chalk.greenBright(
                "[EVENT ACKNOWLEDGED]"
            )} interactionCreate with command ban`
        );
        const mem = (await interaction.options.getMember("member")) || null;
        const reason =
            (await interaction.options.getString("reason")) ||
            "No reason specified.";
        const moderator = interaction.user.tag;
        const time = Math.floor(new Date().getTime() / 1000);

        if (
            !interaction.member.permissions.has("BAN_MEMBERS") ||
            !interaction.guild.me.permissions.has("BAN_MEMBERS")
        ) {
            interaction.reply({
                embeds: [
                    {
                        description:
                            "Either you or I are missing the correct permissions (BAN_MEMBERS) to perform this action",
                        footer: {
                            text: "Check my role's permissions and make sure I have the permission to Ban Members",
                        },
                    },
                ],
                ephemeral: true,
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

        if (!mem.bannable) {
            interaction.reply({
                embeds: [
                    {
                        description:
                            "Something went wrong! Check your server's role order, or stop trying to ban the owner!",
                        footer: {
                            text: "Make sure my highest role is above whoever you are trying to ban.",
                        },
                    },
                ],
            });
            return;
        }

        try {
            await mem.ban({ deleteMessageSeconds: 3600, reason: reason });
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
                            title: `Ban`,
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
                        description: `<@${mem.id}> has been banned! \nReason: ${reason}`,
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
