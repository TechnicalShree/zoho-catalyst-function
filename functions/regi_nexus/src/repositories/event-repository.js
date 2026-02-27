'use strict';

const catalyst = require('zcatalyst-sdk-node');
const { isSafeIdentifier } = require('../utils/validators');

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
		return `'${escapeString(value.toISOString())}'`;
	}
	if (typeof value === 'object') {
		return `'${escapeString(JSON.stringify(value))}'`;
	}
	return `'${escapeString(value)}'`;
}

function buildInsertQuery(tableName, rowData) {
	const columns = Object.keys(rowData);
	const columnSQL = columns.join(', ');
	const valueSQL = columns.map((column) => toZCQLLiteral(rowData[column])).join(', ');

	return `INSERT INTO ${tableName} (${columnSQL}) VALUES (${valueSQL})`;
}

async function insertEvent(req, tableName, eventPayload) {
	if (!isSafeIdentifier(tableName)) {
		throw new Error('Invalid table_name. Use letters, numbers, and underscores only.');
	}

	for (const column of Object.keys(eventPayload)) {
		if (!isSafeIdentifier(column)) {
			throw new Error(`Invalid column name: ${column}`);
		}
	}

	const query = buildInsertQuery(tableName, eventPayload);
	const catalystApp = catalyst.initialize(req, { scope: 'admin' });
	const zcql = catalystApp.zcql();

	return zcql.executeZCQLQuery(query);
}

module.exports = {
	insertEvent
};
