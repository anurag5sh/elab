const Joi = require('@hapi/joi');
const bcrypt = require('bcryptjs');
//const _ = require('lodash');
const {Student} = require('../models/student');
const {Teacher} = require('../models/teacher')
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const teacher = require('../middleware/teacher');
const session = require('express-session');
const admin = require('../middleware/admin');
const {Practice} = require('../models/practice');
const {Contest} = require('../models/contest');

const fs = require('fs');

const multer = require('multer');
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/home/abdul/elab/profilePhotos')
  },
  filename: function (req, file, cb) {
    console.log(file);
    let file_name = file.originalname.split('.');
    cb(null, req.session.usn+'.'+file_name[1])
  }
  })
  let upload = multer({ storage: storage })

//filter teacher and student login
//redirect to respective dashboard
router.get('/',(req,res,next)=>{
  if (req.session && req.session.userId)
    if(req.session.staff_id) 
      return res.render('teacher/trdashboard');
    else
    return res.redirect('/dashboard');
  else  next();

}, (req,res) => {
    res.render('login');
});

//student dashboard
router.get('/dashboard', authenticate,async (req,res)=> {
    const q = await Practice.find().sort({date:-1}).limit(5).lean().catch(err => res.send(err));
    if(!req.session.staff_id)
    res.render('dashboard', {q:q});
    else
    res.status(404).end();

});

//logout route
router.get('/logout', function(req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function(err) {
      if(err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
});


//profile
router.get('/profile', authenticate,async function(req,res){

  if(req.session.staff_id){
    const teacher = await Teacher.findOne({ staff_id: req.session.staff_id }).lean().select('staff_id fname lname email recovery_email about_me');

    if(!teacher){
    return res.status(400).end();
  }
  res.render('teacher/profile',{teacher:teacher});
  }
  else{
    const student = await Student.findOne({ usn: req.session.usn }).lean().select('usn fname lname email recovery_email about_me profile_image');
  if(!student){
    return res.status(400).end();
  }
  res.render('profile',{student:student});
  }
  
});

router.post('/profile', authenticate, async (req, res) =>{
  if(!req.body.recovery_email || req.body.recovery_email.trim() == ''){
    return res.send("Recovery Email cannont be Blank please fill");
  }

  if(req.session.staff_id){
    let teacher = await Teacher.findOne({ staff_id: req.session.staff_id}).select('recovery_email about_me');
    if(!teacher) return res.status(400).send("Invalid ID");
    teacher.about_me = req.body.about_me;
    teacher.recovery_email = req.body.recovery_email;
    await teacher.save();
    res.send("Saved");
  }
  else{
    let student = await Student.findOne({ usn: req.session.usn }).select('recovery_email about_me');
    if(!student) return res.status(400).send("Invalid USN");
    student.recovery_email = req.body.recovery_email;
    student.about_me = req.body.about_me;
    await student.save();
    res.send("Saved");
  }
});

//password reset validation and updation
router.post('/password',authenticate, async (req, res)=>{

if(!req.body.current_password || req.body.current_password == ''){
  return res.status(400).send("Current Password Field is Blank");
}
else if(!req.body.new_password || req.body.new_password < 5){
  return res.status(400).send("New Password length should be of minimum 5 character long");
}
else if(!req.body.re_entered_password || req.body.re_entered_password < 5){
  return res.status(400).send("New Password length should be of minimum 5 character long");
}
  let user=null;
  if(req.session.staff_id)
  user = await Teacher.findOne({staff_id:req.session.staff_id}).select('password');
  else
  user = await Student.findOne({usn:req.session.usn}).select('password');
  
  if(req.body.new_password == req.body.re_entered_password){

    const changedPassword = await bcrypt.compare(req.body.current_password,user.password);

    if(changedPassword) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.new_password, salt);
      user.save();
      return res.send("Password Successfully Changed");
      
    }
    else
      return res.status(400).send("Current Password is Invalid");
  }
  else{
    return res.status(400).send("New password and Re-entered Password are not same");
  }

});


