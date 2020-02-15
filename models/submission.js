const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
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
    year:{
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

const Submission = mongoose.model('Submission',submissionSchema);

exports.Submission = Submission;

