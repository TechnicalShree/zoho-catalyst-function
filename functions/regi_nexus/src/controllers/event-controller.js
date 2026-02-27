import { createEvent, getAllEvents, getEventById } from '../services/event-service.js';
import { readRequestBody, sendJson } from '../utils/http.js';

export async function eventController(req, res) {
    switch (req.method) {
        case 'GET':
            await handleGetEvents(req, res);
            return;
        case 'POST':
            await handleCreateEvent(req, res);
            return;
        default:
            sendJson(res, 405, {
                status: 'error',
                message: `Method ${req.method} not allowed. Use GET or POST on /event`
            });
    }
}

async function handleGetEvents(req, res) {
    try {
        const url = new URL(req.url || '/', 'http://localhost');
        const eventId = url.searchParams.get('id');

        let result;
        if (eventId) {
            result = await getEventById(req, eventId);
        } else {
            result = await getAllEvents(req);
        }

        sendJson(res, 200, {
            status: 'success',
            data: result.query_result
        });
    } catch (error) {
        sendJson(res, error.statusCode || 500, {
            status: 'error',
            message: 'Unable to fetch events',
            details: error.message
        });
    }
}

async function handleCreateEvent(req, res) {
    try {
        const rawBody = await readRequestBody(req);
        const payload = rawBody ? JSON.parse(rawBody) : {};
        const result = await createEvent(req, payload);

        sendJson(res, 201, {
            status: 'success',
            message: 'Event created successfully',
            data: result.query_result
        });
    } catch (error) {
        const isJsonParseError = error instanceof SyntaxError;
        sendJson(res, error.statusCode || (isJsonParseError ? 400 : 500), {
            status: 'error',
            message: isJsonParseError ? 'Invalid JSON body' : 'Unable to create event using ZCQL',
            details: error.message
        });
    }
}
