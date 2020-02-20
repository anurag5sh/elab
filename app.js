require('express-async-errors');
const express = require('express');
const app = express();
const config = require('config');
const mongoose = require('mongoose');
const login = require('./routes/auth');
const register = require('./routes/register');
const contest = require('./routes/contest');
const practice = require('./routes/practice');
const admin = require('./routes/admin');
const api = require('./routes/api');
const assignment = require('./routes/assignment');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const errors = require('./middleware/errors');
const moment = require('moment');
const winston = require('winston');
require('winston-mongodb');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet')

const port = process.env.elab_port_no || 4000;

//fixing all deprecationWarning of mongoDB
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

function connectWithRetry(){
mongoose.connect('mongodb://localhost/elab').then(() => {
    winston.info("connected to mongo");
})
.catch((err)=> { winston.error("Error connecting to mongo",err);setTimeout(connectWithRetry, 5000);});
}
connectWithRetry();

app.use(express.static('public'));
app.set('view engine', 'pug');
app.set('views',__dirname+"/views");

app.use(helmet());
app.use(function(req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});

//logging
winston.configure({
  format : winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),winston.format.json(),winston.format.errors({stack:true})),
  transports : [new winston.transports.File({ filename: './logs/error.log', level: 'error'}),
  new winston.transports.File({ filename: './logs/combined.log' }),
  new winston.transports.MongoDB({db:"mongodb://localhost/elab",options:{useUnifiedTopology: true},level:'error',expireAfterSeconds:60*24*60*60,tryReconnect:true})]
});


if (process.env.NODE_ENV !== 'production') {
 winston.add(new winston.transports.Console)
}

winston.exceptions.handle(
  new winston.transports.File({filename:'./logs/exceptions.log',exitOnError:true})
);

process.on('unhandledRejection',(ex)=>{
  throw(ex);
});


//middleware
app.use(session({
    name:'elab',
    secret: 'elab',
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
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(mongoSanitize({
  replaceWith: '_'
}));

app.use('/', login)
app.use('/assignment', assignment);
app.use('/contest', contest);
app.use('/practice', practice);
app.use('/admin', admin);
app.use('/api',api);
app.use('/register', register);
app.use(errors);


app.listen(port,()=> {
    console.log("Listening on port"+ port);
});