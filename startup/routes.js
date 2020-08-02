const express = require('express');
const session = require('express-session');
const config = require('config');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet')
const cookieParser = require('cookie-parser');
const errors = require('../middleware/errors');
const rateLimiter = require('../middleware/rateLimiter');
const assignmentVeri = require('../middleware/assignmentVeri');
const login = require('../routes/auth');
const register = require('../routes/register');
const contest = require('../routes/contest');
const practice = require('../routes/practice');
const admin = require('../routes/admin');
const compiler_run = require('../routes/compiler_run');
const assignment = require('../routes/assignment');
const lab = require('../routes/lab');


module.exports = function(app){
    //rate Limiter
    //app.use(rateLimiter);

    //PugJS config
    app.use(express.static('public'));
    app.set('view engine', 'pug');
    app.set('views',__dirname+"/../views");
    app.locals.moment = require('moment');

    //trust proxy
    app.set('trust proxy',true);
    app.use(cookieParser());

    //security headers
    app.use(helmet());

    //middleware
    app.use(session({
        name:'elab',
        secret: config.get('session-secret'),
        cookie:{sameSite:"strict",maxAge:2*60*60*1000},
        resave: false,
        rolling:true,
        saveUninitialized: false,
        store: new MongoStore({
        mongooseConnection: mongoose.connection
        })
    }));
    app.use(function(req,res,next){
    res.locals.session = req.session;
    next();
    });
    app.use(express.urlencoded({extended:true,limit: '10mb'}));
    app.use(express.json({limit: '10mb'}));
    app.use(mongoSanitize({
    replaceWith: '_'
    }));


    //logic routes
    app.use('/', login)
    app.use('/assignment', assignmentVeri,assignment);
    app.use('/contest', contest);
    app.use('/practice', practice);
    app.use('/lab', lab);
    app.use('/admin',admin);
    app.use('/api',compiler_run);
    app.use('/register', register);
    app.use(errors);
}

