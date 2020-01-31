const mongoose = require('mongoose');

const assignmentSubmission = new mongoose.Schema({
    qid:{
        type:String
    },
    timestamp:{
        type:Date
    },
    language_id:{
        type:Number
    },
    usn:{
        type:String
    },
    sourceCode:{
        type:String
    },
    status:{
        type:String
    },
    points:{
        type: Number,default:0
    }
});

const aSubmission = mongoose.model('aSubmission',assignmentSubmission);

exports.aSubmission = aSubmission;

