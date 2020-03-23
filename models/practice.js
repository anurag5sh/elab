const Joi = require('@hapi/joi');
const mongoose = require('mongoose');
const moment = require('moment');



const practiceSchema = new mongoose.Schema({
    name:{
        type: String,
        required:true
    },
    qid:{
        type:String,
        default: moment().format('DDMMYY')
    },
    createdBy:{type:String},
    createdByName:{type:String},
    statement:{
        type: String,
        required: true,

    },
    constraints:{
        type: String,
        
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
        } ,
        points:{
            type:Number
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
    submissions:[{
        timestamp:{type:Date},
        language_id:{type:Number},
        usn:{type:String},
        year:{type:String},
        sourceCode:{type:String},
        status:{type:String},
        points:{type: Number,default:0},
        _id : false
      }],
    languages:{
    type:[String],
    default:[]
    }
    
});

const Practice = mongoose.model('Practice',practiceSchema);

function validatePractise(question)
{
    const schema = Joi.object({
        name: Joi.string().required(),
        statement:Joi.string().required(),
        constraints: Joi.string().allow(''),
        i_format: Joi.string().required(),
        o_format: Joi.string().required(),
        i_sample1: [Joi.string(),Joi.array().items(Joi.string())],
        o_sample1: [Joi.string(),Joi.array().items(Joi.string())],
        i_testcase1: [Joi.string(),Joi.array().items(Joi.string())],
        o_testcase1: [Joi.string(),Joi.array().items(Joi.string())],
        explanation: Joi.string().required(),
        points:[Joi.number(),Joi.array().items(Joi.number())],
        difficulty:Joi.string().valid('Easy','Medium','Hard').required(),
        description:Joi.string().required(),
        languages:[Joi.string(),Joi.array().items(Joi.string())]
    });

    return schema.validate(question,{escapeHtml:true});
}

exports.Practice = Practice;
exports.validatePractise = validatePractise;