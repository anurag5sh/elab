const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const teacher = require('../middleware/teacher');
const admin = require('../middleware/admin');
const _ = require('lodash');
const request = require("request-promise");
const {Assignment,validateAssignment} = require('../models/assignment');
const {AssignmentQ,validateAQ} = require('../models/assignmentQ');
const {aSubmission} = require('../models/assignmentSubmission');
const moment = require('moment');
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

//Load the current assignment questions for students and manage for teachers
router.get('/',authenticate, async (req,res) => {
    let page=1;
    if(Number.isNaN(req.query.page) || !req.query.page || req.query.page < 1) page=1;
    else page=req.query.page;
    let count=0;
    if(req.session.staff_id){
        const current = await Assignment.find({ 'duration.ends' :{$gt : new Date()} }).lean().select({id:1,sem:1,_id:0}).sort({id:1});
        res.render('teacher/assignment',{current:current});
    }
    else{
        const assignment = await Assignment.findOne({id:new RegExp('\^'+req.session.year),'duration.ends' :{$gt : new Date()}}).lean().select('id questions duration');
        if(!assignment) return res.render('assignment',{questions:[],count:0,page:page});
        
        let questions = await AssignmentQ.find({$or:[{assignmentId:assignment.id},{qid:{$in:assignment.questions}}]}).lean().select({_id:0,name:1,qid:1}).sort({_id:-1}).skip((page-1)*12).limit(12);
        if(questions.length > 0) count = await AssignmentQ.countDocuments({$or:[{assignmentId:assignment.id},{qid:{$in:assignment.questions}}]});
        
        if(questions.length <=0) {questions = [];count=0;}

        res.render('assignment',{questions:questions,count:count,page:page,id:assignment.id,duration:assignment.duration});
    }
    
});

//fetch previous assignment for students and teachers
router.get('/previous',authenticate,async (req,res)=>{
    if(req.session.staff_id){
        res.render('teacher/previousAssignment');
    }
    else{
        const arr = await Assignment.find({id:new RegExp(new Date().getFullYear() - req.session.year),'duration.ends':{$lt:new Date()}}).select('id sem');
        res.render('previousAssignment',{arr:arr});
    }
});

//fetch the list of previous assignments for teacher
router.get('/previous/:sem',authenticate,teacher,async (req,res)=>{
    const previous = await Assignment.find({sem:parseInt(req.params.sem),'duration.ends':{$lt: new Date()}}).select('id').lean();
    let data='<div class="form-group" ><label for="aid" class="font-weight-bold">Select Assignment</label><select id="aid" class="form-control custom-select"><option selected disabled value="">Select Assignment</option>';
    previous.forEach((item)=>{
        data+='<option value='+item.id+'> Batch '+item.id.substr(5,4) +'</option>';
    });
    data+='</select></div>';
    res.send(data);
});

//fetch previous assignment for dataTable
router.get('/previous/list/:id',authenticate,async (req,res)=>{
    if(req.session.staff_id){
        const assignment = await Assignment.findOne({id:req.params.id}).lean();
        if(!assignment) return res.status(404).send("Not Found!");

        const questions = await AssignmentQ.find({assignmentId : req.params.id}).lean().select('qid name createdByName difficulty');
        let sendData=[];
        questions.forEach((item)=>{
            let obj={};
            obj.qid = item.qid;
            obj.name = item.name;
            obj.createdByName = item.createdByName;
            obj.difficulty = item.difficulty;
            obj.view = '<a href="" data-toggle="modal" data-target="#view" data-id="'+item.qid+'">View</a>';
            obj.editor = '<a href="/assignment/'+item.qid+'" target="_blank" >View</a>';

            sendData.push(obj);
        });
        res.send(sendData);
    }else{
        if(!req.params.id.includes(new Date().getFullYear()-req.session.year)) return res.status(404).end();
        const assignment = await Assignment.findOne({id:req.params.id,'duration.ends':{$lt:new Date()}}).lean();
        if(!assignment) return res.status(404).send("Not Found!");

        const questions = await AssignmentQ.find({assignmentId : req.params.id}).lean().select('qid name createdByName difficulty');
        let sendData=[];
        questions.forEach((item)=>{
            let obj={};
            obj.qid = item.qid;
            obj.name = item.name;
            obj.createdByName = item.createdByName;
            obj.difficulty = item.difficulty;
            obj.view = '<a href="/assignment/'+item.qid+'" target="_blank" >View</a>';

            sendData.push(obj);
        });
        res.send(sendData);
    }
});

