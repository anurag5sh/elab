const config = require('config');
const Joi = require('@hapi/joi');
const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
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
  staff_id:{
    type:Number,
    required:true,
    unique:true
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024
  },
  isAdmin:{
      type:Boolean,
      default:false
  },
  isTeacher:{
      type:Boolean,
      default:true
  },
  recovery_email : {
    type: String,
  },
  about_me : {
    type: String,
    maxlength: 300
  }
});


const Teacher = mongoose.model('Teacher', teacherSchema);

function validateTeacher(user) {
  const schema = Joi.object({
    fname: Joi.string().min(3).max(25).required(),
    lname: Joi.string().min(1).max(25).required(),
    email: Joi.string().min(3).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
    type: Joi.string(),
    staff_id:Joi.number().required()
  });

  return schema.validateTeacher(user);
}

exports.Teacher = Teacher;
exports.validateTeacher = validateTeacher;