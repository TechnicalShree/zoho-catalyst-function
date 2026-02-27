import { eventController } from '../controllers/event-controller.js';

export async function handleEventRoute(req, res) {
    await eventController(req, res);
}
