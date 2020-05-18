const Joi = require("@hapi/joi");
const mongoose = require("mongoose");
const moment = require("moment");

const labQSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    qid: {
        type: String,
        default: moment().format("DDMMYY"),
    },
    active:{
        type:Boolean,
        default : true
    },
    statement: {
        type: String,
        required: true,
    },
    difficulty: {
        type: String,
    },
    timings: {
        created: { type: Date },
        starts: { type: Date },
        ends: { type: Date },
    },
    constraints: {
        type: String,
        default: "",
    },
    input_format: {
        type: String,
        required: true,
    },
    output_format: {
        type: String,
        required: true,
    },
    test_cases: [
        {
            input: {
                type: String,
            },
            output: {
                type: String,
            },
            _id: false,
        },
    ],
    sample_cases: [
        {
            input: {
                type: String,
            },
            output: {
                type: String,
            },
            _id: false,
        },
    ],
    explanation: {
        type: String,
    },
    date: {
        type: Date,
        default: moment().format(),
    },
    description: {
        type: String,
    },
    solution: {
        language: { type: String },
        sourceCode: { type: String },
        _id: false,
    },
    languages: {
        type: [String],
        default: [],
    },
    autoJudge: {
        type: Boolean,
        default: false,
    },
    autoApproval:{
        type: Boolean,
        default: true,
    },
    submissions: [
        {
            timestamp: { type: Date },
            language_id: { type: Number },
            usn: { type: String },
            sourceCode: { type: String },
            status: { type: String },
            _id: false,
        },
    ],
});

const LabQ = mongoose.model("LabQ", labQSchema);

function validateLQ(question) {
    const schema = Joi.object({
        name: Joi.string().required(),
        statement: Joi.string().required(),
        constraints: Joi.string().allow(""),
        i_format: Joi.string().required(),
        o_format: Joi.string().required(),
        judging: Joi.string().valid("true", "false").required(),
        i_sample1: [Joi.string().when('judging', { is: 'false', then: Joi.allow('') }), Joi.array().items(Joi.string())],
        o_sample1: [Joi.string().when('judging', { is: 'false', then: Joi.allow('') }), Joi.array().items(Joi.string())],
        i_testcase1: [Joi.string().when('judging', { is: 'false', then: Joi.allow('') }), Joi.array().items(Joi.string())],
        o_testcase1: [Joi.string().when('judging', { is: 'false', then: Joi.allow('') }), Joi.array().items(Joi.string())],
        explanation: Joi.string().when('judging', { is: 'false', then: Joi.allow('') }),
        points: [Joi.number().when('judging', { is: 'false', then: Joi.allow('') }), Joi.array().items(Joi.number())],
        difficulty: Joi.string().valid("Easy", "Medium", "Hard").required(),
        description: Joi.string().required(),
        languages: [Joi.string(), Joi.array().items(Joi.string())],
        autoApproval: Joi.string().valid("true", "false").required(),
        active: Joi.string().valid("on", "off").allow(''),
        timings:Joi.string().required(),
    });

    return schema.validate(question);
}

exports.LabQ = LabQ;
exports.validateLQ = validateLQ;
