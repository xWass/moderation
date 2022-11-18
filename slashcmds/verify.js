const {SlashCommandBuilder}=require("@discordjs/builders");
const {MessageAttachment}=require("discord.js");
const {createCanvas}=require("canvas");
const chalk=require("chalk");

const letters="ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789";

function generateCaptchaString() {
    let str="";

    for (let i=0; i<6; i++)
        str+=`${ letters[Math.floor(Math.random()*letters.length)] } `;

    return str;
}

function createCaptcha() {
    const ctx=createCanvas(500, 200).getContext("2d");

    ctx.fillStyle="#303434";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const captchaString=generateCaptchaString();

    ctx.font="50px Sans";
    ctx.fillStyle="white";
    ctx.textAlign="center";
    ctx.fillText(captchaString, 250, 120);

    return {captchaString, buffer: ctx.canvas.toBuffer()};
}

module.exports={
    data: new SlashCommandBuilder()
        .setName("verify")
        .setDescription("Verify yourself in a server."),
    
    async execute(interaction, client) {
        console.log(`${ chalk.greenBright("[EVENT ACKNOWLEDGED]") } interactionCreate with command infractions`);
        const db=await client.db.collection('Infractions');
        const {captchaString, buffer}=createCaptcha();
        const attachment=new MessageAttachment(buffer, "captcha.png");

        const sentMessage=await interaction.user.send({
            embeds: [{
                title: "Please type the captcha shown below.",
                image: {
                    url: `attachment://${ attachment.name }`
            },
                color: "GREEN"
            }],
            files: [attachment]
        }).catch(() => null);

        if (sentMessage===null) {
            await interaction.reply({
                content: "Your DMs are closed, please open them so I can send you the captcha.",
                ephemeral: true
            });
            return;
        }

        await interaction.reply({
            embeds: [{
                title: "Captcha has been sent to your DMs."
            }],
            ephemeral: true
        });

        const response=await sentMessage.channel
            .awaitMessages({max: 1, time: 60_000, errors: ["time"]})
            .then((collected) => collected.first())
            .catch(() => null);

        if (response===null) {
            await sentMessage.channel.send({
                embeds: [{
                    description: "You didn't respond to the captcha within 60 seconds. Please run the command again"
                }]
            });
            return;
        }
        if (response.content!==captchaString.replaceAll(" ", "")) {
            await sentMessage.channel.send({
                embeds: [{
                    description: "You didn't type the captcha correctly. Please run the command again again."
                }]
            });
            return;
        }
        sentMessage.channel.send({
            embeds: [{
                description: "You have successfully verified your account. Thanks!"
            }]
        });
        const memm=await db.findOne({
            'guild.id': interaction.guild.id,
            [`guild.config.verify.role`]: {
                $exists: true
            }
        });

        const fetch=memm.guild.config.verify.role
        const role=interaction.guild.roles.cache.find(r => r.id===fetch);
        interaction.member.roles.add(role)
    }
};
