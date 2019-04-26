const Joi = require('joi');
const moment = require('moment');
const validate = require('../middleware/validate'); 
const validateObjectId = require('../middleware/validateObjectId');
const auth = require('../middleware/auth');
const {Movie} = require('../models/movie'); 
const {Rental} = require('../models/rental'); 
const express = require('express');
const router = express.Router();

router.post('/', [auth, validate(validateReturn)], async (req, res) => {

    const rental = new Rental(req.body.customerId, req.body.movieId);
    const retVal = await rental.lookup(req.body.customerId, req.body.movieId);

    if(!retVal)
        return res.status(404).send('Rental not found');

    if(rental.dateReturned) 
        return res.status(400).send('Return already processed'); 
    
    await rental.return();
    await rental.save();

    return res.send(rental);
  });

  function validateReturn(req) {
  const schema = {
    customerId: Joi.number().required(),
    movieId: Joi.number().required()
  };

  return Joi.validate(req, schema);
}
module.exports = router;
