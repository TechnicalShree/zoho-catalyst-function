import { EVENTS_TABLE_NAME } from '../config/env.js';
import { insertEvent } from '../repositories/event-repository.js';
import { createHttpError } from '../utils/errors.js';
import { isPlainObject } from '../utils/validators.js';

const EVENT_COLUMNS = new Set([
	'slug',
	'name',
	'starts_at',
	'capacity',
	'banner_object_url',
	'created_by_user_id',
	'created_at'
]);

function getCreateEventPayload(body) {
	if (isPlainObject(body.data)) {
		return body.data;
	}

	const eventBody = {};
	for (const [key, value] of Object.entries(body)) {
		if (key !== 'table_name' && key !== 'data') {
			eventBody[key] = value;
		}
	}
	return eventBody;
}

function toIsoDatetime(value, fieldName) {
	if (typeof value !== 'string') {
		throw createHttpError(400, `${fieldName} must be a valid datetime string`);
	}

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		throw createHttpError(400, `${fieldName} must be a valid datetime string`);
	}

	return parsed.toISOString();
}

function toCapacity(value) {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}

	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 0) {
		throw createHttpError(400, 'capacity must be a non-negative integer');
	}

	return parsed;
}

function slugify(value) {
	return String(value)
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function normalizeEventPayload(rawPayload) {
	const normalized = {};

	if (typeof rawPayload.name !== 'string' || !rawPayload.name.trim()) {
		throw createHttpError(400, 'name is required');
	}
	normalized.name = rawPayload.name.trim();

	const startsAtInput = rawPayload.starts_at ?? rawPayload.start_at ?? rawPayload.start_time;
	if (startsAtInput === undefined || startsAtInput === null || startsAtInput === '') {
		throw createHttpError(400, 'starts_at is required');
	}
	normalized.starts_at = toIsoDatetime(startsAtInput, 'starts_at');

	normalized.slug =
		typeof rawPayload.slug === 'string' && rawPayload.slug.trim()
			? rawPayload.slug.trim()
			: slugify(normalized.name);

	const capacity = toCapacity(rawPayload.capacity);
	if (capacity !== undefined) {
		normalized.capacity = capacity;
	}

	if (rawPayload.banner_object_url !== undefined) {
		normalized.banner_object_url = String(rawPayload.banner_object_url);
	}
	if (rawPayload.created_by_user_id !== undefined) {
		normalized.created_by_user_id = String(rawPayload.created_by_user_id);
	}
	normalized.created_at = rawPayload.created_at
		? toIsoDatetime(rawPayload.created_at, 'created_at')
		: new Date().toISOString();

	for (const column of Object.keys(normalized)) {
		if (!EVENT_COLUMNS.has(column)) {
			throw createHttpError(400, `Unsupported field: ${column}`);
		}
	}

	return normalized;
}

export async function createEvent(req, payload) {
	if (!isPlainObject(payload)) {
		throw createHttpError(400, 'Request body must be a JSON object');
	}

	const tableName = payload.table_name || EVENTS_TABLE_NAME;
	const rawEventPayload = getCreateEventPayload(payload);

	if (Object.keys(rawEventPayload).length === 0) {
		throw createHttpError(400, 'No event fields were provided for insert');
	}
	const eventPayload = normalizeEventPayload(rawEventPayload);

	try {
		const queryResult = await insertEvent(req, tableName, eventPayload);
		return {
			table: tableName,
			query_result: queryResult
		};
	} catch (error) {
		if (error.message.startsWith('Invalid table_name') || error.message.startsWith('Invalid column name')) {
			throw createHttpError(400, error.message);
		}
		throw error;
	}
}
