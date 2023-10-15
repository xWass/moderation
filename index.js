/** @format */

const fs = require("fs");
const chalk = require("chalk");
const { MongoClient } = require("mongodb");
const { Client, Collection, Intents, MessageEmbed } = require("discord.js");
const intents = new Intents();
require("dotenv").config();

intents.add(
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.GUILD_BANS
);

const client = new Client({
    intents,
    partials: ["MESSAGE", "REACTION"],
    allowedMentions: { parse: ["users"] },
});

client.SlashCommands = new Collection();
const commandFiles = fs
    .readdirSync("./slashcmds")
    .filter((file) => file.endsWith(".js"));

const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

const databaseConnect = async () => {
    const mongoClient = new MongoClient(process.env.MONGO);
    await mongoClient.connect();
    const database = mongoClient.db("Moderation");
    client.db = database;
    console.log(chalk.greenBright('Connected to the "Moderation" Database'));
};

const commands = [];
for (const file of commandFiles) {
    const command = require(`./slashcmds/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);
(async () => {
    try {
        console.log(
            chalk.yellowBright("Started refreshing application [/] commands.")
        );

        await rest.put(Routes.applicationCommands("928758715505578094"), {
            body: commands,
        });
        console.log(
            chalk.greenBright("Successfully reloaded application [/] commands.")
        );
    } catch (error) {
        console.error(error);
    }
})();

client.on("ready", async () => {
    client.user.setActivity("trouble 👀", { type: "LISTENING" });
    await databaseConnect();
});

client.once("ready", async () => {
    for (const file of commandFiles) {
        console.log(`${chalk.yellowBright("[SLASH COMMAND LOADED]")} ${file}`);
    }
    console.log(chalk.greenBright("Ready!"));
});
for (const file of commandFiles) {
    const command = require(`./slashcmds/${file}`);
    client.SlashCommands.set(command.data.name, command);
}

client.on("interactionCreate", async (interaction) => {
    const command = client.SlashCommands.get(interaction.commandName);
    if (!command) return;
    console.log(
        `${chalk.yellowBright(
            "[EVENT FIRED]"
        )} interactionCreate with command ${interaction.commandName}`
    );

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error);
        interaction.reply({
            embeds: [
                {
                    description: `An error has occurred! Message <@928624781731983380> (xwass.) with this information along with what command you ran: \n\`\`\`Command: ${interaction.commandName}\nError: ${error}\`\`\``,
                },
            ],
            ephemeral: true,
        });
    }
});

client.on("messageDelete", async (message) => {
    const time = Math.floor(new Date().getTime() / 1000);
    if (message?.author?.bot || message?.channel?.type === "DM") return;
    const db = await client.db.collection("Infractions");
    const logging = await db.findOne({
        "guild.id": message.guild.id,
        [`guild.config.logging`]: {
            $exists: true,
        },
    });
    const chan = client.channels.cache.get(
        logging.guild.config.logging.channel
    );

    if (logging.guild.config.logging.level === "Low") {
        chan.send({
            embeds: [
                {
                    title: `Message Deleted`,
                    fields: [
                        {
                            name: "Member",
                            value: `${message.author || "Unavailable"}`,
                        },
                        {
                            name: "Content:",
                            value: `${message.content || "Unavailable"}`,
                            inline: true,
                        },
                        { name: "Time:", value: `<t:${time}:f>` },
                    ],
                    color: "RED",
                },
            ],
        });
    }
});