//leaderboard for students
router.get('/leaderboard',authenticate,async (req,res)=>{
    let assignment = await Assignment.findOne({id:new RegExp('\^'+req.session.year),'duration.ends' :{$gt : new Date()}}).lean().select('leaderboard');
    if(!assignment) assignment={leaderboard:[]}

    res.render('leaderboardAssignment',{assignment:assignment});
});

//leaderboard for teachers
router.get('/leaderboard/:id',authenticate,teacher,async (req,res)=>{
    const assignment = await Assignment.findOne({id:req.params.id}).lean().select('leaderboard sem id');
    if(!assignment) return res.status(404).end();

    res.render('leaderboardAssignment',{assignment:assignment});
});


function two(x) {return ((x>9)?"":"0")+x}
function three(x) {return ((x>99)?"":"0")+((x>9)?"":"0")+x}

function time(ms) {var sec = Math.floor(ms/1000);  ms = ms % 1000;  t = three(ms);  var min = Math.floor(sec/60);  sec = sec % 60;  t = two(sec) + ":" + t;  var hr = Math.floor(min/60);  min = min % 60;  t = two(min) + ":" + t; var day = Math.floor(hr/60);  hr = hr % 60;  t = two(hr) + ":" + t;   return t;  }

//fetching submissions data
router.get('/submissions/data/:id',authenticate,teacher,async (req,res) =>{  
    const assignment = await Assignment.findOne({id:req.params.id}).lean().select('submissions sem id');
    if(!assignment) return res.status(404).end();

    let students = [];

    for(i=0;i<assignment.submissions.length;i++){
        students.push(assignment.submissions[i].usn);
    }

    let studentData = await Student.find({usn:{$in:students}}).select('usn fname lname -_id').lean();
    if(!studentData) studentData = [];

    let questions = await AssignmentQ.find({assignmentId:assignment.id}).lean().select('qid name -_id');
    if(!questions) questions=[];

    let SendData=[];
    for(i=0;i<assignment.submissions.length;i++){ let data={};

        const index = studentData.findIndex(j => j.usn == assignment.submissions[i].usn);
        data.usn = studentData[index].usn;
        data.name = studentData[index].fname + " " + studentData[index].lname;
        data.code = '<a data-toggle="modal" data-target="#source" data-usn="'+studentData[index].usn+'" data-qid="'+assignment.submissions[i].qid +'" href="#">View Code</a>';
    
        data.qname = questions[questions.findIndex(j => j.qid == assignment.submissions[i].qid)].name;
        data.time = time(assignment.submissions[i].timestamp);
        data.points =assignment.submissions[i].points;
        data.status = assignment.submissions[i].status;
        const l = lang(assignment.submissions[i].language_id);
        data.lang = l.substr(0,l.length-2); 

        SendData.push(data);
    }

    res.send(SendData);
});

//router for submissions page
router.get('/submissions/:id',authenticate,teacher,async (req,res)=>{
    const assignment = await Assignment.findOne({id:req.params.id}).lean().select('sem id');
    if(!assignment) return res.status(404).end();

    res.render('teacher/assignmentSub',{assignment:assignment});
});

//fetching source for view modal
router.get('/source/:id/:usn/:qid',authenticate,teacher,async (req,res) =>{
    const assignment = await Assignment.findOne({id:req.params.id}).lean().select('sem id submissions');
    if(!assignment) return res.status(404).end();

    res.send(assignment.submissions.find(i => i.usn == req.params.usn && i.qid == req.params.qid).sourceCode);
});

