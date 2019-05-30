'use strict';
const mongoose = require('mongoose'),
	Users = mongoose.model('Users'),
	Events = mongoose.model('Events'),
	Requests = mongoose.model('Requests'),
	Keys = mongoose.model('Keys'),
	Bookings = mongoose.model('Bookings');

function passwordSolver(plainPassword){
	//Getting the length of the password - 1 (which is the final random interval used later on)
	var passwordLength = plainPassword.length - 1;
	//Parsing the final random interval back to integer to be used in generating the salt;
	var randInterval = parseInt(plainPassword.charAt(plainPassword.length - 1));

	//Initializing the new passphrase for later conversion
	var generatedPassphrase = "";

	/*Loop through the plainPassword, start pulling out characters of the plain password based on their
	corresponding position of the key from 1 to the randInterval and reorder them from 1 to 6 in this situation

	Example:
						Password is AbcDEfGh
						randInterval is 6
						=>      AbcDEfGh
								12345612
								1: AG
								2: bh
								3: c
								4: D
								5: E
								6: f
						=> The final salt is: AGbhcDEf */
	for(var passwordIterator = 0; passwordIterator <= (randInterval - 1); passwordIterator++){
		for(var saltIterator = passwordIterator; saltIterator < passwordLength; saltIterator+=randInterval){
			generatedPassphrase += plainPassword.charAt(saltIterator);
		}
	}
	// Creating 2 empty strings to contain the arbitrarised passphrase and password
	var arbitrarisedPhrase = "";

	// Start adding the ASCII equivalent of each character of the passphrase and password
	// then concatenate them into the 2 strings above
	for(var iterator = 0; iterator < passwordLength; iterator++){
		arbitrarisedPhrase += generatedPassphrase.charCodeAt(iterator);
	}

	if(arbitrarisedPhrase.length > 31){
		arbitrarisedPhrase = arbitrarisedPhrase.substr(0, 31);
	}
	arbitrarisedPhrase += randInterval.toString();

	return arbitrarisedPhrase;
}
/* ===============================================================================================

A WORD OF NOTICE, ALL OF THE FOLLOWING PATHS NEED AN API KEY TO HAVE ACCESS INTO THE PATH.
YOU CAN DO THIS BY ATTACHING THE API KEY, WHICH WAS GIVEN TO YOU AFTER SIGNING UP AND LOGGING IN,
TO THE HEADER AND USE THE ATTRIBUTE "Api-Key":

	"Api-Key": {{KEY WILL GO HERE}}
ALL OF THE REQUESTS ARE ONLY ACCEPTED IF THE Content-Type is application/json

=================================================================================================*/


// TESTED - ADDED ACTIVITY TRACKER(TESTED)
/* This is controller that is responsible for letting the user sign-in, sign-out and sign up.
The paths to the corresponding functions shall be listed below and all of the path requires HTTP
POST method with the correct information (except for sign_out)
	- /user?mode=sign_up: This is used for the new users to sign up for an account
	and have access to the system. 
	You will have to POST to the path above the following details:
		+, PersonalID
		+, Username
		+, Email
		+, Password
		+, Phone Number
		+, First name
		+, Last name
		+, Date of Birth as a string formatted with the following syntax: YYYY-MM-DD
		+, Address
		+, Gender: must be a number 0, 1 or 2 (Male, Female or Prefer not to Say)
	
	- /user?mode=sign_in: This is used for logging into the system by requiring you to POST to the path
	the username and password, which will return an API key that you will need to save in order to use
	any of the other path later on for the duration of the session that you will use the system for.
	This API key will be available for 14 days since the day you last logged in. If an API key is
	already existed in the database, the same key will always be returned to you and shall be 
	renewed after the 14-day period mentioned previously.

	- /user?mode=sign_out: This is used for the user when they want to log out and delete their API key
	from the database, preventing any unauthorised access to the system. Just put the API-key into the
	header of a POST request and send it to the server.
*/
exports.user_login = function(req, res){
	if(req._parsedUrl.query == null || req.query.mode == undefined || req.query.mode == "") {
		res.status(404).json({'errorCode': 404, 'errorMessage': "Missing 'mode' parameter in the URL, please refer back to the Documentation.", 'givenUrl': req.headers.host + req.originalUrl});
	} else if(req.query.mode == 'sign_up') {
		var randInterval = Math.floor((Math.random() * (2 - (req.body.password.length - 1))) + (req.body.password.length - 1));
		if(req.body.personalID == undefined ||
			req.body.username == undefined || req.body.username == "" ||
			req.body.email == undefined || req.body.email == "" ||
			req.body.password == undefined || req.body.password == "" ||
			req.body.phoneNumber == undefined ||
			req.body.firstName == undefined || req.body.firstName == "" ||
			req.body.lastName == undefined || req.body.lastName == "" ||
			req.body.dateOfBirth == undefined ||
			req.body.address == undefined ||
			req.body.gender == undefined){
			res.json({'errorCode': 400, 'errorMessage': "Please fill in all of the details required!"});
		} else {
			Users.find({username: req.body.username}, function(error, usersList){
				if(error){
					res.json({'errorCode': 500, 'errorMessage': err});
				} else {
					if(usersList.length > 0){
						res.json({'errorCode': 500, 'errorMessage': "User with such username has already exists in the system, please sign up with a new username!"});
					} else {
						Users.find({email: req.body.email}, function(err, docs){
							if(err) {
								res.json({'errorCode': 500, 'errorMessage': err});
							} else {
								if(docs.length > 0){
									res.json({'errorCode': 500, 'errorMessage': "User with such email has already exists in the system, please sign up with a new email!"});
								} else {

									var newUser = new Users({
										personalID: req.body.personalID,
										email: req.body.email,
										username: req.body.username,
										password: passwordSolver(req.body.password + randInterval),
										phoneNumber: req.body.phoneNumber,
										firstName: req.body.firstName,
										lastName: req.body.lastName,
										dateOfBirth: new Date(req.body.dateOfBirth),
										address: req.body.address,
										gender: req.body.gender
									});
									newUser.save().then(saved => res.json({'result': "Successfully created your account! You may now login to the system!", 'serverMessage': saved}))
									.catch(saving_err => res.json({'errorCode': 500, 'errorMessage': saving_err}));
								}
							}
						});
					}
				}
			});
		}
	} else if(req.query.mode == 'sign_in') {
		if(req.body.username == undefined || req.body.username == "" ||
			req.body.password == undefined || req.body.password == ""){
			res.json({'errorCode': 400, 'errorMessage': "Missing login details, please check again!"});
		} else {
			Users.findOne({username: req.body.username}, function(err, doc){
				if(err){
					res.json({'errorCode': 500, 'errorMessage': err});
				} else {
					if (doc == null || doc == undefined){
						res.json({'errorCode': 500, 'errorMessage': "User doesn't exist in the system!"});
					} else {
						if(doc.accountStatus == -1){
							res.status(403).json({'errorCode': 403, 'errorMessage': "Sorry but your account is deactivated, please ask the admin to reactivate your account!"});
						} else if(doc.accountStatus == -2){
							res.status(403).json({'errorCode': 403, 'errorMessage': "Sorry but your account is banned, please ask the admin to unban your account!"});
						} else if(doc.accountStatus == 1) {
							if(passwordSolver(req.body.password + doc.password.charAt(doc.password.length - 1)) == doc.password){
								Keys.find({userId: doc._id}, function(keyError, list){
									if(keyError){
										res.json({'errorCode': 500, 'errorMessage': err});
									} else {
										Users.updateOne({_id: doc._id},{$push: {activities: {activityDescription: "Logged in!"}}}, function(errorUpdatingUser, updatingResult){
											if(errorUpdatingUser){
												if(errorUpdatingUser.name == "CastError"){
													res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid user ID!"});
												} else {
													res.status(500).json({'errorCode': 500, 'errorMessage': errorUpdatingUser});
												}
											}
										});
										if(list.length == 0){
											var newKey = new Keys({
												key: undefined,
												userId: doc._id
											});
											newKey.save().then(saved => res.json({
												'result': "Successfully logged in! An API Key has been created and is valid for 14 days.",
												'apiKey': newKey.key,
												'expiredOn': newKey.expiredOn,
												'userDetails': {
													personalID: doc.personalID,
													email: doc.email,
													username: doc.username,
													phoneNumber: doc.phoneNumber,
													firstName: doc.firstName,
													lastName: doc.lastName,
													dateOfBirth: new Date(doc.dateOfBirth),
													address: doc.address,
													gender: doc.gender,
													activities: doc.activities
												}
											}))
											.catch(saving_err => res.json({'errorCode': 500, 'errorMessage': saving_err}));
										} else {
											var currentDate = new Date(Date.now());
											var currentExpiredOn;
											for(var iterator = 0; iterator < list.length; iterator++){
												currentExpiredOn = new Date(list[iterator].expiredOn);
												if(currentDate.getTime() >= currentExpiredOn.getTime()){
													if(iterator == list.length - 1){
														var newKey = new Keys({
															key: undefined,
															userId: doc._id
														});
														newKey.save().then(saved => res.json({
															'result': "Successfully logged in! An API Key has been created and is valid for 14 days.",
															'apiKey': newKey.key,
															'expiredOn': newKey.expiredOn,
															'userDetails': {
																personalID: doc.personalID,
																email: doc.email,
																username: doc.username,
																phoneNumber: doc.phoneNumber,
																firstName: doc.firstName,
																lastName: doc.lastName,
																dateOfBirth: new Date(doc.dateOfBirth),
																address: doc.address,
																gender: doc.gender
															}
														}))
														.catch(saving_err => res.json({'errorCode': 500, 'errorMessage': saving_err}));
													} else {
														continue;
													}
												} else {
													var daysLeft = new Date(currentExpiredOn - currentDate);
													daysLeft = daysLeft.getDate();
													res.json({
														'result': "Successfully logged in! Your API Key is valid for " + (daysLeft - 1) + " day(s)." ,
														'apiKey': list[iterator].key,
														'expiredOn': currentExpiredOn,
														'userDetails': {
															personalID: doc.personalID,
															email: doc.email,
															username: doc.username,
															phoneNumber: doc.phoneNumber,
															firstName: doc.firstName,
															lastName: doc.lastName,
															dateOfBirth: new Date(doc.dateOfBirth),
															address: doc.address,
															gender: doc.gender
														}
													});
													break;
												}
											}
										}
									}
								});
							} else {
								res.json({'errorCode': 500, 'errorMessage': "Sorry but it seems like the password provided is wrong!"});
							}
						} else {
							res.status(500).json({'errorCode': 500, 'errorMessage': "Account status is invalid, please contact with admin!"});
						}
					}

				}
			});
		}
	} else if(req.query.mode == 'sign_out') {
		if(req.header('Api-Key') == undefined || req.header('Api-Key') == ""){
			res.status(400).json({'errorCode': 400, 'errorMessage': "Bad request made! Please insert the API key into the headers with KEY is API-KEY and type is text/plain!"});
		} else {
			Keys.deleteOne({key: req.header('Api-Key')}, function(err, result){
				if(result.deletedCount != 1){
					res.status(500).json({'errorCode': 500, 'errorMessage': "The API key does not exist! Please check again!"});
				} else {
					res.status(200).json({'result': 'Successfully sign out!'});
				}
			});
		}
	} else {
		res.status(404).json({'errorCode': 404, 'errorMessage': "Sorry but the URL you gave does not exist", 'givenUrl': req.headers.host + req.originalUrl});
	}
}


