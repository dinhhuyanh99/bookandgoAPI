'use strict';
module.exports = function(app){
	const controllers = require('../controllers/controllers');
	/* Routes to controllers relating to user*/
	app.route('/user')
		.get(controllers.get_user_details)
		.post(controllers.user_login)
		.put(controllers.update_user_details);


	/* Routes to controllers relating to booking details*/
	app.route('/booking')
		.get(controllers.get_booking_details)
		.post(controllers.book_for_event)
		.delete(controllers.cancel_booking);


	/* Routes to controllers relating to event details without any API key needed*/
	app.route('/events/no_auth')
		.get(controllers.get_events_no_auth);


	/* Routes to controllers relating to event details*/
	app.route('/events')
		.get(controllers.get_event_details)
		.post(controllers.request_event_details)
		.put(controllers.modify_event_details)
		.delete(controllers.delete_event_details);


	/* Routes to controllers relating to request details*/
	app.route('/requests')
		.get(controllers.get_request_details)
		.delete(controllers.delete_request);
		


	/* Routes to controllers relating to admin's events/request information*/
	app.route('/admin/events')
		.get(controllers.get_events_and_requests)
		.put(controllers.modify_event)
		.delete(controllers.delete_events);

	/* Routes to controllers relating to admin's users management*/
	app.route('/admin/users')
		.get(controllers.get_users)
		.put(controllers.update_user_status)
		.delete(controllers.delete_user);
}