const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("gleave")
        .setDescription("leave a guild."),
    
    async execute(interaction, client) {
        //const guilds=client.guilds.cache.map(guild => guild.id)
        const leave=client.guilds.cache.get("645739190616719377");
        console.log(leave.name)
        await leave.leave()
        
        interaction.reply({
            embeds: [{
                title: "left bad server xd"
            }]
        })
    },
};
