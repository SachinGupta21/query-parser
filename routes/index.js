var express = require('express');
var router = express.Router();
var fs = require('fs');
var connection = require('../db/connection');
var mysql      = require('mysql');

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log('/ called');
  res.render('startup.html');
});

router.post('/connectToDb', function(req, res, next) {
  console.log('/connectToDb called with data ', req.body);
  var token = new Date().getTime().toString() + makeid();
  var queryStmt = 'insert into tokens(f_token,f_type,f_url,f_port,f_username,f_password,f_database) values(\''
  + token +'\', \''
  + req.body.type + '\', \''
  + req.body.url + '\', \''
  + req.body.port + '\', \''
  + req.body.username + '\', \''
  + req.body.password + '\', \''
  + req.body.database + '\')';

  console.log(queryStmt);
  connection.query(queryStmt, function (error, results, fields) {
    console.log('error: ', error);
    console.log('results: ', results);
    console.log('fields: ', fields);
    if (error) {
      res.send(JSON.stringify({message: 'error connecting to db'}));
    } else {
      res.send(JSON.stringify({message: 'successfully processed', token: token.toString() }));
    }
  });
});

router.post('/executeQuery', function(req, res, next) {
  console.log('/executeQuery called with body: ', req.body);
  console.log('/executeQuery called with headers: ', req.headers['authorization']);
  var queryStmt = 'select * from tokens where f_token = \'' + req.headers['authorization'] + '\'';
  connection.query(queryStmt, function (error, results, fields) {
    if (results.length > 0) {
      if (results[0].f_type === 'mysql') {
        console.log(results[0].f_url);
        console.log(results[0].f_username);
        console.log(results[0].f_password);

        var conn = mysql.createConnection({
        host     : results[0].f_url,
        port     : results[0].f_port,
        user     : results[0].f_username,
        password : results[0].f_password
        });

        console.log(JSON.stringify(req.body.query));

        conn.query(req.body.query, function (error, results, fields) {
          res.send(JSON.stringify(results));
          conn.end();
        })

      } else if (results[0].f_type === 'mongodb') {
        var MongoClient = require('mongodb').MongoClient;
        var url = 'mongodb://' + results[0].f_username + ':' + results[0].f_password + '@' + results[0].f_url + ':' + results[0].f_port + '/' + results[0].f_database;
        MongoClient.connect(url, function(err, db) {
          if(err) {
            res.send(err);
          }

          var query = req.body.query;
          console.log(query);
          query = JSON.parse(query);

          if(query.operation === 'find') {
            db.collection(query.collection)[query.operation](query.query).toArray(function(err, result) {
              if(err) {
                res.send(err)
              } else {
                res.send(JSON.stringify(result))
              }
              db.close();
            });
          } else if(query.operation === 'insert') {
            db.collection(query.collection)[query.operation](query.query, function(err, result) {
              if(err) {
                res.send(err)
              } else {
                res.send(result)
              }
              db.close();
            });
          }
        })
      }
    }
  })
});

module.exports = router;
