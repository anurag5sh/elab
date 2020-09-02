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
const config = require('config');
const {Student} = require('../models/student');
const winston = require('winston');



function encode64(string){ //encoding to base64
  const b = new Buffer.from(string.replace(/\r\n/g, "\n"));
return b.toString('base64');
}

function decode64(string64){//decode to utf8
  const b = new Buffer.from(string64, 'base64')
return b.toString();
}


router.get('/', authenticate,async (req,res)=> {
    let page=1;
    if(Number.isNaN(req.query.page) || !req.query.page || req.query.page < 1) page=1;
    else page=req.query.page;
    let count=0;
    let questions = await Practice.find().sort({date:-1}).lean().skip((page-1)*12).limit(12);
    if(questions.length > 0) count =  await Practice.countDocuments();
    if(questions.length<=0) {questions=[],count=0}
    if(!req.session.staff_id){
      res.render('practice', {q:questions,count:count,page:page});
    }
    
    else{
      res.render('teacher/practice',{q:questions,count:count,page:page});
    }
    
  });


//delete a question
router.get('/delete/:qid',authenticate,teacher,async (req,res)=>{
  const question = await Practice.findOne({qid:req.params.qid});
  if(!question) return res.status(404).end();

  if(!question.createdBy == req.params.staff_id){
    if(req.session.isAdmin){}
    else
    return res.status(401).end();
  } 

  await Practice.deleteOne({qid:req.params.qid}).then(()=>{
    res.send("Question Deleted!");
  }).catch((err)=>{
    winston.error(err);
    res.status(500).send("Unable to delete");
  })
});

//fetch source code for student
router.get('/source/:qid',authenticate,async (req,res)=>{

  if(req.session.staff_id){ let temp=null;
    if(req.session.practice){
       temp = req.session.practice.find(i => i.usn == req.session.staff_id && i.lang==req.query.lang);
    }
    if(temp) return res.send(temp.sourceCode);
    else { let sC="";
      if(config.has(`source.${req.query.lang}`)){
        sC = config.get(`source.${req.query.lang}`);
      }
      const source=sC;
      return res.send(source);
    }
  }

  const question = await Practice.findOne({qid:req.params.qid}).lean().select('submissions');
  if(!question) return res.status(400).send("Question not found!!");

  let temp=null;
  let source = question.submissions.find( i => i.usn == req.session.usn && i.lang == req.query.lang);
  if(req.session.practice){
    temp = req.session.practice.find(i => i.usn == req.session.usn && i.lang==req.query.lang);
  }
  if(!source) { let sC="";
    if(config.has(`source.${req.query.lang}`)){
      sC = config.get(`source.${req.query.lang}`);
    }
    source=sC;
    if(temp) source = temp.sourceCode;
    return res.send(source);
  }
  else{
    if(temp && temp.timestamp>source.timestamp)
    source=temp;
    res.send(source.sourceCode);
  }
});

//temp saving code
router.post('/source/:qid',authenticate,async (req,res)=>{
  req.body.sourceCode = req.body.sourceCode.substr(0,req.body.sourceCode.length-18);
  if(req.body.sourceCode == '') return res.send('');
  if(req.session.practice){
    const found = req.session.practice.findIndex(i =>{return i.qid == req.params.qid && i.lang == req.body.lang.substr(req.body.lang.length-2) });
    if(found!=-1){
        req.session.practice[found].sourceCode = req.body.sourceCode;
        req.session.practice[found].timestamp = new Date();
    }
    else{
        let obj = {};
        obj.qid=req.params.qid;
        obj.usn = req.session.usn || req.session.staff_id;
        obj.lang = req.body.lang.substr(req.body.lang.length-2);
        obj.sourceCode = req.body.sourceCode;
        obj.timestamp = new Date();
        req.session.practice.push(obj);
    }
}
else{
    let obj = {};
    obj.qid=req.params.qid;
    obj.usn = req.session.usn || req.session.staff_id;
    obj.lang = req.body.lang.substr(req.body.lang.length-2);
    obj.sourceCode = req.body.sourceCode;
    obj.timestamp = new Date();
    req.session.practice = [];
    req.session.practice.push(obj);
}
res.send('');
});

