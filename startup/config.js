const fs = require('fs');

module.exports = function(){

    //creating important directories
    fs.mkdir('./uploads', { recursive: true }, (err) => {
        if (err) throw err;
    });
    fs.mkdir('./reports', { recursive: true }, (err) => {
        if (err) throw err;
    });
    fs.mkdir('./public/profileImage/new', { recursive: true }, (err) => {
        if (err) throw err;
    });
  
}