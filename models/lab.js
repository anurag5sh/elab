const Joi = require("@hapi/joi");
const mongoose = require("mongoose");
const moment = require("moment");

const labSchema = new mongoose.Schema({
  createdBy: {
    type: String,
  },
  createdByName: {
    type: String,
    default: "",
  },
  timings: {
    created: { type: Date },
  },
  id: {
    type: Number,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  url: {
    type: String,
    required: true,
    unique: true,
  },
  custom_staff_id:{
    type:[String],
    default : []
  },
  customGroup:{
    type:[Number],
    default : []
   },
  isReady:{
    type: Boolean,
    default:false,
  },
  questions:{
    type:[String],
    default : []
  },
  rules:{
    type:String,
    default:''
  }
});

const Lab = mongoose.model("Lab", labSchema);

function validateLab(lab)
{
    const schema = Joi.object({
        name: Joi.string().required(),
        description:Joi.string().allow(''),
        status:Joi.string().allow('')
    });

    return schema.validate(lab,{escapeHtml:true});
}

exports.validateLab = validateLab;
exports.Lab = Lab;
