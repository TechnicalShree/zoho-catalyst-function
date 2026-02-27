import { MAX_BODY_SIZE } from '../config/constants.js';

export function sendJson(res, statusCode, payload) {
	res.writeHead(statusCode, {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type'
	});
	res.end(JSON.stringify(payload));
}

export function sendHtml(res, statusCode, html) {
	res.writeHead(statusCode, {
		'Content-Type': 'text/html',
		'Access-Control-Allow-Origin': '*'
	});
	res.write(html);
	res.end();
}

export function sendCorsPreflight(res) {
	res.writeHead(204, {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type'
	});
	res.end();
}

export function readRequestBody(req) {
	return new Promise((resolve, reject) => {
		let body = '';

		req.on('data', (chunk) => {
			body += chunk;
			if (body.length > MAX_BODY_SIZE) {
				reject(new Error('Request body too large'));
				req.destroy();
			}
		});

		req.on('end', () => resolve(body));
		req.on('error', reject);
	});
}
