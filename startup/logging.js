require('express-async-errors');
const winston = require('winston');
require('winston-mongodb');

module.exports = function(){
    //logging
    winston.configure({
        format : winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),winston.format.json(),winston.format.errors({stack:true})),
        transports : [new winston.transports.File({ filename: './logs/error.log', level: 'error'}),
        new winston.transports.File({ filename: './logs/combined.log' }),
        new winston.transports.MongoDB({db:"mongodb://localhost/elab",options:{useUnifiedTopology: true},level:'error',expireAfterSeconds:60*24*60*60,tryReconnect:true})]
    });
    
    
    if (process.env.NODE_ENV != 'production') {
    winston.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
    }
    
    winston.exceptions.handle(
        new winston.transports.File({filename:'./logs/exceptions.log',exitOnError:true})
    );
    
    process.on('unhandledRejection',(ex)=>{
        throw(ex);
    });
  
}