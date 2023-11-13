// INCOMPLETE FILE
const { SlashCommandBuilder } = require("@discordjs/builders");
const chalk = require("chalk");
module.exports = {
    data: new SlashCommandBuilder()
        .setName("infractions")
        .setDescription("View a member's infractions.")
        .addUserOption((option) =>
            option
                .setName("member")
                .setRequired(true)
                .setDescription("The member whos infractions you want to view.")
        ),

    async execute(interaction, client) {
        const db = await client.db.collection("Infractions");
        console.log(
            `${chalk.greenBright(
                "[EVENT ACKNOWLEDGED]"
            )} interactionCreate with command infractions`
        );
        const mem = (await interaction.options.getMember("member")) || null;

        if (!interaction.member.permissions.has("KICK_MEMBERS")) {
            interaction.reply({
                embeds: [
                    {
                        description:
                            "You are missing the correct permissions (KICK_MEMBERS) to perform this action.",
                    },
                ],
            });
            return;
        }

        const warned = await db.findOne({ "guild.id": interaction.guild.id });
        if (!warned) {
            interaction.reply({
                embeds: [
                    {
                        title: "Nobody has been warned in this server...",
                    },
                ],
                ephemeral: true,
            });
            return;
        } else {
            const memm = await db.findOne({
                "guild.id": interaction.guild.id,
                [`guild.infractions.${mem.user.id}`]: {
                    $exists: true,
                },
            });

            if (!memm) {
                interaction.reply({
                    embeds: [
                        {
                            title: "This member has no infractions",
                        },
                    ],
                    ephemeral: true,
                });
                return;
            }
            const newArr = await memm.guild.infractions[mem.user.id]
                .map((x) => ({
                    name: `${x.type || "N/A"}`,
                    value: `Reason: ${x.reason}\nTime: <t:${x.time}:f>`,
                    inline: false,
                }))
                .reverse()
                .slice(0, 10);
            interaction.reply({
                embeds: [
                    {
                        description: `**${mem.user.tag}'s infractions:**`,
                        fields: newArr,
                        footer: {
                            text: "Limited to the 10 most recent infractions.",
                        },
                        color: "GREEN",
                    },
                ],
            });
        }
    },
};
