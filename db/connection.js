var mysql      = require('mysql');

var connection = mysql.createConnection({
host     : 'localhost',
user     : 'root',
password : 'root',
database : 'query_parser'
});

module.exports = connection;