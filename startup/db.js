const winston = require('winston');
const mongoose = require('mongoose');

module.exports = function () {
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
}