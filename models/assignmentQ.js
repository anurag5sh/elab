const Joi = require('@hapi/joi');
const mongoose = require('mongoose');
const moment = require('moment');

const assignmentQSchema = new mongoose.Schema({
    assignmentId : {
        type: String,
        required : true
    },
    qid:{
        type:String,
    },
    createdBy:{type:String},
    createdByName:{type:String},
    name:{
        type: String,
        required:true
    },
    statement:{
        type: String,
        required: true,

    },
    constraints:{
        type: String,
        default : ""
        
    },
    input_format:{
        type: String,
        required:true,
    },
    output_format:{
        type: String,
        required:true,
    },
    test_cases:[{
      input:{
          type:String
      },
      output:{
          type:String
      }  ,
      points :{
        type: Number
      },
      _id : false
    }],
    sample_cases:[{
        input:{
            type:String
        },
        output:{
            type:String
        }  ,
        _id : false
      }],
    explanation:{
        type:String
    },
    date:{
        type: Date,
        default: moment().format()
    },
    description:{
        type:String
    },
    difficulty:{
        type:String
    },
    solution:{
        language:{type:String},
        sourceCode:{type:String},
        _id:false
    },
    languages:{
        type:[String],
        default:[]
    }
    
});

const AssignmentQ = mongoose.model('AssignmentQ',assignmentQSchema);

function validateAQ(question)
{
    const schema = Joi.object({
        aId : Joi.string().required(),
        name: Joi.string().required(),
        statement:Joi.string().required(),
        constraints: Joi.string().allow(''),
        i_format: Joi.string().required(),
        o_format: Joi.string().required(),
        i_sample1: [Joi.string(),Joi.array().items(Joi.string())],
        o_sample1: [Joi.string(),Joi.array().items(Joi.string())],
        i_testcase1: [Joi.string(),Joi.array().items(Joi.string())],
        o_testcase1: [Joi.string(),Joi.array().items(Joi.string())],
        points:[Joi.number(),Joi.array().items(Joi.number())],
        explanation: Joi.string().required(),
        difficulty:Joi.string().valid('Easy','Medium','Hard').required(),
        description:Joi.string().required(),
        languages:[Joi.string(),Joi.array().items(Joi.string())]
        
    });

    return schema.validate(question,{escapeHtml:true});
}


exports.AssignmentQ = AssignmentQ;
exports.validateAQ = validateAQ;