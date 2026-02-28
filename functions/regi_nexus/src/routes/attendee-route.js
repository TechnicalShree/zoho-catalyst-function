import { attendeeController } from '../controllers/attendee-controller.js';

export async function handleAttendeeRoute(req, res) {
    await attendeeController(req, res);
}
