
module.exports = async function(req,res,next){
    if(req.session.name.endsWith(" ") ) next();
    else
    return res.status(404).end();
}