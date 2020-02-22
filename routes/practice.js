const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const _ = require('lodash');
const session = require('express-session');
const authenticate = require('../middleware/auth');
const {Practice,validatePractise} = require('../models/practice');
const moment = require('moment');
const request = require("request-promise");
const teacher = require('../middleware/teacher');



function encode64(string){ //encoding to base64
  const b = new Buffer.from(string);
return b.toString('base64');
}

function decode64(string64){//decode to utf8
  const b = new Buffer.from(string64, 'base64')
return b.toString();
}


router.get('/', authenticate,async (req,res)=> {
    const questions = await Practice.find().sort({date:-1}).lean();
    if(!req.session.staff_id)
    res.render('practice', {q:questions});
    else
    res.render('teacher/practice',{q:questions});
  });


router.get('/:qid', authenticate, async (req,res)=>{
  const question = await Practice.findOne({qid: req.params.qid}).lean();
  if(!question) return res.send("Question not found!!");

  if(req.session.staff_id){
    res.render('teacher/editor', {question : _.pick(question,['name','statement','constraints', 'input_format','output_format','sample_cases'])});

  }
  else{
    res.render('editor', {question : _.pick(question,['name','statement','constraints', 'input_format','output_format','sample_cases'])});

  }
});

router.post('/:qid',authenticate,async (req,res) => {
  const question = await Practice.findOne({qid: req.params.qid});
  if(!question) return res.send("Question not found!!");
  
  const testcase = question.test_cases;

  if(req.body.source.substr(req.body.source.length-18) == "undefinedundefined")
  req.body.source = req.body.source.substr(0,req.body.source.length-18);
  else
  return res.status(400).send("Unauthorized");

  if(req.body.source.trim()=='')
  return res.send("Source Code cannot be empty!");

  let result = [];

  for(let i=0;i<testcase.length;i++){
  let options = { method: 'POST',
  url: 'http://127.0.0.1:3000/submissions?base64_encoded=true&wait=true',
  body: { "source_code": encode64(req.body.source), "language_id": req.body.language, "stdin":encode64(testcase[i].input),
          "expected_output":encode64(testcase[i].output) },
  json: true };

  result.push(request(options));

  }

  Promise.all(result)
    .then(data => {
      let desc= [];
      let i=0;
      data.forEach(store);
      function store(data){let point=0;
        if(data.status.id == 3){
          point = testcase[i].points;
        }
        desc.push({id:data.status.id,description:data.status.description,points:point}); 
      }
      
      res.send(desc);

    }).catch(err => {
      res.send(err);
    });

});

//adding a new question
router.post('/',authenticate,teacher,async (req,res)=>{

    const {error} = validatePractise(req.body);
    if(error) return res.status(400).send(error.message);
    const date = moment().format('DDMMYY');
    let lastInserted = await Practice.find({qid:new RegExp('\^'+date)}).sort({_id:-1}).limit(1).lean().select('qid');
    let count =0;
    if(lastInserted.length>0){
        count = lastInserted[0].qid.replace(date,"");
    }

    let question = new Practice();
    question.name = req.body.name;
    question.difficulty = req.body.difficulty;
    question.description = req.body.description;
    question.constraints = req.body.constraints;
    question.input_format = req.body.i_format;
    question.output_format = req.body.o_format;
    question.statement=decodeURIComponent(req.body.statement); 
    question.qid=date + (++count);
    if(Array.isArray(req.body.i_sample1)){

      for(let i=0;i<req.body.i_sample1.length;i++){
          question.sample_cases.push({input:req.body.i_sample1[i], output:req.body.o_sample1[i]});
      }
      }
      else{
          question.sample_cases.push({input:req.body.i_sample1, output:req.body.o_sample1});
          
      }
      
      if(Array.isArray(req.body.i_testcase1)){
  
          for(let i=0;i<req.body.i_testcase1.length;i++){
              question.test_cases.push({input:req.body.i_testcase1[i], output:req.body.o_testcase1[i],points:req.body.points[i]});
          }
      }
      else
      {
          question.test_cases.push({input:req.body.i_testcase1, output:req.body.o_testcase1,points:req.body.points});
      }
      question.explanation= req.body.explanation;
    await question.save();

    res.send("Question Added");
});


//editing a question
router.post('/edit/:qid',authenticate,teacher,async (req,res)=>{
  const {error} = validatePractise(req.body);
    if(error) return res.status(400).send(error.message);

    let question  = await Practice.findOne({qid:req.params.qid});
    if(!question) return res.status(400).send('Invalid ID');

    question.name = req.body.name;
    question.constraints = req.body.constraints;
    question.difficulty = req.body.difficulty;
    question.description = req.body.description;
    question.input_format = req.body.i_format;
    question.output_format = req.body.o_format;
    question.statement=decodeURIComponent(req.body.statement); 

    question.sample_cases = [];
    question.test_cases =[];
    if(Array.isArray(req.body.i_sample1)){

      for(let i=0;i<req.body.i_sample1.length;i++){
          question.sample_cases.push({input:req.body.i_sample1[i], output:req.body.o_sample1[i]});
      }
      }
      else{
          question.sample_cases.push({input:req.body.i_sample1, output:req.body.o_sample1});
          
      }
      
      if(Array.isArray(req.body.i_testcase1)){
  
          for(let i=0;i<req.body.i_testcase1.length;i++){
              question.test_cases.push({input:req.body.i_testcase1[i], output:req.body.o_testcase1[i],points:req.body.points[i]});
          }
      }
      else
      {
          question.test_cases.push({input:req.body.i_testcase1, output:req.body.o_testcase1,points:req.body.points});
      }
      question.explanation= req.body.explanation;
    await question.save().then(()=>{
      res.send("Question saved.")
    })
    .catch(err =>{
      res.status(400).send("Something went wrong!");
    });


});


router.get('/edit/:qid',authenticate,teacher,async (req,res) => {
  const question  = await Practice.findOne({qid:req.params.qid}).lean();
  if(!question) return res.status(400).send("Invalid ID");

  res.send(question);
  

});

module.exports = router;