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
const winston = require('winston');
const {Submission} = require('../models/submission');

const fs = require('fs');

const multer = require('multer');
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/profileImage/new/')
  },
  filename: function (req, file, cb) {
    let file_name = file.originalname.split('.');
    if(req.session.staff_id)
    cb(null, req.session.staff_id+'.'+file_name[1])
    else
    cb(null, req.session.usn+'.'+file_name[1])
  }
  });
  let upload = multer({ storage: storage,
    fileFilter : async (req, file, cb) => { 
      if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
        //deleting old image
        let user = null;
        let old_file =null;
        if(req.session.staff_id)
        {
          user = await Teacher.findOne({staff_id: req.session.staff_id}).select('profile_image').lean();
          old_file = req.session.staff_id;
        }  
        else{
          user = await Student.findOne({usn: req.session.usn}).select('profile_image').lean();
          old_file =req.session.usn;
        }
        
        if(user.profile_image != '/profileImage/default.png' ){
          const fileName = user.profile_image.split('.');
          fs.access('./public/profileImage/new/'+ old_file + '.' + fileName[1], fs.F_OK, (err) => {
            if(!err){
              fs.unlink('./public/profileImage/new/'+ old_file + '.' + fileName[1] ,(err) => {
                if (err) { 
                  winston.error(err);
                }
              });
            }
          });
        }
        cb(null, true);
      } else { req.fileTypeError = 'Only .png, .jpg and .jpeg format allowed!';
        cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
      }
    } }).single('profile_image');

//filter teacher and student login
//redirect to respective dashboard
router.get('/',async (req,res,next)=>{
  if (req.session && (req.session.staff_id || req.session.usn))
    if(req.session.staff_id){
      const contest = await Contest.find({'timings.starts':{$lt:new Date()},isReady:true}).sort({'timings.ends':-1}).limit(7).lean();
      let labels=[];
      let signedup=[];
      let submissions=[];
      contest.forEach(async (item,index)=>{
        labels.push(item.name+"");
        signedup.push(item.signedUp.length);
        submissions.push(item.submissions.length );
      });

      const practice = await Practice.find().sort({_id:-1}).limit(3).lean();
      const contest3 = await Contest.find({createdBy:req.session.staff_id}).sort({_id:-1}).lean().select('name url description image').limit(3);
      return res.render('teacher/trdashboard',{labels:labels,signedup:signedup,submissions:submissions,practice:practice,contest3:contest3});
    } 
     
    else
    return res.redirect('/dashboard');
  else  next();

}, (req,res) => {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.render('login');
});


//View Profile
router.get('/viewProfile/:id',authenticate,async (req,res)=>{
    let user = await Student.findOne({usn:req.params.id}).lean();
    if(!user) {
      user = await Teacher.findOne({staff_id:req.params.id}).lean();
      if(!user) return res.status(400).send('Invalid ID');
    }
    if(req.session.usn){
      return res.render('viewProfile',{user:user});
    }
    else{
      return res.render('teacher/viewProfile',{user:user});
    }
    
});

//student dashboard
router.get('/dashboard', authenticate,async (req,res)=> {
    const q = await Practice.find().sort({date:-1}).limit(2).lean().select('name qid').catch(err => res.send(err));
    const contest = await Contest.find({isReady:true}).sort({_id:-1}).limit(2).lean().select('name description url image ').catch(err => res.send(err));
    if(!req.session.staff_id)
    res.render('dashboard', {q:q,contest:contest});
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
    const student = await Student.findOne({ usn: req.session.usn }).lean().select('usn fname lname email year recovery_email about_me profile_image');
  if(!student){
    return res.status(400).end();
  }
  res.render('profile',{student:student});
  }
  
});