// TESTED
/* This is the controller that is in charge of getting the user information from the database by using the
pre-existed API key. Just user a GET request with the API key in the header and let the server replied
to you with a JSON string containing all of the information you need.
The path to get the following is 
	- /user: just send a GET request with the API key in the header with the attribute "Api-Key
*/
exports.get_user_details = function(req, res){
	const APIKEY = req.header('Api-Key');
	Keys.findOne({key: APIKEY},function(error, result){
		if(error){
			res.status(500).json({'errorCode': 500, 'errorMessage': error});
		}
	}).populate('userId').lean().then((success_callback) => {
		if(success_callback != null || success_callback != undefined){
			var currentDate = new Date(Date.now());
			var expiredDate = new Date(success_callback.expiredOn);
			if((currentDate.getTime()) >= (expiredDate.getTime())){
				res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key is outdated. Please login and try again!"});
			} else {
				delete(success_callback.userId.password);
				delete(success_callback.userId.__v);
				res.status(200).json({userDetails: success_callback.userId});
			}
		} else {
			res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key not found in the server, please login and try again!"});
		}
	});	
}


// TESTED - ADDED ACTIVITY TRACKER(TESTED)
/* This is the controller that is responsible for checking the details that the user sent to the system and
see if they are valid to be used as updated details. There are 3 mode of operations for this specific path,
you can specify the detailed action by adding a query called "mode" and add either "change_password" if you
want to change the password or "deactivate" if you wish to deactivate the account (requiring an admin to
reactivate your account later on). If you didn't put the query string into the path, normally, when you
send the PUT request to the API link with the path "/user" attached with all of the "updatable" details
such as:
	- personalID
	- email
	- phoneNumber
	- firstName
	- lastName
	- dateOfBirth
	- address
	- gender
*/
exports.update_user_details = function(req, res){
	const APIKEY = req.header('Api-Key');
	Keys.findOne({key: APIKEY},function(error, result){
		if(error){
			res.status(500).json({'errorCode': 500, 'errorMessage': error});
		}
	}).then((success_callback) => {
		if(success_callback != null || success_callback != undefined){
			var currentDate = new Date(Date.now());
			var expiredDate = new Date(success_callback.expiredOn);
			if((currentDate.getTime()) >= (expiredDate.getTime())){
				res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key is outdated. Please login and try again!"});
			} else {
				if(req.query.mode == null || req.query.mode == undefined){
					if(req.body.personalID == undefined ||
						req.body.email == undefined || req.body.email == "" ||
						req.body.phoneNumber == undefined ||
						req.body.firstName == undefined || req.body.firstName == "" ||
						req.body.lastName == undefined || req.body.lastName == "" ||
						req.body.dateOfBirth == undefined ||
						req.body.address == undefined ||
						req.body.gender == undefined){
						res.json({'errorCode': 400, 'errorMessage': "Please fill in all of the updated details required!"});
					} else {
						var updatedDetails = {
							personalID: req.body.personalID,
							email: req.body.email,
							phoneNumber: req.body.phoneNumber,
							firstName: req.body.firstName,
							lastName: req.body.lastName,
							dateOfBirth: new Date(req.body.dateOfBirth),
							address: req.body.address,
							gender: req.body.gender
						};
						Users.updateOne({_id: success_callback.userId}, updatedDetails, function(errorUpdatingUser, updatingResult){
							if(errorUpdatingUser){
								if(errorUpdatingUser.name == "CastError"){
									res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid User ID! Unauthorized API key detected!"});
								} else {
									res.status(500).json({'errorCode': 500, 'errorMessage': errorUpdatingUser});
								}
							} else {
								Users.updateOne({_id: success_callback.userId},{$push: {activities: {activityDescription: "Changed user's details"}}}, function(errorUpdatingUser, updatingResult){
									if(errorUpdatingUser){
										if(errorUpdatingUser.name == "CastError"){
											res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid user ID!"});
										} else {
											res.status(500).json({'errorCode': 500, 'errorMessage': errorUpdatingUser});
										}
									} else {										
										res.status(200).json({'result': "Successfully updated user's details!"});
									}
								});
							}
						});
					}
				} else {
					if(req.query.mode != "change_password" && req.query.mode != "deactivate"){
						res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid update mode!"});
					} else {
						if(req.query.mode == "change_password"){
							if(req.body.password == null || req.body.password == undefined || req.body.password == ""){
								res.status(411).json({'errorCode': 411, 'errorMessage': "Invalid password!"});
							} else {
								var randInterval = Math.floor((Math.random() * (2 - (req.body.password.length - 1))) + (req.body.password.length - 1));
								Users.updateOne({_id: success_callback.userId}, {password: passwordSolver(req.body.password + randInterval)}, function(errorUpdatingUser, updatingResult){
									if(errorUpdatingUser){
										if(errorUpdatingUser.name == "CastError"){
											res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid User ID! Unauthorized API key detected!"});
										} else {
											res.status(500).json({'errorCode': 500, 'errorMessage': errorUpdatingUser});
										}
									} else {
										Users.updateOne({_id: success_callback.userId},{$push: {activities: {activityDescription: "Changed password"}}}, function(errorUpdatingUser, updatingResult){
											if(errorUpdatingUser){
												if(errorUpdatingUser.name == "CastError"){
													res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid user ID!"});
												} else {
													res.status(500).json({'errorCode': 500, 'errorMessage': errorUpdatingUser});
												}
											} else {
												res.status(200).json({'result': "Successfully updated user's password"});
											}
										});
									}
								});
							}
						} else {
							Users.updateOne({_id: success_callback.userId}, {accountStatus: -1}, function(errorUpdatingUser, updatingResult){
									if(errorUpdatingUser){
										if(errorUpdatingUser.name == "CastError"){
											res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid User ID! Unauthorized API key detected!"});
										} else {
											res.status(500).json({'errorCode': 500, 'errorMessage': errorUpdatingUser});
										}
									} else {
										Users.updateOne({_id: success_callback.userId},{$push: {activities: {activityDescription: "Deactivate account"}}}, function(errorUpdatingUser, updatingResult){
											if(errorUpdatingUser){
												if(errorUpdatingUser.name == "CastError"){
													res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid user ID!"});
												} else {
													res.status(500).json({'errorCode': 500, 'errorMessage': errorUpdatingUser});
												}
											} else {
												Keys.deleteMany({userId: success_callback.userId}, function(errorDeletingKeys, deletingResult){
													if(errorDeletingKeys){
														res.status(500).json({'errorCode': 500, 'errorMessage': errorDeletingKeys});
													} else {
														res.status(200).json({'result': "Successfully deactivated account! Contact admin to reactivate your account if you wish to do so!"});
													}
												});
											}
										});
									}
								});
						}
					}
				}
			}
		} else {
			res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key not found in the server, please login and try again!"});
		}
	});
}

//TESTED
/* This is the get event without authentication controller and it is used for the main index page
that the user first landed on when get into the website. This will be available on the following
path: 
					/events/no_auth
This path is available to anyone that has the link and you can pull all of the events without needing
any API key by sending a GET request to that specific path
*/
exports.get_events_no_auth = function(req, res){
	Events.find({status: 1}).populate('host').lean().exec(function(err, events_list){
		if(err){
			res.status(500).json({'errorCode': 500, 'errorMessage': err});
		} else {
			for(var i = 0; i < events_list.length; i++){
				if(events_list.length == 0){
					break;
				} else {
					delete(events_list[i]._id);
					delete(events_list[i].status);
					delete(events_list[i].promoCodes);
					delete(events_list[i].createdAt);
					delete(events_list[i].updatedAt);
					delete(events_list[i].__v);


					delete(events_list[i].host._id);
					delete(events_list[i].host.personalID);
					delete(events_list[i].host.email);
					delete(events_list[i].host.password);
					delete(events_list[i].host.phoneNumber);
					delete(events_list[i].host.dateOfBirth);
					delete(events_list[i].host.address);
					delete(events_list[i].host.gender);
					delete(events_list[i].host.activities);
					delete(events_list[i].host.registeredEvents);
					delete(events_list[i].host.accountType);
					delete(events_list[i].host.accountStatus);
					delete(events_list[i].host.createdAt);
					delete(events_list[i].host.updatedAt);
					delete(events_list[i].host.__v);
				}
			}
			res.json({'length': events_list.length, 'results': events_list});
		}
	});
}

