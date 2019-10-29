const express = require('express');
const multer = require('multer');
const csv=require('csvtojson')
const router = express.Router();
const admin = require('../middleware/admin');


let storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, '/home/anurag/uploads')
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now())
    }
    })
   
let upload = multer({ storage: storage })

router.get('/', admin, (req,res)=> {
    res.render('admin/admin',{name:req.session.name});
});

router.get('/add',admin, (req,res) => {
    res.render('admin/addAccount');
});

router.post('/add', upload.single('csv'), async (req, res, next) => {
    const file = req.file;
    if (!file) {
      const error = new Error('Please upload a file');
      error.httpStatusCode = 400;
      return next(error);
    }
    
    const jsonArray=await csv().fromFile(file.path);
    res.send(jsonArray);
    
  })


module.exports = router;