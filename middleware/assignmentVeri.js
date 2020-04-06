
module.exports = async function(req,res,next){
    if(req.session.isTeacher ) next();
    else
    return res.status(404).end();
}