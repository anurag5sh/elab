
module.exports = async function(req,res,next){
    if(req.session.staff_id ) next();
    else
    return res.status(404).end();
}