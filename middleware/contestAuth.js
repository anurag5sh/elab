const {Contest} = require('../models/contest');
const {CustomGroup} = require('../models/customGroup');

module.exports = async function(req,res,next){
    let contest = await Contest.findOne({url:req.params.curl}).lean().select('year custom_usn customGroup');
    if(!contest) return res.status(404).end();

    const groups = await CustomGroup.find({id:{$in: contest.customGroup}}).limit().select({usn:1,_id:0});
    let grp_usn = [];
    for(i of groups)
        grp_usn = grp_usn.concat(i.usn);
    if(contest.year.includes(req.session.year) || contest.custom_usn.includes(req.session.usn) || grp_usn.includes(req.session.usn))
        return next();

    else if(req.session.staff_id ) next();
    else
    return res.status(404).send("Not Found");

}