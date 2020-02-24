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
  }

});


const ArchivedStudents = mongoose.model('ArchivedStudent', studentSchema);

exports.ArchivedStudents = ArchivedStudents; 
