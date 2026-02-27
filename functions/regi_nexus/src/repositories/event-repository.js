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
	const valueSQL = columns.map((column) => toZCQLLiteral(rowData[column])).join(', ');

	return `INSERT INTO Events (${columnSQL}) VALUES (${valueSQL})`;
}

export async function insertEvent(req, eventPayload) {
	for (const column of Object.keys(eventPayload)) {
		if (!isSafeIdentifier(column)) {
			throw new Error(`Invalid column name: ${column}`);
		}
	}

	const query = buildInsertQuery(eventPayload);
	const catalystApp = catalyst.initialize(req, { scope: 'admin' });
	const zcql = catalystApp.zcql();

	return zcql.executeZCQLQuery(query);
}

export async function selectAllEvents(req) {
	const query = `SELECT * FROM Events ORDER BY CREATEDTIME DESC`;
	const catalystApp = catalyst.initialize(req, { scope: 'admin' });
	const zcql = catalystApp.zcql();

	return zcql.executeZCQLQuery(query);
}

