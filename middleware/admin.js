const {Teacher} = require('../models/teacher');

module.exports= async function (req, res, next) {
    if (req.session && req.session.staff_id) {
        try{
            const admin = await Teacher.findOne({staff_id:req.session.staff_id}).lean().select('isAdmin');
        if(admin.isAdmin)
        return next();
        else{
            const err = new Error('Forbidden');
            return res.status(403).send(err.message);
        }
        }
        catch{
            const err = new Error('Forbidden');
            return res.status(403).send(err.message);
        }
    } 
    else {
        req.session.redirectTO = req.originalUrl;
        return res.redirect('/');
    }
        
        
  }