router.get('/get/:id',authenticate,teacher,async (req,res) =>{
    let page=1;
    if(Number.isNaN(req.query.page) || !req.query.page || req.query.page < 1) page=1;
    else page=req.query.page;
    let count=0;

    const assignment = await Assignment.findOne({id:req.params.id,'duration.ends' :{$gt : new Date()}}).lean().select('id questions duration');
    if(!assignment) return res.send({questions:[],count:0,page:page});

    let questions = await AssignmentQ.find({$or:[{assignmentId:assignment.id},{qid:{$in:assignment.questions}}]}).lean().select({_id:0,name:1,qid:1}).sort({_id:-1}).skip((page-1)*12).limit(12);
    if(questions.length>0) count = await AssignmentQ.countDocuments({$or:[{assignmentId:assignment.id},{qid:{$in:assignment.questions}}]});
    
    if(questions.length <=0) {questions = [];count=0;}

    res.send({questions:questions,count:count,page:page,ends:assignment.duration.ends.toString()});

});

router.get('/manage',authenticate,teacher,async (req,res) => {
    const current = await Assignment.find({ 'duration.ends' :{$gt : new Date()} }).lean().select({id:1,sem:1,_id:0}).sort({id:1});
        res.render('teacher/manageAssignment',{current : current});
});

//fetching source code
function lang(l){
    switch (l){
        case 50 : return "C50";
        case 54 : return "C++54";
        case 51 : return "C#51";
        case 62 : return "Java62";
        case 63 : return "Javascript63";
        case 71 : return "Python71";
    }   
}
router.get('/source/:qid',authenticate,async (req,res) =>{

    if(req.session.staff_id) { let source=[];
        if(!req.query.lang) return res.send('');
        if(req.session.assignment){ 
            const index = req.session.assignment.findIndex(i => {return i.qid == req.params.qid && i.lang == req.query.lang})
            if(index != -1)
            source = [req.session.assignment[index]];
            else{
                if(config.has(`source.${req.query.lang}`)){
                sC = config.get(`source.${req.query.lang}`);
                }
                source=[{sourceCode:sC}];
            }
        }else{ let sC="";
            if(config.has(`source.${req.query.lang}`)){
                sC = config.get(`source.${req.query.lang}`);
            }
            source=[{sourceCode:sC}];
        }
        return res.send(source);
    }
    let source=[];
    if(req.query.lang){
        let assignment = await Assignment.findOne({id:new RegExp('\^'+req.session.year)},{submissions:{$elemMatch:{usn:req.session.usn,qid:req.params.qid,language_id:req.query.lang}}},{_id:0,'submissions.$':1}).lean();
        if(!assignment) return res.status(404).end();
        if(!assignment.submissions)assignment.submissions=[];

        const submission = await aSubmission.find({usn:req.session.usn,qid:req.params.qid,language_id:req.query.lang}).lean();
        source = assignment.submissions.concat(submission);
        if(req.session.assignment){
            const index = req.session.assignment.findIndex(i => {return i.curl == req.params.curl && i.qid == req.params.qid && i.lang == req.query.lang})
            if(index != -1)
            source = source.concat(req.session.assignment[index])
        }
        if(source.length == 0){ let sC="";
            if(config.has(`source.${req.query.lang}`)){
                sC = config.get(`source.${req.query.lang}`);
            }
            source=[{sourceCode:sC}];
            return res.send(source);
        }
    }
    else{
        let assignment = await Assignment.findOne({url:req.params.curl},{submissions:{$elemMatch:{usn:req.session.usn,qid:req.params.qid}}},{_id:0,'submissions.$':1}).lean();
        if(!assignment) return res.status(404).end();
        if(!assignment.submissions) assignment.submissions=[];
    
        const submission = await aSubmission.find({usn:req.session.usn,qid:req.params.qid}).lean();
        source = assignment.submissions.concat(submission);
        for(i=0;i<source.length;i++){
            source[i].language_id = lang(source[i].language_id);
        }
    }
  
    res.send(source.sort((a,b)=>(a.timestamp>b.timestamp)?1:-1));
});

