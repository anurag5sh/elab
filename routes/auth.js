const Joi = require('@hapi/joi');
const bcrypt = require('bcrypt');
//const _ = require('lodash');
const {Student} = require('../models/student');
const {Teacher} = require('../models/teacher')
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const session = require('express-session');
const admin = require('../middleware/admin');

router.get('/',(req,res,next)=>{  console.log(req.session.userId);
  if (req.session && req.session.userId) 
    return res.redirect('/dashboard');
  else  next();

}, (req,res) => {
    res.render('login');
});

router.get('/dashboard', authenticate,(req,res)=> {
    res.render('dashboard',{name:req.session.name});
});



router.get('/editor', authenticate,(req,res)=> {
  
  res.render('editor',{msg:{question:"Question",input:"Input"}});
});

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
    req.session.name = student.name.toUpperCase(); 
    return res.redirect('/dashboard');
  }

  else if(req.body.type === "teacher")
  {
    let teacher = await Teacher.findOne({ email: req.body.email });
    if (!teacher) return res.render('login',{login_error:"Invalid email or password"});

    const validPassword = await bcrypt.compare(req.body.password, teacher.password);
    if (!validPassword) return res.render('login',{login_error:"Invalid email or password"});

    req.session.userId = teacher._id;
    req.session.name = teacher.name.toUpperCase();
    if(teacher.isAdmin)
      return res.redirect('/admin');
    return res.send('Teacher logged in');
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

module.exports = router; 