router.get('/:qid', authenticate, async (req,res)=>{
  const question = await Practice.findOne({qid: req.params.qid}).lean();
  if(!question) return res.send("Question not found!!");

  if(req.session.staff_id){
    res.render('teacher/editor', {question :question});

  }
  else{
    let accepted=false;
    const sub = question.submissions.find(i => {return i.usn == req.session.usn && i.status == "Accepted"});
    if(sub) accepted=true;
    res.render('editor', {question : question,isAccepted:accepted});

  }
});

//source code of a submission
router.get('/source/:qid/:usn',authenticate,async (req,res)=>{
  const question = await Practice.findOne({qid:req.params.qid}).lean();
  if(!question || !question.submissions) return res.status(404).send("Not found!");

  //verify
  if(req.session.usn){
    const sub = question.submissions.find(i => {return i.usn == req.session.usn && i.status == "Accepted"});
    if(!sub) return res.status(401).end();
  }

  res.send(question.submissions.find(i => {return i.usn == req.params.usn && i.status == "Accepted"}).sourceCode);
});

//submissions view page
router.get('/:qid/submissions',authenticate,async (req,res)=>{
  const question = await Practice.findOne({qid:req.params.qid}).lean();
  if(!question) return res.status(404).end();
  if(req.session.usn){
    const sub = question.submissions.find(i => {return i.usn == req.session.usn && i.status == "Accepted"});
    if(!sub) return res.status(401).end();
  }
  res.render('practiceSub',{question:question});
});

//data for submission table
router.get('/:qid/submissions/list',authenticate,async (req,res)=>{
  //const question = await Practice.findOne({qid:req.params.qid,submissions:{$elemMatch:{status:"Accepted"}}}).lean();
  let question = await Practice.aggregate([{$match:{qid:req.params.qid}},{$project:{submissions:{$filter:{input:"$submissions",as:"submissions",cond:{$eq:["$$submissions.status","Accepted"]}}}}}]);
  if(question.length == 0) return res.send([]);
  question=question[0];
  //verify
  if(req.session.usn){
    const sub = question.submissions.find(i => {return i.usn == req.session.usn && i.status == "Accepted"});
    if(!sub) return res.status(401).end();
  }
  if(question.submissions == []) return res.send([]);

  let students=[];

  for(i of question.submissions){
    students.push(i.usn);
  }

  let studentData = {};
  let result = await Student.find({usn:{$in:students}}).select('usn fname lname -_id').lean();
    if(!result) result = [];
    else{
      for (i of result)
        studentData[i.usn] = i;
  }

  let SendData=[];
  for(i=0;i<question.submissions.length;i++){ let data={};
    let student = studentData[question.submissions[i].usn];
    data.usn = question.submissions[i].usn;
    data.name = student.fname + " " + student.lname;
    data.time = {timestamp:moment(question.submissions[i].timestamp).format('x'),display:moment(question.submissions[i].timestamp).format('LLL')};
    data.points = question.submissions[i].points;
    data.status = question.submissions[i].status;
    data.code = '<a data-toggle="modal" data-target="#source" data-usn="'+question.submissions[i].usn+'"  href="#">View Code</a>';
  
    SendData.push(data);
  }
  res.send(SendData);
});

