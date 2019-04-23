const Joi = require('joi');
const {genreSchema} = require('./genre');
const pool = require("./db");

class Movie {
  constructor(movieObj) {
    this.title = movieObj.title;
    this.genreId = movieObj.genreId;
    this.numberInStock = movieObj.numberInStock;
    this.dailyRentalRate = movieObj.dailyRentalRate;
    this.liked = movieObj.liked;
  }

  static async find() {
    const client = await pool.connect();
    let res = "";
    try {
      res = await client.query('SELECT * FROM movies ORDER BY title');
    }
    catch(err) {
        throw err;
    }
    finally {
        client.release();
    }
    return res.rows;
  }

  static async findById(id) {
    const client = await pool.connect();
    let res = "";
    try {
      res = await client.query('SELECT m.*, g.* FROM movies m INNER JOIN genres g \
        ON m.genreid=g.id WHERE m.id = $1', [id]);
    }
    catch(err) {
        throw err;
    }
    finally {
        client.release();
    }
    return res.rowCount > 0 ? res.rows[0] : null;
  }

  async save() {
    const client = await pool.connect();
    let res = "";
    try {
      await client.query('BEGIN');
      try {
        res =  await client.query('INSERT INTO movies (title, genreid, numberinstock,dailyrentalrate) VALUES ($1, $2, $3, $4) \
          RETURNING movies.*',[this.title, this.genreId, this.numberInStock, this.dailyRentalRate]);
        await client.query('COMMIT');
      }
      catch(err) {
        await client.query('ROLLBACK');
        throw err;
      }
    } finally {
      client.release();
    }
    return res.rows;
  }

  static async findByIdAndUpdate(id, movieObj) {
    const client = await pool.connect();
    let res = "";
    try {
      await client.query('BEGIN');
      try {
        res =  await client.query('UPDATE movies SET title = $1, genreid= $2, numberinstock = $3, dailyRentalRate = $4, \
        liked = $5 WHERE id = $6 RETURNING movies.*',
        [movieObj.title, movieObj.genreId, movieObj.numberInStock, movieObj.dailyRentalRate, movieObj.liked, id]);

        await client.query('COMMIT');
      }
      catch(err) {
        await client.query('ROLLBACK');
        throw err;
      }
    } finally {
      client.release();
    }
    return res.rowCount > 0 ? res.rows[0] : null;
  }

  static async findByIdAndRemove(id) {
    const client = await pool.connect();
    let res = "";
    try {
      await client.query('BEGIN');
      try {
        res =  await client.query('DELETE FROM movies WHERE id = $1 RETURNING movies.*', [id]);
        await client.query('COMMIT');
      }
      catch(err) {
        await client.query('ROLLBACK');
        throw err;
      }
    } finally {
      client.release();
    }
    console.log(res);
    return res.rowCount > 0 ? res.rows[0] : null;
  }

}
function validateMovie(movie) {
  const schema = {
    title: Joi.string().min(5).max(50).required(),
    genreId: Joi.number().required(),
    numberInStock: Joi.number().min(1).max(15).required(),
    dailyRentalRate: Joi.number().min(2).required(),
    liked: Joi.boolean()
  };

  return Joi.validate(movie, schema);
}

exports.Movie = Movie; 
exports.validate = validateMovie;