client.on("messageUpdate", async (oldMessage, newMessage) => {
    const time = Math.floor(new Date().getTime() / 1000);
    if (oldMessage?.author?.bot || oldMessage?.channel?.type === "DM") return;
    const db = await client.db.collection("Infractions");
    const logging = await db.findOne({
        "guild.id": oldMessage.guild.id,
        [`guild.config.logging`]: {
            $exists: true,
        },
    });
    const chan = client.channels.cache.get(
        logging.guild.config.logging.channel
    );
    if (oldMessage.content === newMessage.content) return;
    if (logging.guild.config.logging.level === "Low") {
        chan.send({
            embeds: [
                {
                    title: `Message Edited`,
                    fields: [
                        {
                            name: "Member",
                            value: `${newMessage.author || "Unavailable"}`,
                        },
                        {
                            name: "Old Content:",
                            value: `${
                                oldMessage.content ||
                                "Unavailable*\n*This might have been a post with just an image."
                            }`,
                            inline: true,
                        },
                        {
                            name: "New Content:",
                            value: `${newMessage.content || "Unavailable"} `,
                            inline: true,
                        },
                        { name: "Time:", value: `<t:${time}:f>` },
                    ],
                    color: "YELLOW",
                },
            ],
        });
    }
});

client.on("guildAuditLogEntryCreate", async (auditLogEntry, guild) => {
    const db = await client.db.collection("Infractions");
    const logging = await db.findOne({
        "guild.id": guild.id,
        [`guild.config.logging`]: {
            $exists: true,
        },
    });
    const chan = client.channels.cache.get(
        logging.guild.config.logging.channel
    );
    if (logging.guild.config.logging.level === "High") {
        if (
            auditLogEntry.action === "INVITE_CREATE" ||
            auditLogEntry.action === "INVITE_DELETE"
        ) {
            try {
                const altered = auditLogEntry.action.replaceAll("_", " ");
                chan.send({
                    embeds: [
                        {
                            title: `${altered}`,
                            fields: [
                                {
                                    name: `**❯** Code`,
                                    value: `\u3000${
                                        auditLogEntry.changes[0].new ||
                                        auditLogEntry.changes[0].old
                                    }`,
                                },
                            ],
                            footer: {
                                text: `Invite created by ${auditLogEntry.executor.username}`,
                            },
                            color: "ORANGE",
                        },
                    ],
                });
            } catch {
                return;
            }
        } else {
            const changes = auditLogEntry.changes
                .map((changes) => {
                    return `**❯** ${changes.key.replaceAll(
                        "_",
                        " "
                    )}  \n \u3000 Old: ${
                        Array.isArray(changes.old)
                            ? changes.old.map((element) =>
                                  Object.entries(element)
                                      .map(
                                          ([key, value]) =>
                                              ` \n\u3000\u3000 
                                      ${key || "Unavailable"}: 
                                      ${value || "Unavailable"}`
                                      )
                                      .join(", ")
                              )
                            : `\n\u3000\u3000${changes.old || "Unavailable"}`
                    }\n \u3000 New: ${
                        Array.isArray(changes.new)
                            ? changes.new.map((element) =>
                                  Object.entries(element)
                                      .map(
                                          ([key, value]) =>
                                              ` \n\u3000\u3000 
                                      ${key || "Unavailable"}: 
                                      ${value || "Unavailable"}`
                                      )
                                      .join(", ")
                              )
                            : `\n\u3000\u3000${changes.new || "Unavailable"}`
                    }`;
                })
                .join("\n");
            const targetType = auditLogEntry.targetType;
            let x = "";
            switch (targetType) {
                case "USER":
                    x = "@";
                    break;
                case "CHANNEL":
                    x = "#";
                    break;
                case "ROLE":
                    x = "@&";
                    break;
                default:
                    x = undefined;
            }

            try {
                chan.send({
                    embeds: [
                        {
                            title: `${auditLogEntry.action}`,
                            fields: [
                                {
                                    name: `${auditLogEntry.targetType}:`,
                                    value: x
                                        ? `<${x}${auditLogEntry.targetId}>`
                                        : `${auditLogEntry.targetId ?? "None"}`,
                                },
                                {
                                    name: "Changes:",
                                    value: `${changes}`,
                                },
                            ],
                            footer: {
                                text: `Executed by ${auditLogEntry.executor.username}`,
                            },
                            color: "ORANGE",
                        },
                    ],
                });
            } catch {
                return;
            }
        }
    } else {
        return;
    }
});

client.login(process.env.TOKEN);
