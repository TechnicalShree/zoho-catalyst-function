import { createEvent } from '../services/event-service.js';
import { readRequestBody, sendCorsPreflight, sendJson } from '../utils/http.js';

export async function createEventController(req, res) {
	if (req.method === 'OPTIONS') {
		sendCorsPreflight(req, res);
		return;
	}

	if (req.method !== 'POST') {
		sendJson(req, res, 405, {
			status: 'error',
			message: 'Method not allowed. Use POST /create_event'
		});
		return;
	}

	try {
		const rawBody = await readRequestBody(req);
		const payload = rawBody ? JSON.parse(rawBody) : {};
		const result = await createEvent(req, payload);

		sendJson(req, res, 201, {
			status: 'success',
			message: 'Event created successfully',
			table: result.table,
			query_result: result.query_result
		});
	} catch (error) {
		const isJsonParseError = error instanceof SyntaxError;
		sendJson(req, res, error.statusCode || (isJsonParseError ? 400 : 500), {
			status: 'error',
			message: isJsonParseError ? 'Invalid JSON body' : 'Unable to create event using ZCQL',
			details: error.message
		});
	}
}
