'use strict';

const { createEventController } = require('../controllers/create-event-controller');

async function handleCreateEventRoute(req, res) {
	await createEventController(req, res);
}

module.exports = {
	handleCreateEventRoute
};
