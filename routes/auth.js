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
    if(!req.session.name.staff_id)
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
router.get('/profile', async function(req,res){
  const student = await Student.findOne({ usn: req.session.usn }).lean().select('usn name email');
  if(!student){
    return res.status(400).end();
  }
  res.render('profile',{student:student});
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
    req.session.usn = student.usn;
    req.session.year = student.year;
    res.cookie("name", student.name,{sameSite:"strict"});
    return res.redirect('/dashboard');
  }

  else if(req.body.type === "teacher")
  {
    let teacher = await Teacher.findOne({ email: req.body.email }).lean();
    if (!teacher) return res.render('login',{login_error:"Invalid email or password"});

    const validPassword = await bcrypt.compare(req.body.password, teacher.password);
    if (!validPassword) return res.render('login',{login_error:"Invalid email or password"});

    req.session.userId = teacher._id;
    req.session.name = teacher.name;
    req.session.staff_id = teacher.staff_id;
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

router.get('/students/:year',authenticate,teacher, async (req,res) =>{
  const students = await Student.find({ year: req.params.year }).lean().select({usn:1,name:1,_id:0});
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
