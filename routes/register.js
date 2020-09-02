const config = require('config');
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const {Student, validate} = require('../models/student');
const {Teacher,validateTeacher} = require('../models/teacher');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const admin = require('../middleware/admin');
// router.get('/me', auth, async (req, res) => {
//   const Student = await Student.findById(req.Student._id).select('-password');
//   res.send(Student);
// });

function getBatch(year){
  month=new Date().getMonth()+1;
  const currYear=new Date().getFullYear();
  if(month>=8){
      return currYear-year+1;
  }
  else{
      return currYear-year;
  }
}

router.post('/',admin, async (req, res) => {

  if(req.body.type === "student"){

  const { error } = validate(req.body); 
  if (error) return res.status(400).send(error.message);

  let student = await Student.findOne({ $or:[{email: req.body.email},{usn:req.body.usn}]  });
  if (student) return res.status(400).send('Student already registered.');

  if(!req.body.lname) req.body.lname=" ";

  student = new Student(_.pick(req.body, ['fname', 'lname', 'email', 'password','year','usn']));
  student.batch = getBatch(req.body.year);
  const salt = await bcrypt.genSalt(10);
  student.password = await bcrypt.hash(student.password, salt);
  student.profile_image = '/profileImage/'+student.usn.toUpperCase()+'.jpg';
  await student.save();


  res.send("Account created!");

  }
  else if(req.body.type === "teacher")
  {
    const { error } = validateTeacher(req.body); 
  if (error) return res.status(400).send(error.message);

  let teacher = await Teacher.findOne({$or:[{email: req.body.email},{staff_id:req.body.staff_id}] });
  if (teacher) return res.status(400).send('Teacher already registered.');

  if(!req.body.lname) req.body.lname=" ";

  teacher = new Teacher(_.pick(req.body, ['fname', 'lname','email', 'password','staff_id']));
  const salt = await bcrypt.genSalt(10);
  teacher.password = await bcrypt.hash(teacher.password, salt);
  teacher.profile_image = '/profileImage/default.png';
  await teacher.save();

  res.send("Account created!");
  }
  else
    res.send('Please select the account type');
});

module.exports = router; 