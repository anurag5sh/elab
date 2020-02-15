const Joi = require('@hapi/joi');
const mongoose = require('mongoose');


const assignmentSchema = new mongoose.Schema({
   id : {
       type: String,
       required : true,
       unique: true
   },
   sem:{
    type:Number,
    required : true,
    max : 8
   },
   duration:{
    created:{type:Date},
    starts:{type: Date},
    ends:{type:Date},
    _id : false,
  },
  isReady:{
    type: Boolean,
    default:false,
  },
  leaderboard:[{
    position:{type:Number},
    name:{type:String},
    usn:{type:String},
    timestamp:{type:Date},
    points:{type:Number},
    _id : false
  }],
  questions:{
    type:[String]
  },
  submissions:[{
    qid:{type:String},
    timestamp:{type:Date},
    usn:{type:String},
    sourceCode:{type:String},
    status:{type:String},
    points:{type: Number,default:0},
    language_id:{type:Number},
    _id : false
  }]

    
  });
  
  const Assignment = mongoose.model('Assignment',assignmentSchema);
  
  
  function validateAssignment(assignment)
  {
      const schema = Joi.object({
          sem : Joi.number().required().max(8),
          duration : Joi.string().required()

      });
  
      return schema.validate(assignment,{escapeHtml:true});
  }
  
  exports.validateAssignment = validateAssignment;
  exports.Assignment = Assignment;
