const {Teacher} = require('../models/teacher');

module.exports= async function (req, res, next) {
    if (req.session && req.session.userId) {
        try{
            const admin = await Teacher.findById(req.session.userId).lean();
        if(admin.isAdmin)
        return next();
        else{
            const err = new Error('Forbidden');
            return res.send(err.message);
        }
        }
        catch{
            const err = new Error('Forbidden');
            return res.send(err.message);
        }
    } 
    else {
      var err = new Error('You must be logged in to view this page.');
      err.status = 401;
      return res.send(err.message);
    }
        
        
  }