router.post('/source/:qid',authenticate,async (req,res) =>{
    req.body.sourceCode = req.body.sourceCode.substr(0,req.body.sourceCode.length-18);
    if(req.body.sourceCode == '') return res.send('');
    if(req.session.assignment){
        const found = req.session.assignment.findIndex(i =>{return i.qid == req.params.qid && i.lang == req.body.lang.substr(req.body.lang.length-2) });
        if(found!=-1){
            req.session.assignment[found].sourceCode = req.body.sourceCode;
            req.session.assignment[found].timestamp = new Date();
        }
        else{
            let obj = {};
            obj.qid=req.params.qid;
            obj.lang = req.body.lang.substr(req.body.lang.length-2);
            obj.sourceCode = req.body.sourceCode;
            obj.timestamp = new Date();
            req.session.assignment.push(obj);
        }
    }
    else{
        let obj = {};
        obj.qid=req.params.qid;
        obj.lang = req.body.lang.substr(req.body.lang.length-2);
        obj.sourceCode = req.body.sourceCode;
        obj.timestamp = new Date();
        req.session.assignment = [];
        req.session.assignment.push(obj);
    }

    res.send('');
});

//teacher editing details
router.post('/',authenticate,async (req,res) => {
    let ready = false;
  if(req.body.isReady) ready = true;
  let starts,ends = null;
    try{
      starts = new Date(req.body.duration.split("-")[0]);
      ends = new Date(req.body.duration.split("-")[1]);
    }
    catch(err){
      return res.status(400).send("Wrong datetime format");
    }
  
  let update = {'duration.starts' : starts,'duration.ends':ends,isReady:ready};

  const assignment = await Assignment.findOneAndUpdate({id:req.body.aId},update);
  if(!assignment) return res.status(400).send('Invalid ID');

  res.status(200).send("Changes Saved.");
});

//adding a question to assignment
router.post('/add',authenticate,teacher,async (req,res) => {
    const {error} = validateAQ(req.body);
    if(error) return res.status(400).send(error.message);

    let count=1;
    let lastInserted = await AssignmentQ.findOne({qid:new RegExp('\^'+moment().format('DDMMYY'))}).sort({_id:-1}).lean().select('qid');
    if(!_.isEmpty(lastInserted)){
        count = Number(lastInserted.qid.substr(lastInserted.qid.indexOf('Q')+1));
        count++;
    }

    let question = new AssignmentQ({assignmentId:req.body.aId});
    question.name = req.body.name;
    question.statement= decodeURIComponent(req.body.statement);
    question.constraints = req.body.constraints;
    question.input_format = req.body.i_format;
    question.output_format = req.body.o_format;
    question.description = req.body.description;
    question.difficulty = req.body.difficulty;
    question.createdBy = req.session.staff_id;
    question.createdByName = req.session.fname + " " + req.session.lname;

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
    else{
        question.test_cases.push({input:req.body.i_testcase1, output:req.body.o_testcase1,points:req.body.points});
    }

    question.explanation= req.body.explanation;
    question.qid = moment().format('DDMMYY') + "Q" + count;
    if(Array.isArray(req.body.languages)){
        question.languages = req.body.languages;
      }
      else{
        question.languages=[req.body.languages];
      }
    await question.save();

    res.status(200).send("Question added successfully");

});

//solution for assingment questions
router.get('/solution/:qid',authenticate, async (req,res)=>{

    const question = await AssignmentQ.findOne({qid:req.params.qid}).lean().select('solution createdBy assignmentId');
    if(!question) return res.status(400).send("Invalid ID");

    const assignment = await Assignment.findOne({id:question.assignmentId}).select('duration').lean();

    if(question.createdBy == req.session.staff_id || req.session.isAdmin || assignment.duration.ends < new Date())
        if(question.solution) res.send(question.solution);
        else res.send('No solutions yet!');
    else
    res.status(404).end();

});

router.post('/solution/:qid',authenticate,teacher, async (req,res)=>{

    const question = await AssignmentQ.findOne({qid:req.params.qid}).select('solution createdBy');
    if(!question) return res.status(400).send("Invalid ID");

    if(question.createdBy == req.session.staff_id || req.session.isAdmin){
        question.solution.language = req.body.language;
        question.solution.sourceCode = req.body.sourceCode;
        question.save();
        res.send("Saved");
    }
    else{
        res.status(401).end();
    }

});

