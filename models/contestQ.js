const Joi = require('@hapi/joi');
const mongoose = require('mongoose');
const moment = require('moment');



const contestQSchema = new mongoose.Schema({
    name:{
        type: String,
        required:true
    },
    qid:{
        type:String,
        default: moment().format('DDMMYY')
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
    }
    
});

const ContestQ = mongoose.model('ContestQ',contestQSchema);

function validateCQ(question)
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
        points : [Joi.number(),Joi.array().items(Joi.number())]
        
    });

    return schema.validate(question);
}

exports.ContestQ = ContestQ;
exports.validateCQ = validateCQ;