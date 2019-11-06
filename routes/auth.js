const Joi = require('@hapi/joi');
const bcrypt = require('bcryptjs');
//const _ = require('lodash');
const {Student} = require('../models/student');
const {Teacher} = require('../models/teacher')
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const session = require('express-session');
const admin = require('../middleware/admin');
const {Practice} = require('../models/practice');

//filter teacher and student login
//redirect to respective dashboard
router.get('/',(req,res,next)=>{
  if (req.session && req.session.userId)
    if(req.session.name.endsWith(" ")) 
      return res.render('teacher/trdashboard');
    else
    return res.redirect('/dashboard');
  else  next();

}, (req,res) => {
    res.render('login');
});

//student dashboard
router.get('/dashboard', authenticate,async (req,res)=> {
    const q = await Practice.find().sort({date:-1}).limit(5);
    res.render('dashboard', {q:q});
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
router.get('/profile', function(req,res){
  res.render('profile');
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

    req.session.userId = student._id;
    req.session.name = student.name.trim(); 
    res.cookie("name", student.name,{sameSite:"strict"});
    return res.redirect('/dashboard');
  }

  else if(req.body.type === "teacher")
  {
    let teacher = await Teacher.findOne({ email: req.body.email });
    if (!teacher) return res.render('login',{login_error:"Invalid email or password"});

    const validPassword = await bcrypt.compare(req.body.password, teacher.password);
    if (!validPassword) return res.render('login',{login_error:"Invalid email or password"});

    req.session.userId = teacher._id;
    req.session.name = teacher.name+" ";
    res.cookie("name", teacher.name,{sameSite:"strict"});
    if(teacher.isAdmin)
      return res.redirect('/admin');
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


/* TEACHER'S ACCOUNT ROUTES

--------------------------------------------------------- */



module.exports = router; 
