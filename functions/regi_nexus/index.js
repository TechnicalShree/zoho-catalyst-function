'use strict';

const { IncomingMessage, ServerResponse } = require('http');
const { handleRequest } = require('./src/app');

/**
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 */
module.exports = async (req, res) => {
	await handleRequest(req, res);
};
