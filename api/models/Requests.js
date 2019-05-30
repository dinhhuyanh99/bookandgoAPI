'use strict';
const mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var RequestSchema = new Schema({
	event: {
		type: Schema.Types.ObjectId,
		ref: 'Events'
	},
	host: {
		type: Schema.Types.ObjectId,
		ref: 'Users'
	},
	reason: {
		type: String,
		required: "Please state the reason why this event is held."
	},
	status: {
		type: Number,
		enum: [-1, 0, 1],
		default: 0,
		validate: {
			validator: function(requestStatus){
				return /^-{0,1}[0,1]$/g.test(requestStatus);
			},
			message: requestResult => `${requestResult.value} is not a valid request status!`
		}
	}
}, {timestamps: true});

module.exports = mongoose.model('Requests', RequestSchema);