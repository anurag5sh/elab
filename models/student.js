const config = require('config');
const Joi = require('@hapi/joi');
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  fname: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 25
  },
  lname: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 25
  },
  email: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 255,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024
  },
  year : {
    type: Number,
    required : true,
  },
  usn : {
    type: String,
    required : true,
    unique : true,
    uppercase : true
  },
  recovery_email : {
    type: String,
  },
  about_me : {
    type: String,
    maxlength: 300
  },
  profile_image: {
    type: String
  }


  
});


const Student = mongoose.model('Student', studentSchema);

function validateUser(user) {
  const schema = Joi.object({
    fname: Joi.string().min(3).max(25).required(),
    lname: Joi.string().min(1).max(25).required(),
    email: Joi.string().min(3).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
    type: Joi.string(),
    year: Joi.number().required().integer().max(4).positive(),
    usn:Joi.string().required(),

  });

  return schema.validate(user);
}

exports.Student = Student; 
exports.validate = validateUser;