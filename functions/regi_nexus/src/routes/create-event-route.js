import { createEventController } from '../controllers/create-event-controller.js';

export async function handleCreateEventRoute(req, res) {
	await createEventController(req, res);
}
