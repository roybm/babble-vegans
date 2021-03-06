"use strict";
var express = require('express');
var app = express();
var parser = require('body-parser');
var users = [];
var statsPolling = [];
var asks = [];

app.use(parser.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.options("/*", function (req, res, next) {
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.status(204).send();
});
var messages = require('./messages-util');

app.get('/', function (req, res) {
  res.send('Hello World!');
});
/////////post messagse
app.post('/messages', function (req, res) {
  var u_mes;
  var message = req.body;
  var i = messages.addMessage(message);
  for (var j = 0; j < asks.length; j++) {
    u_mes = asks.pop();
    u_mes.json(message);
  }
  for (j = 0; j < statsPolling.length; j++) {
    u_mes = statsPolling.pop();
    if (messages.getMessages(0) == "0")
      u_mes.json({
        "users": users.length,
        "messages": 0
      });
    else
      u_mes.json({
        "users": users.length,
        "messages": messages.getMessages(0).length
      });
  }
  res.json();
});
///////////delete message
app.delete('/messages/:id', function (req, res) {
  var id = req.params.id;
  var u_mes, j;
  if ((typeof id === 'undefined') || (isNaN(id))) {
    res.status(400);
    res.send('400: Bad Paramaters');
  }
  if (messages.deleteMessage(id)) {
    for (j = 0; j < statsPolling.length; j++) {
      u_mes = statsPolling.pop();
      if (messages.getMessages(0) == "0") {
        u_mes.json({
          "users": users.length,
          "messages": 0
        });
      } else {
        u_mes.json({
          "users": users.length,
          "messages": messages.getMessages(0).length
        });
      }
    }
    res.send('{}');
  } else {
    console.log("message not found");
  }
});
/////get messages
app.get('/messages', function (req, res) {
  var counter = req.query.counter;
  if ((typeof counter === 'undefined') || (isNaN(counter))) {
    res.status(400);
    res.send('400: Bad Paramaters');
    return;
  }
  if (needData(counter)) {
    var temp_ids = messages.getIds(counter);
    var temp = messages.getMessages(counter);
    var super_message;
    var super_array = [];
    for (var i = 0; i < temp.length; i++) {
      super_message = {
        "id": temp_ids[i].id,
        "name": temp_ids[i].name,
        "email": temp_ids[i].email,
        "message": temp[i].message,
        "timestamp": temp_ids[i].timestamp
      };
      super_array.push(super_message);
    }
    res.json(JSON.stringify(super_array));
  } else {
    asks.push(res);
  }
});
//
function needData(i) {
  if (messages.getIds(i) != "0") {
    return 1;
  }
  return 0;
}

////////////////////////////////////////////////////
////////post register
app.post('/register', function (req, res) {
  var u_mes;
  if (prevent_doubles(req.body)) {
    users.push(req.body);
    res.json(req.body);
  }
  for (var j = 0; j < statsPolling.length; j++) {
    u_mes = statsPolling.pop();
    if (messages.getMessages(0) == "0")
      u_mes.json({
        "users": users.length,
        "messages": 0
      });
    else
      u_mes.json({
        "users": users.length,
        "messages": messages.getMessages(0).length
      });
  }
});
///////// delete logout
app.post('/logOut', function (req, res) {
  var u_mes;
  if (delete_u(req.body)) {
    for (var j = 0; j < statsPolling.length; j++) {
      u_mes = statsPolling.pop();
      if (messages.getMessages(0) == "0")
        u_mes.json({
          "users": users.length,
          "messages": 0
        });
      else
        u_mes.json({
          "users": users.length,
          "messages": messages.getMessages(0).length
        });
    }
    res.send();
  } else {
    console.log("could not find the user");
    res.send();
  }
});
//
function delete_u(data) {
  for (var i = 0; i < users.length; i++) {
    if ((data.name == users[i].name) && (data.email == users[i].email)){
      users.splice(i, 1);
    return 1;
    }
  }
  return 0;
}
//
function prevent_doubles(data) {
  for (var i = 0; i < users.length; i++) {
    if ((data.name == users[i].name) && (data.email == users[i].email))
      return 0;
  }
  return 1;
}
//////////get stats
app.get('/stats', function (req, res) {
  statsPolling.push(res);
});
////////////////////////////////////////////////////
app.listen(9000, function () {
  console.log('server listening on port 9000!');
});
///////////////////////////////////////////////////



app.all('/', function (req, res) {
  handle_405(res);
});
app.all('/messages', function (req, res) {
  handle_405(res);
});
app.all('/messages/:id', function (req, res) {
  handle_405(res);
});
app.all('/logOut', function (req, res) {
  handle_405(res);
});
app.all('/register', function (req, res) {
  handle_405(res);
});
app.all('/stats', function (req, res) {
  handle_405(res);
});
app.all('*', function (req, res) {
  res.status(404);
  res.send('404: File Not Found');
});

function handle_405(res) {
  res.status(405);
  res.send('405: bad for certain URL');
}