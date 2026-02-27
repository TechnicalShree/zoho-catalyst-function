'use strict';

const { sendJson, sendHtml } = require('./utils/http');
const { handleCreateEventRoute } = require('./routes/create-event-route');
const { CREATE_EVENT_URL } = require('./config/env');

async function handleRequest(req, res) {
	const url = new URL(req.url || '/', 'http://localhost');

	switch (url.pathname) {
		case '/':
			sendHtml(
				res,
				200,
				`<h1>Hello from index.js</h1><p>POST event URL: ${CREATE_EVENT_URL}</p>`
			);
			return;
		case '/create_event':
			await handleCreateEventRoute(req, res);
			return;
		default:
			sendJson(res, 404, {
				status: 'error',
				message: 'You might find the page you are looking for at "/" path'
			});
	}
}

module.exports = {
	handleRequest
};
