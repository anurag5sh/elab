const config = require('config');
const Joi = require('@hapi/joi');
const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50
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
  }
});


const Teacher = mongoose.model('Teacher', teacherSchema);

function validateTeacher(user) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().min(3).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
    type: Joi.string(),
    staff_id:Joi.number().required()
  });

  return schema.validateTeacher(user);
}

exports.Teacher = Teacher;
exports.validateTeacher = validateTeacher;