// TESTED
/* This is the controller that is responsible for getting the events from the databases but the difference
comparing to the no authentication path is that this one requires a valid API key.
The path to pull all of the events is:
					/events
The previous path will return all of the events accepted by the admin by default. Apart from that, we also
have specific query strings if you so incline to further refine the search result(s):
	
	- /events?event_id={{event ID}}: this query will return the details of a specific event based on the given
	_id in the query string.
	
	- /events?host_id={{host ID}}: this query will return the details of all events of that specific host.
	
	- /events?sort_by={{sort string will go here}}: this query will have the following values for sorting
	depending on the needs of the caller:
		+, priceAsc: this will sort all of the events in ascending order of price
		+, priceDesc: this will sort all of the events in descending order of price
		+, numberOfTicketsAsc: this will sort all of the events in ascending order based on the number of
		tickets
		+, numberOfTicketsDesc: this will sort all of the events in descending order based on the number of
		tickets
		+, capacityAsc: this will sort all of the events in ascending order of capacity
		+, capacityDesc: this will sort all of the events in descending order of capacity
		+, capacityAsc: this will sort all of the events in ascending order of capacity
		+, capacityDesc: this will sort all of the events in descending order of capacity
		+, startSoonest: this will sort all of the events based on which one will start first
		comparing to the current date
		+, startLatest: this will sort all of the events based on which one will start later
		comparing to the current date

	- /events?host_id={{host ID}}&sort_by={{sort string will go here}}: this query will sort the events
	of a certain host. The sort_by string will be exactly similar as the one above.

*/
exports.get_event_details = function(req, res){
	const APIKEY = req.header('Api-Key');
	Keys.findOne({key: APIKEY},function(error, result){
		if(error){
			res.status(500).json({'errorCode': 500, 'errorMessage': error});
		}
	}).then((success_callback) => {
		if(success_callback != null || success_callback != undefined){
			var currentDate = new Date(Date.now());
			var expiredDate = new Date(success_callback.expiredOn);
			if((currentDate.getTime()) >= (expiredDate.getTime())){
				res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key is outdated. Please login and try again!"});
			} else {
				if(req._parsedUrl.query == null){
					// TESTED
					// Find all events which have been approved by admin
					Events.find({status: 1}).lean().exec(function(err, events_list){
						if(err){
							res.status(500).json({'errorCode': 500, 'errorMessage': err});
						} else {
							res.json({'length': events_list.length, 'results': events_list});
						}
					});
				} else {
					//TESTED
					// Return a specific event details through event_id
					if((req.query.event_id != undefined || req.query.event_id != "") && req.query.host_id == undefined && req.query.sort_by == undefined){
						Events.findOne({_id: req.query.event_id, status: 1}).lean().exec(function(err, specific_event){
							if(err){
								res.status(500).json({'errorCode': 500, 'errorMessage': err});
							} else {
								if(specific_event == undefined || specific_event == null){
									res.status(200).json({'result': "No event with such ID was found!"})
								} else {
									res.status(200).json({'event': specific_event});
								}
							}
						});
					} else if((req.query.host_id != undefined || req.query.host_id != "")&& req.query.event_id == undefined && req.query.sort_by == undefined){
						// TESTED
						// Return a list of events host by a user with such ID passed into the param/query list
						Events.find({status: 1, host: req.query.host_id}).lean().exec(function(err, events_of_host){
							if(err){
								res.status(500).json({'errorCode': 500, 'errorMessage': err});
							} else {
								res.json({'host': req.query.host_id, 'length': events_of_host.length, 'results': events_of_host});
							}
						});
					} else if((req.query.sort_by != undefined || req.query.sort_by != "") && req.query.host_id == undefined && req.query.event_id == undefined){
						if(req.query.sort_by == "priceAsc"){
							//TESTED
							// Return the events list in ascending order based on price
							Events.find({status: 1}).sort({price: 'ascending'}).lean().exec(function(err, events_list){
								if(err){
									res.status(500).json({'errorCode': 500, 'errorMessage': err});
								} else {
									res.json({'length': events_list.length, 'results': events_list});
								}
							});
						} else if(req.query.sort_by == "priceDesc"){
							//TESTED
							// Return the events list in descending order based on price 
							Events.find({status: 1}).sort({price: 'descending'}).lean().exec(function(err, events_list){
								if(err){
									res.status(500).json({'errorCode': 500, 'errorMessage': err});
								} else {
									res.json({'length': events_list.length, 'results': events_list});
								}
							});
						} else if(req.query.sort_by == "numberOfTicketsAsc"){
							//TESTED
							// Return the events list in ascending order based on number of tickets
							Events.find({status: 1}).sort({numberOfTickets: 'ascending'}).lean().exec(function(err, events_list){
								if(err){
									res.status(500).json({'errorCode': 500, 'errorMessage': err});
								} else {
									res.json({'length': events_list.length, 'results': events_list});
								}
							});
						} else if(req.query.sort_by == "numberOfTicketsDesc"){
							//TESTED
							// Return the events list in descending order based on number of tickets 
							Events.find({status: 1}).sort({numberOfTickets: 'descending'}).lean().exec(function(err, events_list){
								if(err){
									res.status(500).json({'errorCode': 500, 'errorMessage': err});
								} else {
									res.json({'length': events_list.length, 'results': events_list});
								}
							});
						} else if(req.query.sort_by == "capacityAsc"){
							//TESTED
							// Return the events list in ascending order based on capacity
							Events.find({status: 1}).sort({capacity: 'ascending'}).lean().exec(function(err, events_list){
								if(err){
									res.status(500).json({'errorCode': 500, 'errorMessage': err});
								} else {
									res.json({'length': events_list.length, 'results': events_list});
								}
							});
						} else if(req.query.sort_by == "capacityDesc"){
							//TESTED
							// Return the events list in descending order based on capacity
							Events.find({status: 1}).sort({capacity: 'descending'}).lean().exec(function(err, events_list){
								if(err){
									res.status(500).json({'errorCode': 500, 'errorMessage': err});
								} else {
									res.json({'length': events_list.length, 'results': events_list});
								}
							});
						} else if(req.query.sort_by == "startSoonest"){
							//TESTED
							// Return the events list in ascending order based on soonest starting time
							Events.find({status: 1, startTime: { $gt: currentDate}}).sort({startTime: 'ascending'}).lean().exec(function(err, events_list){
								if(err){
									res.status(500).json({'errorCode': 500, 'errorMessage': err});
								} else {
									res.json({'length': events_list.length, 'results': events_list});
								}
							});
						} else if(req.query.sort_by == "startLatest"){
							//TESTED
							// Return the events list in descending order based on latest starting time
							Events.find({status: 1, startTime: {$gt: currentDate}}).sort({startTime: 'descending'}).lean().exec(function(err, events_list){
								if(err){
									res.status(500).json({'errorCode': 500, 'errorMessage': err});
								} else {
									res.json({'length': events_list.length, 'results': events_list});
								}
							});
						} else {
							res.status(404).json({'result': "Wrong sort_by query string given, please check!"});
						}
					} else if((req.query.sort_by != undefined || req.query.sort_by != "") && (req.query.host_id != undefined || req.query.host_id != "") && req.query.event_id == undefined){
						if(req.query.sort_by == "priceAsc"){
							// TESTED
							// Return the events list in ascending order based on host and price 
							Events.find({status: 1, host: req.query.host_id}).sort({price: 'ascending'}).lean().exec(function(err, events_list){
								if(err){
									res.status(500).json({'errorCode': 500, 'errorMessage': err});
								} else {
									res.json({'length': events_list.length, 'results': events_list});
								}
							});
						} else if(req.query.sort_by == "priceDesc"){
							//TESTED
							// Return the events list in descending order based on host and price
							Events.find({status: 1, host: req.query.host_id}).sort({price: 'descending'}).lean().exec(function(err, events_list){
								if(err){
									res.status(500).json({'errorCode': 500, 'errorMessage': err});
								} else {
									res.json({'length': events_list.length, 'results': events_list});
								}
							});
						} else if(req.query.sort_by == "numberOfTicketsAsc"){
							//TESTED
							// Return the events list in ascending order based on host and number of tickets
							Events.find({status: 1, host: req.query.host_id}).sort({numberOfTickets: 'ascending'}).lean().exec(function(err, events_list){
								if(err){
									res.status(500).json({'errorCode': 500, 'errorMessage': err});
								} else {
									res.json({'length': events_list.length, 'results': events_list});
								}
							});
						} else if(req.query.sort_by == "numberOfTicketsDesc"){
							//TESTED
							// Return the events list in descending order based on host and number of tickets
							Events.find({status: 1, host: req.query.host_id}).sort({numberOfTickets: 'descending'}).lean().exec(function(err, events_list){
								if(err){
									res.status(500).json({'errorCode': 500, 'errorMessage': err});
								} else {
									res.json({'length': events_list.length, 'results': events_list});
								}
							});
						} else if(req.query.sort_by == "capacityAsc"){
							//TESTED
							// Return the events list in ascending order based on host and capacity
							Events.find({status: 1, host: req.query.host_id}).sort({capacity: 'ascending'}).lean().exec(function(err, events_list){
								if(err){
									res.status(500).json({'errorCode': 500, 'errorMessage': err});
								} else {
									res.json({'length': events_list.length, 'results': events_list});
								}
							});
						} else if(req.query.sort_by == "capacityDesc"){
							//TESTED
							// Return the events list in descending order based on host and capacity
							Events.find({status: 1, host: req.query.host_id}).sort({capacity: 'descending'}).lean().exec(function(err, events_list){
								if(err){
									res.status(500).json({'errorCode': 500, 'errorMessage': err});
								} else {
									res.json({'length': events_list.length, 'results': events_list});
								}
							});
						} else if(req.query.sort_by == "startSoonest"){
							//TESTED
							// Return the events list in ascending order based on host and start time
							Events.find({status: 1, host: req.query.host_id, startTime: {$gt: currentDate}}).sort({startTime: 'ascending'}).lean().exec(function(err, events_list){
								if(err){
									res.status(500).json({'errorCode': 500, 'errorMessage': err});
								} else {
									res.json({'length': events_list.length, 'results': events_list});
								}
							});
						} else if(req.query.sort_by == "startLatest"){
							//TESTED
							// Return the events list in descending order based on host and start time
							Events.find({status: 1, host: req.query.host_id, startTime: {$gt: currentDate}}).sort({startTime: 'descending'}).lean().exec(function(err, events_list){
								if(err){
									res.status(500).json({'errorCode': 500, 'errorMessage': err});
								} else {
									res.json({'length': events_list.length, 'results': events_list});
								}
							});
						} else {
							res.status(404).json({'result': "Wrong sort_by query string given, please check!"});
						}
					} else {
						res.status(404).json({'result': "Wrong path given! Please check again with the documentation"});
					}					
				}
			}
		} else {
			res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key not found in the server, please login and try again!"});
		}
	});
}


