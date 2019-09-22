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
        required:true,
        type: Map,
        of: String

    },
    sample_cases:{
        required:true,
        type: Map,
        of: String
    },
    date:{
        type: Date,
        default: moment().format()
    }
    
});

const Practice = mongoose.model('Practice',practiceSchema);

function validatePractise(question)
{
    const schema = Joi.object({
        name: Joi.string().required(),
        statement:Joi.string().required(),
        constraints: Joi.string(),
        input_format: Joi.string().required(),
        output_format: Joi.string().required(),
        test_cases:Joi.object().required(),
        sample_cases: Joi.object().required()
    });

    return schema.validate(question);
}

exports.Practice = Practice;
exports.validatePractise = validatePractise;