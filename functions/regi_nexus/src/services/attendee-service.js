import { v4 as uuidv4 } from 'uuid';
import {
    insertAttendee,
    selectAttendeesByEvent,
    selectAttendeeById,
    selectAttendeeByEventAndEmail
} from '../repositories/attendee-repository.js';
import { createHttpError } from '../utils/errors.js';
import { isPlainObject } from '../utils/validators.js';

// Columns that are allowed in the Attendees table.
const ATTENDEE_COLUMNS = new Set([
    'attendee_id',
    'event_slug',
    'name',
    'email',
    'phone',
    'registered_at'
]);

/**
 * Formats a Date object into Catalyst ZCQL datetime format: 'yyyy-MM-dd HH:mm:ss'.
 */
function toCatalystDatetime(date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const h = String(date.getUTCHours()).padStart(2, '0');
    const min = String(date.getUTCMinutes()).padStart(2, '0');
    const s = String(date.getUTCSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

/**
 * Normalise and validate the raw registration payload.
 * Throws an HTTP 400 error for any missing / invalid field.
 * @param {object} raw
 */
function normalizeAttendeePayload(raw) {
    const normalized = {};

    // event_slug — required
    if (typeof raw.event_slug !== 'string' || !raw.event_slug.trim()) {
        throw createHttpError(400, 'event_slug is required');
    }
    normalized.event_slug = raw.event_slug.trim();

    // name — required
    if (typeof raw.name !== 'string' || !raw.name.trim()) {
        throw createHttpError(400, 'name is required');
    }
    normalized.name = raw.name.trim();

    // email — required, basic format check
    if (typeof raw.email !== 'string' || !raw.email.trim()) {
        throw createHttpError(400, 'email is required');
    }
    const emailTrimmed = raw.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
        throw createHttpError(400, 'email is not a valid email address');
    }
    normalized.email = emailTrimmed;

    // phone — optional
    if (raw.phone !== undefined && raw.phone !== null && raw.phone !== '') {
        normalized.phone = String(raw.phone).trim();
    }

    // attendee_id — auto-generate if not provided
    normalized.attendee_id =
        typeof raw.attendee_id === 'string' && raw.attendee_id.trim()
            ? raw.attendee_id.trim()
            : uuidv4();

    // registered_at — defaults to now
    normalized.registered_at = raw.registered_at
        ? toCatalystDatetime(new Date(raw.registered_at))
        : toCatalystDatetime(new Date());

    // Guard against unexpected columns
    for (const column of Object.keys(normalized)) {
        if (!ATTENDEE_COLUMNS.has(column)) {
            throw createHttpError(400, `Unsupported field: ${column}`);
        }
    }

    return normalized;
}

/**
 * Register a new attendee for an event.
 * Prevents duplicate registrations for the same email + event combination.
 */
export async function registerAttendee(req, payload) {
    if (!isPlainObject(payload)) {
        throw createHttpError(400, 'Request body must be a JSON object');
    }

    if (Object.keys(payload).length === 0) {
        throw createHttpError(400, 'No attendee fields were provided');
    }

    const attendeePayload = normalizeAttendeePayload(payload);

    // Duplicate-registration guard
    const existing = await selectAttendeeByEventAndEmail(
        req,
        attendeePayload.event_slug,
        attendeePayload.email
    );
    if (existing && existing.length > 0) {
        throw createHttpError(
            409,
            `${attendeePayload.email} is already registered for this event`
        );
    }

    try {
        const queryResult = await insertAttendee(req, attendeePayload);
        return { attendee_id: attendeePayload.attendee_id, query_result: queryResult };
    } catch (error) {
        if (error.message && error.message.startsWith('Invalid column name')) {
            throw createHttpError(400, error.message);
        }
        throw error;
    }
}

/**
 * Return all attendees registered for a given event slug.
 */
export async function getAttendeesByEvent(req, eventSlug) {
    if (!eventSlug || typeof eventSlug !== 'string') {
        throw createHttpError(400, 'Invalid or missing event_slug');
    }
    const queryResult = await selectAttendeesByEvent(req, eventSlug);
    return { query_result: queryResult };
}

/**
 * Return a single attendee by their attendee_id.
 */
export async function getAttendeeById(req, attendeeId) {
    if (!attendeeId || typeof attendeeId !== 'string') {
        throw createHttpError(400, 'Invalid or missing attendee_id');
    }
    const queryResult = await selectAttendeeById(req, attendeeId);
    if (!queryResult || queryResult.length === 0) {
        throw createHttpError(404, 'Attendee not found');
    }
    return { query_result: queryResult };
}