//display single question for student
router.get('/:qid',authenticate,async (req,res) => {
    let assignment=null;
    if(req.session.staff_id){
        const question =  await AssignmentQ.findOne({qid:req.params.qid}).lean();
        return res.render('editorAssignment',{question:question});
    }

    //previous 
    const question_prev = await AssignmentQ.findOne({assignmentId:new RegExp(new Date().getFullYear() - req.session.year),qid:req.params.qid}).lean().select({_id:0,test_cases:0,date:0});
    if(question_prev){
        assignment = await Assignment.findOne({id:question_prev.assignmentId}).lean().select('duration');
        return res.render('editorAssignment',{question:question_prev,duration:assignment.duration});
    }
    
    assignment = await Assignment.findOne({id:new RegExp('\^'+req.session.year),'duration.ends' :{$gt : new Date()}}).lean().select('id questions duration');
    if(!assignment) return res.status(404).end();

    if(assignment.questions.includes(req.params.qid)){
        const question = await AssignmentQ.findOne({qid:req.params.qid}).lean().select({_id:0,test_cases:0,date:0});
        return  res.render('editorAssignment',{question:question,duration:assignment.duration});

    }else //old questions of other batch
    {
        let question = await AssignmentQ.findOne({assignmentId:assignment.id,qid:req.params.qid}).lean().select({_id:0,test_cases:0,date:0});
        if(!question) return res.status(404).end();
        
        return res.render('editorAssignment',{question:question,duration:assignment.duration});
    }
    
    

});

