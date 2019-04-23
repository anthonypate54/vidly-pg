const Joi = require("joi");
const pool = require("./db");

  class Customer {
    constructor(customerObj) {
      this.firstName = customerObj.firstName;
      this.lastName = customerObj.lastName;
      this.isGold = customerObj.isGold;
      this.phone = customerObj.phone;
    }
  
  static async find() {
    const client = await pool.connect();
    let res = "";
    try {
      res = await client.query('SELECT * FROM customer ORDER BY lastname');
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
      res = await client.query('SELECT * FROM customer WHERE id = $1', [id]);
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
        res =  await client.query('INSERT INTO customer (lastname, firstname, isgold, phone) VALUES ($1, $2, $3, $4) \
          RETURNING customer.*',[this.firstName, this.lastName, this.isGold, this.phone]);
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

  static async findByIdAndUpdate(id, customerObj) {
    const client = await pool.connect();
    let res = "";
    try {
      await client.query('BEGIN');
      try {
        res =  await client.query('UPDATE customer SET lastname = $1, firstname= $2, isgold = $3, phone = $4  \
          WHERE id = $5 RETURNING customer.*',
        [customerObj.lastName, customerObj.firstName, customerObj.isGold, customerObj.phone, id]);

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
function validateCustomer(customer) {
  const schema = {
    firstName: Joi.string()
      .min(2)
      .max(50)
      .required(),
    lastName: Joi.string()
      .min(2)
      .max(50)
      .required(),
    phone: Joi.string()
      .min(5)
      .max(50)
      .required(),
    isGold: Joi.boolean()
  };

  return Joi.validate(customer, schema);
}

exports.Customer = Customer;
exports.validate = validateCustomer;
