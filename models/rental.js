const Joi = require("joi");
const moment = require("moment");
const { Movie, validate } = require("./movie");
const pool = require("./db");

class Rental {
  constructor(customerId, movieId) {
    this.customerId = customerId;
    this.movieId = movieId;
  }

  async find() { 
    const client = await pool.connect();
      let res = "";
      try {
        res = await client.query('SELECT * FROM rental where customerid = $1 AND movieid = $2', [this.customerId, this.movieId]);
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
    res = await client.query('SELECT * FROM customer WHERE rentalid = $1', [rentalId]);
  }
  catch(err) {
      throw err;
  }
  finally {
      client.release();
  }
  return res.rowCount > 0 ? res.rows[0] : null;
}


//INSERT INTO table_name(column_list) VALUES(value_list)
//ON CONFLICT target action;

// must decrement movies number in stock
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

}

/*
rentalSchema.statics.lookup = function(customerId, movieId) {
  return this.findOne({
    "customer._id": customerId,
    "movie._id": movieId
  });
};

rentalSchema.methods.return = function() {
  this.dateReturned = new Date();

  const rentalDays = moment().diff(this.dateOut, "days");
  this.rentalFee = rentalDays * this.movie.dailyRentalRate;
};
*/
function validateRental(rental) {
  const schema = {
    customerId: Joi.number().integer().required(),
    movieId: Joi.number().integer().required()
  };

  return Joi.validate(rental, schema);
}

exports.Rental = Rental;
exports.validate = validateRental;
