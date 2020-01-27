const {Contest} = require('../models/contest');

module.exports = async function(req,res,next){
    let contest = await Contest.findOne({url:req.params.curl}).lean().select('year custom_usn');
    if(!contest) return res.status(404).end();

    if(contest.year.includes(req.session.year) || contest.custom_usn.includes(req.session.usn))
        return next();

    else if(req.session.staff_id ) next();
    else
    return res.status(404).send("Not Found");

}