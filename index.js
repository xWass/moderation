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
	Intents.FLAGS.DIRECT_MESSAGES
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
	await databaseConnect();
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
				description: `An error has occurred! Message <@928624781731983380> (xWass#5848) with this information along with what command you ran: \n\`\`\`Command: ${ interaction.commandName }\nError: ${ error }\`\`\``
			}],
			ephemeral: true
		});
	}
});


const time=Math.floor((new Date()).getTime()/1000);

client.on("messageCreate", async (message) => {
	const db=await client.db.collection('Infractions');
	const automod=await db.findOne({
		'guild.id': message.guild.id,
		[`guild.config.automod`]: {
			$exists: true
		}
	});
	const logging=await db.findOne({
		'guild.id': message.guild.id,
		[`guild.config.logging`]: {
			$exists: true
		}
	});
	const chan=client.channels.cache.get(logging.guild.config.logging.channel);


	if (message.author.bot||message.channel.type==="DM") return;
	const found=await db.findOne({"guild.id": message.guild.id})||null;
	if (!found) {
		await db.insertOne({
			"guild": {
				"id": message.guild.id,
				"infractions": {
				},
				"config": {
					"automod": false,
					"verify": {
						"status": false,
						"channel": null,
						"role": null
					}
				}
			}
		});
	}

	const reg=(/\b(?:discord\.gg\/[a-zA-Z]+|(?:(?:www|canary|ptb)\.)?discord(?:app)?\.com\/invite\/[a-zA-Z]+)\b/gi);
	if (automod.guild.config.automod.status===true) {
		if (message.content.match(reg)) {
			const type="AutoMod";
			const reason="Server Advertising.";
			const moderator=client.user.tag;
			message.delete();
			if (automod.guild.config.automod.warn===true) {
				await db.updateOne({
					"guild.id": message.guild.id,
				}, {
					$push: {
						[`guild.infractions.${ [message.author.id] }`]: {type, reason, time, moderator}
					}
				});
				if (logging.guild.config.logging.status===true) {
					chan.send({
						embeds: [{
							title: `AutoMod`,
							fields: [
								{name: "Member:", value: `<@${ message.author.id }>`, inline: true},
								{name: "Reason:", value: reason, inline: true},
								{name: "Content:", value: `${ message.content }`},
								{name: "Time:", value: `<t:${ time }:f>`},
							],
							footer: {
								text: `Moderator: ${ client.user.tag }`
							},
							color: 'GREEN'
						}]
					});
				}

				try {
					await message.author.send({
						embeds: [{
							description: `You have been warned in ${ message.guild.name }.`,
							fields: [{
								name: "Reason:",
								value: reason
							}],
						}]
					});
					return;
				} catch {
					return;
				}
			}
			await message.reply({
				embeds: [{
					title: "No invites allowed!"
				}],
				ephemeral: true
			});
		}
		const badWords=['faggot', 'nigger', 'heck']; // yea this is part of the bot, get over it
		const text=message.content.toLowerCase().split(/ +/g);
		function findMatchingValues(arr1, arr2) {
			let matchingValues=[];
			for (let i=0; i<arr1.length; i++) {
				for (let j=0; j<arr2.length; j++) {
					if (arr1[i]===arr2[j]) {
						matchingValues.push(arr1[i]);
					}
				}
			}
			return matchingValues;
		}

		const found=findMatchingValues(badWords, text);
		if (found[0]!==undefined) {
			const type="AutoMod";
			const reason="Inappropriate language.";

			const moderator=client.user.tag;
			message.delete();
			if (automod.guild.config.automod.warn===true) {
				await db.updateOne({
					"guild.id": message.guild.id,
				}, {
					$push: {
						[`guild.infractions.${ [message.author.id] }`]: {type, reason, time, moderator}
					}
				});
				if (logging.guild.config.logging.status===true) {

					chan.send({
						embeds: [{
							title: `AutoMod`,
							fields: [
								{name: "Member:", value: `<@${ message.author.id }>`, inline: true},
								{name: "Reason:", value: reason, inline: true},
								{name: "Content:", value: `${ message.content }`},
								{name: "Time:", value: `<t:${ time }:f>`},
							],
							footer: {
								text: `Moderator: ${ client.user.tag }`
							},
							color: 'GREEN'
						}]
					});
				}

				try {
					await message.author.send({
						embeds: [{
							description: `You have been warned in ${ message.guild.name }.`,
							fields: [{
								name: "Reason:",
								value: reason
							}],
						}]
					});
					return;
				} catch {
					return;
				}
			}
			await message.author.send({
				embeds: [{
					title: "Watch your language!"
				}],
				ephemeral: true
			});

		}
	}
});

client.on("channelCreate", async (channel) => {
	const db=await client.db.collection('Infractions');
	const logging=await db.findOne({
		'guild.id': channel.guild.id,
		[`guild.config.logging`]: {
			$exists: true
		}
	});
	const chan=client.channels.cache.get(logging.guild.config.logging.channel);

	if (logging.guild.config.logging.level==="High") {
		chan.send({
			embeds: [{
				title: `Channel Created`,
				fields: [
					{name: "Channel:", value: `<#${ channel.id }>`, inline: true},
					{name: "Time:", value: `<t:${ time }:f>`},
				],
				footer: {
					text: `Moderator: ${ client.user.tag }`
				},
				color: 'GREEN'
			}]
		});
	}
});

