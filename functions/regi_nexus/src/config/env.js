'use strict';

module.exports = {
	EVENTS_TABLE_NAME: process.env.EVENTS_TABLE_NAME || 'Events',
	CREATE_EVENT_URL: process.env.CREATE_EVENT_URL || 'https://catalyst-hackathon-915650487.development.catalystserverless.com/create_event'
};
