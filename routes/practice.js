const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const _ = require('lodash');
const session = require('express-session');
const authenticate = require('../middleware/auth');
const {Practice,validatePractise} = require('../models/practice');
const moment = require('moment');
const request = require("request-promise");


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
    if(!req.session.name.endsWith(" "))
    res.render('practice', {q:questions});
    else
    res.render('teacher/practice',{q:questions});
  });


router.get('/:qid', authenticate, async (req,res)=>{
  const question = await Practice.findOne({qid: req.params.qid});
  if(!question) return res.send("Question not found!!");

  res.render('editor', {question : _.pick(question,['statement','constraints', 'input_format','output_format','sample_cases'])});
});

router.post('/:qid',authenticate,async (req,res) => {
  const question = await Practice.findOne({qid: req.params.qid});
  if(!question) return res.send("Question not found!!");
  
  const testcase = question.test_cases;


  if(req.body.source=='')
  return res.send();

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

router.post('/',async (req,res)=>{

    const {error} = validatePractise(req.body);
    if(error) return res.send(error.message);
    const date = moment().format('DDMMYY');
    let count = await Practice.countDocuments({qid: new RegExp("^"+date)});

    let question = new Practice(_.pick(req.body, ['qid','name','statement', 'constraints', 'input_format','output_format']));
    question.qid+= ++count;
    for(let i=0;i<req.body.i_sample.length;i++){
      question.sample_cases.push({input:req.body.i_sample[i], output:req.body.o_sample[i]});
    }

    for(let i=0;i<req.body.i_testcase.length;i++){
        question.test_cases.push({input:req.body.i_testcase[i], output:req.body.o_testcase[i]});
    }

    await question.save();

    res.send(question);
});

module.exports = router;