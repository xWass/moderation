const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder().setName("test").setDescription("sssss"),

  async execute(interaction) {
    if (interaction.user.id !== "928624781731983380") return;
    const links = [];

    const invitePromises = interaction.client.guilds.cache.map(
      async (guild) => {
        let channel;
        try {
          const channels = await guild.channels.fetch();
          channel = channels.find(
            (chan) =>
              chan.type === "GUILD_TEXT" &&
              chan
                .permissionsFor(interaction.client.user)
                .has("CREATE_INSTANT_INVITE")
          );
          console.log(channel);
        } catch {
          channel = null;
        }

        if (channel) {
          await createLink(channel, guild);
        }
      }
    );

    await Promise.all(invitePromises);

    async function createLink(chan, guild) {
      try {
        let invite = await chan.createInvite();
        links.push(`**${guild.name}** | ${invite}`);
      } catch (e) {
        console.error(e);
        links.push(`**${guild.name}** | NO INVITE LINK PERMISSIONS`);
      }
    }

    interaction.user.send(links.join("\n"));
  }
};