client.on("channelDelete", async (channel) => {
	const db=await client.db.collection('Infractions');
	const logging=await db.findOne({
		'guild.id': channel.guild.id,
		[`guild.config.logging`]: {
			$exists: true
		}
	});
	const chan=client.channels.cache.get(logging.guild.config.logging.channel);

	if (logging.guild.config.logging.level==="High") {
		if (logging.guild.config.logging.level==="High") {
			chan.send({
				embeds: [{
					title: `Channel Deleted`,
					fields: [
						{name: "Channel:", value: `#${ channel.name }`, inline: true},
						{name: "Time:", value: `<t:${ time }:f>`},
					],
					footer: {
						text: `Moderator: ${ client.user.tag }`
					},
					color: 'GREEN'
				}]
			});
		}

	}
});
client.on("messageDelete", async (message) => {
	if (message.author.bot||message.channel.type==="DM") return;
	const db=await client.db.collection('Infractions');
	const logging=await db.findOne({
		'guild.id': message.guild.id,
		[`guild.config.logging`]: {
			$exists: true
		}
	});
	const chan=client.channels.cache.get(logging.guild.config.logging.channel);

	if (logging.guild.config.logging.level==="High") {
		chan.send({
			embeds: [{
				title: `Message Deleted`,
				fields: [
					{name: "Member", value: `${ message.author||"Unavailable" }`},
					{name: "Content:", value: `${ message.content||"Unavailable" }`, inline: true},
					{name: "Time:", value: `<t:${ time }:f>`},
				],
				footer: {
					text: `Moderator: ${ client.user.tag }`
				},
				color: 'GREEN'
			}]
		});
	}
});
client.on("messageUpdate", async (oldMessage, newMessage) => {
	if (oldMessage.author.bot||oldMessage.channel.type==="DM") return;
	const db=await client.db.collection('Infractions');
	const logging=await db.findOne({
		'guild.id': oldMessage.guild.id,
		[`guild.config.logging`]: {
			$exists: true
		}
	});
	const chan=client.channels.cache.get(logging.guild.config.logging.channel);

	if (logging.guild.config.logging.level==="High") {
		chan.send({
			embeds: [{
				title: `Message Edited`,
				fields: [
					{name: "Member", value: `${ newMessage.author||"Unavailable" }`},
					{name: "Old Content:", value: `${ oldMessage.content||"Unavailable" }`, inline: true},
					{name: "New Content:", value: `${ newMessage.content||"Unavailable" } `, inline: true},
					{name: "Time:", value: `<t:${ time }:f>`},
				],
				footer: {
					text: `Moderator: ${ client.user.tag }`
				},
				color: 'GREEN'
			}]
		});

	}
});
client.on("roleCreate", async (role) => {
	const db=await client.db.collection('Infractions');
	const logging=await db.findOne({
		'guild.id': role.guild.id,
		[`guild.config.logging`]: {
			$exists: true
		}
	});
	const chan=client.channels.cache.get(logging.guild.config.logging.channel);

	if (logging.guild.config.logging.level==="High") {
		chan.send({
			embeds: [{
				title: `Role Created`,
				fields: [
					{name: "Role:", value: `<@&${ role.id }>`},
					{name: "Time:", value: `<t:${ time }:f>`},
				],
				footer: {
					text: `Moderator: ${ client.user.tag }`
				},
				color: 'GREEN'
			}]
		});

	}
});
client.on("roleDelete", async (role) => {
	const db=await client.db.collection('Infractions');
	const logging=await db.findOne({
		'guild.id': role.guild.id,
		[`guild.config.logging`]: {
			$exists: true
		}
	});
	const chan=client.channels.cache.get(logging.guild.config.logging.channel);

	if (logging.guild.config.logging.level==="High") {
		chan.send({
			embeds: [{
				title: `Role Deleted`,
				fields: [
					{name: "Role:", value: `<@&${ role.name }>`},
					{name: "Time:", value: `<t:${ time }:f>`},
				],
				footer: {
					text: `Moderator: ${ client.user.tag }`
				},
				color: 'GREEN'
			}]
		});

	}
});
client.on("roleUpdate", async (oldRole, newRole) => {
	const db=await client.db.collection('Infractions');
	const logging=await db.findOne({
		'guild.id': oldRole.guild.id,
		[`guild.config.logging`]: {
			$exists: true
		}
	});
	const chan=client.channels.cache.get(logging.guild.config.logging.channel);

	if (logging.guild.config.logging.level==="High") {
		chan.send({
			embeds: [{
				title: `Role Updated`,
				description: "For more information, check Audit Logs",
				fields: [
					{name: "Role:", value: `<@&${ newRole.id }>`, inline: true},
					{name: "Time:", value: `<t:${ time }:f>`},
				],
				footer: {
					text: `Moderator: ${ client.user.tag }`
				},
				color: 'GREEN'
			}]
		});
	}
});
client.on("guildUpdate", async (oldGuild, newGuild) => {
	if (logging.guild.config.logging.level==="High") {
		const db=await client.db.collection('Infractions');
		const logging=await db.findOne({
			'guild.id': oldRole.guild.id,
			[`guild.config.logging`]: {
				$exists: true
			}
		});
		const chan=client.channels.cache.get(logging.guild.config.logging.channel);

		if (logging.guild.config.logging.level==="High") {
			chan.send({
				embeds: [{
					title: `Guild Updated`,
					description: "For more information, check Audit Logs",
					fields: [
						{name: "Time:", value: `<t:${ time }:f>`},
					],
					footer: {
						text: `Moderator: ${ client.user.tag }`
					},
					color: 'GREEN'
				}]
			});
		}

	}
});


client.login(process.env.TOKEN);
