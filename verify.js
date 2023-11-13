/** @format */

const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageAttachment } = require("discord.js");
const { createCanvas } = require("canvas");
const chalk = require("chalk");

const letters = "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("verify")
        .setDescription("Verify yourself in a server."),

    async execute(interaction, client) {
        console.log(
            `${chalk.greenBright(
                "[EVENT ACKNOWLEDGED]"
            )} interactionCreate with command verify`
        );
        const db = await client.db.collection("Infractions");
        const find = await db.findOne({
            "guild.id": interaction.guild.id,
            [`guild.config.verify.status`]: {
                $exists: true,
            },
        });
        const status = find.guild.config.verify.status;
        if (status === false) {
            interaction.reply({
                embeds: [
                    {
                        title: "This command is not enabled in this server.",
                    },
                ],
                ephemeral: true,
            });
            return;
        }
        function generateCaptchaString() {
            let str = "";

            for (let i = 0; i < 6; i++)
                str += `${
                    letters[Math.floor(Math.random() * letters.length)]
                } `;

            return str;
        }

        function createCaptcha() {
            const ctx = createCanvas(500, 200).getContext("2d");

            ctx.fillStyle = "#303434";
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            const captchaString = generateCaptchaString();

            ctx.font = "50px Sans";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(captchaString, 250, 120);

            return { captchaString, buffer: ctx.canvas.toBuffer() };
        }

        const { captchaString, buffer } = createCaptcha();
        const attachment = new MessageAttachment(buffer, "captcha.png");
        const memm = await db.findOne({
            "guild.id": interaction.guild.id,
            [`guild.config.verify.role`]: {
                $exists: true,
            },
        });

        if (interaction.channel.id !== memm.guild.config.verify.channel) {
            await interaction.reply({
                content: "This command does not work in this channel.",
                ephemeral: true,
            });
            return;
        }
        const sentMessage = await interaction.user
            .send({
                embeds: [
                    {
                        title: "Please type the captcha shown below. \nThis is case sensitive.",
                        image: {
                            url: `attachment://${attachment.name}`,
                        },
                        color: "GREEN",
                    },
                ],
                files: [attachment],
            })
            .catch(() => null);

        if (sentMessage === null) {
            await interaction.reply({
                content:
                    "Your DMs are closed, please open them so I can send you the captcha.",
                ephemeral: true,
            });
            return;
        }

        await interaction.reply({
            embeds: [
                {
                    title: "Captcha has been sent to your DMs.",
                },
            ],
            ephemeral: true,
        });

        const response = await sentMessage.channel
            .awaitMessages({ max: 1, time: 60_000, errors: ["time"] })
            .then((collected) => collected.first())
            .catch(() => null);

        if (response === null) {
            await sentMessage.channel.send({
                embeds: [
                    {
                        description:
                            "You didn't respond to the captcha within 60 seconds. Please run the command again",
                    },
                ],
            });
            return;
        }
        if (response.content !== captchaString.replaceAll(" ", "")) {
            await sentMessage.channel.send({
                embeds: [
                    {
                        description:
                            "You didn't type the captcha correctly. Please run the command again again.",
                    },
                ],
            });
            return;
        }
        sentMessage.channel.send({
            embeds: [
                {
                    description:
                        "You have successfully verified your account. Thanks!",
                },
            ],
        });

        const fetch = memm.guild.config.verify.role;
        const role = interaction.guild.roles.cache.find((r) => r.id === fetch);
        try {
            interaction.member.roles.add(role);
        } catch {
            interaction.followUp({
                embeds: [
                    {
                        title: "Role heirarchy is incorrect",
                    },
                ],
            });
        }
    },
};