// TESTED - ADDED ACTIVITY TRACKER(TESTED)
/* This is the controller that is responsible for handling request for new events sent in by registered users.
An event will need to have the following details:
	- name: the name of the event
	- location: the location where the event is held at
	- startTime: the starting time of the event, the string format that you want to sent is
	- endTime: the ending time of the event, which can help the user knows when it ends to schedule
	there own works
	- description: the description of the event
	- price: price of the event per ticket
	- ticketType: the type of ticket, this can be any of the following:
		+, 0: General Admission, which is the default ticketType
		+, 1: VIP
		+, 2: Reserved
		+, 3: Multiday-pass
		+, 4: Oneday-pass
	- thumbnail: the thumbnail of the event, which will work in conjunction with the API given by imgur
	- status: the status of the event, which will change according to the status of the request that is attached
	to the event
	- numberOfTickets: the number of tickets available for the event
	- promoCodes: this is going to be an array containing multiple promocodes if that suits the users personal needs.
		+, validUntil: the valid date of the promocode
		+, code: the code itself
		+, discountFactor: the amount of money that the user can save by using the specific code.
	- capacity: the capacity of the event, can be known as the maximum number of people that the event's avenue can
	take
	- host: this is the host id, which will reference the user that posted the event request before
	- reason: this is a part of the request, which will explain to the admin why do they want to hold such event
	at the Univeristy of Wollongong or on behalf of the University of Wollongong.
*/
exports.request_event_details = function(req, res){
	const APIKEY = req.header('Api-Key');
	Keys.findOne({key: APIKEY},function(error, result){
		if(error){
			res.status(500).json({'errorCode': 500, 'errorMessage': error});
		}
	}).then((success_callback) => {
		if(success_callback != null || success_callback != undefined){
			var currentDate = new Date(Date.now());
			var expiredDate = new Date(success_callback.expiredOn);
			if((currentDate.getTime()) >= (expiredDate.getTime())){
				res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key is outdated. Please login and try again!"});
			} else {
				if(req.body.name == undefined || req.body.name == ""||
					req.body.location == undefined || req.body.location == ""||
					req.body.startTime == undefined || req.body.startTime == ""||
					req.body.endTime == undefined || req.body.endTime == ""||
					req.body.thumbnail == undefined || req.body.thumbnail == ""||
					req.body.price == undefined || req.body.price == null ||
					req.body.ticketType == undefined || req.body.ticketType == null||
					req.body.numberOfTickets == undefined || req.body.numberOfTickets == null||
					req.body.capacity == undefined || req.body.capacity == null||
					req.body.reason == undefined || req.body.reason == "" ||
					req.body.description == undefined || req.body.description == ""){

					res.json({'errorCode': 400, 'errorMessage': "Please fill in all of the details required!"});
				} else {
					var promoCodesList = [];
					if(req.body.promoCodes.length > 0 || req.body.promoCodes !=  undefined ||
						req.body.promoCodes !=  null || req.body.promoCodes != ""){
						for(var i = 0; i < req.body.promoCodes.length; i++){
							if(req.body.promoCodes[i].validUntil == undefined || req.body.promoCodes[i].validUntil == "" || req.body.promoCodes[i].validUntil ==  null ||
								req.body.promoCodes[i].code == undefined || req.body.promoCodes[i].code == "" || req.body.promoCodes[i].code ==  null ||
								eq.body.promoCodes[i].discountFactor == undefined || req.body.promoCodes[i].discountFactor == "" || req.body.promoCodes[i].discountFactor ==  null){

								continue;
							} else {	
								var newPromoCode = {
									validUntil: new Date(req.body.promoCodes[i].validUntil),
									code: req.body.promoCodes[i].code,
									discountFactor: req.body.promoCodes[i].discountFactor
								};
								promoCodesList.push(newPromoCode);
							}
						}
					}

					var newEvent = new Events({
						name: req.body.name,
						location: req.body.location,
						startTime: new Date(req.body.startTime),
						endTime: new Date(req.body.endTime),
						thumbnail: req.body.thumbnail,
						price: req.body.price,
						ticketType: req.body.ticketType,
						numberOfTickets: req.body.numberOfTickets,
						capacity: req.body.capacity,
						description: req.body.description,
						promoCodes: promoCodesList,
						host: success_callback.userId
					});
					var newRequest = new Requests({
						event: newEvent._id,
						host: success_callback.userId,
						reason: req.body.reason
					});
					newEvent.save(function(event_saving_err){
						if(event_saving_err){
							res.status(500).json({'errorCode': 500, 'errorMessage': event_saving_err});
						} else {
							newRequest.save(function(request_saving_err){
								if(request_saving_err){
									res.status(500).json({'errorCode': 500, 'errorMessage': request_saving_err});
								} else {
									Users.updateOne({_id: success_callback.userId},{$push: {activities: {activityDescription: "Request for event " + newEvent._id}}}, function(errorUpdatingUser, updatingResult){
										if(errorUpdatingUser){
											if(errorUpdatingUser.name == "CastError"){
												res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid user ID!"});
											} else {
												res.status(500).json({'errorCode': 500, 'errorMessage': errorUpdatingUser});
											}
										} else {
											res.status(200).json({'result': "Successfully request an event, please check back and see if the admin approves the event."})
										}
									});
								}
							});
						}
					});
				}
			}
		} else {
			res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key not found in the server, please login and try again!"});
		}
	});
}


// TESTED - ADDED ACTIVITY TRACKER(TESTED)
/* This is the controller that will handle the PUT requests that are sent in by the user and modify the event's
details into the new one, the user can do this before and after the acceptance from the admin.*/
exports.modify_event_details = function(req, res){
	const APIKEY = req.header('Api-Key');
	Keys.findOne({key: APIKEY},function(error, result){
		if(error){
			res.status(500).json({'errorCode': 500, 'errorMessage': error});
		}
	}).then((success_callback) => {
		if(success_callback != null || success_callback != undefined){
			var currentDate = new Date(Date.now());
			var expiredDate = new Date(success_callback.expiredOn);
			if((currentDate.getTime()) >= (expiredDate.getTime())){
				res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key is outdated. Please login and try again!"});
			} else {
				if(req._parsedUrl.query == null || req._parsedUrl.query == null || req.query.event_id == ""){
					res.status(411).json({'errorCode': 411, 'errorMessage': "Please provide the event_id you want to update!"});
				} else {
					if(req.query.event_id != undefined || req.query.event_id != null || req.query.event_id != ""){
						Events.findOne({_id: req.query.event_id, host: success_callback.userId}, function(errorFindingEvent, findingEventResult){
							if(errorFindingEvent){
								if(errorFindingEvent.name == "CastError"){
									res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid event_id"});
								} else {
									res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingEvent});
								}
							} else {
								if(findingEventResult == null || findingEventResult == undefined){
									res.status(404).json({'errorCode': 404, 'errorMessage': "Event ID not found or you are not the host!"});
								} else {
									if(req.body.name == undefined || req.body.name == ""||
										req.body.location == undefined || req.body.location == ""||
										req.body.startTime == undefined || req.body.startTime == ""||
										req.body.endTime == undefined || req.body.endTime == ""||
										req.body.thumbnail == undefined || req.body.thumbnail == ""||
										req.body.price == undefined || req.body.price == null ||
										req.body.ticketType == undefined || req.body.ticketType == null||
										req.body.numberOfTickets == undefined || req.body.numberOfTickets == null||
										req.body.capacity == undefined || req.body.capacity == null||
										req.body.description == undefined || req.body.description == ""){

										res.json({'errorCode': 400, 'errorMessage': "Please fill in all of the details required!"});
									} else {
										var promoCodesList = [];
										if(req.body.promoCodes.length > 0 || req.body.promoCodes !=  undefined ||
											req.body.promoCodes !=  null || req.body.promoCodes != ""){
											for(var i = 0; i < req.body.promoCodes.length; i++){
												if(req.body.promoCodes[i].validUntil == undefined || req.body.promoCodes[i].validUntil == "" || req.body.promoCodes[i].validUntil ==  null ||
													req.body.promoCodes[i].code == undefined || req.body.promoCodes[i].code == "" || req.body.promoCodes[i].code ==  null ||
													req.body.promoCodes[i].discountFactor == undefined || req.body.promoCodes[i].discountFactor == "" || req.body.promoCodes[i].discountFactor ==  null){

													continue;
												} else {	
													var newPromoCode = {
														validUntil: new Date(req.body.promoCodes[i].validUntil),
														code: req.body.promoCodes[i].code,
														discountFactor: req.body.promoCodes[i].discountFactor
													};
													promoCodesList.push(newPromoCode);
												}
											}
										}
										var updatedDetails = {
											name: req.body.name,
											location: req.body.location,
											startTime: new Date(req.body.startTime),
											endTime: new Date(req.body.endTime),
											thumbnail: req.body.thumbnail,
											price: req.body.price,
											ticketType: req.body.ticketType,
											numberOfTickets: req.body.numberOfTickets,
											capacity: req.body.capacity,
											description: req.body.description,
											promoCodes: promoCodesList
										};
										Events.updateOne({_id: req.query.event_id}, updatedDetails, function(event_updating_err, update_result){
											if(event_updating_err){
												res.status(500).json({'errorCode': 500, 'errorMessage': event_updating_err});
											} else {
												Users.updateOne({_id: success_callback.userId},{$push: {activities: {activityDescription: "Modified event " + req.query.event_id}}}, function(errorUpdatingUser, updatingResult){
													if(errorUpdatingUser){
														if(errorUpdatingUser.name == "CastError"){
															res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid user ID!"});
														} else {
															res.status(500).json({'errorCode': 500, 'errorMessage': errorUpdatingUser});
														}
													} else {
														res.status(200).json({'serverMessage': "Successfully updated event details!", 'result': updatedDetails})
													}
												});
											}
										});
									}
								}
							}
						});
					} else {
						res.status(411).json({'errorCode': 411, 'errorMessage': "Please provide the event_id you want to update!"});
					}
				}
			}
		} else {
			res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key not found in the server, please login and try again!"});
		}
	});
}


// TESTED - ADDED ACTIVITY TRACKER(TESTED)
/* This controller will handle the DELETE request that is sent in by the user to delete a specific event from the
system. There are 2 modes of operation: single and multiple. The path of the request should look as follows:
	/events?mode={{mode of delete in here}}
	
	- single: only delete a single event out of the database. For this to happen, the user must pass in the ID
	of the event they want to delete by adhering the id of the event to the attribute event_id and  attach it
	to the query string:
		/events?mode=single&event_id={{event id will go here}}

	- multiple: this option is for people who want to batch-delete events. In order to do this, the user needs
	to send a DELETE request with a body containing the following information regarding the events they want to
	delete:
		/events?mode=multiple

		with a body containing the following information in JSON format
			{
				"deleteList": ["eventID1", "eventID2", ...]
			}

*/
exports.delete_event_details = function(req, res){
	const APIKEY = req.header('Api-Key');
	const MODE = req.query.mode;
	Keys.findOne({key: APIKEY},function(error, result){
		if(error){
			res.status(500).json({'errorCode': 500, 'errorMessage': error});
		}
	}).then((success_callback) => {
		if(success_callback != null || success_callback != undefined){
			var currentDate = new Date(Date.now());
			var expiredDate = new Date(success_callback.expiredOn);
			if((currentDate.getTime()) >= (expiredDate.getTime())){
				res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key is outdated. Please login and try again!"});
			} else {
				if(MODE == "single"){
					if(req.query.event_id == undefined || req.query.event_id == ""){
						req.status(411).json({'errorCode': 411, 'errorMessage': "Please append the event_id to the query string!"})
					} else {
						Events.updateOne({_id: req.query.event_id}, {status: -1}, function(err, delete_result){
							if(err){
								res.status(500).json({'errorCode': 500, 'errorMessage': err});
							} else {
								Users.updateOne({_id: success_callback.userId},{$push: {activities: {activityDescription: "Deleted event " + req.query.event_id}}}, function(errorUpdatingUser, updatingResult){
									if(errorUpdatingUser){
										if(errorUpdatingUser.name == "CastError"){
											res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid user ID!"});
										} else {
											res.status(500).json({'errorCode': 500, 'errorMessage': errorUpdatingUser});
										}
									} else {
										res.status(200).json({'result': "Successfully deleted the event"});
									}
								});
							}
						});
					}
				} else if(MODE == "multiple"){
					if(req.body.deleteList == undefined || req.body.deleteList == "" || req.body.deleteList == [] || req.body.deleteList.length == 0){
						req.status(500).json({'errorCode': 411, 'errorMessage': "Please append all the event_id you want to delete to the body of the request!"})
					} else {
						Events.updateMany({_id: {$in: req.body.deleteList}}, {status: -1}, function(err, delete_result){
							if(err){
								res.status(500).json({'errorCode': 500, 'errorMessage': err});
							} else {
								Users.updateOne({_id: success_callback.userId},{$push: {activities: {activityDescription: "Delete multiple events"}}}, function(errorUpdatingUser, updatingResult){
									if(errorUpdatingUser){
										if(errorUpdatingUser.name == "CastError"){
											res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid user ID!"});
										} else {
											res.status(500).json({'errorCode': 500, 'errorMessage': errorUpdatingUser});
										}
									} else {
										res.status(200).json({'result': "Successfully deleted all events"});
									}
								});
							}
						});
					}
				} else {
					res.status(411).json({'errorCode': 411, 'errorMessage': "Invalid delete mode passed to query string, please check again!"});
				}
			}
		} else {
			res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key not found in the server, please login and try again!"});
		}
	});
}


