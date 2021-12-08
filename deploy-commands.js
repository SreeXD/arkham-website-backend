const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const dotenv = require('dotenv');

dotenv.config();

const commands = [
        new SlashCommandBuilder().setName('set')
                .setDescription('Set art / pictures channel to sync with')
                .addStringOption(option => option.setName('type')
                        .setRequired(true)
                        .addChoice('art', '0')
                        .addChoice('pictures', '1')
                        .setDescription('whether channel is for art or pictures'))
                .addChannelOption(option => option.setName('channel')
                        .setRequired(true)
                        .setDescription('select the channel to sync with')),
                
        new SlashCommandBuilder().setName('channels')
                .setDescription('View which channels are synced for art / pictures')

].map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN);

rest.put(Routes.applicationGuildCommands(process.env.BOT_CLIENT_ID, process.env.BOT_GUILD_ID), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);