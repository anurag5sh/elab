const Joi = require('@hapi/joi');
const mongoose = require('mongoose');
const moment = require('moment');

const contestSchema = new mongoose.Schema({
  secret:{
    type:String
  },
  createdBy:{
    type:mongoose.Schema.Types.ObjectId
  },
  id:{
    type:Number
  },
  name:{
      type:String,
      required:true,
  }, 
  url:{
      type:String,
      required:true
  },
  timings:{
    created:{type:Date},
    starts:{type: Date},
    ends:{type:Date}
  },
  year:[{
    type:Number
  }],
  custom_usn : {
    type:[String]
  },
  isReady:{
    type: Boolean,
    default:false,
  },
  signedUp:[{
    usn:{type : String},
    time:{ type: Date, default:Date.now()},
    _id : false
  }],
  questions:{
    type:[String]
  },
  submissions:{
    qid:{type:String},
    timestamp:{type:Date},
    usn:{type:String},
    sourceCode:{type:String},
    status:{type:String},
    points:{type: Number,default:0},
    _id : false
  },
  leaderboard:{
    position:{type:Number},
    name:{type:String},
    timestamp:{type:Date},
    year:{type:String},
    points:{type:Number},
    _id : false
  }
  
});

const Contest = mongoose.model('Contest',contestSchema);


function validateContest(contest)
{
    const schema = Joi.object({
        name: Joi.string().required(),
        starts: Joi.date().required().timestamp(),
        ends:Joi.date().required().greater(Joi.ref('starts')).timestamp().error(new Error("Invalid Date Selected!")),
        year:[Joi.number(),Joi.array().items(Joi.number().required())]
    });

    return schema.validate(contest);
}

exports.validateContest = validateContest;
exports.Contest = Contest;