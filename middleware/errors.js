const winston = require('winston');

module.exports = function (err,req,res,next){
    console.log(err);
    winston.error(err);
    res.status(500).end();
}