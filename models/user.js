const config = require("config");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const pool = require("./db");

class User {
    constructor(userObj) {
      this.name = userObj.name;
      this.email = userObj.email;
      this.password = userObj.password;
      console.log(this);
     }

    async save() {
      const client = await pool.connect();
      let res = "";
      try {
        await client.query('BEGIN');
        try {
          res =  await client.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',[this.name, this.email, this.password]);
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

  static async findOne(email) {
       const client = await pool.connect();
      let res = "";
      try {
        res = await client.query('SELECT email FROM users WHERE email = $1', [email.email]);
        console.log(res);
      }
      catch(err) {
          throw err;
      }
      finally {
          client.release();
      }
      console.log(res.rows);
      return res.rowCount > 0 ? res.rows : null;
     
   }

  static async findById(id) {
    const client = await pool.connect();
    let res = "";
    try {
      res = await client.query('SELECT name, email FROM users WHERE id = $1', [id]);
    }
    catch(err) {
        throw err;
    }
    finally {
        client.release();
    }
    return res.rows;
  }
  
  generateAuthToken() {
    const token = jwt.sign(
      {
        _id: this._id,
        email: this.email,
        name: this.name,
        isAdmin: this.isAdmin
      },
      config.get("jwtPrivateKey")
    );
    return token;
  };
  
}


function validateUser(user) {
  const schema = {
    name: Joi.string()
      .min(5)
      .max(255)
      .required(),
    email: Joi.string()
      .min(5)
      .max(255)
      .required()
      .email(),
    password: Joi.string()
      .min(5)
      .max(255)
      .required()
  };

  return Joi.validate(user, schema);
}

module.exports = { User, validate: validateUser };
