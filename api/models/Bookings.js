var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var BookingSchema = new Schema({
	eventDetails: {
		type: Schema.Types.ObjectId,
		ref: 'Events'
	},
	userDetails: {
		type: Schema.Types.ObjectId,
		ref: 'Users'
	},
	promoCodeApplied: {
		type: String
	},
	finalPrice: {
		type: Number
	}
}, {timestamps: true});

module.exports = mongoose.model('Bookings', BookingSchema);