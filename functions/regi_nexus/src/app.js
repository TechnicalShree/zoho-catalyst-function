import { API_BASE_URL } from './config/env.js';
import { handleCreateEventRoute } from './routes/create-event-route.js';
import { sendHtml, sendJson } from './utils/http.js';

export async function handleRequest(req, res) {
	const url = new URL(req.url || '/', 'http://localhost');
	const createEventUrl = `${API_BASE_URL}/event/create`;

	switch (url.pathname) {
		case '/':
			sendHtml(
				req,
				res,
				200,
				`<h1>Hello from index.js</h1><p>POST event URL: ${createEventUrl}</p>`
			);
			return;
		case '/event/create':
			await handleCreateEventRoute(req, res);
			return;
		default:
			sendJson(req, res, 404, {
				status: 'error',
				message: 'You might find the page you are looking for at "/" path'
			});
	}
}
