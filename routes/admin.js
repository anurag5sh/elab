const express = require('express');
const multer = require('multer');
const csv=require('csvtojson')
const router = express.Router();
const admin = require('../middleware/admin');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const {Student, validate} = require('../models/student');
const {Teacher,validateTeacher} = require('../models/teacher');
const {Assignment,validateAssignment} = require('../models/assignment');
const {AssignmentQ,validateAQ} = require('../models/assignmentQ');
const fs = require('fs');
const Joi = require("@hapi/joi");
const winston = require('winston');

//------------------Accounts routes start-----------------//
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
    })
   
let upload = multer({ storage: storage })

router.get('/', admin, (req,res)=> {
    res.render('admin/admin',{name:req.session.fname});
});

//Logs
router.get('/logs',admin,async (req,res)=>{
  const options = {
    from: new Date() - (24 * 60 * 60 * 1000),
    until: new Date(),
    limit: 10,
    start: 0,
    order: 'desc',
    fields: ['message']
  };
   
  winston.query(options, function (err, results) {
    if (err) {
      throw err;
    }
   
    console.log(results);
    res.send(results);
  });
});


//fetching teachers
router.get('/get/teachers',admin,async (req,res)=>{
  let list = await Teacher.find().lean().select('fname lname staff_id -_id');
  if(!list) return res.send([]);
  
  for(let i=0;i<list.length;i++){
    list[i].name = list[i].fname + " " + list[i].lname;
    list[i].edit = '<a class="fas fa-edit" data-toggle="modal" data-target="#editTeacher" data-id="'+list[i].staff_id+'" style="color:dimgrey;" href=""></a>';
    list[i].delete = '<a class="fas fa-trash" data-toggle="modal" data-target="#delete" data-id="'+list[i].staff_id+'" data-teacher="true" style="color:red;" href=""></a>';

    delete list[i].fname;
    delete list[i].lname;
  }
  res.send(list);
});

//fetching a teacher's info
router.get('/get/teacher/:id',admin,async (req,res)=>{
  const teacher = await Teacher.findOne({staff_id:req.params.id}).lean().select('fname lname staff_id email recovery_email isAdmin -_id');
  if(!teacher) return res.status(400).send("Invalid ID");

  res.send(teacher);
});

//editing a teacher's data
router.post('/teacher/:id',admin,async (req,res)=>{
  let teacher = await Teacher.findOne({staff_id:req.params.id});
  if(!teacher) return res.status(400).send("Invalid ID");

  const schema = Joi.object({
    fnameT: Joi.string().min(3).max(25).required(),
    lnameT: Joi.string().min(1).max(25).required(),
    emailT: Joi.string().min(3).max(255).required().email(),
    passwordT: Joi.string().min(5).max(255).allow(''),
    recovery_emailT: Joi.string().email().min(3).max(255),
    staff_id:Joi.number().required(),
    isAdmin:Joi.boolean().required(),
    activeT:Joi.boolean().required()
  });

  const {error} = schema.validate(req.body,{escapeHtml:true});
  if(error) return res.status(400).send(error.message);

  teacher.fname = req.body.fnameT;
  teacher.lname = req.body.lnameT;
  teacher.email = req.body.emailT;
  teacher.recovery_email = req.body.recovery_emailT;
  teacher.isAdmin = req.body.isAdmin;
  teacher.staff_id = req.body.staff_id;
  teacher.active = req.body.activeT;
  
  if(!req.body.passwordT == ''){
    const salt = await bcrypt.genSalt(10);
    teacher.password = await bcrypt.hash(req.body.passwordT, salt);
  }

  await teacher.save().catch((err)=>{
    return res.status(400).send("Unable to save.");
  });
  res.send("Changes Saved!");
});

//deleting a teacher
router.get('/delete/teacher/:id',admin,async (req,res)=>{
  await Teacher.findOneAndDelete({staff_id:req.params.id}).then(()=>{
    return res.send("Account deleted!");
  }).catch((err)=>{
    return res.status(400).send("Unable to delete!");
  })
});

//fetching students in a year
router.get('/get/students/:year',admin,async (req,res)=>{
    let list = await Student.find({year:req.params.year}).sort({usn:1}).select('usn fname lname -_id').lean();
    if(!list) return res.send([]);

    for(let i=0;i<list.length;i++){
      list[i].name = list[i].fname + " " + list[i].lname;
      list[i].edit = '<a class="fas fa-edit" data-toggle="modal" data-target="#edit" data-usn="'+list[i].usn+'" style="color:dimgrey;" href=""></a>';
      list[i].delete = '<a class="fas fa-trash" data-toggle="modal" data-target="#delete" data-usn="'+list[i].usn+'" style="color:red;" href=""></a>';

      delete list[i].fname;
      delete list[i].lname;
    }
    res.send(list);
});

//fetching a student info
router.get('/get/student/:usn',admin,async (req,res)=>{
  const student = await Student.findOne({usn:req.params.usn}).lean().select('fname lname usn email recovery_email year -_id');
  if(!student) return res.status(400).send("Invalid USN");

  res.send(student);
});