//submission for assignment
router.post('/:qid',authenticate,async (req,res)=>{
    let assignment=null;
    let question = null;
    if(req.session.staff_id){
        question = await AssignmentQ.findOne({qid:req.params.qid}).lean().select({_id:0,test_cases:1});
        if(!question) return res.status(404).send("Invalid ID");
    }
    else{
        //check if previous
        question = await AssignmentQ.findOne({assignmentId: new RegExp(new Date().getFullYear()-req.session.year),qid:req.params.qid}).lean();
        if(question) assignment = await Assignment.findOne({id:question.assignmentId,'duration.ends':{$lt:new Date()}}).lean();
        if(!assignment){
            assignment = await Assignment.findOne({id:new RegExp('\^'+req.session.year),'duration.ends' :{$gt : new Date()}});
            if(!assignment) return res.status(400).end();

            question=null;
            if(assignment.questions.includes(req.params.qid)){

            question = await AssignmentQ.findOne({qid:req.params.qid}).lean();
            if(!question) return res.status(404).send("Invalid ID");
            }
            else{

            question = await AssignmentQ.findOne({assignmentId:assignment.id,qid:req.params.qid}).lean();
            if(!question) return res.status(404).send("Invalid ID");
            }
        }
        

    }
    
    const testcase = question.test_cases;
    let question_points = 0;
  testcase.forEach((item,index) =>{
    question_points +=item.points;
  });

  if(req.body.source.substr(req.body.source.length-18) == "undefinedundefined")
  req.body.source = req.body.source.substr(0,req.body.source.length-18);
  else
  return res.status(401).send("Unauthorized");
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
            "expected_output":encode64(testcase[i].output) ,"compiler_options":compiler_opt},
    json: true };

    result.push(request(options));

    }

    Promise.all(result)
    .then(async data => {
    let desc= [];
    data.forEach(store);
    function store(data,index){ let points=0;
        if(data.status.id == 3){
            points = testcase[index].points;
        }
        desc.push({id:data.status.id,description:data.status.description,points:points}); 
    }

    let total_points  = 0;
        desc.forEach((item,index) =>{
                total_points+= item.points;
        });

    if(req.session.code == req.body.source+req.params.qid) return res.send(desc);
    req.session.code = req.body.source + req.params.qid;

    if(req.session.staff_id || assignment.duration.ends < new Date() ){
        if(req.session.usn){
            let sub = new aSubmission();
            const subCount = await aSubmission.estimatedDocumentCount({usn:req.session.usn,qid:req.params.qid});
            if(subCount == 20){
                sub = await aSubmission.findOne({usn:req.session.usn,qid:req.params.qid}).sort({timestamp:1});
            }
            sub.qid = req.params.qid;
            sub.timestamp = new Date();
            sub.usn = req.session.usn;
            sub.sourceCode = req.body.source;
            if(total_points == question_points){
                sub.status = "Accepted";
            }
            else if(total_points == 0 ){
                sub.status = "Wrong Answer";
            }
            else{
                sub.status = "Partially Accepted";
            }
            sub.language_id = req.body.language;
            sub.points = total_points;
            await sub.save();
            return res.send(desc);
        }
        else{
            return res.send(desc);
        }
    }
        
        
        const usn =req.session.usn;
        const user_submission = assignment.submissions.find(i => (i.usn == req.session.usn && i.qid==req.params.qid));
        if(!user_submission){
        
            let obj ={};
            obj.qid = req.params.qid;
            obj.timestamp = new Date();
            obj.usn = req.session.usn;
            obj.sourceCode = req.body.source;
            if(total_points == question_points){
                obj.status = "Accepted";
            }
            else if(total_points == 0 ){
                obj.status = "Wrong Answer";
            }
            else{
                obj.status = "Partially Accepted";
            }
            obj.points = total_points;
            obj.language_id = req.body.language;
            assignment.submissions.push(obj);
            
            //leaderboard
            if(total_points>0){
                const index = assignment.leaderboard.findIndex(item=>{
                    return item.usn == usn;
                });
                if(index == -1){
                    let leadObj = {};
                    leadObj.usn=usn;
                    leadObj.timestamp = new Date()- assignment.duration.starts;
                    leadObj.name = req.session.fname + " " + req.session.lname;
                    leadObj.points = total_points; 
                    
                    assignment.leaderboard.push(leadObj);
                }
                else
                {
                    assignment.leaderboard[index].points += total_points;
                    assignment.leaderboard[index].timestamp = new Date()- assignment.duration.starts;
                }
                leaderboardSort();
            }

            await assignment.save();
            return res.send(desc);
        }
    
        let sub = new aSubmission();
        const subCount = await aSubmission.estimatedDocumentCount({usn:req.session.usn,qid:req.params.qid});
        if(subCount == 20){
            sub = await aSubmission.findOne({usn:req.session.usn,qid:req.params.qid}).sort({timestamp:1});
        }
        if(total_points == question_points && user_submission.status == "Accepted"){
            
            sub.qid = req.params.qid;
            sub.timestamp = new Date();
            sub.usn = req.session.usn;
            sub.sourceCode = req.body.source;
            sub.status = "Accepted";
            sub.language_id = req.body.language;
            sub.points = total_points;
            await sub.save();
            return res.send(desc);
        }
        else if (total_points == question_points ){
            
            const i= assignment.submissions.indexOf(user_submission);
            let previous_sub =  new aSubmission(_.pick(assignment.submissions[i].toJSON(),['usn','sourceCode','status','timestamp','language_id','points']));
            await previous_sub.save();
            assignment.submissions.splice(i,1);
            let obj ={};
            obj.qid = req.params.qid;
            obj.timestamp = new Date();
            obj.usn = req.session.usn;
            obj.sourceCode = req.body.source;
            obj.status = "Accepted";
            obj.points = total_points;
            obj.language_id = req.body.language;

            //leaderboard
            const index = assignment.leaderboard.findIndex(item=>{
                return item.usn == usn;
            });
            if(index == -1){
                let leadObj = {};
                leadObj.usn=usn;
                leadObj.timestamp = new Date()- assignment.duration.starts;
                leadObj.name = req.session.fname + " " + req.session.lname;
                leadObj.points = total_points; 
                
                assignment.leaderboard.push(leadObj);
            }
            else
            {
                assignment.leaderboard[index].points += total_points - old_points;
                assignment.leaderboard[index].timestamp = new Date()- assignment.duration.starts;
            }
            leaderboardSort();

            assignment.submissions.push(obj);
            await assignment.save();
            return res.send(desc);
        }
        else if(total_points > user_submission.points){
            
            const i= assignment.submissions.indexOf(user_submission);
            let previous_sub =  new aSubmission(_.pick(assignment.submissions[i].toJSON(),['usn','sourceCode','status','timestamp','language_id','points']));
            await previous_sub.save();
            assignment.submissions.splice(i,1);
            let obj ={};
            obj.qid = req.params.qid;
            obj.timestamp = new Date();
            obj.usn = req.session.usn;
            obj.sourceCode = req.body.source;
            if(total_points == question_points){
                obj.status = "Accepted";
            }
            else if(total_points == 0 ){
                obj.status = "Wrong Answer";
            }
            else{
                obj.status = "Partially Accepted";
            }
            obj.language_id = req.body.language;
            obj.points = total_points;

            //leaderboard
            const index = assignment.leaderboard.findIndex(item =>{
                return item.usn == usn;
            });
            if(index == -1){
                let leadObj = {};
                leadObj.usn=usn;
                leadObj.timestamp = new Date() -  assignment.duration.starts;
                leadObj.name = req.session.fname + " " + req.session.lname;
                leadObj.points = total_points; 
                
                assignment.leaderboard.push(leadObj);
            }
            else
            {
                assignment.leaderboard[index].points += total_points - old_points;
                assignment.leaderboard[index].timestamp = new Date()- assignment.duration.starts;
            }

            leaderboardSort();

            assignment.submissions.push(obj);
            await assignment.save();
            return res.send(desc);
        }
        else {
       
            sub.qid = req.params.qid;
            sub.timestamp = new Date();
            sub.usn = req.session.usn;
            sub.sourceCode = req.body.source;
            if(total_points == question_points){
                sub.status = "Accepted";
            }
            else if(total_points == 0 ){
                sub.status = "Wrong Answer";
            }
            else{
                sub.status = "Partially Accepted";
            }
            
            sub.language_id = req.body.language;
            sub.points = total_points;
            await sub.save();
            return res.send(desc);
            
    
        }

        function leaderboardSort(){
            assignment.leaderboard.sort((a,b) =>{
                if(a.points > b.points) return -1;
                else if(a.points < b.points) return 1;
                else if(a.points == b.points){
                    if(a.timestamp<b.timestamp) return -1;
                    else if(a.timestamp>b.timestamp) return 1;
                    else return 0;
                }
        });
        }
    
    }).catch(err => { winston.error(err);
        console.log(err);
    res.status(500).send("Something went wrong.");
    });



});

