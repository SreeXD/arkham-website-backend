const axios = require('axios');

const Image = require('../models/Image.js');
const Attachment = require('../models/Attachment.js');

const getImageByFileName = async (req, res) => {
    try {
        const fileSplit = req.params.file.split('.');
        const readStream = Attachment.read({ filename: fileSplit[0] });

        readStream.pipe(res);
        readStream.on('error', (error) => {
            res.status(500).json({ error: error.message });
        });

        readStream.on('finish', () => {
            res.header('Content-Type', `image/${fileSplit[1]}`);
            res.status(200);
        });
    }

    catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getImages = async (req, res) => {
    try {
        const date = req.query.date ?? new Date().toISOString();
        const type = req.query.type;

        const images = await Image.find({ 
            type: type,
            date: {
                $lt: date
            }
        }).sort({ date: -1 }).limit(30);

        res.status(200).json({ images: images });
    } 

    catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAuthorInfo = async (req, res) => {
    try {
        const apiRes = await axios.get(`https://discord.com/api/v9/users/${req.params.id}`, {
            headers: {
                Authorization: `Bot ${process.env.BOT_TOKEN}`
            }
        });

        res.status(200).json(apiRes.data);
    }
    
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getImageByFileName,
    getImages,
    getAuthorInfo
};