// TESTED
/* This controller is responsible for handling the GET request that is sent in through the path /requests to get
the details of one/all request(s) that the user has made before from the latest to the oldest.
Just send a GET request to the path:
	/requests: if the user want to get all of their requests
	/requests?request_id={{the request ID will be here}}: if the user want to get a specific event's request
*/
exports.get_request_details = function(req, res){
	const APIKEY = req.header('Api-Key');
	Keys.findOne({key: APIKEY},function(error, result){
		if(error){
			res.status(500).json({'errorCode': 500, 'errorMessage': error});
		}
	}).then((success_callback) => {
		if(success_callback != null || success_callback != undefined){
			var currentDate = new Date(Date.now());
			var expiredDate = new Date(success_callback.expiredOn);
			if((currentDate.getTime()) >= (expiredDate.getTime())){
				res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key is outdated. Please login and try again!"});
			} else {
				if(req._parsedUrl.query == null || req._parsedUrl.query == undefined){
					Requests.find({host: success_callback.userId}).sort({createdAt: 'descending'}).populate('event').exec(function(errorFindingRequests, resultList){
						if(errorFindingRequests){
							res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingRequests});
						} else {
							res.status(200).json({'length': resultList.length, 'results': resultList});
						}
					});
				} else {
					if(req.query.request_id == undefined || req.query.request_id == null || req.query.request_id == ""){
						res.status(411).json({'errorCode': 411, 'errorMessage': "Please append the request_id to the query string!"})
					} else {
						Requests.findOne({_id: req.query.request_id}).populate('event').exec(function(errorFindingRequest, requestCallBack){
							if(errorFindingRequest){
								if(errorFindingRequest.name == "CastError"){
									res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid request_id!"});
								} else {
									res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingRequest});
								}
							} else {
								if(requestCallBack == null || requestCallBack == undefined){
									res.status(404).json({'errorCode': 404, 'errorMessage': "Request not found!"});
								} else {
									res.status(200).json({'result': requestCallBack});
								}
							}
						});
						
						
					}
				}
			}
		} else {
			res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key not found in the server, please login and try again!"});
		}
	});
}


// TESTED - ADDED ACTIVITY TRACKER(TESTED)
/* This controller is responsible for handling the deletion of a request from the database.
To achieve such result, the user must send a DELETE request to the path /requests with the query string
at the end indicating the request's ID that they want to delete:

	/requests?request_id={{request_id will go here}}

*/
exports.delete_request = function(req, res){
	const APIKEY = req.header('Api-Key');
	Keys.findOne({key: APIKEY},function(error, result){
		if(error){
			res.status(500).json({'errorCode': 500, 'errorMessage': error});
		}
	}).then((success_callback) => {
		if(success_callback != null || success_callback != undefined){
			var currentDate = new Date(Date.now());
			var expiredDate = new Date(success_callback.expiredOn);
			if((currentDate.getTime()) >= (expiredDate.getTime())){
				res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key is outdated. Please login and try again!"});
			} else {
				if(req.query.request_id == undefined || req.query.request_id == null || req.query.request_id == ""){
					res.status(411).json({'errorCode': 411, 'errorMessage': "Please append the request_id to the query string!"})
				} else {
					Requests.findOne({_id: req.query.request_id}, function(errorFindingRequest, requestCallBack){
						if(errorFindingRequest){
							if(errorFindingRequest.name == "CastError"){
								res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid request_id!"});
							} else {
								res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingRequest});
							}
						} else {
							if(requestCallBack == null || requestCallBack == undefined){
								res.status(404).json({'errorCode': 404, 'errorMessage': "Request not found!"});
							} else {
								Events.deleteOne({_id: requestCallBack.event}, function(errorDeletingEvent){
									if(errorDeletingEvent){
										if(errorDeletingEvent.name == "CastError"){
											res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid event_id!"});
										} else {
											res.status(500).json({'errorCode': 500, 'errorMessage': errorDeletingEvent});
										}
									} else {
										Requests.deleteOne({_id: req.query.request_id}, function(errorDeletingRequest){
											if(errorDeletingRequest){
												if(errorDeletingRequest.name == "CastError"){
													res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid request_id!"});
												} else {
													res.status(500).json({'errorCode': 500, 'errorMessage': errorDeletingRequest});
												}
											} else {
												Users.updateOne({_id: success_callback.userId},{$push: {activities: {activityDescription: "Deleted request " + req.query.request_id}}}, function(errorUpdatingUser, updatingResult){
													if(errorUpdatingUser){
														if(errorUpdatingUser.name == "CastError"){
															res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid user ID!"});
														} else {
															res.status(500).json({'errorCode': 500, 'errorMessage': errorUpdatingUser});
														}
													} else {
														res.status(200).json({'result': "Successfully deleted the request!"});
													}
												});
											}
										});
									}
								});
							}
						}
					});
					
					
				}
			}
		} else {
			res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key not found in the server, please login and try again!"});
		}
	});
}


// TESTED
/* This controller will be the one that is responsible for handling all of the GET requests coming from the path
		/booking
	The following query strings can be used to further refine the search results:
		
		?sort_by={{new_to_old or old_to_new}}: this is to sort the list in those 2 specific order
		
		?host_id={{event's host id will go here}}: this is to sort out all of the bookings that don't have events that
		are held by this specific individual

		?sort_by={{new_to_old or old_to_new}}&host_id={{event's host id will go here}}: will do both of the functions mentioned above
*/
exports.get_booking_details = function(req, res){
	const APIKEY = req.header('Api-Key');
	Keys.findOne({key: APIKEY},function(error, result){
		if(error){
			res.status(500).json({'errorCode': 500, 'errorMessage': error});
		}
	}).then((success_callback) => {
		if(success_callback != null || success_callback != undefined){
			var currentDate = new Date(Date.now());
			var expiredDate = new Date(success_callback.expiredOn);
			if((currentDate.getTime()) >= (expiredDate.getTime())){
				res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key is outdated. Please login and try again!"});
			} else {
				if(req._parsedUrl.query == null || req._parsedUrl.query == undefined){
					Bookings.find({userDetails: success_callback.userId}).populate('eventDetails').lean().exec(function(errorFindingAllBookings, bookingsResults){
						if(errorFindingAllBookings){
							if(errorFindingAllBookings.name == "CastError"){
								res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid user_id!"});
							} else {
								res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingAllBookings});
							}
						} else {
							res.status(200).json({'length': bookingsResults.length, 'results': bookingsResults});
						}
					});
				} else {
					if((req.query.sort_by != "" || req.query.sort_by != undefined || req.query.sort_by != null) && (req.query.host_id == null || req.query.host_id == undefined || req.query.host_id == "")){
						// This is to get the list of the bookings sorted by the date that the booking is made from new to old or old to new
						if(req.query.sort_by == "new_to_old"){
							Bookings.find({userDetails: success_callback.userId}).populate('eventDetails').sort({createdAt: 'descending'}).lean().exec(function(errorFindingAllBookings, bookingsResults){
								if(errorFindingAllBookings){
									if(errorFindingAllBookings.name == "CastError"){
										res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid user_id!"});
									} else {
										res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingAllBookings});
									}
								} else {
									res.status(200).json({'length': bookingsResults.length, 'results': bookingsResults});
								}
							});
						} else if(req.query.sort_by == "old_to_new") {
							Bookings.find({userDetails: success_callback.userId}).populate('eventDetails').sort({createdAt: 'ascending'}).lean().exec(function(errorFindingAllBookings, bookingsResults){
								if(errorFindingAllBookings){
									if(errorFindingAllBookings.name == "CastError"){
										res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid user_id!"});
									} else {
										res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingAllBookings});
									}
								} else {
									res.status(200).json({'length': bookingsResults.length, 'results': bookingsResults});
								}
							});
						} else {
							res.status(404).json({'errorCode': 404, 'errorMessage': "Sorry but the query string for sort_by is not correct!"});
						}
					} else if((req.query.sort_by == "" || req.query.sort_by == undefined || req.query.sort_by == null) && (req.query.host_id != null || req.query.host_id != undefined || req.query.host_id != "")) {
						// This is for finding the booking details that related to the events that are held by a specific individual
						// if the need ever arises
						Bookings.find({userDetails: success_callback.userId}).populate('eventDetails').lean().exec(function(errorFindingAllBookings, bookingsResults){
							if(errorFindingAllBookings){
								if(errorFindingAllBookings.name == "CastError"){
									res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid user_id!"});
								} else {
									res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingAllBookings});
								}
							} else {
								for(var i = 0; i < bookingsResults.length; i++){
									if(bookingsResults[i].eventDetails.host != req.query.host_id){
										delete(bookingsResults[i]);
									}
								}
								res.status(200).json({'length': bookingsResults.length, 'results': bookingsResults});
							}
						});
					} else if((req.query.sort_by != "" || req.query.sort_by != undefined || req.query.sort_by != null) && (req.query.host_id != null || req.query.host_id != undefined || req.query.host_id != "")) {
						// This is the combination of the two query strings mentioned above.
						if(req.query.sort_by == "new_to_old"){
							Bookings.find({userDetails: success_callback.userId}).populate('eventDetails').sort({createdAt: 'descending'}).lean().exec(function(errorFindingAllBookings, bookingsResults){
								if(errorFindingAllBookings){
									if(errorFindingAllBookings.name == "CastError"){
										res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid user_id!"});
									} else {
										res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingAllBookings});
									}
								} else {
									for(var i = 0; i < bookingsResults.length; i++){
										if(bookingsResults[i].eventDetails.host != req.query.host_id){
											delete(bookingsResults[i]);
										}
									}
									res.status(200).json({'length': bookingsResults.length, 'results': bookingsResults});
								}
							});
						} else if(req.query.sort_by == "old_to_new"){
							Bookings.find({userDetails: success_callback.userId}).populate('eventDetails').sort({createdAt: 'ascending'}).lean().exec(function(errorFindingAllBookings, bookingsResults){
								if(errorFindingAllBookings){
									if(errorFindingAllBookings.name == "CastError"){
										res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid user_id!"});
									} else {
										res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingAllBookings});
									}
								} else {
									for(var i = 0; i < bookingsResults.length; i++){
										if(bookingsResults[i].eventDetails.host != req.query.host_id){
											delete(bookingsResults[i]);
										}
									}
									res.status(200).json({'length': bookingsResults.length, 'results': bookingsResults});
								}
							});
						} else {
							res.status(404).json({'errorCode': 404, 'errorMessage': "Cannot find such sort_by query string!"});
						}
					} else {
						res.status(500).json({'errorCode': 500, 'errorMessage': "Sorry but your query strings are invalid!"});
					}
				}
			}
		} else {
			res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key not found in the server, please login and try again!"});
		}
	});
}


