const express = require('express');
const multer = require('multer');
const csv=require('csvtojson')
const router = express.Router();
const admin = require('../middleware/admin');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const {Student, validate} = require('../models/student');

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

router.get('/edit',admin, (req,res) => {
  res.render('admin/editAccount');
});

router.post('/add', upload.single('csv'), admin,async (req, res, next) => {
    const file = req.file;
    if (!file) {
      const error = new Error('Please upload a file');
      error.httpStatusCode = 400;
      return next(error.message);
    }
    
    const jsonArray=await csv().fromFile(file.path);
    
    if(req.body.type_csv == "student"){
      let studentArray = [];

      

      for(let i=0;i<jsonArray.length;i++){

        const { error } = validate(jsonArray[i]); 
        if (error) return res.status(400).send(error.message + " at index="+ i+1);

        let student = new Student(_.pick(jsonArray[i], ['name', 'email', 'password']));
        const salt = await bcrypt.genSalt(10);
        student.password = await bcrypt.hash(student.password, salt);
        studentArray.push(student);
      }
    
      Student.insertMany(studentArray,{ordered:false}).then(docs => {
          return res.send("All accounts added Successfully!");
      }).catch(err => { let e="";
        err.result.result.writeErrors.forEach(message);
        function message(value,index,array){
          e +=value.errmsg+ " at index " + value.index+"\n\r"; 
        }
          return res.send(e);
      });
      }
      else if(req.body.type_csv == "teacher"){
        res.send("Need to add");
      }
      else{
        res.send("Select account type");
      }

    
     
  })


module.exports = router;