// Image Update

router.post('/uploadImage', async (req,res,next)=>{
  
  let student = await Student.findOne({usn: req.session.usn}).select('profile_image');
  if(student.profile_image != '/profileImage/default.png' ){
    const fileName = student.profile_image.split('.');
    fs.unlink('/home/abdul/elab/profilePhotos/'+req.session.usn + '.' + fileName[1] , async (err) => {
      if (err) {
        console.log(err);
      }
      
      // student.profile_image = '/profileImage/' + new_file_name + '.' + ext[1];
      // await student.save();
    });
  }next();
},upload.single('profile_image'), authenticate,async (req,res,next)=> {
  let student = await Student.findOne({usn: req.session.usn}).select('profile_image');
  
if(req.file){
  
  const ext = req.file.originalname.split('.');
  const new_file_name = req.session.usn;
 // const old_file_name = student.profile_image.split('.');
  student.profile_image = '/profileImage/' + new_file_name + '.' + ext[1];
    await student.save();
  
  // await student.save();
  return res.send("Profile Photo Updated");
}
else
{
  student.profile_image = '/profileImage/default.png';
  await student.save();
return res.status(400).send("No Image uploaded");
}
});

//download image
router.get('/profileImage/:name',authenticate,async (req,res)=>{
  fs.readFile('/home/abdul/elab/profilePhotos/'+req.params.name, function(err, data) {
      if(err) console.log(err);
      //res.writeHead(200, {'Content-Type': 'image/jpeg'});
      res.sendFile('/home/abdul/elab/profilePhotos/'+req.params.name);
      
  });
});

//login validation
router.post('/', async (req, res) => { console.log(req.body);
  const { error } = validate(req.body); 
  if (error) return res.render('login',{login_error:error.message});
  
  if(req.body.type === "student")
  {
    let student = await Student.findOne({ email: req.body.email });
    if (!student) return res.render('login',{login_error:"Invalid email or password"});

    const validPassword = await bcrypt.compare(req.body.password, student.password);
    if (!validPassword) return res.render('login',{login_error:"Invalid email or password"});

    req.session.fname = student.fname; 
    req.session.lname = student.lname;
    req.session.usn = student.usn;
    req.session.year = student.year;
    res.cookie("name", student.fname,{sameSite:"strict"});
    return res.redirect('/dashboard');
  }

  else if(req.body.type === "teacher")
  {
    let teacher = await Teacher.findOne({ email: req.body.email }).lean();
    if (!teacher) return res.render('login',{login_error:"Invalid email or password"});

    const validPassword = await bcrypt.compare(req.body.password, teacher.password);
    if (!validPassword) return res.render('login',{login_error:"Invalid email or password"});

    req.session.fname = teacher.fname;
    req.session.lname = teacher.lname;
    req.session.staff_id = teacher.staff_id;
    res.cookie("name", teacher.fname,{sameSite:"strict"});
    if(teacher.isAdmin){
      req.session.isAdmin = teacher.isAdmin;
      return res.redirect('/admin');
    }
    return res.render('teacher/trdashboard');
  }
  
  else{
    res.render('login',{login_error:"Invalid account type"});
  }
  
  
  
});

function validate(req) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
    type:Joi.string().required().error(new Error('Please select the account type'))
  });

  return schema.validate(req);
}

router.get('/students/:year',authenticate,teacher, async (req,res) =>{
  const students = await Student.find({ year: req.params.year }).lean().select({usn:1,fname:1,_id:0});
  if(!students) return res.status(400).send("Students not Found");

  res.send(students);

});

router.post('/students/:id',authenticate,teacher,async (req,res) =>{
  const contest = await Contest.findOne({id:req.params.id});
  contest.custom_usn = contest.custom_usn.concat(req.body.list);
  await contest.save();
  res.send("Students Added");
  
});


/* TEACHER'S ACCOUNT ROUTES

--------------------------------------------------------- */



module.exports = router; 
