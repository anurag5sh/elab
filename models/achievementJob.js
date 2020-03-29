const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  contest_id : {
      type:Number,
      required : true,
      unique:true
  },
  ends : {
      type: Date,
      required:true
  }
});


const Achievements = mongoose.model('Achievement',achievementSchema);

exports.Achievements = Achievements; 
