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

exports.Teacher = Teacher;