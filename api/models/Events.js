'use strict';
const mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var EventSchema = new Schema({
	name: {
		type: String,
		required: "Please input a name for the event."
	},
	location: {
		type: String,
		required: "Please input the location that the event is held at."
	},
	startTime: {
		type: Date,
		required: "Please input the start time of the event."
	},
	endTime: {
		type: Date,
		required: "Please input the end time of the event."
	},
	description: {
		type: String,
		default: "Not Included"
	},
	price: {
		type: Number,
		default: 0
	},
	ticketType: {
		type: Number,
		enum: [0, 1, 2, 3, 4], //General Admission, VIP, Reserved, Multiday-pass, One-day-pass
		validate: {
			validator: function(ticketTypeInput){
				return /^[0-4]$/g.test(ticketTypeInput);
			},
			message: ticketTypeValidation => `${ticketTypeValidation.value} is not a correct value for ticketType.`
		}
	},
	thumbnail:{
		type: String,
		default: "Not Provided"
	},
	status: {
		type: Number, // this status will be based on the request,
		default: 0 // Pending when first posted! Awaits for admin's acceptance
		// status can be 0 for pending, 1 for approved, -1 for deleted/rejected
	},
	numberOfTickets: {
		type: Number,
		required: "Please enter the amount of tickets available."
	},
	promoCodes: {
		type: [{
			validUntil: Date,
			code: String,
			discountFactor: Number
		}],
		default: []
	},
	capacity: {
		type: Number,
		required: "Please enter the maximum capacity of the event!"
	},
	host: {
		type: Schema.Types.ObjectId,
		ref: 'Users'
	}
}, {timestamps: true});

module.exports = mongoose.model('Events', EventSchema);