const http = require('http');
const fs = require('fs');
const path = require('path');
const socketIO = require('socket.io');

const PORT = 1234;
const events = [];
const cursors = {};

function serve(res, file) {
    var filePath = path.join(__dirname, file);
    var stat = fs.statSync(filePath);
  
    var extname = String(path.extname(filePath)).toLowerCase();
    var mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        // add more MIME types if needed
    };

    var contentType = mimeTypes[extname] || 'application/octet-stream';
  
    res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stat.size,
        'Access-Control-Allow-Origin': '*'
    });
  
    var readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
}

const server = http.createServer(function (req, res) {

    server.on('options', (req, res) => {
        // res.writeHead(200, {
        //   'Access-Control-Allow-Origin': '*',
        //   'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // Adjust methods as needed
        //   'Access-Control-Allow-Headers': 'Content-Type' // Adjust headers as needed
        // });
        res.end();
    });

    let reqBody = '';

    req.on('data', function(data) {
        reqBody += data;
    });

    req.on('end', function() {
        var filePath = '.' + req.url;
    if (filePath == './') {
        filePath = './index.html';
    }

    fs.stat(filePath, function(err, stats) {
        if (err || !stats.isFile()) {
            console.log('404');
            // res.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
            // res.end('not found');
        } else {
            serve(res, filePath);
            return;
        }

        if (!reqBody) {
            console.log('Empty request body');
            res.writeHead(400, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
            res.end('Bad request: Empty request body');
            return; // Stop further execution of the code block
        }

        try {
            var params = JSON.parse(reqBody);
        } catch (error) {
            console.error('Error parsing JSON data:', error);
            res.writeHead(400, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
            res.end('Bad req: Invalid JSON data');
            return; // Stop further execution of the code block
        }
        
        if (req.url === '/snd') {
            events.push(params);
            console.log('/snd', reqBody);
            res.writeHead(200, { 'Content-Type': 'text/plain'
            // ,'Access-Control-Allow-Origin': '*'
             });
            res.end('ok');
        } else if (req.url === '/rcv') {
            console.log('/rcv', reqBody);
            var clientId = params.clientId;
            var data = [];
            if (typeof cursors[clientId] === 'undefined') cursors[clientId] = 0;
            for (var idx = cursors[clientId]; idx < events.length; idx++) {
                var event = events[idx];
                data.push(event);
            }
            cursors[clientId] = events.length;
            res.writeHead(200, { 'Content-Type': 'application/json'
            // , 'Access-Control-Allow-Origin': '*' 
        });
            res.end(JSON.stringify(data));
        } else {
            if (!stats || !stats.isFile()) {
                console.log('404');
                res.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
                res.end('not found');
            }
        }
    });
});
}).listen(PORT);

const io = socketIO(server);
console.log(`Server running at http://localhost:${PORT}/`);

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('chat message', (msg) => {
        console.log(msg);
        socket.broadcast.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    })
})