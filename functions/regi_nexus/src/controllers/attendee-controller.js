import {
    registerAttendee,
    getAttendeesByEvent,
    getAttendeeById
} from '../services/attendee-service.js';
import { readRequestBody, sendJson } from '../utils/http.js';
import { appendDebugLog } from '../utils/logger.js';

/**
 * Main attendee controller — routes by HTTP method.
 *
 * GET  /attendee?event_slug=<slug>         → list attendees for an event
 * GET  /attendee?attendee_id=<id>          → fetch one attendee by id
 * POST /attendee                           → register a new attendee
 */
export async function attendeeController(req, res) {
    switch (req.method) {
        case 'GET':
            await handleGetAttendees(req, res);
            return;
        case 'POST':
            await handleRegisterAttendee(req, res);
            return;
        default:
            sendJson(res, 405, {
                status: 'error',
                message: `Method ${req.method} not allowed. Use GET or POST on /attendee`
            });
    }
}

// ---------------------------------------------------------------------------
// Private handlers
// ---------------------------------------------------------------------------

async function handleGetAttendees(req, res) {
    try {
        const url = new URL(req.url || '/', 'http://localhost');
        const eventSlug = url.searchParams.get('event_slug');
        const attendeeId = url.searchParams.get('attendee_id');

        await appendDebugLog(
            `GET /attendee | event_slug=${eventSlug || '-'} attendee_id=${attendeeId || '-'}`,
            'attendee-controller'
        );

        let result;
        if (attendeeId) {
            await appendDebugLog(`Fetching attendee by id: ${attendeeId}`, 'attendee-controller');
            result = await getAttendeeById(req, attendeeId);
        } else if (eventSlug) {
            await appendDebugLog(`Fetching attendees for event: ${eventSlug}`, 'attendee-controller');
            result = await getAttendeesByEvent(req, eventSlug);
        } else {
            sendJson(res, 400, {
                status: 'error',
                message: 'Provide either event_slug or attendee_id as a query parameter'
            });
            return;
        }

        sendJson(res, 200, {
            status: 'success',
            data: result.query_result
        });
    } catch (error) {
        sendJson(res, error.statusCode || 500, {
            status: 'error',
            message: 'Unable to fetch attendee(s)',
            details: error.message
        });
    }
}

async function handleRegisterAttendee(req, res) {
    try {
        const rawBody = await readRequestBody(req);
        const payload = rawBody ? JSON.parse(rawBody) : {};

        await appendDebugLog(
            `POST /attendee | registering attendee for event: ${payload.event_slug || 'unknown'}`,
            'attendee-controller'
        );

        const result = await registerAttendee(req, payload);

        sendJson(res, 201, {
            status: 'success',
            message: 'Attendee registered successfully',
            attendee_id: result.attendee_id,
            data: result.query_result
        });
    } catch (error) {
        const isJsonParseError = error instanceof SyntaxError;
        sendJson(res, error.statusCode || (isJsonParseError ? 400 : 500), {
            status: 'error',
            message: isJsonParseError
                ? 'Invalid JSON body'
                : error.message || 'Unable to register attendee',
            details: isJsonParseError ? undefined : error.message
        });
    }
}
