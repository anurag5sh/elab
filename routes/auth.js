const Joi = require('@hapi/joi');
const bcrypt = require('bcryptjs');
const config = require('config');
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
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const fs = require('fs');

const multer = require('multer');
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/profileImage')
  },
  filename: function (req, file, cb) {
    let file_name = file.originalname.split('.');
    if(req.session.staff_id)
    cb(null, req.session.staff_id+'.'+file_name[1])
    else
    cb(null, req.session.usn+'.'+file_name[1])
  }
  })
  let upload = multer({ storage: storage })

//filter teacher and student login
//redirect to respective dashboard
router.get('/',(req,res,next)=>{
  if (req.session && (req.session.staff_id || req.session.usn))
    if(req.session.staff_id) 
      return res.render('teacher/trdashboard');
    else
    return res.redirect('/dashboard');
  else  next();

}, (req,res) => {
    res.render('login');
});


//View Profile
router.get('/viewProfile/:usn',authenticate,async (req,res)=>{
    const student = await Student.findOne({usn:req.params.usn}).lean();
    if(!student) return res.status(400).send('Invalid USN');
    return res.render('viewProfile',{student:student});
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
        res.clearCookie('elab', {path: '/'});
        return res.redirect('/');
      }
    });
  }
});


//profile
router.get('/profile', authenticate,async function(req,res){

  if(req.session.staff_id){
    const teacher = await Teacher.findOne({ staff_id: req.session.staff_id }).lean().select('staff_id fname lname email recovery_email about_me profile_image');

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
  let user = null;
  let old_file =null;
  if(req.session.staff_id)
  {
    user = await Teacher.findOne({staff_id: req.session.staff_id}).select('profile_image');
    old_file = req.session.staff_id;
  }  
  else{
    user = await Student.findOne({usn: req.session.usn}).select('profile_image');
    old_file =req.session.usn;
  }
  // let student = await Student.findOne({usn: req.session.usn}).select('profile_image');
  if(user.profile_image != '/profileImage/default.png' ){
    const fileName = user.profile_image.split('.');
    fs.unlink('./public/profileImage/'+ old_file + '.' + fileName[1] , async (err) => {
      if (err) {
        console.log(err);
      }
      
      // student.profile_image = '/profileImage/' + new_file_name + '.' + ext[1];
      // await student.save();
    });
  }next();
},upload.single('profile_image'), authenticate,async (req,res,next)=> {
  let user = null;
  let old_file =null;
  if(req.session.staff_id)
  {
    user = await Teacher.findOne({staff_id: req.session.staff_id}).select('profile_image');
    old_file = req.session.staff_id;
  }  
  else{
    user = await Student.findOne({usn: req.session.usn}).select('profile_image');
    old_file =req.session.usn;
  }
  // let student = await Student.findOne({usn: req.session.usn}).select('profile_image');
if(req.file){
  
  const ext = req.file.originalname.split('.');
  const new_file_name = old_file;
 // const old_file_name = student.profile_image.split('.');
  user.profile_image = '/profileImage/' + new_file_name + '.' + ext[1];
    await user.save();
  
  // await student.save();
  return res.send("Profile Photo Updated");
}
else
{
  user.profile_image = '/profileImage/default.png';
  await user.save();
return res.status(400).send("No Image uploaded");
}
});

//first time user login logic
router.post('/first',authenticate,async (req,res)=>{
  let user = null;
  if(req.session.usn)user = await Student.findOne({usn:req.session.usn}).select('password recovery_email lastLogin');
  else user =  await Teacher.findOne({staff_id:req.session.staff_id}).select('password recovery_email lastLogin');
  
  if(!(user.lastLogin == null || user.recovery_email == null)) return res.status(404).end();

  if(req.body.password && req.body.recovery_email){

    const schema = Joi.object({
      recovery_email: Joi.string().min(3).max(255).required().email(),
      password: Joi.string().min(5).max(255).required(),
  
    });
    const {error} = schema.validate(req.body,{escapeHtml:true});
    if(error) return res.status(400).send(error.message);

    user.recovery_email = req.body.recovery_email;
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.new_password, salt);
    user.lastLogin = new Date();

    user.save();
    res.redirect('/');

  }
  else if(req.body.password){

    const schema = Joi.object({
      password: Joi.string().min(5).max(255).required()
    });
    const {error} = schema.validate(req.body,{escapeHtml:true});
    if(error) return res.status(400).send(error.message);

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.new_password, salt);
    user.lastLogin = new Date();
    user.save();
    res.redirect('/');
  }
  else if(req.body.recovery_email){
    const schema = Joi.object({
      recovery_email: Joi.string().min(3).max(255).required().email()
    });
    const {error} = schema.validate(req.body,{escapeHtml:true});
    if(error) return res.status(400).send(error.message);

    user.recovery_email = req.body.recovery_email;
    user.lastLogin = new Date();
    user.save();
    res.redirect('/');
  }
});


