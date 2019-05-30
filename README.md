# Book And Go Booking System for UOW

Book And Go is an intuitive, robust and easy to use booking system designed by a small team of developer at UOW
This is the system that our group came up with as a resolution to the problem mentioned in the group assignment
for CSIT214, which is to create an event booking system for the University of Wollongong.

This system is consisted of 2 parts for ease of maintenance and incremental updates: the frontend and the backend
- The Frontend is written completely in HTML, CSS and Javascript
- The Backend is written in Javascript (Node.JS)

The service is hosted at ``` http://bookandgo.appspot.com/ ```
The server is hosted at ``` http://bookandgo-api.herokuapp.com/ ```

In details, the frontend is hosted with Google Cloud SDK at the link ...
and the backend is hosted on Heroku CLI in conjunction with a MongoDB database
with the Node.js module.

The system's backend also contains an API that will help the university to provide information to all people
who are outside of the premise of the university a chance to pull some events details down and see without
any authentication.

Other than that, if the user wants to look at all events, make bookings, make changes to accounts, make changes
to request, request events, etc. then they have to first log in to get the API key (which will be available
for 14 days from the day that you logged in)

## Backend
## Frontend

## Dependencies

Book And Go uses a number of open source projects to work properly:

* [materialize](https://github.com/Dogfalo/materialize) - a Material Design framework that helps us design our own template for the frontend, kudos to [@Dogfalo](https://github.com/Dogfalo)
* [Node.js](https://nodejs.org/) - evented I/O for the backend
* [cors](https://www.npmjs.com/package/cors) - a node.js package to provide option to enable CORS
* [express](http://expressjs.com) - fast node.js network app framework [@tjholowaychuk]
* [mongoose](https://www.npmjs.com/package/mongoose) - a [MongoDB](https://www.mongodb.com/) object modeling tool designed to work in an asynchronous environment
* [body-parser](https://www.npmjs.com/package/body-parser) - a parsing middleware that helps with translating the URL into usable format
* [nodemon](https://www.npmjs.com/package/nodemon) - a node.js package that helps with debugging node.js app
* [imgur API](https://apidocs.imgur.com) - an API that can help us upload photos to it 
* [Heroku](https://devcenter.heroku.com) - a hosting service that can help us host the API of the backend
* [MongoDB Atlas](https://cloud.mongodb.com) - a MongoDB database service that will contain all of our information being sent through the API
* [Google Cloud SDK](https://cloud.google.com/sdk/) - a SDK pack that has the option for us to host a website on Google Cloud Platform


## Installation
### Backend
Book And Go Backend requires [Node.js](https://nodejs.org/) v5+ to run.

The list of the following steps to get the backend up and running is as follows:
1. Make sure you have a version of Node.js that is version 5 or later installed on your local machine
2. Clone this repository with ```git clone```
3. Open up a terminal and type the following for the installation of dependencies
```sh
$ cd bookandgo
$ npm install express
$ npm install nodemon
$ npm install cors
$ npm install mongoose
$ npm install body-parser
```
4. After all dependencies are installed, run the backend locally with the following command
```sh
$ npm run start
```
5. After that, the service is hosted at ```localhost:8080```

### Frontend
Just clone or download the folder containing the frontend source codes, then fix the javascript files to make sure all of the paths are as you please then use any website hosting service, locally or otherwise, to run the code.

License
----

MIT


**Free Software, Hell Yeah!**


