const Joi = require('@hapi/joi');
const mongoose = require('mongoose');

const practiceSchema = new mongoose.Schema({
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
        default: Date.now()
    }
    
});

const Practice = mongoose.model('Practice',practiceSchema);

function validatePractise(question)
{
    const schema = Joi.object({
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