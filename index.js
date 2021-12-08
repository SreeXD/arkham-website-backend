const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const axios = require('axios');
const cors = require('cors');
const { Client, Intents, MessageEmbed, Permissions } = require('discord.js');

const Config = require('./models/Config.js');

dotenv.config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(cors());

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

mongoose.connect(process.env.CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true }, async () => {       
    const Attachment = require('./models/Attachment.js');
    const Image = require('./models/Image.js');
    const imageRoutes = require('./routes/image.js'); 

    app.use('/image', imageRoutes);
    
    const downloadImage = async (url, filename, save) => {
        try {
            const res = await axios.get(url, { responseType: 'stream' });
            const options = { filename };
        
            Attachment.write(options, res.data, async (error, file) => {    
                if (!error) await save();
            });
        }

        catch (error) { }
    };

    app.listen(process.env.PORT, () => console.log(`listening on port ${process.env.PORT}`));

    let config = await Config.findOne();
    
    if (!config) {
        config = new Config({ })
        await config.save();
    } 

    const fetchFromChannel = async (channel) => {
        const messages = await channel.messages.fetch({ limit: Number(process.env.FETCH_LIMIT) });
                
        for (let i = 0; i < messages.size; ++i) {
            const message = messages.at(i);
            let attachments = message.attachments;

            if (attachments.size) {
                for (let i = 0; i < attachments.size; ++i) {
                    let attachment = attachments.at(i);
                    let url = attachment.url;
                    let filename = attachments.keyAt(i);
                    let contentType = attachment.contentType.split('/');
                    let userId = message.author.id;
                    let date = new Date(message.createdTimestamp).toISOString();
                    let type = message.channelId == config.artChannel ? 0 : 1;
                    let width = attachment.width;
                    let height = attachment.height;
                    
                    if (contentType[0] != 'image')
                        continue;
                    
                    const save = async () => {
                        try {
                            await new Image({ 
                                filename, 
                                width,
                                height,
                                userId, 
                                type, 
                                url, 
                                extension: contentType[1],
                                date
                            }).save();
                        }
    
                        catch (error) { }
                    };
    
                    if (!(await Image.exists({ filename }))) 
                        await downloadImage(url, filename, save);
                }
            }
        }
    };

    client.on('ready', async client => {
        const channels = []
        if (config.artChannel !== undefined) channels.push(config.artChannel);
        if (config.picturesChannel !== undefined) channels.push(config.picturesChannel);

        const guild = await client.guilds.cache.get(process.env.BOT_GUILD_ID);

        for (const channelId of channels) {
            try {
                const channel = await guild.channels.fetch(channelId);
                await fetchFromChannel(channel);
            }

            catch (error) { }
        }
    });
    
    client.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) 
            return;
        
        if (interaction.commandName === 'set') {
            if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR))
                return;

            const options = interaction.options;
            const channel = options.getChannel('channel');
            const type = options.getString('type');
            
            try {
                if (type == '0') {
                    await Config.updateOne(config, { artChannel: channel.id });    
                }
                    
                else {  
                    await Config.updateOne(config, { picturesChannel: channel.id });    
                }

                config = await Config.findOne();

                await interaction.reply(`channel for syncing ${type == '0' ? 'arts' : 'pictures'} with has been set to ${channel}`);
                await fetchFromChannel(channel);
            }
            
            catch (error) { }
        }

        else if (interaction.commandName == 'channels') {
            let artChannel = null, picturesChannel = null;
            
            try {
                artChannel = await interaction.guild.channels.fetch(config.artChannel);
            }
            catch (error) { }

            try {
                picturesChannel = await interaction.guild.channels.fetch(config.picturesChannel);
            }
            catch (error) { }
            
            const embed = new MessageEmbed();
            embed.setTitle('Synced channels')
                .setColor(process.env.EMBED_COLOR)
                .setDescription('channels containing arts and pictures to sync with')
                .addField('Art', (config.artChannel && artChannel) ? artChannel.toString() : 'not set', true)
                .addField('Pictures', (config.picturesChannel && picturesChannel) ? picturesChannel.toString() : 'not set', true);

            await interaction.reply({ embeds: [embed] });
        }
    });

    client.on('messageCreate', async message => {
        if (message.channelId != config.artChannel && message.channelId != config.picturesChannel)
            return;

        let attachments = message.attachments;

        if (attachments.size) {
            for (let i = 0; i < attachments.size; ++i) {
                let attachment = attachments.at(i);
                let url = attachment.url;
                let filename = attachments.keyAt(i);
                let contentType = attachment.contentType.split('/');
                let userId = message.author.id;
                let date = new Date(message.createdTimestamp).toISOString();
                let type = message.channelId == config.artChannel ? 0 : 1;
                let width = attachment.width;
                let height = attachment.height;
                
                if (contentType[0] != 'image')
                    continue;

                const save = async () => {                    
                    try {
                        await new Image({ 
                            filename, 
                            width,
                            height,
                            userId, 
                            type, 
                            url, 
                            extension: contentType[1],
                            date
                        }).save();
                    }

                    catch (error) { }
                };

                await downloadImage(url, filename, save);
            }
        }
    });

    client.once('ready', () => console.log('discord bot is up and running'));
    client.login(process.env.BOT_TOKEN);
});