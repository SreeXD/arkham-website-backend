const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
    artChannel: String,
    picturesChannel: String
});

const Config = new mongoose.model('configuration', configSchema);

module.exports = Config;