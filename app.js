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
const moment = require('moment');

const port = process.env.elab_port_no || 4000;

//fixing all deprecationWarning of mongoDB
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

mongoose.connect('mongodb://localhost/elab').then(() => {
    console.log("connected to mongo");
})
.catch((err)=> { console.log("Error connecting to mongo",err)});
    
app.use(express.static('public'));
app.set('view engine', 'pug');
app.set('views',__dirname+"/views");

app.use(function(req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});


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

app.use('/', login)
app.use('/assignment', assignment);
app.use('/contest', contest);
app.use('/practice', practice);
app.use('/admin', admin);
app.use('/api',api);
app.use('/register', register);



app.listen(port,()=> {
    console.log("Listening on port"+ port);
});