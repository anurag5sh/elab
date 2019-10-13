const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const _ = require('lodash');
const session = require('express-session');
const authenticate = require('../middleware/auth');
const {Practice,validatePractise} = require('../models/practice');
const moment = require('moment');

//Saving name for pug to display name in navbar
// router.use(function(req,res,next){
//   res.locals.name = req.session.name;
//   next();
// });

router.get('/', authenticate,async (req,res)=> {
    const questions = await Practice.find().sort({date:-1});
    
    res.render('practice', {q:questions});
  });


router.get('/:qid', authenticate, async (req,res)=>{
  const question = await Practice.findOne({qid: req.params.qid});
  if(!question) return res.send("Question not found!!");

  res.render('editor', {question : _.pick(question,['statement','constraints', 'input_format','output_format','sample_cases'])});
});

router.post('/',async (req,res)=>{

    const {error} = validatePractise(req.body);
    if(error) return res.send(error.message);
    const date = moment().format('DDMMYY');
    let count = await Practice.countDocuments({qid: new RegExp("^"+date)});

    let question = new Practice(_.pick(req.body, ['qid','name','statement', 'constraints', 'input_format','output_format','test_cases','sample_cases']));
    question.qid+= ++count;
    await question.save();

    res.send(question);
});

module.exports = router;