const winston = require("winston");
const Pool = require('pg').Pool

const config = require("config");

// const pool = new Pool({
//   user: 'vidly',
//   host: 'localhost',
//   database: 'vidly',
//   password: '1234',
//   port: 5432,
// });
const connectionString = 'postgresql://vidly:1234@localhost:5432/vidly'
const pool = new Pool({
  connectionString: connectionString
});

module.exports = pool;
