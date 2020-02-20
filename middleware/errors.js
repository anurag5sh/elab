const winston = require('winston');

module.exports = function (err,req,res,next){
    winston.error(err + err.stack);
    res.status(500).end();
}