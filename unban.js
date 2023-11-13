/** @format */

const { SlashCommandBuilder } = require("@discordjs/builders");
const chalk = require("chalk");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unban")
        .setDescription("Unban a member.")
        .addUserOption((option) =>
            option
                .setName("user")
                .setRequired(true)
                .setDescription(
                    "The user you wish to unban. (This takes IDs as well)"
                )
        )
        .addStringOption((option) =>
            option
                .setName("reason")
                .setDescription("Reason for unbanning this user.")
        ),

    async execute(interaction, client) {
        console.log(
            `${chalk.greenBright(
                "[EVENT ACKNOWLEDGED]"
            )} interactionCreate with command unban`
        );
        const users = await interaction.options.getUser("user");
        const reason =
            (await interaction.options.getString("reason")) ||
            "No reason specified.";
        const db = await client.db.collection("Infractions");
        const time = Math.floor(new Date().getTime() / 1000);

        if (
            !interaction.member.permissions.has("BAN_MEMBERS") ||
            !interaction.guild.members.me.permissions.has("BAN_MEMBERS")
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

        try {
            await interaction.guild.members.members.unban(users);
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
                            title: `Unban`,
                            fields: [
                                {
                                    name: "Member:",
                                    value: `<@${users.tag}>`,
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
                        description: `${users.tag} has been unbanned! \nReason: ${reason}`,
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
