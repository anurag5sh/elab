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
    active:{
        type:Boolean,
        default : true
    },
    statement:{
        type: String,
        required: true,

    },
    difficulty:{
        type:String
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
    },
    description:{
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
    },
    autoJudge: {
        type: Boolean,
        default: false,
    },
    totalPoints:{
        type:Number,
        default:0
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
        judging: Joi.string().valid("true", "false").required(),
        i_sample1: [Joi.string().when('judging', { is: 'false', then: Joi.allow('') }), Joi.array().items(Joi.string())],
        o_sample1: [Joi.string().when('judging', { is: 'false', then: Joi.allow('') }), Joi.array().items(Joi.string())],
        i_testcase1: [Joi.string().when('judging', { is: 'false', then: Joi.allow('') }), Joi.array().items(Joi.string())],
        o_testcase1: [Joi.string().when('judging', { is: 'false', then: Joi.allow('') }), Joi.array().items(Joi.string())],
        explanation: Joi.string().when('judging', { is: 'false', then: Joi.allow('') }),
        points: [Joi.number().when('judging', { is: 'false', then: Joi.allow('') }), Joi.array().items(Joi.number())],
        totalPoints : Joi.number().when('judging', { is: 'true', then: Joi.allow('') }),
        difficulty:Joi.string().valid('Easy','Medium','Hard').required(),
        description:Joi.string().required(),
        languages:[Joi.string(),Joi.array().items(Joi.string())],
        active: Joi.string().valid("on", "off").allow('')
        
    });

    return schema.validate(question);
}

exports.ContestQ = ContestQ;
exports.validateCQ = validateCQ;