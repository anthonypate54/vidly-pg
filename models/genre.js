const Joi = require('joi');
const pool = require("./db");

class Genre {
    constructor(genreObj) {
      this.name = genreObj.name;
    }

    static async find() {
      const client = await pool.connect();
      let res = "";
      try {
        res = await client.query('SELECT * FROM genres');
      }
      catch(err) {
          throw err;
      }
      finally {
          client.release();
      }
      return res.rows;
  }

  static async findById(genreId) {
    const client = await pool.connect();
    let res = "";
    try {
      res = await client.query('SELECT * FROM genres WHERE _id = $1', [genreId]);
    }
    catch(err) {
        throw err;
    }
    finally {
        client.release();
    }
    return res.rowCount > 0 ? res.rows[0] : null;
  }

  static async findByIdAndUpdate(genreId, reqObj) {
    const client = await pool.connect();
    let res = "";
    try {
      await client.query('BEGIN');
      try {
        res =  await client.query('UPDATE genres SET name = $1 WHERE _id = $2 RETURNING genres.*', [reqObj.name, genreId]);
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

  static async findByIdAndRemove(genreId) {
    const client = await pool.connect();
    let res = "";
    try {
      await client.query('BEGIN');
      try {
        res =  await client.query('DELETE FROM genres WHERE _id = $1 RETURNING genres.*', [genreId]);
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

  async save() {
    const client = await pool.connect();
    let res = "";
    try {
      await client.query('BEGIN');
      try {
        res =  await client.query('INSERT INTO genres (name) VALUES ($1) RETURNING _id',[this.name]);
        await client.query('COMMIT');
      }
      catch(err) {
        await client.query('ROLLBACK');
        throw err;
      }
    } finally {
      client.release();
    }
    return res.rows[0];
  }
}

function validateGenre(genre) {
  const schema = {
    name: Joi.string().min(5).max(50).required()
  };

  return Joi.validate(genre, schema);
}

exports.Genre = Genre; 
exports.validate = validateGenre;