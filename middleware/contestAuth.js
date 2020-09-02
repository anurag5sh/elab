const {Contest} = require('../models/contest');
const {CustomGroup} = require('../models/customGroup');

module.exports = async function(req,res,next){
    let contest = await Contest.findOne({url:req.params.curl});
    if(!contest) return res.status(404).end();
    res.locals.contest = contest;

    const groups = await CustomGroup.find({id:{$in: contest.customGroup}}).limit().select({usn:1,_id:0});
    let grp_usn = [];
    for(i of groups){
        grp_usn = grp_usn.concat(i.usn);
    }
    if(contest.batch.includes(req.session.batch) || contest.custom_usn.includes(req.session.usn) || grp_usn.includes(req.session.usn))
        return next();

    else if(req.session.staff_id ) next();
    else
    return res.status(404).send("Not Found");

}