var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit: 10,
  host: 'classmysql.engr.oregonstate.edu',
  user: 'cs361_karthauk',
  password: '5626',
  database: 'cs361_karthauk'
});
module.exports.pool = pool;