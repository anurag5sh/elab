const mongoose = require('mongoose');

const customSchema = new mongoose.Schema({
    createdBy:{
        type:String
    },
    name:{
        type:String,
        required:true
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

module.exports.CustomGroup = CustomGroup;