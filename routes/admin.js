const express = require('express');
const multer = require('multer');
const csv=require('csvtojson')
const router = express.Router();
const admin = require('../middleware/admin');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const {Student, validate} = require('../models/student');
const {Assignment,validateAssignment} = require('../models/assignment');

//------------------Accounts routes start-----------------//
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
//--------------------Accounts end------------------------------//


//-------------------Assignment routes start----------------------//

router.get('/assignment/new', admin, async (req,res) => {
    res.render('admin/addAssignment');
});

//create a new assignment
router.post('/assignment/new', admin, async (req,res) => { 
  const {error} = validateAssignment(req.body);
    if(error) return res.status(400).send(error.message);
    
    let starts,ends = null;
    try{
      starts = new Date(req.body.duration.split("-")[0]);
      ends = new Date(req.body.duration.split("-")[1]);
    }
    catch(err){
      return res.status(400).send("Wrong datetime format");
    }

    let sub,yr = null;
    switch(Number(req.body.sem)){
        case 1 : sub=0;yr=1;break;
        case 2: sub=1;yr=1;break;
        case 3: sub=1;yr=2;break;
        case 4:sub=2;yr=2;break;
        case 5: sub=2;yr=3;break;
        case 6:sub=3;yr=3;break;
        case 7:sub=3;yr=4;break;
        case 8: sub=4;yr=4;break;
        default : return res.status(400).send("Invalid Sem");
    }

    const batch = new Date().getFullYear() - sub;
    let num = null;
    let lastInserted = await Assignment.find({id:new RegExp('\^'+yr+"year"+batch)}).sort({_id:-1}).limit(1).lean().select('id');
    
    if(lastInserted[0]){
        lastInserted = lastInserted[0].id;
     num = lastInserted.substr(lastInserted.indexOf(batch)+4,lastInserted.length);
    num++;}
    else
     num = 1 ;
    let assignment = new Assignment();
    assignment.id = yr + "year" + batch + num;
    assignment.sem = Number(req.body.sem);
    assignment.duration.created = new Date();
    assignment.duration.starts =starts;
    assignment.duration.ends = ends;

    await assignment.save();
    res.send("Assignment Added Successfully!");

    
});

//editing an assignment
router.get('/assignment/edit', admin, async (req,res) => {
  const current = await Assignment.find({ 'duration.ends' :{$gt : new Date()} }).lean().select({id:1,sem:1,_id:0}).sort({id:1});
  
  res.render('admin/editAssignment',{current : current});
});

//get an assignment
router.get('/assignment/:id',admin,async (req,res) => {
  const assignment = await Assignment.findOne({id:req.params.id}).lean();
  if(!assignment) return res.status(400).send("Not Found");

  res.send(assignment);
});

router.get('/assignment/reports', admin, async (req,res) => {
  res.render('admin/assignmentReports');
});





module.exports = router;