// TESTED - ADDED ACTIVITY TRACKER(TESTED)
/* This controller will be the one that is responsible for handling all of the POST requests made to the following
path:
			/booking

The user will need to post the following details to the aformentioned path:
	- event_id: the ID of the event that the user wants to book in
	- promoCodeApplied: only one of the promocode is accepted!
*/
exports.book_for_event = function(req, res){
	const APIKEY = req.header('Api-Key');
	Keys.findOne({key: APIKEY},function(error, result){
		if(error){
			res.status(500).json({'errorCode': 500, 'errorMessage': error});
		}
	}).then((success_callback) => {
		if(success_callback != null || success_callback != undefined){
			var currentDate = new Date(Date.now());
			var expiredDate = new Date(success_callback.expiredOn);
			if((currentDate.getTime()) >= (expiredDate.getTime())){
				res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key is outdated. Please login and try again!"});
			} else {
				if(req.body.event_id != null || req.body.event_id != undefined || req.body.event_id != "" ||
					req.body != null || req.body != undefined){
					Events.findOne({_id: req.body.event_id}, function(errorFindingEvent, findingEventResult){
						if(errorFindingEvent){
							if(errorFindingEvent.name == "CastError"){
								res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid event_id"});
							} else {
								res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingEvent});
							}
						} else {
							if(findingEventResult == null || findingEventResult == undefined){
								res.status(404).json({'errorCode': 500, 'errorMessage': "Event not found"});
							} else {
								if(findingEventResult.numberOfTickets <= 0){
									res.status(200).json({'result': "You cannot book into this event anymore!"});
								} else {
									var discountFactorFound = 0;
									if(req.body.promoCodeApplied != "" || req.body.promoCodeApplied != null || req.body.promoCodeApplied != undefined){
										for(var i = 0; i < findingEventResult.promoCodes.length; i++){
											if(findingEventResult.promoCodes[i].code == req.body.promoCodeApplied){
												if((currentDate.getTime()) <= (new Date(findingEventResult.promoCodes[i].validUntil).getTime())){
													discountFactorFound = findingEventResult.promoCodes[i].discountFactor;
													break;
												}
											}
										}
									}
									var finalPriceCalc = findingEventResult.price - (findingEventResult.price * (discountFactorFound/100));
									var newBooking = new Bookings({
										eventDetails: findingEventResult._id,
										userDetails: success_callback.userId,
										promoCodeApplied: req.body.promoCodeApplied,
										finalPrice: finalPriceCalc
									});
									newBooking.save(function(errorSavingNewBooking){
										if(errorSavingNewBooking){
											res.status(500).json({'errorCode': 500, 'errorMessage': errorSavingUserBooking});
										} else {
											Events.updateOne({_id: findingEventResult._id}, {$inc: {numberOfTickets: -1}}, function(errorUpdatingEvent, updateEventResult){
												if(errorUpdatingEvent){
													res.status(500).json({'errorCode': 500, 'errorMessage': errorUpdatingEvent});
												} else {
													Users.updateOne({_id: success_callback.userId}, {$push: {registeredEvents: newBooking._id}}, function(errorSavingUserBooking, saveUserBookingResult){
														if(errorSavingUserBooking){
															res.status(500).json({'errorCode': 500, 'errorMessage': errorSavingUserBooking});
														} else {
															Users.updateOne({_id: success_callback.userId},{$push: {activities: {activityDescription: "Booked for event " + req.body.event_id}}}, function(errorUpdatingUser, updatingResult){
																if(errorUpdatingUser){
																	if(errorUpdatingUser.name == "CastError"){
																		res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid user ID!"});
																	} else {
																		res.status(500).json({'errorCode': 500, 'errorMessage': errorUpdatingUser});
																	}
																} else {
																	res.status(200).json({'result': "Successfully booked in for the event!"})
																}
															});
														}
													});
												}
											});
										}
									});
								}
							}
						}
					});
				} else {
					res.status(500).json({'errorCode': 500, 'errorMessage': "event_id not found! Cannot book event! Please check again in the body!"});
				}
			}
		} else {
			res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key not found in the server, please login and try again!"});
		}
	});
}


// TESTED - ADDED ACTIVITY TRACKER(TESTED)
/* This controller is responsible for handling the requests relating to the cancelation of bookings by sending
DELETE request to the following path
		/booking?booking_id={{booking ID}}
This will delete a user's booking of a certain event based on the booking ID
*/
exports.cancel_booking = function(req, res){
	const APIKEY = req.header('Api-Key');
	Keys.findOne({key: APIKEY},function(error, result){
		if(error){
			res.status(500).json({'errorCode': 500, 'errorMessage': error});
		}
	}).then((success_callback) => {
		if(success_callback != null || success_callback != undefined){
			var currentDate = new Date(Date.now());
			var expiredDate = new Date(success_callback.expiredOn);
			if((currentDate.getTime()) >= (expiredDate.getTime())){
				res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key is outdated. Please login and try again!"});
			} else {
				if(req._parsedUrl.query == null || req._parsedUrl.query == undefined){
					res.status(411).json({'errorCode': 411, 'errorMessage': "Missing booking ID in the query string!"});
				} else {
					if(req.query.booking_id != undefined || req.query.booking_id != null || req.query.booking_id != ""){
						Users.findOne({_id: success_callback.userId}).lean().exec(function(errorFindingUser, userDetails){
							if(errorFindingUser){
								if(errorFindingUser.name == "CastError"){
									res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid UserID, please check"});
								} else {
									res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingUser});
								}
							} else {
								var isBookingIDIncluded = false; 
								for(var i = 0; i < userDetails.registeredEvents.length; i++){
									if(userDetails.registeredEvents[i].equals(req.query.booking_id)){
										isBookingIDIncluded = true;
										break;
									}
								}
								if(isBookingIDIncluded){
									Bookings.findOne({_id: req.query.booking_id}).populate('eventDetails').exec(function(errorFindingBooking, bookingResult){
										if(errorFindingBooking){
											if(errorFindingBooking.name == "CastError"){
												res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid booking_id!"});
											} else {
												res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingBooking});
											}
										} else {
											if((currentDate.getTime()) >= (new Date(bookingResult.eventDetails.startTime).getTime())){
												res.status(200).json({'result': "Cannot cancel booking after the event has already started"});
											} else {
												Events.updateOne({_id: bookingResult.eventDetails._id}, {$inc: {numberOfTickets: 1}}, function(errorUpdatingEvent){
													if(errorUpdatingEvent){
														res.status(500).json({'errorCode': 500, 'errorMessage': errorUpdatingEvent});
													} else {
														Users.updateOne({_id: userDetails._id}, {$pull: {registeredEvents: req.query.booking_id}}, function(errorUpdatingUserBookingDetails, updatingResult){
															if(errorUpdatingUserBookingDetails){
																res.status(500).json({'errorCode': 500, 'errorMessage': errorUpdatingUserBookingDetails});
															} else {
																Bookings.deleteOne({_id: req.query.booking_id}, function(errorDeletingBooking, deletingResult){
																	if(errorDeletingBooking){
																		res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingUser});
																	} else {
																		Users.updateOne({_id: success_callback.userId},{$push: {activities: {activityDescription: "Cancel booking for event " + req.query.booking_id}}}, function(errorUpdatingUser, updatingResult){
																			if(errorUpdatingUser){
																				if(errorUpdatingUser.name == "CastError"){
																					res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid user ID!"});
																				} else {
																					res.status(500).json({'errorCode': 500, 'errorMessage': errorUpdatingUser});
																				}
																			} else {
																				res.status(200).json({'result': "Successfully cancel the event!"});
																			}
																		});
																	}
																});
															}
														});
													}
												});
											}
										}
									});



									
								} else {
									res.status(404).json({'errorCode': 404, 'errorMessage': "Sorry but we cannot find the booking ID!"});
								}
							}
						});
					} else {
						res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid query strings found!"});
					}
				}
				
			}
		} else {
			res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key not found in the server, please login and try again!"});
		}
	});
}




/* All of the controllers from this point onwards are the admin variants of the events
and users controllers above.
The different is that with these controllers, the admin will be able to do the following:
	- Get all of the events and requests (and sorting as usual)
	
	- Modify events' details (modify_mode=edit_event), accepting request (modify_mode=approve_event_request),
	reject request(modify_mode=reject_event_request)
	
	- Delete events' details outright from the system

	- Get all users' information (with the exceptions of all passwords, the admin cannot see it

	- Modify the users' statuses (ban/unban/reactivate users)

	- Delete users' from the system*/

// TESTED
exports.get_events_and_requests = function(req, res){
	const APIKEY = req.header('Api-Key');
	Keys.findOne({key: APIKEY},function(error, result){
		if(error){
			res.status(500).json({'errorCode': 500, 'errorMessage': error});
		}
	}).populate('userId').then((success_callback) => {
		if(success_callback != null || success_callback != undefined){
			var currentDate = new Date(Date.now());
			var expiredDate = new Date(success_callback.expiredOn);
			if((currentDate.getTime()) >= (expiredDate.getTime())){
				res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key is outdated. Please login and try again!"});
			} else {
				if(success_callback.userId.accountType != 1){
					res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! This API Key is not an admin key. Please try again!"});
				} else {
					if(req._parsedUrl.query == null){
						Requests.find({}).populate('event').lean().exec(function(requestError, results){
							if(requestError){
								res.status(500).json({'errorCode': 500, 'errorMessage': requestError});
							} else {
								if(results.length == 0){
									res.json({'result': "Sorry but there are no events in the database!"});
								} else {
									res.json({'length': results.length, 'results': results});
								}
							}
						});
					} else {
						if(req.query.sort_by == "new_to_old" && (req.query.event_id == undefined || req.query.event_id == null || req.query.event_id == "")
							&& (req.query.location == undefined || req.query.location == null || req.query.location == "")){
							Requests.find({}).populate('event').sort({createdAt:'descending'}).lean().exec(function(requestError, results){
								if(requestError){
									res.status(500).json({'errorCode': 500, 'errorMessage': requestError});
								} else {
									res.json({'length': results.length, 'results': results});
								}
							});
						} else if(req.query.sort_by == "old_to_new" && (req.query.event_id == undefined || req.query.event_id == null || req.query.event_id == "")
							&& (req.query.location == undefined || req.query.location == null || req.query.location == "")){
							Requests.find({}).populate('event').sort({createdAt:'ascending'}).lean().exec(function(requestError, results){
								if(requestError){
									res.status(500).json({'errorCode': 500, 'errorMessage': requestError});
								} else {
									if(results.length == 0){
										res.json({'result': "Sorry but there are no events in the database!"});
									} else {
										res.json({'length': results.length, 'results': results});
									}
								}
							});
						} else if((req.query.event_id != undefined || req.query.event_id != null || req.query.event_id != "") && (req.query.sort_by == "" || req.query.sort_by == undefined || req.query.sort_by == null)
							&& (req.query.location == undefined || req.query.location == null || req.query.location == "")){
							Requests.findOne({event: req.query.event_id}).populate('event').populate('host').lean().exec(function(requestError, eventResult){
								if(requestError){
									if(requestError.name == "CastError"){
										res.json({'result': "Sorry but this ID is invalid!"});
									} else {
										res.status(500).json({'errorCode': 500, 'errorMessage': requestError});
									}
								} else {
									if(eventResult == null || eventResult == undefined){
										res.json({'result': "Sorry but there are no event with such ID!"});
									} else {
										delete(eventResult.host.password);
										delete(eventResult.host.personalID);
										delete(eventResult.host.phoneNumber);
										delete(eventResult.host.dateOfBirth);
										delete(eventResult.host.address);
										delete(eventResult.host.gender);
										delete(eventResult.host.registeredEvents);
										delete(eventResult.host.accountType);
										delete(eventResult.host.accountStatus);
										res.json({'result': eventResult});
									}
								}
							});
						} else if((req.query.location != undefined || req.query.location != null || req.query.location != "") && (req.query.sort_by == "" || req.query.sort_by == undefined || req.query.sort_by == null)
							&& (req.query.event_id == undefined || req.query.event_id == null || req.query.event_id == "")){
							Requests.find({}).populate('event').lean().exec(function(requestError, results){
							if(requestError){
								res.status(500).json({'errorCode': 500, 'errorMessage': requestError});
							} else {
								if(results.length == 0){
									res.json({'result': "Sorry but there are no events in the database!"});
								} else {
									for(var i = 0; i < results.length; i++){
										if(results[i].event.location != req.query.location){
											results.splice(i);
										}
									}
									if(results.length == 0){
										res.json({'result': "Sorry but there are no events with such location!"});
									} else {
										res.json({'length': results.length, 'results': results});
									}
								}
							}
						});
						} else {
							res.status(500).json({'errorCode': 500, 'errorMessage': "Sorry but the query strings provided are not correct!"});
						}
					}
				}
			}
		} else {
			res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key not found in the server, please login and try again!"});
		}
	});
}


