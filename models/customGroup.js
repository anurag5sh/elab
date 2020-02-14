const mongoose = require('mongoose');
const Joi = require('@hapi/joi');

const customSchema = new mongoose.Schema({
    id:{
        type:Number,
        required:true
    },
    createdBy:{
        type:String
    },
    name:{
        type:String,
        required:true,
        unique : true
    },
    description:{
        type:String
    },
    usn:{
        type:[String]
    },
    date :{
        type : Date,
        default: new Date
    }

});

const CustomGroup = mongoose.model('CustomGroup',customSchema);


function validateGroup(group)
{
    const schema = Joi.object({
        name: Joi.string().required(),
        description:Joi.string().required(),
        usn:Joi.array().items(Joi.string().required())
    });

    return schema.validate(group,{escapeHtml:true});
}

module.exports.CustomGroup = CustomGroup;
exports.validateGroup =validateGroup;