//login validation
router.post('/', async (req, res) => {
  const { error } = validate(req.body); 
  if (error) return res.status(400).send(error.message);

  if(req.body.type === "student")
  {
    let student = await Student.findOne({ email: req.body.email }).select('fname lname password usn year active lastLogin recovery_email -_id');
    if (!student) return res.status(400).send("Invalid Email or Password.");

    const validPassword = await bcrypt.compare(req.body.password, student.password);
    if (!validPassword) return res.status(400).send("Invalid Email or Password.");

    if(!student.active) return res.status(400).send("Account Disabled!");

    req.session.fname = student.fname; 
    req.session.lname = student.lname;
    req.session.usn = student.usn;
    req.session.year = student.year;
    if(student.recovery_email == null){
      if(student.lastLogin == null){
        res.render(''); //both
      }
      else{
        //only rec
      }
    }else{
      //only pass
    }

    student.lastLogin = new Date();
    await student.save();
    return res.send('/dashboard');
  }

  else if(req.body.type === "teacher")
  {
    let teacher = await Teacher.findOne({ email: req.body.email }).lean().select('fname lname password staff_id isAdmin active lastLogin recovery_email -_id');
    if (!teacher) return res.status(400).send("Invalid Email or Password.");

    const validPassword = await bcrypt.compare(req.body.password, teacher.password);
    if (!validPassword) return res.status(400).send("Invalid Email or Password.");

    if(!teacher.active) return res.status(400).send("Account Disabled!");

    req.session.fname = teacher.fname;
    req.session.lname = teacher.lname;
    req.session.staff_id = teacher.staff_id;
    req.session.isAdmin = teacher.isAdmin;

    if(teacher.recovery_email == null){
      if(teacher.lastLogin == null){
        res.render(''); //both
      }
      else{
        //only rec
      }
    }else{
      //only pass
    }

    if(teacher.isAdmin){
      teacher.lastLogin = new Date();
      await teacher.save();
      return res.send('/admin');
    }
    teacher.lastLogin = new Date();
    await teacher.save();
    return res.send('/');
  }
  
  else{
    res.status(400).send("Invalid account type");
  }
  
  
  
});

function validate(req) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
    type:Joi.string().required().error(new Error('Please select the account type'))
  });

  return schema.validate(req,{escapeHtml:true});
}

router.get('/forgotPassword',async (req,res)=>{
  res.render('forgotPassword');
});


router.post('/forgotPassword',async (req,res)=>{

  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    type:Joi.string().required().error(new Error('Please select the account type'))
  });

  const {error} = schema.validate(req.body);
  if(error ) return res.status(400).send(error.message);

  let user; let token;
  if(req.body.type == 'student'){
    user = await Student.findOne({email:req.body.email});
    if(!user) return res.status(400).send('User not found!');

    token = crypto.randomBytes(20).toString('hex');
    user.resetToken = token;
    user.tokenExpires = Date.now() + 3600000;
    await user.save();
  }
  else if(req.body.type == 'teacher'){

    user = await Teacher.findOne({email:req.body.email});
    if(!user) return res.status(400).send('User not found!');

    token = crypto.randomBytes(20).toString('hex');
    user.resetToken = token;
    user.tokenExpires = Date.now() + 3600000;
    await user.save();

  }
  else return res.status(400).send("Invalid account type");

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.get('elab-admin-mail.email'),
      pass: config.get('elab-admin-mail.password'),
    },
  });
  if(!user.recovery_email || user.recovery_email == '' || user.recovery_email==null) return res.status(400).send('Recovery Email not set!');
  const mailOptions = {
    from: config.get('elab-admin-mail.email'),
    to: `${user.recovery_email}`,
    subject: 'ELAB - Password Reset link',
    text:
      `Hi ${user.fname},\n\n`
      + 'You recently requested to reset your password for your Elab account. Click on the link below to reset it.\n\n'
      + `http://localhost:4000/resetPassword/${token}\n\n`
      + 'If you did not request this, please ignore this email and your password will remain unchanged. This reset link is valid only for next 1hr.\n',
  };

  transporter.sendMail(mailOptions, (err, response) => {
    if (err) {
      res.status(400).send("Unable to send the reset link.");
    } else {
      res.status(200).send('Recovery E-mail sent.');
    }
  });

});

//reset password via token
router.get('/resetPassword/:token',async (req,res) =>{ 
  let user;
  user = await Student.findOne({resetToken : req.params.token,tokenExpires:{$gt:Date.now()}});
  if(!user) user = await Teacher.findOne({resetToken : req.params.token,tokenExpires:{$gt:Date.now()}});

  if(!user) return res.status(400).send("Invalid or Expired token!");
  res.render('changePassword');
});

router.post('/resetPassword/:token', async (req,res)=>{
  let user;
  user = await Student.findOne({resetToken : req.params.token,tokenExpires:{$gt:Date.now()}});
  if(!user) user = await Teacher.findOne({resetToken : req.params.token,tokenExpires:{$gt:Date.now()}});

  if(!user) return res.status(400).send("Invalid or Expired token!");

  const schema = Joi.object({
    password: Joi.string().min(5).max(255).required(),
    cnf_password:Joi.string().min(5).max(255).required().equal(Joi.ref('password')).error(new Error("Passwords do not match!"))
  });

  const {error} = schema.validate(req.body);
  if (error) return res.status(400).send(error.message);

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(req.body.password, salt);
  user.resetToken = null;
  user.tokenExpires=null;
  user.save();

  res.send("Password updated! proceed to login page.");

});


module.exports = router; 
