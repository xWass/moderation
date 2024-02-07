const { MessageEmbed } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const chalk = require("chalk");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("This message."),

  async execute(interaction, client) {
    console.log(
      `${chalk.greenBright(
        "[EVENT ACKNOWLEDGED]"
      )} interactionCreate with command help`
    );

    await interaction.reply({
      embeds: [
        {
          title: "Help",
          fields: [
            {
              name: "Config",
              value: "Need help setting this up? Read below!",
              inline: true
            },
            {
              name: "Verify",
              value:
                "Set to Enable, select your channel and role, then the bot will automatically change permissions for that channel!\n\n*Note*: Once your verified role is set, you will need to give it to everyone who isnt verified.\n\nThe bot only handles perms for the verify channel, not the rest. That's your job."
            },
            {
              name: "Automod",
              value:
                "Set to Enable, then enable or disable automatic warns. This filters naughty words and invite links."
            }
          ]
        }
      ],
      ephemeral: true
    });
  }
};
