const {SlashCommandBuilder}=require('@discordjs/builders');
const chalk=require('chalk');
module.exports={
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription("Change bot configurations.")
        .addStringOption((option) => option
            .setName("setting")
            .setRequired(true)
            .setDescription("Select a setting!")
            .addChoices(
                {name: 'Automod', value: 'Automod'},
                {name: 'Verify', value: 'Verify'},
            )
        )
        .addStringOption((option) => option
            .setName("modify")
            .setRequired(true)
            .setDescription("Enable or disable selected setting!")
            .addChoices(
                {name: 'Enable', value: 'Enable'},
                {name: 'Disable', value: 'Disable'},
            )
        ),

    async execute(interaction, client) {
        const setting=await interaction.options.getString('setting');
        const modify=await interaction.options.getString('modify');

        let value;
        if (modify==="Enable") value=true;
        if (modify==="Disable") value=false;

        const db=await client.db.collection('Infractions');
        console.log(`${ chalk.greenBright('[EVENT ACKNOWLEDGED]') } interactionCreate with command config`);
        const moderator=interaction.user.tag;

        if (!interaction.member.permissions.has('MANAGE_SERVER')||!interaction.guild.me.permissions.has('MANAGE_SERVER')) {
            interaction.reply({
                embeds: [{
                    description: "You are not a moderator!",
                    footer: {
                        text: "This requires the Manage Server permission."
                    }
                }]
            });
            return;
        }

        if (setting==="Automod") {
            const found=await db.findOne({"guild.id": interaction.guild.id});
            if (!found) {
                await db.insertOne({
                    "guild": {
                        "id": interaction.guild.id,
                        "infractions": {
                        },
                        "config": {
                            "automod": value,
                            "verify": false
                        }
                    }
                });
                interaction.reply({
                    embeds: [{
                        description: `Automod has been set to \`${ modify }d\``,
                        footer: {
                            text: `Moderator: ${ moderator }`
                        },
                        color: 'GREEN'
                    }],
                });
            } else {
                await db.updateOne({
                    "guild.id": interaction.guild.id,
                }, {
                    $set: {
                        "guild.config.automod": value // pulled from subcommand
                    }
                });
                interaction.reply({
                    embeds: [{
                        description: `Automod has been set to \`${ modify }d\``,
                        footer: {
                            text: `Moderator: ${ moderator }`
                        },
                        color: 'GREEN'
                    }],
                });
            }
        } else {
            const found=await db.findOne({"guild.id": interaction.guild.id});
            if (!found) {
                await db.insertOne({
                    "guild": {
                        "id": interaction.guild.id,
                        "infractions": {
                        },
                        "config": {
                            "automod": false,
                            "verify": value
                        }
                    }
                });
                interaction.reply({
                    embeds: [{
                        description: `Verify has been set to \`${ modify }d\``,
                        footer: {
                            text: `Moderator: ${ moderator }`
                        },
                        color: 'GREEN'
                    }],
                });

            } else {
                interaction.reply({
                    embeds: [{
                        description: `Verify has been set to \`${ modify }d\``,
                        footer: {
                            text: `Moderator: ${ moderator }`
                        },
                        color: 'GREEN'
                    }],
                });
                await db.updateOne({
                    "guild.id": interaction.guild.id,
                }, {
                    $set: {
                        "guild.config.verify": value // pulled from subcommand
                    }
                });
            }
        }
    }
};