router.post('/:qid',authenticate,async (req,res) => {
  const question = await Practice.findOne({qid: req.params.qid});
  if(!question) return res.send("Question not found!!");
  
  const testcase = question.test_cases;
  let question_points = 0;
  testcase.forEach((item,index) =>{
    question_points +=item.points;
  });

  if(req.body.source.substr(req.body.source.length-18) == "undefinedundefined")
  req.body.source = req.body.source.substr(0,req.body.source.length-18);
  else
  return res.status(400).send("Unauthorized");
  if(!question.languages.includes(req.body.language.toString()))
    return res.status(400).send("Not permitted to submit in this language!");

  if(req.body.source.trim()=='')
  return res.send("Source Code cannot be empty!");

  let result = [];

  let compiler_opt = null;
  if (req.body.language == 50){
    compiler_opt = "-lm";
  }

  for(let i=0;i<testcase.length;i++){
  let options = { method: 'POST',
  url: 'http://127.0.0.1:3000/submissions?base64_encoded=true&wait=true',
  body: { "source_code": encode64(req.body.source), "language_id": req.body.language, "stdin":encode64(testcase[i].input),
          "expected_output":encode64(testcase[i].output),"compiler_options":compiler_opt },
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

      if(req.session.staff_id) return res.send(desc);

    let total_points  = 0;
    desc.forEach((item,index) =>{
            total_points+= item.points;
    });
    const user_submission = question.submissions.findIndex(i => i.usn == req.session.usn);
    if(user_submission == -1){
      let obj = {};
      obj.usn = req.session.usn;
      obj.timestamp = new Date();
      obj.sourceCode = req.body.source;
      obj.language_id = req.body.language;
      obj.year  = req.session.year;
      obj.points = total_points;
      if(total_points == question_points){
        obj.status = "Accepted";
      }
      else if(total_points == 0 ){
          obj.status = "Wrong Answer";
      }
      else{
          obj.status = "Partially Accepted";
      }
      question.submissions.push(obj);
      question.save();
    }
    else{
      if(total_points >= question.submissions[user_submission].points){
        question.submissions[user_submission].points = total_points;
        question.submissions[user_submission].sourceCode = req.body.source;
        question.submissions[user_submission].timestamp = new Date();
        if(total_points == question_points){
          question.submissions[user_submission].status = "Accepted";
        }
        else if(total_points == 0 ){
            question.submissions[user_submission].status = "Wrong Answer";
        }
        else{
            question.submissions[user_submission].status = "Partially Accepted";
        }
        question.save();
      }
    }
      res.send(desc);

    }).catch(err => { winston.error(err);
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
    question.createdBy = req.session.staff_id;
    question.createdByName = req.session.fname +" "+req.session.lname ;
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

      if(Array.isArray(req.body.languages)){
        question.languages = req.body.languages;
      }
      else{
        question.languages.push(req.body.languages)
      }
    await question.save();

    res.send("Question Added");
});


//editing a question
router.post('/edit/:qid',authenticate,teacher,async (req,res)=>{
  const {error} = validatePractise(req.body);
    if(error) return res.status(400).send(error.message);

  let question  = await Practice.findOne({qid:req.params.qid});
  if(!question) return res.status(400).send('Invalid ID');

  if(question.createdBy != req.session.staff_id) {
    if(req.session.isAdmin){}
    else
    return res.status(401).end();
  }
    question.name = req.body.name;
    question.constraints = req.body.constraints;
    question.difficulty = req.body.difficulty;
    question.description = req.body.description;
    question.input_format = req.body.i_format;
    question.output_format = req.body.o_format;
    question.statement=decodeURIComponent(req.body.statement); 
    question.description = req.body.description;

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
      if(Array.isArray(req.body.languages)){
        question.languages = req.body.languages;
      }
      else{
        question.languages=[req.body.languages]
      }
    await question.save().then(()=>{
      res.send("Question saved.")
    })
    .catch(err =>{ winston.error(err);
      res.status(400).send("Something went wrong!");
    });


});


router.get('/edit/:qid',authenticate,teacher,async (req,res) => {
  const question  = await Practice.findOne({qid:req.params.qid}).lean();
  if(!question) return res.status(400).send("Invalid ID");

  res.send(question);
  

});

module.exports = router;