// var http = require('http');
import http from 'http';
// var fileSystem = require('fs');
import fileSystem from 'fs';
// var pathLib = require('path');
import pathLib from 'path';
const events = [];
const cursors = {};

import { fileURLToPath } from 'url';
import { dirname } from 'path';


function serve(res, file) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  var filePath = pathLib.join(__dirname, file);
  var stat = fileSystem.statSync(filePath);

    var contentType = 'text/html';
    if (file.endsWith('.js')) {
      contentType = 'text/js'
    }

    res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stat.size
    });

    var readStream = fileSystem.createReadStream(filePath);
    readStream.pipe(res);
}

var server = http.createServer(function(req, res) {
  var path = req.url;
  var reqBody = '';


  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }
  
  req.on('data', function(data) {
    reqBody += data;
  });

  req.on('end', function() {
    if (path == '/') {
      serve(res, 'index.html');
      return;
    }
    if (path.endsWith('.js')) {
      serve(res, path);
      return;
    }

    try {
      var params = JSON.parse(reqBody);
    } catch (error) {
      console.error('Error parsing JSON data:', error);
      res.writeHead(400, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
      res.end('Bad Request: Invalid JSON data');
      return; // Stop further execution of the code block
    }
    
    if (path === '/snd') {
      events.push(params);
      console.log('/snd', reqBody);
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end('ok');
    } else if (path === '/rcv') {
      try {
        console.log('/rcv', reqBody);
        var params = JSON.parse(reqBody);
        var clientId = params.clientId;
        var data = [];
        if (typeof cursors[clientId] === 'undefined') cursors[clientId] = 0;
        for (var idx = cursors[clientId]; idx < events.length; idx++) {
          var event = events[idx];
          data.push(event);
        }
        cursors[clientId] = events.length;
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        });
        res.end(JSON.stringify(data));
      } catch (error) {
        console.error('Error parsing JSON data:', error);
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        });
        res.end('Internal Server Error');
      }
    } else {
      console.log('404');
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end('not found');
    }
  });
});

server.listen(8080,'0.0.0.0');