//--------------------editing routes------------------------//
//get an assignment
router.get('/edit/:id',authenticate,teacher,async (req,res) => {
    const assignment = await Assignment.findOne({id:req.params.id}).lean();
    if(!assignment) return res.status(400).send("Not Found");
  
    let questions = await AssignmentQ.find({assignmentId:req.params.id}).lean();
    if(!questions) questions = [];

    const old = await AssignmentQ.find({qid:{$in:assignment.questions}}).lean();
    questions = questions.concat(old);

    res.send({assignment:assignment,questions:questions});
  });

//get an old assignment question
router.get('/old/:qid',authenticate,async (req,res)=>{
    if(req.session.staff_id){
        let question = await AssignmentQ.findOne({qid:req.params.qid}).lean();
        if(!question) return res.status(400).send("Not Found!");

        res.send(question);
    }
    else{
        let question = await AssignmentQ.findOne({qid:req.params.qid}).lean();
        if(!question) return res.status(400).send("Not Found!");

        if(!question.assignmentId.includes(new Date().getFullYear() - req.session.year)) return res.status(404).end();
    
        res.send(question);
    }
});

  //get an assignment question
router.get('/edit/:id/:qid',authenticate,teacher,async (req,res) => {
    const assignment = await Assignment.findOne({id:req.params.id}).lean().select('questions id');
    if(!assignment) return res.status(400).send("Error! Not Found");

    let question = await AssignmentQ.findOne({qid:req.params.qid}).lean();
    if(!question) return res.status(400).send("Not Found!");

    if(assignment.questions.includes(question.qid) || question.assignmentId == assignment.id){
        res.send(question);
    }
    else
    {
        res.status(400).send("Not found!");
    }

});

//editing a question
router.post('/edit/:id/:qid',authenticate,teacher,async (req,res) =>{
    const {error} = validateAQ(req.body);
    if(error) return res.status(400).send(error.message);

    let question = await AssignmentQ.findOne({qid:req.params.qid,assignmentId:req.params.id});
    if(!question) return res.status(400).send("Cannot edit this question.");

    question.name = req.body.name;
    question.statement= decodeURIComponent(req.body.statement);
    question.constraints = req.body.constraints;
    question.input_format = req.body.i_format;
    question.output_format = req.body.o_format;
    question.description = req.body.description;
    question.difficulty = req.body.difficulty;

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
    else{
        question.test_cases.push({input:req.body.i_testcase1, output:req.body.o_testcase1,points:req.body.points});
    }

    question.explanation= req.body.explanation;
    if(Array.isArray(req.body.languages)){
        question.languages = req.body.languages;
      }
      else{
        question.languages=[req.body.languages];
      }
    await question.save();

    res.send("Changes Saved Successfully.");


});



