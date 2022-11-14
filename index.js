const fs=require("fs");
const chalk=require("chalk");
const {MongoClient}=require("mongodb");
const {
	Client, Collection, Intents, MessageEmbed,
}=require("discord.js");
const intents=new Intents();
require("dotenv").config();

intents.add(
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
	Intents.FLAGS.GUILD_PRESENCES,
	Intents.FLAGS.GUILD_MEMBERS,
);

const client=new Client({intents, partials: ["MESSAGE", "REACTION"], allowedMentions: {parse: ["users"]}});

client.SlashCommands=new Collection();
const commandFiles=fs.readdirSync("./slashcmds").filter((file) => file.endsWith(".js"));



const {REST}=require("@discordjs/rest");
const {Routes}=require("discord-api-types/v9");

const databaseConnect=async () => {
	const mongoClient=new MongoClient(process.env.MONGO);
	await mongoClient.connect();
	const database=mongoClient.db("Moderation");
	client.db=database;
	console.log(chalk.greenBright("Connected to the \"Moderation\" Database"));
};

const commands=[];
for (const file of commandFiles) {
	const command=require(`./slashcmds/${ file }`);
	commands.push(command.data.toJSON());
}

const rest=new REST({version: "9"}).setToken(process.env.TOKEN);
(async () => {
	try {
		console.log(chalk.yellowBright("Started refreshing application [/] commands."));

		await rest.put(
			Routes.applicationCommands("928758715505578094"),
			{body: commands},
		);
		console.log(chalk.greenBright("Successfully reloaded application [/] commands."));
	} catch (error) {
		console.error(error);
	}
})();

client.on("ready", async () => {
	client.user.setActivity("trouble 👀", {type: "LISTENING"});
	databaseConnect();
});

client.once("ready", async () => {
	for (const file of commandFiles) {
		console.log(`${ chalk.yellowBright("[SLASH COMMAND LOADED]") } ${ file }`);
	}
	console.log(chalk.greenBright("Ready!"));
});
for (const file of commandFiles) {
	const command=require(`./slashcmds/${ file }`);
	client.SlashCommands.set(command.data.name, command);
}

client.on("interactionCreate", async (interaction) => {

	const command=client.SlashCommands.get(interaction.commandName);
	if (!command) return;
	console.log(`${ chalk.yellowBright("[EVENT FIRED]") } interactionCreate with command ${ interaction.commandName }`);

	try {
		await command.execute(interaction, client);
	} catch (error) {
		console.error(error);
		interaction.reply({
			embeds: [{
				description: `An error has occurred! Message <@928624781731983380> (xWass#0001) with this information along with what command you ran: \n\`\`\`Command: ${interaction.commandName}\nError: ${ error }\`\`\``
			}],
			ephemeral: true
		});
	}
});
client.login(process.env.TOKEN);