router.post('/profile', authenticate, async (req, res) =>{
  if(!req.body.recovery_email || req.body.recovery_email.trim() == ''){
    return res.send("Recovery Email cannot be blank please fill.");
  }
  const schema = Joi.object({
    recovery_email: Joi.string().min(3).max(255).required().email(),
    verifyPassword: Joi.string().required().error(new Error("Password not entered!")),
    about_me:Joi.string().allow('')
  });
  const {error} = schema.validate(req.body,{escapeHtml:true});
  if(error) return res.status(400).send(error.message);

  if(req.session.staff_id){
    let teacher = await Teacher.findOne({ staff_id: req.session.staff_id}).select('recovery_email about_me password');
    if(!teacher) return res.status(400).send("Invalid ID");

    const validPassword = await bcrypt.compare(req.body.verifyPassword, teacher.password);
    if (!validPassword) return res.status(400).send("Wrong Password.");

    teacher.about_me = req.body.about_me;
    teacher.recovery_email = req.body.recovery_email;
    await teacher.save();
    res.send("Saved");
  }
  else{
    let student = await Student.findOne({ usn: req.session.usn }).select('recovery_email about_me password');
    if(!student) return res.status(400).send("Invalid USN");

    const validPassword = await bcrypt.compare(req.body.verifyPassword, student.password);
    if (!validPassword) return res.status(400).send("Wrong Password.");

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
router.post('/uploadImage',authenticate,async (req,res,next)=> {
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

  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
        winston.error(err);
    } else if (err) {
      if(req.fileTypeError)
      return res.status(400).send(req.fileTypeError);
      else
      {
        winston.error(err);
        return res.end();
      }
    }

    if(req.file){
      const ext = req.file.originalname.split('.');
      const new_file_name = old_file;
      user.profile_image = '/profileImage/new/' + new_file_name + '.' + ext[1];
        await user.save();
      
      return res.send("Profile Photo Updated");
      }
      else
      {
      user.profile_image = '/profileImage/default.png';
      await user.save();
      return res.status(400).send("No Image uploaded");
      }
  });
  
  
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
      cnf_password:Joi.string().min(5).max(255).required().equal(Joi.ref('password')).error(new Error("Passwords do not match!"))
  
    });
    const {error} = schema.validate(req.body,{escapeHtml:true});
    if(error) return res.status(400).send(error.message);

    user.recovery_email = req.body.recovery_email;
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.lastLogin = new Date();

    user.save();
    req.session.incomplete = false;
    res.send('/');

  }
  else if(req.body.password){

    const schema = Joi.object({
      password: Joi.string().min(5).max(255).required(),
      cnf_password:Joi.string().min(5).max(255).required().equal(Joi.ref('password')).error(new Error("Passwords do not match!"))
    });
    const {error} = schema.validate(req.body,{escapeHtml:true});
    if(error) return res.status(400).send(error.message);

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.lastLogin = new Date();
    user.save();
    req.session.incomplete = false;
    res.send('/');
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
    req.session.incomplete = false;
    res.send('/');
  }
  else res.status(400).send("Not permitted!");
});


router.get('/first',authenticate,async (req,res)=>{
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  if(req.session.incomplete)
  return res.render('firstLogin',{select:'both',title:'Change Password and Recovery Email'});
  else res.status(404).end();
});

router.get('/firstR',authenticate,async (req,res)=>{
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  if(req.session.incomplete)
  return res.render('firstLogin',{select:'recovery',title:'Update Recovery Email'});
  else res.status(404).end();
});

router.get('/firstP',authenticate,async (req,res)=>{
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  if(req.session.incomplete)
  return res.render('firstLogin',{select:'password',title:'Change Password'});
  else res.status(404).end();
});

