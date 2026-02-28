import catalyst from 'zcatalyst-sdk-node';
import { isSafeIdentifier } from '../utils/validators.js';

function escapeString(value) {
    return String(value).replace(/'/g, "''");
}

function toZCQLLiteral(value) {
    if (value === null || value === undefined) {
        return 'NULL';
    }
    if (typeof value === 'number') {
        return Number.isFinite(value) ? String(value) : 'NULL';
    }
    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }
    if (value instanceof Date) {
        const y = value.getUTCFullYear();
        const mo = String(value.getUTCMonth() + 1).padStart(2, '0');
        const d = String(value.getUTCDate()).padStart(2, '0');
        const h = String(value.getUTCHours()).padStart(2, '0');
        const mi = String(value.getUTCMinutes()).padStart(2, '0');
        const s = String(value.getUTCSeconds()).padStart(2, '0');
        return `'${y}-${mo}-${d} ${h}:${mi}:${s}'`;
    }
    if (typeof value === 'object') {
        return `'${escapeString(JSON.stringify(value))}'`;
    }
    return `'${escapeString(value)}'`;
}

function buildInsertQuery(rowData) {
    const columns = Object.keys(rowData);
    const columnSQL = columns.join(', ');
    const valueSQL = columns.map((col) => toZCQLLiteral(rowData[col])).join(', ');
    return `INSERT INTO Attendees (${columnSQL}) VALUES (${valueSQL})`;
}

/**
 * Insert a new attendee row into the Attendees table.
 * @param {object} req    - Catalyst request (used to initialize the SDK)
 * @param {object} attendeePayload - validated column → value map
 */
export async function insertAttendee(req, attendeePayload) {
    for (const column of Object.keys(attendeePayload)) {
        if (!isSafeIdentifier(column)) {
            throw new Error(`Invalid column name: ${column}`);
        }
    }

    const query = buildInsertQuery(attendeePayload);
    const catalystApp = catalyst.initialize(req, { scope: 'admin' });
    const zcql = catalystApp.zcql();

    return zcql.executeZCQLQuery(query);
}

/**
 * Fetch all attendees for a specific event (matched by event_slug).
 * @param {object} req
 * @param {string} eventSlug
 */
export async function selectAttendeesByEvent(req, eventSlug) {
    const query = `SELECT * FROM Attendees WHERE event_slug = '${escapeString(eventSlug)}' ORDER BY CREATEDTIME DESC`;
    const catalystApp = catalyst.initialize(req, { scope: 'admin' });
    const zcql = catalystApp.zcql();

    return zcql.executeZCQLQuery(query);
}

/**
 * Fetch a single attendee by their unique attendee_id.
 * @param {object} req
 * @param {string} attendeeId
 */
export async function selectAttendeeById(req, attendeeId) {
    const query = `SELECT * FROM Attendees WHERE attendee_id = '${escapeString(attendeeId)}'`;
    const catalystApp = catalyst.initialize(req, { scope: 'admin' });
    const zcql = catalystApp.zcql();

    return zcql.executeZCQLQuery(query);
}

/**
 * Check whether an email is already registered for a given event.
 * Returns the matching rows (should be 0 or 1).
 * @param {object} req
 * @param {string} eventSlug
 * @param {string} email
 */
export async function selectAttendeeByEventAndEmail(req, eventSlug, email) {
    const query = `SELECT * FROM Attendees WHERE event_slug = '${escapeString(eventSlug)}' AND email = '${escapeString(email)}'`;
    const catalystApp = catalyst.initialize(req, { scope: 'admin' });
    const zcql = catalystApp.zcql();

    return zcql.executeZCQLQuery(query);
}
