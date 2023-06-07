const { SlashCommandBuilder } = require("@discordjs/builders");
const { exec, execSync } = require("child_process");

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

    async execute(interaction) {
        const guilds=client.guilds.cache.map(guild => guild.id)
        console.log(guilds)
    },
};
