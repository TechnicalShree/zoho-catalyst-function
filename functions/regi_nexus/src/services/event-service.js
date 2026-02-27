'use strict';

const { EVENTS_TABLE_NAME } = require('../config/env');
const { insertEvent } = require('../repositories/event-repository');
const { createHttpError } = require('../utils/errors');
const { isPlainObject } = require('../utils/validators');

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

async function createEvent(req, payload) {
	if (!isPlainObject(payload)) {
		throw createHttpError(400, 'Request body must be a JSON object');
	}

	const tableName = payload.table_name || EVENTS_TABLE_NAME;
	const eventPayload = getCreateEventPayload(payload);

	if (Object.keys(eventPayload).length === 0) {
		throw createHttpError(400, 'No event fields were provided for insert');
	}

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

module.exports = {
	createEvent
};
