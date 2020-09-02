const Joi = require('@hapi/joi');
const mongoose = require('mongoose');
const moment = require('moment');

const contestSchema = new mongoose.Schema({
  createdBy:{
    type:String
  },
  createdByName:{
    type:String,
    default: ''
  },
  id:{
    type:Number
  },
  name:{
      type:String,
      required:true,
  },
  description:{
      type:String
  } ,
  url:{
      type:String,
      required:true,
      unique:true
  },
  timings:{
    created:{type:Date},
    starts:{type: Date},
    ends:{type:Date}
  },
  batch:{
    type:[Number],
    required:true,
    default : []
  },
  year:{
    type:[Number],
    required:true,
    default : []
  },
  custom_usn : {
    type:[String],
    default : []
  },
  custom_staff_id:{
    type:[String],
    default : []
  },
  customGroup:{
    type:[Number],
    default : []
   },
  isReady:{
    type: Boolean,
    default:false,
  },
  signedUp:[{
    usn:{type : String},
    name:{type:String},
    time:{ type: Date, default:new Date()},
    year:{type:String},
    _id : false
  }],
  questions:{
    type:[String],
    default : []
  },
  submissions:[{
    qid:{type:String},
    timestamp:{type:Date},
    language_id:{type:Number},
    usn:{type:String},
    year:{type:String},
    sourceCode:{type:String},
    status:{type:String},
    points:{type: Number,default:0}
  }],
  leaderboard:[{
    name:{type:String},
    usn:{type:String},
    timestamp:{type:Date},
    year:{type:String},
    points:{type:Number},
    _id : false
  }],
  rules:{
    type:String,
    default:''
  },
  image:{type:String}
  
});

const Contest = mongoose.model('Contest',contestSchema);


function validateContest(contest)
{
    const schema = Joi.object({
        name: Joi.string().required(),
        timings:Joi.string().required(),
        year:[Joi.number(),Joi.array().items(Joi.number().required())],
        description:Joi.string().allow(''),
        status:Joi.string().allow('')
    });

    return schema.validate(contest,{escapeHtml:true});
}

exports.validateContest = validateContest;
exports.Contest = Contest;