//delete a question
router.get('/delete/:id/:qid',authenticate,teacher, async (req,res) => {
    let assignment = await Assignment.findOne({id:req.params.id});
    if(!assignment) return res.status(400).send("Invalid ID");

    let question = await AssignmentQ.findOne({assignmentId:req.params.id,qid:req.params.qid});
    if(!question){
        if( assignment.questions.includes(req.params.qid)){
            const i=assignment.questions.indexOf(req.params.qid);
            assignment.questions.splice(i,1);
            assignment.save();
            return res.send("Question Removed");
        }
        else{
            return res.status(400).send("Invalid ID");
        }
    }
    else{
        if(!assignment.duration.ends> new Date()) return res.status(400).send("Invalid ID");
        await AssignmentQ.findOneAndDelete({assignmentId:assignment.id,qid:req.params.qid});
    }
  
    
    res.send("Question Deleted.");

});


//retrieve old questions
router.post('/edit/old',authenticate,teacher,async(req,res)=>{

    if(!req.query.page) req.query.page=1;
    
    const assignment = await Assignment.find({sem:req.body.sem,'duration.ends':{$lt:new Date()}}).lean().select({id:1,_id:0});
    
    if(!assignment) return res.status(400).send("Nothing Found.");
    
    let asg= [];
    assignment.forEach((item,index)=>{
        asg.push(item.id);
    });
    const totalCount = await AssignmentQ.countDocuments({assignmentId:{$in:asg}}).lean();
    if(!totalCount) return res.status(400).send("Nothing Found");
    
    let questions = await AssignmentQ.find({assignmentId:{$in:asg}}).sort({assignmentId:-1}).skip((req.query.page-1)*10).limit(10).lean();
    if(!questions) return res.status(400).send("Nothing Found");
    
    res.send({questions:questions,total:totalCount});


});

router.post('/edit/oldAdd',authenticate,teacher,async (req,res) =>{
    let qid,cur_aId=null;
    try{cur_aId = req.body.cur_aId;
        let assignment = await Assignment.findOne({id:cur_aId}).select('questions');
        if(!assignment) return res.status(400).send("Assignment not found");

        
        if(!Array.isArray(req.body.list)){
        qid = req.body.list.split("#")[1];

        if(assignment.questions.includes(qid)) return res.status(400).send("Question with ID "+qid+" already inserted. Deselect to proceed");
        assignment.questions.push(qid);
        assignment.save();
        return res.send("Questions added Successfully");
        }
        else{
            for(let i=0;i<req.body.list.length;i++){
                qid = req.body.list[i].split("#")[1];
                if(assignment.questions.includes(qid)) return res.status(400).send("Question with ID "+qid+" already inserted. Deselect to proceed");
                assignment.questions.push(qid);
                
            }
            assignment.save();
        }
        
    }
    catch(err){winston.error(err);
        return res.status(400).end();
        }

    res.send("Questions added Successfully");
    
});

//searching questions
router.get('/old/search/:sem/:term',authenticate,teacher,async (req,res) => {
    const term = req.params.term;
    let sem=0;
    try{
        sem  = Number(req.params.sem);
    }
    catch(err){
        sem=0;
    }
    if(isNaN(sem)) return res.send("Please Select Sem");
    const assignment = await Assignment.find({sem:sem}).lean().select({id:1,_id:0});
    if(!assignment) return res.send("Nothing Found");
    let list=[];
    assignment.forEach((item,index)=>{
        list.push(item.id);
    });
    const questions = await AssignmentQ.find({name: new RegExp(term,'i'),assignmentId:{$in:list}}).lean();
    if(!questions || questions.length==0){
        return res.status(400).send("Nothing found!");
    }

    res.send(questions);
});


module.exports = router;