import { MAX_BODY_SIZE } from '../config/constants.js';

export function sendJson(res, statusCode, payload) {
	res.writeHead(statusCode, {
		'Content-Type': 'application/json'
	});
	res.end(JSON.stringify(payload));
}

export function sendHtml(res, statusCode, html) {
	res.writeHead(statusCode, {
		'Content-Type': 'text/html'
	});
	res.write(html);
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
