'use strict';
const express = require('express'),
	mongoose = require('mongoose'),
	cors = require('cors'),
	bodyParser = require('body-parser'),
	UsersModel = require('./api/models/Users'),
	EventsModel = require('./api/models/Events'),
	RequestsModel = require('./api/models/Requests'),
	KeysModel = require('./api/models/Key'),
	BookingsModel = require('./api/models/Bookings'),
	routes = require('./api/routes/routes'),
	app = express(),
	port = process.env.PORT || 8080;



try {
	mongoose.Promise = global.Promise;
	mongoose.connect('mongodb+srv://admin:establishConnectionTo230179@bookandgo-free-cluster-oes0n.mongodb.net/mainApp?retryWrites=true', {useNewUrlParser: true});
	mongoose.set('useFindAndModify', false);
} catch(exception){
	console.log(exception);
}


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(cors());

routes(app);

app.listen(port);


console.log('Currently listening all requests on PORT ' + port);