// this is where funi db stuff gets involved i hate it
const { SlashCommandBuilder } = require("@discordjs/builders");
const chalk = require("chalk");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Clear messages from a channel.")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setRequired(true)
        .setDescription("Amount of messages to clear.")
    ),

  async execute(interaction, client) {
    console.log(
      `${chalk.greenBright(
        "[EVENT ACKNOWLEDGED]"
      )} interactionCreate with command clear`
    );
    const amount = (await interaction.options.getInteger("amount")) || null;
    const db = await client.db.collection("Infractions");
    const time = Math.floor(new Date().getTime() / 1000);

    if (
      !interaction.member.permissions.has("MANAGE_MESSAGES") ||
      !interaction.guild.members.me.permissions.has("MANAGE_MESSAGES")
    ) {
      interaction.reply({
        embeds: [
          {
            description:
              "Either you or I are missing the correct permissions (MANAGE_MESSAGES) to perform this action",
            footer: {
              text: "Check my role's permissions and make sure I have the permission to Manage Messages"
            }
          }
        ],
        ephemeral: true
      });
      return;
    }
    try {
      let messagesDeleted = 0;
      while (messagesDeleted < amount) {
        const messagesToDelete = Math.min(amount - messagesDeleted, 100);
        await interaction.channel.bulkDelete(messagesToDelete, true);
        messagesDeleted += messagesToDelete;
      }
      const logging = await db.findOne({
        "guild.id": interaction.guild.id,
        [`guild.config.logging`]: {
          $exists: true
        }
      });

      if (logging.guild.config.logging.status === true) {
        const channel = client.channels.cache.get(
          logging.guild.config.logging.channel
        );
        channel.send({
          embeds: [
            {
              title: `Clear`,
              fields: [
                {
                  name: "Amount:",
                  value: `${amount}`,
                  inline: true
                },
                { name: "Time:", value: `<t:${time}:f>` }
              ],
              footer: {
                text: `Moderator: ${interaction.user.tag}`
              },
              color: "YELLOW"
            }
          ]
        });
      }

      interaction.reply({
        embeds: [
          {
            description: `${amount} messages cleared!`,
            footer: {
              text: `Moderator: ${interaction.user.tag}`
            },
            color: "GREEN"
          }
        ]
      });
      setTimeout(() => {
        interaction.deleteReply();
      }, 5000);
    } catch (err) {
      interaction.reply({
        embeds: [
          {
            description: `Something went very wrong. Send this error to \`xwass.\`! \n\`\`\`${err}\`\`\``
          }
        ],
        ephemeral: true
      });
    }
  }
};
