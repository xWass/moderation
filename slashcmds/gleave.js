const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("gleave")
        .setDescription("leave a guild.")
        .addStringOption((option) =>
            option
                .setName("id")
                .setDescription("guild id")
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const guilds=client.guilds.cache.map(guild => guild.id)
        console.log(guilds)
    },
};
