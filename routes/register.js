const config = require('config');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const {Student, validate} = require('../models/student');
const {Teacher} = require('../models/teacher');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

// router.get('/me', auth, async (req, res) => {
//   const Student = await Student.findById(req.Student._id).select('-password');
//   res.send(Student);
// });

router.post('/', async (req, res) => {

  if(req.body.type === "student"){

  const { error } = validate(req.body); 
  if (error) return res.status(400).send(error.details[0].message);

  let student = await Student.findOne({ email: req.body.email });
  if (student) return res.status(400).send('Student already registered.');

  student = new Student(_.pick(req.body, ['name', 'email', 'password','type']));
  const salt = await bcrypt.genSalt(10);
  student.password = await bcrypt.hash(student.password, salt);
  await student.save();


  res.send(student);

  }
  else if(req.body.type === "teacher")
  {
    const { error } = validate(req.body); 
  if (error) return res.status(400).send(error.details[0].message);

  let teacher = await Teacher.findOne({ email: req.body.email });
  if (teacher) return res.status(400).send('Student already registered.');

  teacher = new Teacher(_.pick(req.body, ['name', 'email', 'password']));
  const salt = await bcrypt.genSalt(10);
  teacher.password = await bcrypt.hash(teacher.password, salt);
  await teacher.save();

  res.send(teacher);
  }
  else
    res.send('Please select the account type');
});

module.exports = router; 