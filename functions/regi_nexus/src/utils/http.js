import { MAX_BODY_SIZE } from '../config/constants.js';

function getCorsHeaders(req) {
	const origin = req.headers.origin || '*';
	const requestedHeaders = req.headers['access-control-request-headers'];
	const requestedMethod = req.headers['access-control-request-method'];

	return {
		'Access-Control-Allow-Origin': origin,
		'Access-Control-Allow-Methods': requestedMethod || 'POST, OPTIONS',
		'Access-Control-Allow-Headers': requestedHeaders || 'Content-Type, Authorization',
		'Access-Control-Allow-Credentials': 'true',
		'Access-Control-Max-Age': '86400',
		Vary: 'Origin'
	};
}

export function sendJson(req, res, statusCode, payload) {
	res.writeHead(statusCode, {
		'Content-Type': 'application/json',
		...getCorsHeaders(req)
	});
	res.end(JSON.stringify(payload));
}

export function sendHtml(req, res, statusCode, html) {
	res.writeHead(statusCode, {
		'Content-Type': 'text/html',
		...getCorsHeaders(req)
	});
	res.write(html);
	res.end();
}

export function sendCorsPreflight(req, res) {
	res.writeHead(204, getCorsHeaders(req));
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
