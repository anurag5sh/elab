const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

require('./startup/logging')();
require('./startup/config')();
require('./startup/db')();
require('./startup/socket')(io);
require('./startup/routes')(app);

//port config
const port = process.argv[2] || 4000;
app.locals.port = port;

if (process.env.NODE_ENV == 'production') {
  http.listen(port,'localhost',()=> {
    console.log("Listening on port"+ port);
  });
}
else{
  http.listen(port,()=> {
    console.log("Listening on port"+ port);
  });
}
