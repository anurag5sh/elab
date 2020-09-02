const config = require('config');
const Joi = require('@hapi/joi');
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  fname: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 30
  },
  lname: {
    type: String,
    minlength: 1,
    maxlength: 30,
    default:" "
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
    default:null
  },
  about_me : {
    type: String,
    maxlength: 300
  },
  profile_image: {
    type: String
  },
  resetToken :{
    type : String
  },
  tokenExpires : {
    type : Date
  },
  active : {
    type:Boolean,
    default:true
  },
  lastLogin :{
    type: Date,
    default : null
  },
  achievements:[{
    position : {type:Number},
    id :{type:String},
    _id:false
  }],
  batch :{
    type:Number
  }

});


const Student = mongoose.model('Student', studentSchema);

function validateUser(user) {
  const schema = Joi.object({
    fname: Joi.string().min(1).max(30).required(),
    lname: Joi.string().min(1).max(30).allow(''),
    email: Joi.string().min(3).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
    type: Joi.string(),
    year: Joi.number().required().integer().max(4).positive(),
    usn:Joi.string().required(),

  });

  return schema.validate(user,{escapeHtml:true});
}

exports.Student = Student; 
exports.validate = validateUser;