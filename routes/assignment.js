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

function encode64(string){ //encoding to base64
    const b = new Buffer.from(string);
  return b.toString('base64');
  }
  
  function decode64(string64){//decode to utf8
    const b = new Buffer.from(string64, 'base64')
  return b.toString();
  }

//Load the current assignment questions for students and manage for teachers
router.get('/',authenticate, async (req,res) => {

    if(req.session.staff_id){
        const current = await Assignment.find({ 'duration.ends' :{$gt : new Date()} }).lean().select({id:1,sem:1,_id:0}).sort({id:1});
        res.render('teacher/assignment',{current:current});
    }
    else{
        const assignment = await Assignment.findOne({id:new RegExp('\^'+req.session.year),'duration.ends' :{$gt : new Date()}}).lean().select('id questions');
        if(!assignment) return res.send("Try again later.");

        let questions = await AssignmentQ.find({assignmentId:assignment.id}).lean().select({_id:0,name:1,qid:1});
        if(!questions) questions = [];

        const old = await AssignmentQ.find({qid:{$in:assignment.questions}}).lean().select({_id:0,name:1,qid:1});
        questions = questions.concat(old);

        res.render('assignment',{questions:questions});
    }
    
});

router.get('/get/:id',authenticate,teacher,async (req,res) =>{

    const assignment = await Assignment.findOne({id:req.params.id,'duration.ends' :{$gt : new Date()}}).lean().select('id questions');
    if(!assignment) return res.send("Try again later.");

    let questions = await AssignmentQ.find({assignmentId:assignment.id}).lean().select({_id:0,name:1,qid:1});
    if(!questions) questions = [];

    const old = await AssignmentQ.find({qid:{$in:assignment.questions}}).lean().select({_id:0,name:1,qid:1});
    questions = questions.concat(old);

    res.send(questions);

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
    let source=[];
    if(req.query.lang){
        let assignment = await Assignment.findOne({id:new RegExp('\^'+req.session.year)},{submissions:{$elemMatch:{usn:req.session.usn,qid:req.params.qid,language_id:req.query.lang}}},{_id:0,'submissions.$':1}).lean();
        if(!assignment) return res.status(404).end();
        if(!assignment.submissions)assignment.submissions=[];

        const submission = await aSubmission.find({usn:req.session.usn,qid:req.params.qid,language_id:req.query.lang}).lean();
        source = assignment.submissions.concat(submission);
        if(source.length == 0){
            source=[{sourceCode:config.get(`source.${req.query.lang}`)}];
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
  
    res.send(source.sort((a,b)=>(a.timestamp>b.timestamp)?-1:1));
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

//display single question for student
router.get('/:qid',authenticate,async (req,res) => {

    if(req.session.staff_id){
        const question =  await AssignmentQ.findOne({qid:req.params.qid}).lean();
        return res.render('teacher/editorAssignment',{question:question});
    }

    const assignment = await Assignment.findOne({id:new RegExp('\^'+req.session.year),'duration.ends' :{$gt : new Date()}}).lean().select('id questions');
    if(!assignment) return res.status(400).end();

    if(assignment.questions.includes(req.params.qid)){
        const question = await AssignmentQ.findOne({qid:req.params.qid}).lean().select({_id:0,test_cases:0,date:0});
        return  res.render('editorAssignment',{question:question});

    }else
    {
        const question = await AssignmentQ.findOne({assignmentId:assignment.id,qid:req.params.qid}).lean().select({_id:0,test_cases:0,date:0});
        if(!question) return res.send("Invalid ID");
        
        return res.render('editorAssignment',{question:question});
        
    }
    
    

});

//submission for assignment
router.post('/:qid',authenticate,async (req,res)=>{

    const assignment = await Assignment.findOne({id:new RegExp('\^'+req.session.year),'duration.ends' :{$gt : new Date()}}).select('id questions submissions');
    if(!assignment) return res.status(400).end();

    let question=null;
    if(assignment.questions.includes(req.params.qid)){

    question = await AssignmentQ.findOne({qid:req.params.qid}).lean().select({_id:0,test_cases:1});
    if(!question) return res.send("Invalid ID");
    }
    else{

    question = await AssignmentQ.findOne({assignmentId:assignment.id,qid:req.params.qid}).lean().select({_id:0,test_cases:1});
    if(!question) return res.send("Invalid ID");
    }

    const testcase = question.test_cases;
    let contest_points = 0;
  testcase.forEach((item,index) =>{
    contest_points +=item.points;
  });

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
    .then(async data => {
    let desc= [];
    data.forEach(store);
    function store(data,index){ let points=0;
        if(data.status.id == 3){
            points = testcase[index].points;
        }
        desc.push({id:data.status.id,description:data.status.description,points:points}); 
    }
    if(req.session.code == req.body.source) return res.send(desc);

        let total_points  = 0;
        desc.forEach((item,index) =>{
                total_points+= item.points;
        });

        const user_submission = assignment.submissions.find(i => (i.usn == req.session.usn && i.qid==req.params.qid));
        req.session.code = req.body.source;
        if(!user_submission){
        
            let obj ={};
            obj.qid = req.params.qid;
            obj.timestamp = new Date();
            obj.usn = req.session.usn;
            obj.sourceCode = req.body.source;
            if(total_points == contest_points){
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
            await assignment.save();
            return res.send(desc);
        }
    
        let sub = new aSubmission();
        const subCount = await aSubmission.estimatedDocumentCount({usn:req.session.usn,qid:req.params.qid});
        if(subCount == 20){
            sub = await aSubmission.findOne({usn:req.session.usn,qid:req.params.qid}).sort({timestamp:1});
        }
        if(total_points == contest_points && user_submission.status == "Accepted"){
            
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
        else if (total_points == contest_points ){
            
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
            if(total_points == contest_points){
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
            assignment.submissions.push(obj);
            await assignment.save();
            return res.send(desc);
        }
        else {
       
            sub.qid = req.params.qid;
            sub.timestamp = new Date();
            sub.usn = req.session.usn;
            sub.sourceCode = req.body.source;
            if(total_points == contest_points){
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

    
    }).catch(err => { console.log(err);
    res.send(err);
    });



});

//--------------------editing routes------------------------//
//get an assignment
router.get('/edit/:id',teacher,async (req,res) => {
    const assignment = await Assignment.findOne({id:req.params.id}).lean();
    if(!assignment) return res.status(400).send("Not Found");
  
    let questions = await AssignmentQ.find({assignmentId:req.params.id}).lean();
    if(!questions) questions = [];

    const old = await AssignmentQ.find({qid:{$in:assignment.questions}}).lean();
    questions = questions.concat(old);

    res.send({assignment:assignment,questions:questions});
  });

  //get an assignment question
router.get('/edit/:id/:qid',teacher,async (req,res) => {
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
router.post('/edit/:id/:qid',teacher,async (req,res) =>{
    const {error} = validateAQ(req.body);
    if(error) return res.status(400).send(error.message);

    let question = await AssignmentQ.findOne({qid:req.params.qid,assignmentId:req.params.id});
    if(!question) return res.status(400).send("Cannot edit this question.");

    question.name = req.body.name;
    question.statement= decodeURIComponent(req.body.statement);
    question.constraints = req.body.constraints;
    question.input_format = req.body.i_format;
    question.output_format = req.body.o_format;

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
    await question.save();

    res.send("Changes Saved Successfully.");


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
    await question.save();

    res.status(200).send("Question added successfully");

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
    catch(err){
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