const http = require('http');
const express = require('express')
const path = require('path')
const app = express()

const SERVER_NAME = 'django-angular2'
const SERVER_PORT = 5004

// body-parser does not handle multipart bodies
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

//parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false, limit: '1mb' }));

// parse application/json
app.use(bodyParser.json({ limit: '1mb' }));

console.log(__dirname + '/dist');

app.use(express.static(__dirname + '/dist'));
app.get('*',function(req,res){
    res.sendFile(path.join(__dirname, '/dist/index.html'));
});

var apiURL = '/api';
var Service = require('./service');
var serv = Service();

app.post(apiURL + '/models', serv.getModels);
app.post(apiURL + '/services', serv.getServices);

//app.listen(SERVER_PORT, () => console.log('Server setup'))
app.set('port', process.env.PORT || SERVER_PORT)

var server = http.createServer(app)
server.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'))
})