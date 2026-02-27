import cors from 'cors';
import { API_BASE_URL } from './config/env.js';
import { handleCreateEventRoute } from './routes/create-event-route.js';
import { sendHtml, sendJson } from './utils/http.js';

// Configure the cors middleware.
// This handles OPTIONS preflight automatically and sets all
// necessary Access-Control-* headers on every response.
const corsMiddleware = cors({
	origin: true, // Reflect the request origin (supports any origin)
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	credentials: true,
	maxAge: 86400 // Cache preflight for 24 hours
});

// Promisify the cors middleware so it works with async/await.
function applyCors(req, res) {
	return new Promise((resolve, reject) => {
		corsMiddleware(req, res, (err) => {
			if (err) reject(err);
			else resolve();
		});
	});
}

export async function handleRequest(req, res) {
	// Apply CORS to every request (handles OPTIONS preflight automatically).
	await applyCors(req, res);

	// If the cors middleware already handled the preflight, the response
	// is ended. Check before continuing to route.
	if (req.method === 'OPTIONS') {
		return;
	}

	const url = new URL(req.url || '/', 'http://localhost');
	const createEventUrl = `${API_BASE_URL}/event/create`;

	switch (url.pathname) {
		case '/':
			sendHtml(
				res,
				200,
				`<h1>Hello from index.js</h1><p>POST event URL: ${createEventUrl}</p>`
			);
			return;
		case '/event/create':
			await handleCreateEventRoute(req, res);
			return;
		default:
			sendJson(res, 404, {
				status: 'error',
				message: 'You might find the page you are looking for at "/" path'
			});
	}
}
