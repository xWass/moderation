const { SlashCommandBuilder } = require("@discordjs/builders");
const chalk = require("chalk");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("fakeban")
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
        const mem = (await interaction.options.getMember("member")) || null;
        const reason =
            (await interaction.options.getString("reason")) ||
            "No reason specified.";
        const moderator = interaction.user.tag;
        interaction.reply({
            embeds: [
                {
                    description: `<@${mem.id}> has been banned! \nReason: ${reason}`,
                    footer: {
                        text: `Moderator: ${moderator}`,
                    },
                    color: "GREEN",
                },
            ],
        });
    },
};