// TESTED
exports.modify_event = function(req, res){
	const APIKEY = req.header('Api-Key');
	Keys.findOne({key: APIKEY},function(error, result){
		if(error){
			res.status(500).json({'errorCode': 500, 'errorMessage': error});
		}
	}).populate('userId').then((success_callback) => {
		if(success_callback != null || success_callback != undefined){
			var currentDate = new Date(Date.now());
			var expiredDate = new Date(success_callback.expiredOn);
			if((currentDate.getTime()) >= (expiredDate.getTime())){
				res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key is outdated. Please login and try again!"});
			} else {
				if(success_callback.userId.accountType != 1){
					res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! This API Key is not an admin key. Please try again!"});
				} else {
					if(req._parsedUrl.query == null || req._parsedUrl.query == undefined){
						res.status(411).json({'errorCode': 411, 'errorMessage': "Missing event_id in the query string!"});
					} else {
						if(req.query.event_id != undefined || req.query.event_id != null || req.query.event_id != ""){
							if(req.query.modify_mode == "edit_event"){
								if(req.body.name == undefined || req.body.name == ""||
									req.body.location == undefined || req.body.location == ""||
									req.body.startTime == undefined || req.body.startTime == ""||
									req.body.endTime == undefined || req.body.endTime == ""||
									req.body.price == undefined || req.body.price == null ||
									req.body.ticketType == undefined || req.body.ticketType == null||
									req.body.numberOfTickets == undefined || req.body.numberOfTickets == null||
									req.body.capacity == undefined || req.body.capacity == null){

									res.json({'errorCode': 400, 'errorMessage': "Please fill in all of the details required!"});
								} else {
									var promoCodesList = [];
									if(req.body.promoCodes.length > 0 || req.body.promoCodes !=  undefined ||
										req.body.promoCodes !=  null || req.body.promoCodes != ""){
										for(var i = 0; i < req.body.promoCodes.length; i++){
											if(req.body.promoCodes[i].validUntil == undefined || req.body.promoCodes[i].validUntil == "" || req.body.promoCodes[i].validUntil ==  null ||
												req.body.promoCodes[i].code == undefined || req.body.promoCodes[i].code == "" || req.body.promoCodes[i].code ==  null ||
												req.body.promoCodes[i].discountFactor == undefined || req.body.promoCodes[i].discountFactor == "" || req.body.promoCodes[i].discountFactor ==  null){

												continue;
											} else {	
												var newPromoCode = {
													validUntil: new Date(req.body.promoCodes[i].validUntil),
													code: req.body.promoCodes[i].code,
													discountFactor: req.body.promoCodes[i].discountFactor
												};
												promoCodesList.push(newPromoCode);
											}
										}
									}

									var updatedDetails = {
										name: req.body.name,
										location: req.body.location,
										startTime: new Date(req.body.startTime),
										endTime: new Date(req.body.endTime),
										price: req.body.price,
										ticketType: req.body.ticketType,
										thumbnail: req.body.thumbnail,
										numberOfTickets: req.body.numberOfTickets,
										promoCodes: promoCodesList,
										capacity: req.body.capacity,
									};
									Events.findOneAndUpdate({_id: req.query.event_id}, updatedDetails, function(event_updating_err, update_result){
										if(event_updating_err){
											if(event_updating_err.name == "CastError"){
												res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid event_id"});
											} else {
												res.status(500).json({'errorCode': 500, 'errorMessage': event_updating_err});
											}
										} else {
											res.status(200).json({'serverMessage': "Successfully updated event details!", 'result': updatedDetails})
										}
									});
								}
							} else if(req.query.modify_mode == "approve_event_request"){
								Requests.findOne({event: req.query.event_id}, function(errorFindingRequest, findResult){
									if(errorFindingRequest){
										if(errorFindingRequest.name == "CastError"){
											res.status(500).json({'errorCode': 500, 'errorMessage': "Sorry but the ID you gave is invalid"});
										} else {
											res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingRequest});
										}
									} else {
										if(findResult == null || findResult == undefined){
											res.status(404).json({'errorCode': 404, 'errorMessage': "Sorry but we cannot find any event with such ID!"});
										} else {
											Requests.updateOne({event: req.query.event_id}, {status: 1}, function(errorUpdatingRequest, updateRequestResult){
												if(errorUpdatingRequest){
													res.status(500).json({'errorCode': 500, 'errorMessage': errorUpdatingRequest});
												} else {
													Events.updateOne({_id: req.query.event_id}, {status: 1}, function(errorUpdatingEvent, updateEventResult){
														if(errorUpdatingEvent){
															res.status(500).json({'errorCode': 500, 'errorMessage': errorUpdatingEvent});
														} else {
															res.status(200).json({'result': "Request approved!"});
														}
													});
												}
											});
										}
									}
								});
							} else if(req.query.modify_mode == "reject_event_request"){
								Requests.findOne({event: req.query.event_id}, function(errorFindingRequest, findResult){
									if(errorFindingRequest){
										if(errorFindingRequest.name == "CastError"){
											res.status(500).json({'errorCode': 500, 'errorMessage': "Sorry but the ID you gave is invalid"});
										} else {
											res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingRequest});
										}
									} else {
										if(findResult == null || findResult == undefined){
											res.status(404).json({'errorCode': 404, 'errorMessage': "Sorry but we cannot find any event with such ID!"});
										} else {
											Requests.updateOne({event: req.query.event_id}, {status: -1}, function(errorUpdatingRequest, updateRequestResult){
												if(errorUpdatingRequest){
													res.status(500).json({'errorCode': 500, 'errorMessage': errorUpdatingRequest});
												} else {
													Events.updateOne({_id: req.query.event_id}, {status: -1}, function(errorUpdatingEvent, updateEventResult){
														if(errorUpdatingEvent){
															res.status(500).json({'errorCode': 500, 'errorMessage': errorUpdatingEvent});
														} else {
															res.status(200).json({'result': "Request rejected!"});
														}
													});
												}
											});
										}
									}
								});
							} else {
								res.status(404).json({'errorCode': 404, 'errorMessage': "Invalid modify_mode query string!"});
							}
						} else {
							res.status(411).json({'errorCode': 411, 'errorMessage': "Missing event_id query string!"});
						} 
					}
				}
			}
		} else {
			res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key not found in the server, please login and try again!"});
		}
	});
}


