var fs = require('fs');
var path = require('path');
var jade = require('jade');
var mustache = require('mustache');
var crypto = require('crypto');
var http = require('http');
var express = require('express');

var app = express();
var port = normalizePort(process.env.PORT || '8000');
app.set('port', port);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.static(path.join(__dirname)));

app.use('/', express.Router()
    .get('/master', function(req, res, next){
        res.render('master');
    })
    .get('/', function(req, res, next){
        res.render('client');
    })
    .get('/plugin/markdown/marked.js', function(req, res, next){
        fs.readFile(path.join(__dirname, 'bower_components/reveal.js/plugin/markdown/marked.js'), function( err, data ) {
            res.send(data);
        });
    })
    .get( '/notes/:socketId', function( req, res ) {
        fs.readFile(path.join(__dirname, 'bower_components/reveal.js/plugin/notes-server/notes.html'), function( err, data ) {
            res.send(mustache.to_html( data.toString(), {
                socketId : req.params.socketId
            }));
        });
    })
    .get("/token", function(req,res) {
        var ts = new Date().getTime();
        var rand = Math.floor(Math.random()*9999999);
        var secret = ts.toString() + rand.toString();
        res.send({secret: secret, socketId: createHash(secret)});
    }));

var server = http.createServer(app);
var io = require('socket.io')(server);

io.sockets.on( 'connection', function( socket ) {

    socket.on( 'connect', function( data ) {
        socket.broadcast.emit( 'connect', data );
    });

    socket.on( 'statechanged', function( data ) {
        socket.broadcast.emit( 'statechanged', data );
    });

    socket.on('slidechanged', function(slideData) {
        if (typeof slideData.secret == 'undefined' || slideData.secret === undefined || slideData.secret === '') return;
        if (createHash(slideData.secret) === slideData.socketId) {
            slideData.secret = null;
            socket.broadcast.emit(slideData.socketId, slideData);
        }
    });
});

server.listen(port);
console.log('Server listening at ' + port);

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

function createHash(secret) {
    var cipher = crypto.createCipher('blowfish', secret);
    return(cipher.final('hex'));
}
