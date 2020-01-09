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
        
    },
    input_format:{
        type: String,
        required:true,
    },
    output_format:{
        type: String,
        required:true,
    },
    test_cases:{
      input:{
          type:[String]
      },
      output:{
          type:[String]
      }  
    },
    sample_cases:{
        input:{
            type:[String]
        },
        output:{
            type:[String]
        }  
      },
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
        constraints: Joi.string(),
        i_format: Joi.string().required(),
        o_format: Joi.string().required(),
        i_sample1: Joi.required(),
        o_sample1: Joi.required(),
        i_testcase1: Joi.required(),
        o_testcase1: Joi.required(),
        explanation: Joi.string().required()
        
    });

    return schema.validate(question);
}

exports.ContestQ = ContestQ;
exports.validateCQ = validateCQ;