//login validation
router.post('/', async (req, res) => {
  const { error } = validate(req.body); 
  if (error) return res.status(400).send(error.message);

  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');

  let student = await Student.findOne({ $or : [{email: req.body.id},{usn:req.body.id}] }).select('fname lname password usn year active lastLogin recovery_email ');
  if (student){
    const validPassword = await bcrypt.compare(req.body.password, student.password);
    if (!validPassword) return res.status(400).send("Invalid Email or Password.");

    if(!student.active) return res.status(400).send("Account Disabled!");

    req.session.fname = student.fname; 
    req.session.lname = student.lname;
    req.session.usn = student.usn;
    req.session.year = student.year;
    if(student.recovery_email == null){ req.session.incomplete = true;
      if(student.lastLogin == null){
        return res.send('/first');
      }
      else{
        return res.send('/firstR');
      }
    }else if(student.lastLogin == null){ req.session.incomplete = true;
      return res.send('/firstP');
    }

    student.lastLogin = new Date();
    await student.save();
    return res.send('/dashboard');
  }

  let teacher = await Teacher.findOne({email: req.body.id}).select('fname lname password staff_id isAdmin active lastLogin recovery_email profile_image');
  if (!teacher) return res.status(400).send("Invalid Email or Password.");

  const validPassword = await bcrypt.compare(req.body.password, teacher.password);
  if (!validPassword) return res.status(400).send("Invalid Email or Password.");

  if(!teacher.active) return res.status(400).send("Account Disabled!");

  req.session.fname = teacher.fname;
  req.session.lname = teacher.lname;
  req.session.staff_id = teacher.staff_id;
  req.session.isAdmin = teacher.isAdmin;
  req.session.profile_image = teacher.profile_image;

  if(teacher.recovery_email == null){ req.session.incomplete = true;
    if(teacher.lastLogin == null){
      return res.send('/first'); //both
    }
    else{
      return res.send('/firstR');
      //only rec
    }
  }else if(teacher.lastLogin == null){ req.session.incomplete = true;
    return res.send('/firstP');
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
  
});

function validate(req) {
  const schema = Joi.object({
    id: Joi.string().min(5).max(255).required(),
    password: Joi.string().min(5).max(255).required(),
    
  });

  return schema.validate(req,{escapeHtml:true});
}

router.get('/forgotPassword',async (req,res)=>{
  res.render('forgotPassword');
});


router.post('/forgotPassword',async (req,res)=>{

  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email()
  });

  const {error} = schema.validate(req.body);
  if(error ) return res.status(400).send(error.message);

  let user; let token;
    user = await Student.findOne({email:req.body.email});
    if(!user) {
      user = await Teacher.findOne({email:req.body.email});
      if(!user) return res.status(400).send('User not found!');
    }

  token = crypto.randomBytes(20).toString('hex');
  user.resetToken = token;
  user.tokenExpires = Date.now() + 3600000;
  await user.save();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.get('elab-admin-mail.email'),
      pass: config.get('elab-admin-mail.password'),
    },
  });
  if(!user.recovery_email || user.recovery_email == '' || user.recovery_email==null) return res.status(400).send('Recovery Email not set!');
  let host= 'elab.hkbk.edu.in';
  if (process.env.NODE_ENV != 'production') {
    host='localhost:'+ req.app.locals.port || 'localhost:4000' ;
  }
  const mailOptions = {
    from: config.get('elab-admin-mail.email'),
    to: `${user.recovery_email}`,
    subject: 'ELAB - Password Reset link',
    text:
      `Hi ${user.fname},\n\n`
      + 'You recently requested to reset your password for your Elab account. Click on the link below to reset it.\n\n'
      + `http://${host}/resetPassword/${token}\n\n`
      + 'If you did not request this, please ignore this email and your password will remain unchanged. This reset link is valid only for next 1hr.\n',
  };

  transporter.sendMail(mailOptions, (err, response) => {
    if (err) { winston.error(err);
      res.status(400).send("Unable to send the reset link.");
    } else {
      res.status(200).send('Recovery E-mail sent to '+user.recovery_email.substr(0,3)+'*****'+user.recovery_email.substr(user.recovery_email.indexOf('@')-1) +'.');
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

//About ELAB page
router.get('/about',(req,res)=>{
  res.render('about');
});


module.exports = router; 