//editing student info
router.post('/student/:usn',admin,async (req,res)=>{
  let student = await Student.findOne({usn:req.params.usn});
  if(!student) return res.status(400).send("Invalid USN");

  const schema = Joi.object({
    fname: Joi.string().min(3).max(25).required(),
    lname: Joi.string().min(1).max(25).required(),
    email: Joi.string().min(3).max(255).required().email(),
    password: Joi.string().min(5).max(255).allow(''),
    recovery_email: Joi.string().email().min(3).max(255),
    year: Joi.number().required().integer().max(4).positive(),
    usn:Joi.string().required(),
    active: Joi.boolean().required()
  });

  const {error} = schema.validate(req.body,{escapeHtml:true});
  if(error) return res.status(400).send(error.message);

  student.fname = req.body.fname;
  student.lname = req.body.lname;
  student.email = req.body.email;
  student.recovery_email = req.body.recovery_email;
  student.year = req.body.year;
  student.usn = req.body.usn;
  student.active = req.body.active;
  
  if(!req.body.password == ''){
    const salt = await bcrypt.genSalt(10);
    student.password = await bcrypt.hash(req.body.password, salt);
  }

  await student.save().catch((err)=>{
    return res.status(400).send("Unable to save.");
  });
  res.send("Changes Saved!");
});

//deleting a student
router.get('/delete/student/:usn',admin,async (req,res)=>{
    await Student.findOneAndDelete({usn:req.params.usn}).then(()=>{
      return res.send("Account deleted!");
    }).catch((err)=>{
      return res.status(400).send("Unable to delete!");
    })
});

router.get('/add',admin, (req,res) => {
    res.render('admin/addAccount');
});

router.get('/edit',admin, (req,res) => {
  res.render('admin/editAccount');
});

router.get('/academic',admin, (req,res)=>{
  res.render('admin/academicYear');
});

router.post('/add', upload.single('csv'), admin,async (req, res, next) => {
    const file = req.file;
    if (!file) {
      const error = new Error('Please upload a file');
      error.httpStatusCode = 400;
      return next(error.message);
    }
    
    const jsonArray=await csv().fromFile(file.path);
    fs.unlink(file.path , async (err) => {
      if (err) {
        throw(err);
      }
    });
    
    if(req.body.type_csv == "student"){
      let studentArray = [];

      

      for(let i=0;i<jsonArray.length;i++){

        const { error } = validate(jsonArray[i]); 
        if (error) return res.status(400).send(error.message + " at column index="+ i+2);

        let student = new Student(_.pick(jsonArray[i], ['fname', 'lname','email', 'password','year','usn']));
        const salt = await bcrypt.genSalt(10);
        student.password = await bcrypt.hash(student.password, salt);
        studentArray.push(student);
      }
    
      Student.insertMany(studentArray,{ordered:false}).then(docs => {
          return res.send("All accounts added Successfully!");
      }).catch(err => { let e="The following accounts were not created due to data error, re-upload the csv files with only these accounts. All other accounts were added successfully.<br><br>",i=1;
        err.result.result.writeErrors.forEach(message);
        function message(value,index,array){
          e +=i++ + ") "+value.errmsg+ " at column index " + (value.index+2)+" <br>"; 
        }
          return res.status(400).send(e);
      });
      }
      else if(req.body.type_csv == "teacher"){
        let teacherArray = [];

        for(let i=0;i<jsonArray.length;i++){
        const { error } = validateTeacher(jsonArray[i]); 
        if (error) return res.status(400).send(error.message + " at column index="+ i+2);

        let teacher = new Teacher(_.pick(jsonArray[i], ['fname', 'lname','email', 'password','staff_id']));
        const salt = await bcrypt.genSalt(10);
        teacher.password = await bcrypt.hash(teacher.password, salt);
        teacherArray.push(teacher);
      }
    
      Teacher.insertMany(teacherArray,{ordered:false}).then(docs => {
          return res.send("All accounts added Successfully!");
                  }).catch(err => { let e="The following accounts were not created due to data error, re-upload the csv files with only these accounts. All other accounts were added successfully. <br><br>",i=1;
        err.result.result.writeErrors.forEach(message);
        function message(value,index,array){
          e +=i++ + ") "+value.errmsg+ " at column index " + (value.index+2)+" <br>"; 
        }
          return res.status(400).send(e);
      });
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

//updating assignment
router.post('/assignment/edit',admin,async (req,res) => {
  let ready = false;
  if(req.body.isReady) ready = true;
  let starts,ends = null;
    try{
      starts = new Date(req.body.duration.split("-")[0]);
      ends = new Date(req.body.duration.split("-")[1]);
    }
    catch(err){
      return res.status(400).send("Wrong datetime format");
    }
  
  let update = {'duration.starts' : starts,'duration.ends':ends,isReady:ready};

  const assignment = await Assignment.findOneAndUpdate({id:req.body.aId},update);
  if(!assignment) return res.status(400).send('Invalid ID');

  res.status(200).send("Changes Saved.");
});

router.get('/assignment/reports', admin, async (req,res) => {
  res.render('admin/assignmentReports');
});

//deleting assignment
router.get('/assignment/delete/:aId',admin,async (req,res) => {
  const del = await Assignment.findOneAndDelete({id:req.params.aId},{'duration.ends' :{$gt : new Date()}});
  if(!del) return res.status(400).send('Invalid ID');

  await AssignmentQ.deleteMany({assignmentId:req.params.aId});

  res.status(200).send('Assignment with ID : '+req.params.aId+' Deleted.');
});


//---------------------------------Yearback and Promotion Logic ---------------------------------------

router.get('/promote',admin, async (req,res)=>{
  await Student.updateMany({},{$inc : {year:1}}).catch((err)=>{
    winston.error(err);
    res.status(400).send("Unable to perform this operation.");
  }).then(()=>{
    res.send("Operation Successful!")
  });
}); 

router.post('/yearback',admin, async (req,res)=>{
  
});



module.exports = router;