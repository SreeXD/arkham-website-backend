const { Router } = require('express');

const { getImageByFileName, getImages, getAuthorInfo } = require('../controllers/image.js');

const routes = new Router();

routes.get('/get/:file', getImageByFileName);
routes.get('/get30', getImages);
routes.get('/author/:id', getAuthorInfo);

module.exports = routes;