// TESTED
exports.delete_events = function(req, res){
	const APIKEY = req.header('Api-Key');
	const MODE = req.query.mode;
	Keys.findOne({key: APIKEY},function(error, result){
		if(error){
			res.status(500).json({'errorCode': 500, 'errorMessage': error});
		}
	}).populate('userId').then((success_callback) => {
		if(success_callback != null || success_callback != undefined){
			var currentDate = new Date(Date.now());
			var expiredDate = new Date(success_callback.expiredOn);
			if((currentDate.getTime()) >= (expiredDate.getTime())){
				res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key is outdated. Please login and try again!"});
			} else {
				if(success_callback.userId.accountType != 1){
					res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! This API Key is not an admin key. Please try again!"});
				} else {
					if(MODE == "single"){
						if(req.query.event_id == undefined || req.query.event_id == ""){
							req.status(411).json({'errorCode': 411, 'errorMessage': "Please append the event_id to the query string!"})
						} else {
							Events.findOne({_id:req.query.event_id}, function(errorFindingEvent, eventResult){
								if(errorFindingEvent){
									if(errorFindingEvent.name == "CastError"){
										res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid event_id!"});
									} else {
										res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingEvent});
									}
								} else {
									Bookings.find({eventDetails: eventResult._id}, function(errorFindingAllBookings, bookingResults){
										if(errorFindingAllBookings){
											if(errorFindingAllBookings.name == "CastError"){
												res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid Event ID passed in!"});
											} else {
												res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingAllBookings});
											}
										} else {
											var listOfBookingsId = [];
											for(var i = 0; i < bookingResults.length; i++){
												listOfBookingsId.push(bookingResults[i]._id);
											}
											Users.updateMany({}, {$pull :{registeredEvents: {$in: listOfBookingsId}}}).exec(function(errorUpdatingUsers, updatingResult){
												if(errorUpdatingUsers){
													if(errorUpdatingUsers.name == "CastError"){
														res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingAllBookings});
													}
												} else {
													Bookings.deleteMany({eventDetails: eventResult._id}, function(errorDeletingBookings){
														if(errorDeletingBookings){
															if(errorDeletingBookings.name == "CastError"){
																res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid Event ID passed in!"});
															} else {
																res.status(500).json({'errorCode': 500, 'errorMessage': errorDeletingBookings});
															}
														} else {
															Requests.deleteOne({event: eventResult._id}, function(errorDeletingRequest){
																if(errorDeletingRequest){
																	if(errorDeletingRequest.name == "CastError"){
																		res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid Event ID passed in!"});
																	} else {
																		res.status(500).json({'errorCode': 500, 'errorMessage': errorDeletingRequest});
																	}
																} else {
																	Events.deleteOne({_id: eventResult._id}, function(errorDeletingEvent){
																		if(errorDeletingEvent){
																			res.status(500).json({'errorCode': 500, 'errorMessage': errorDeletingEvent});
																		} else {
																			res.status(200).json({'result': "Successfully deleted the event"});
																		}
																	});
																}
															});
														}
													});
												}
											});
										}
									});
								}
							});
							
						}
					} else if(MODE == "multiple"){
						if(req.body.deleteList == undefined || req.body.deleteList == "" || req.body.deleteList == [] || req.body.deleteList.length == 0){
							res.status(500).json({'errorCode': 411, 'errorMessage': "Please append all the event_id you want to delete to the body of the request!"})
						} else {
							if(!Array.isArray(req.body.deleteList)){
								res.status(500).json({'errorCode': 500, 'errorMessage': "Sorry but the deleteList needs to be an array containing all of the event IDs you want to delete!"});
							} else {
								for(var deleteIndex = 0; deleteIndex < deleteList.length; deleteIndex++){
									Events.findOne({_id: deleteList[deleteIndex]}, function(errorFindingEvent, eventResult){
										if(errorFindingEvent){
											if(errorFindingEvent.name == "CastError"){
												res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid event_id!"});
											} else {
												res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingEvent});
											}
										} else {
											Bookings.find({eventDetails: eventResult._id}, function(errorFindingAllBookings, bookingResults){
												if(errorFindingAllBookings){
													if(errorFindingAllBookings.name == "CastError"){
														res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid Event ID passed in!"});
													} else {
														res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingAllBookings});
													}
												} else {
													var listOfBookingsId = [];
													for(var i = 0; i < bookingsResults.length; i++){
														listOfBookingsId.push(bookingResults[i]._id);
													}
													Users.updateMany({}, {$pull :{registeredEvents: {$in: listOfBookingsId}}}).exec(function(errorUpdatingUsers, updatingResult){
														if(errorUpdatingUsers){
															if(errorUpdatingUsers.name == "CastError"){
																res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingAllBookings});
															}
														} else {
															Bookings.deleteMany({eventDetails: eventResult._id}, function(errorDeletingBookings){
																if(errorDeletingBookings){
																	if(errorDeletingBookings.name == "CastError"){
																		res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid Event ID passed in!"});
																	} else {
																		res.status(500).json({'errorCode': 500, 'errorMessage': errorDeletingBookings});
																	}
																} else {
																	Requests.deleteOne({event: eventResult._id}, function(errorDeletingRequest){
																		if(errorDeletingRequest){
																			if(errorDeletingRequest.name == "CastError"){
																				res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid Event ID passed in!"});
																			} else {
																				res.status(500).json({'errorCode': 500, 'errorMessage': errorDeletingRequest});
																			}
																		} else {
																			Events.deleteOne({_id: eventResult._id}, function(errorDeletingEvent){
																				if(errorDeletingEvent){
																					res.status(500).json({'errorCode': 500, 'errorMessage': errorDeletingEvent});
																				}
																			});
																		}
																	});
																}
															});
														}
													});
												}
											});
										}
									});
								}
								res.status(200).json({'result': "Successfully deleted all events that are requested!"});
							}
						}
					} else {
						res.status(411).json({'errorCode': 411, 'errorMessage': "Invalid delete mode passed to query string, please check again!"});
					}
				}
			}
		} else {
			res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key not found in the server, please login and try again!"});
		}
	});
}


// TESTED
exports.get_users = function(req, res){
	const APIKEY = req.header('Api-Key');
	Keys.findOne({key: APIKEY},function(error, result){
		if(error){
			res.status(500).json({'errorCode': 500, 'errorMessage': error});
		}
	}).populate('userId').then((success_callback) => {
		if(success_callback != null || success_callback != undefined){
			var currentDate = new Date(Date.now());
			var expiredDate = new Date(success_callback.expiredOn);
			if((currentDate.getTime()) >= (expiredDate.getTime())){
				res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key is outdated. Please login and try again!"});
			} else {
				if(success_callback.userId.accountType != 1){
					res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! This API Key is not an admin key. Please try again!"});
				} else {
					if(req._parsedUrl.query == null || req._parsedUrl.query ==  undefined){
						Users.find({}).lean().exec(function(errorFindingUsers, usersList){
							if(errorFindingUsers){
								res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingUsers});
							} else {
								if(usersList.length == 0){
									res.status(200).json({'results':"There are no users in the database at the moment!"});
								} else {
									for(var i = 0; i < usersList.length; i++){
										delete(usersList[i].password);
										delete(usersList[i].__v);
									}
									res.json({'length': usersList.length, 'results': usersList});
								}
							}
						});
					} else {
						if(req.query.user_id == undefined || req.query.user_id == null || req.query.user_id == ""){
							res.status(411).json({'errorCode': 411, 'errorMessage': "Missing user_id query string"});
						} else {
							Users.findOne({_id: req.query.user_id}).lean().exec(function(errorFindingUser, userResult){
								if(errorFindingUser){
									if(errorFindingUser.name == "CastError"){
										res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid user_id!"});
									} else {
										res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingUser});
									}
								} else {
									if(userResult == undefined || userResult == null){
										res.status(200).json({'result': "There is no user with such ID!"});
									} else {
										delete(userResult.password);
										delete(userResult.__v);
										res.status(200).json({'result': userResult});
									}
								}
							});
						}
					}
				}
			}
		} else {
			res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key not found in the server, please login and try again!"});
		}
	});
}


// TESTED
exports.update_user_status = function(req, res){
	const APIKEY = req.header('Api-Key');
	const ACTION = req.query.action;
	Keys.findOne({key: APIKEY},function(error, result){
		if(error){
			res.status(500).json({'errorCode': 500, 'errorMessage': error});
		}
	}).populate('userId').then((success_callback) => {
		if(success_callback != null || success_callback != undefined){
			var currentDate = new Date(Date.now());
			var expiredDate = new Date(success_callback.expiredOn);
			if((currentDate.getTime()) >= (expiredDate.getTime())){
				res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key is outdated. Please login and try again!"});
			} else {
				if(success_callback.userId.accountType != 1){
					res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! This API Key is not an admin key. Please try again!"});
				} else {
					if(req._parsedUrl.query == null || req._parsedUrl.query ==  undefined){
						res.status(411).json({'errorCode': 411, 'errorMessage': "Missing user_id query string"});
					} else {
						if(req.query.user_id == "" || req.query.user_id == null || req.query.user_id == undefined){
							res.status(411).json({'errorCode': 411, 'errorMessage': "Missing user_id"});
						} else {
							Users.findOne({_id: req.query.user_id}, function(errorFindingUser, userResult){
								if(errorFindingUser){
									if(errorFindingUser.name == "CastError"){
										res.status(500).json({'errorCode': 500, 'errorMessage': "Invalid user_id"});
									} else {
										res.status(500).json({'errorCode': 500, 'errorMessage': errorFindingUser});
									}
								} else {
									if(userResult == null || userResult == undefined){
										res.status(404).json({'errorCode': 404, 'errorMessage': "Cannot find a user with such ID!"});
									} else {
										if((userResult._id).equals(success_callback.userId._id)){
											res.status(403).json({'errorCode': 403, 'errorMessage': "Action is forbidden on your own account!"});
										} else {
											if(ACTION == "ban_user"){
												Users.updateOne({_id: userResult._id}, {accountStatus: -2}, function(errorUpdatingUser){
													if(errorUpdatingUser){
														res.status(500).json({'errorCode': 500, 'errorMessage': errorUpdatingUser});
													} else {
														res.status(200).json({'result': "Successfully banned user with ID " + userResult._id});
													}
												});
											} else if(ACTION == "unban_user" || ACTION == "reactivate_user"){
												Users.updateOne({_id: userResult._id}, {accountStatus: 1}, function(errorUpdatingUser){
													if(errorUpdatingUser){
														res.status(500).json({'errorCode': 500, 'errorMessage': errorUpdatingUser});
													} else {
														res.status(200).json({'result': "Successfully unbanned/reactivated user with ID " + userResult._id});
													}
												});
											} else {
												res.status(500).json({'errorCode': 500, 'errorMessage': "Invailid action query string"});
											}
										}
									}									
								}
							});
						}
					}
				}
			}
		} else {
			res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key not found in the server, please login and try again!"});
		}
	});
}


// TESTED
exports.delete_user = function(req, res){
	const APIKEY = req.header('Api-Key');
	Keys.findOne({key: APIKEY},function(error, result){
		if(error){
			res.status(500).json({'errorCode': 500, 'errorMessage': error});
		}
	}).populate('userId').then((success_callback) => {
		if(success_callback != null || success_callback != undefined){
			var currentDate = new Date(Date.now());
			var expiredDate = new Date(success_callback.expiredOn);
			if((currentDate.getTime()) >= (expiredDate.getTime())){
				res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key is outdated. Please login and try again!"});
			} else {
				if(success_callback.userId.accountType != 1){
					res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! This API Key is not an admin key. Please try again!"});
				} else {
					if(req._parsedUrl.query == null || req._parsedUrl.query == undefined){
						res.status(411).json({'errorCode': 411, 'errorMessage': "Missing userId!"})
					} else {
						if(req.query.user_id == "" || req.query.user_id == undefined || req.query.user_id == null){
							res.status(411).json({'errorCode': 411, 'errorMessage': "Missing userId!"})
						} else {
							if((req.query.user_id) == (success_callback.userId._id.toString())){
								res.status(403).json({'errorCode': 403, 'errorMessage': "Action is forbidden on your own account!"});
							} else {
								Bookings.deleteMany({userDetails: req.query.user_id}, function(errorDeletingBookings){
									if(errorDeletingBookings){
										res.status(500).json({'errorCode': 500, 'errorMessage': errorDeletingBookings});
									} else {
										Events.deleteMany({host: req.query.user_id}, function(errorDeletingEvents){
											if(errorDeletingEvents){
												res.status(500).json({'errorCode': 500, 'errorMessage': errorDeletingEvents});
											} else {
												Requests.deleteMany({host: req.query.user_id}, function(errorDeletingRequests){
													if(errorDeletingRequests){
														res.status(500).json({'errorCode': 500, 'errorMessage': errorDeletingRequests});
													} else {
														Keys.deleteMany({userId: req.query.user_id}, function(errorDeletingKeys){
															if(errorDeletingKeys){
																res.status(500).json({'errorCode': 500, 'errorMessage': errorDeletingKeys});
															} else {
																Users.deleteOne({_id: req.query.user_id}, function(errorDeletingUser){
																	if(errorDeletingUser){
																		res.status(500).json({'errorCode': 500, 'errorMessage': errorDeletingUser});
																	} else {
																		res.status(200).json({'result': "Successfully deleted the user!"});
																	}
																});
															}
														});
													}
												});
											}
										});
									}
								});
							}
						}
					}
				}
			}
		} else {
			res.status(401).json({'errorCode': 401, 'errorMessage': "Unauthorized access! API Key not found in the server, please login and try again!"});
		}
	});
}

