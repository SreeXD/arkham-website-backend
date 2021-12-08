const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    filename: { type: String, unique: true, index: true },
    width: Number,
    height: Number,
    date: { type: Date, index: true },
    userId: String,
    extension: String,
    url: String,
    type: Number,
});

const Image = mongoose.model('images', imageSchema);

module.exports = Image;