import { appendFile } from 'node:fs/promises';
import path from 'node:path';

const DEBUG_LOG_PATH = path.resolve(process.cwd(), 'debug.log');

export async function appendDebugLog(message, source = 'app') {
	const logLine = `${new Date().toISOString()} [${source}] ${message}\n`;

	try {
		await appendFile(DEBUG_LOG_PATH, logLine, 'utf8');
	} catch (error) {
		console.error(`[${source}] Failed to write debug log: ${error.message}`);
	}
}
