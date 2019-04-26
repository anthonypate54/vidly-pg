const Joi = require("joi");
const moment = require("moment");
const { Movie, validate } = require("./movie");
const pool = require("./db");

class Rental {
  constructor(customerId, movieId) {
    this.customerId = customerId;
    this.movieId = movieId;
    this.dateOut = "";
    this.dateReturned = "";
    this.dailyRentalRate = "";
    this.rentalFee = "";
  }

  static async find() { 
    const client = await pool.connect();
      let res = "";
      try {
        res = await client.query('SELECT * FROM rental ORDER BY dateout');
      }
      catch(err) {
          throw err;
      }
      finally {
          client.release();
      }
      return res.rows;
  }

static async findById(rentalId) {
  const client = await pool.connect();
  let res = "";
  try {
    res = await client.query('SELECT * FROM rental WHERE rentalid = $1', [rentalId]);
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
    let insertRes = "";
    let res = "";
    try {
      await client.query('BEGIN');
      try {
        insertRes =  await client.query('INSERT INTO rental (customerid, movieid) VALUES ($1, $2) \
          RETURNING rental.*',[this.customerId, this.movieId]);

        res = await client.query('UPDATE movie SET numberinstock =  numberinstock - 1 where movieid = $1', [this.movieId])  

        // now update the movie obj
        await client.query('COMMIT');
      }
      catch(err) {
        await client.query('ROLLBACK');
        throw err;
      }
    } finally {
      client.release();
    }
    return insertRes.rows[0];
  }

  async update() {
    const client = await pool.connect();
    let res = "";
    try {
      await client.query('BEGIN');
      try {
        res =  await client.query('UPDATE rental SET datereturned = $1, rentalfee = $2 \
          RETURNING rental.* WHERE rentalid = $3',[this.customerId, this.movieId]);

        await client.query('UPDATE movie SET numberinstock =  numberinstock + 1 where movieid = $1', [this.movieId])  

        // now update the movie obj
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

  static async findByIdAndUpdate(id, rentalObj) {
      const client = await pool.connect();
      let res = "";

      await client.query('BEGIN');
      try {
        res =  await client.query('UPDATE customer SET lastname = $1, firstname= $2, isgold = $3, phone = $4  \
          WHERE id = $5 RETURNING customer.*',
        [rentalObj.lastName, rentalObj.firstName, rentalObj.isGold, rentalObjmovieIdd]);


        this.customerId = rentalObj.customerIdt.query('COMMIT');
      }
      catch(err) {
        await client.query('ROLLBACK');
        throw err;
      }
      finally {
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
        res =  await client.query('DELETE FROM customer WHERE id = $1 RETURNING customer.*', [id]);
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

  return() {
    this.dateReturned = new Date();

    const rentalDays = moment().diff(this.dateOut, "days");
    this.rentalFee = rentalDays * this.dailyRentalRate;
  }

  async lookup(customerId, movieId) {
    const client = await pool.connect();
    let res = "";
    try {
      res = await client.query('SELECT r.*, m.dailyRentalRate FROM rental r INNER JOIN movie m ON r.movieid = m.movieid \
        WHERE customerid = $1 AND m.movieid = $2',[customerId, movieId]);
    }
    catch(err) {
        throw err;
    }
    finally {
        client.release();
    }
    this.dateOut = res.rows[0].dateout;
    console.log(this.dailyRentalRate);
    this.dailyRentalRate = res.rows[0].dailyrentalrate;

    return res.rows[0];
  }

}

function validateRental(rental) {
  const schema = {
    customerId: Joi.number().integer().required(),
    movieId: Joi.number().integer().required()
  };

  return Joi.validate(rental, schema);
}

exports.Rental = Rental;
exports.validate = validateRental;
