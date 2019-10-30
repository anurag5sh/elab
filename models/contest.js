const Joi = require('@hapi/joi');
const mongoose = require('mongoose');
const moment = require('moment');

const contestSchema = new mongoose.Schema({
  secret:{},
  id:{},
  name:{
      type:String,
      required:true,
  }, 
  url:{
      type:String,
      required:true
  },
  date:{

  },
  year:{},
  
  isReady:{
    type: Boolean,
    required:true,
  }
  
})