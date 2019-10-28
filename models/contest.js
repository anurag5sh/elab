const Joi = require('@hapi/joi');
const mongoose = require('mongoose');
const moment = require('moment');

const contestschema = new mongoose.Schema({
  name:{
      type:String,
      required:true,
  }, 
  url:{
      type:String,

  },
  date:{

  },
  isReady:{
    type: Boolean,
    required:true,
  }
  
})