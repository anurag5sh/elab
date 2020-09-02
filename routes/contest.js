const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {Student} = require('../models/student');
const {Teacher} = require('../models/teacher');
const teacher = require('../middleware/teacher');
const contestAuth = require('../middleware/contestAuth');
const {Contest,validateContest} = require('../models/contest');
const {ContestQ,validateCQ} = require('../models/contestQ');
const {Submission} = require('../models/submission');
const {CustomGroup} = require('../models/customGroup');
const moment = require('moment');
const _ = require('lodash');
const config = require('config');
const admin = require('../middleware/admin');
const puppeteer = require('puppeteer'); 
const path = require('path');
const winston = require('winston');
const rimraf = require('rimraf');
const fs = require('fs');
const {Achievements} = require('../models/achievementJob');
const achievements = require('../jobs/achivements');
const {run} = require('../compiler/api');

achievements.achievementsStartup();

function encode64(string){ //encoding to base64
    const b = new Buffer.from(string.replace(/\r\n/g, "\n"));
  return b.toString('base64');
}
  
function decode64(string64){//decode to utf8
const b = new Buffer.from(string64, 'base64')
return b.toString();
}


function two(x) {return ((x>9)?"":"0")+x}
function three(x) {return ((x>99)?"":"0")+((x>9)?"":"0")+x}

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

function convertMS( milliseconds ) {
    var day, hour, minute, seconds;
    seconds = Math.floor(milliseconds / 1000);
    minute = Math.floor(seconds / 60);
    seconds = seconds % 60;
    hour = Math.floor(minute / 60);
    minute = minute % 60;
    day = Math.floor(hour / 24);
    hour = hour % 24;
    var time = two(day)+":"+two(hour)+":"+two(minute)+":"+two(seconds);
    return time;
}



router.get('/',authenticate, async (req,res)=> {
    let page=1;
    if(Number.isNaN(req.query.page) || !req.query.page || req.query.page < 1) page=1;
    else page=req.query.page;
    let count=0;
    if(req.session.staff_id){
        let contest=null;
        if(!req.query.l){ //query l does not exist
            if(req.session.isAdmin){
            contest = await Contest.find({'timings.ends':{$gt:new Date()}}).lean().sort({'timings.starts':1}).skip((page-1)*12).limit(12);
            }
            else
            contest = await Contest.find({$or:[{createdBy:req.session.staff_id},{custom_staff_id:req.session.staff_id}],'timings.ends':{$gt:new Date()}}).lean().sort({'timings.starts':1}).skip((page-1)*12).limit(12);
            if(contest.length <=0) return res.render('teacher/trcontest',{contest:[],count:0,msg:"No ongoing or upcoming contests available."});
            count = await Contest.countDocuments({'timings.ends':{$gt:new Date()}});
        }
        else if(req.query.l == 'past'){
            if(req.session.isAdmin){
            contest = await Contest.find({'timings.ends':{$lt:new Date()}}).lean().sort({'timings.starts':-1}).skip((page-1)*12).limit(12);
            }
            else
            contest = await Contest.find({$or:[{createdBy:req.session.staff_id},{custom_staff_id:req.session.staff_id}],'timings.ends':{$lt:new Date()}}).lean().sort({'timings.starts':-1}).skip((page-1)*12).limit(12);
            if(contest.length <=0) return res.render('teacher/trcontest',{contest:[],count:0,msg:"No ongoing or upcoming contests available."});
            count = await Contest.countDocuments({'timings.ends':{$lt:new Date()}}).lean().sort({'timings.starts':-1});
            return res.render('teacher/trcontest',{contest:contest,count:count,type:"past",page:page});
        }
        else{
            if(req.session.isAdmin){
            contest = await Contest.find({'timings.ends':{$gt:new Date()}}).lean().sort({'timings.starts':1}).skip((page-1)*12).limit(12);
            }
            else
            contest = await Contest.find({$or:[{createdBy:req.session.staff_id},{custom_staff_id:req.session.staff_id}],'timings.ends':{$gt:new Date()}}).lean().sort({'timings.starts':1}).skip((page-1)*12).limit(12);
            if(contest.length <=0) return res.render('teacher/trcontest',{contest:[],count:0,msg:"No ongoing or upcoming contests available."});
            count = await Contest.countDocuments({'timings.ends':{$gt:new Date()}}).lean().sort({'timings.starts':-1});
        }
        
        res.render('teacher/trcontest',{contest:contest,count:count,type:"ongoing",page:page});
    }
    else{
        if(!req.query.l){ //query l does not exist
            const grp = await CustomGroup.find({'usn':req.session.usn}).lean().select({id:1,_id:0});
            let gid=[];
            for(i of grp) gid.push(i.id);
            let contest = await Contest.find({$or:[{'batch' : req.session.batch},{'custom_usn':req.session.usn},{customGroup:{$in:gid}}],isReady:true,'timings.ends':{$gt:new Date()}}).select('name url description questions timings image').lean().sort({'timings.starts':1}).skip((page-1)*12).limit(12);
            //-contest = contest.concat(await Contest.find({customGroup:{$in:gid},isReady:true,'timings.ends':{$gt:new Date()}}).lean().select('name url description questions timings')).sort({'timings.starts':-1}).skip((page-1)*12).limit(12);
            if(contest.length <=0) return res.render('contest',{contest:[],count:0,msg:"No ongoing or upcoming contests available."});
            count = await Contest.countDocuments({$or:[{'batch' : req.session.batch},{'custom_usn':req.session.usn},{customGroup:{$in:gid}}],isReady:true,'timings.ends':{$gt:new Date()}});
            res.render('contest',{contest:contest,count:count,type:"ongoing",page:page});
        }
        else{

            

            if(req.query.l == 'past'){ //l=past
                const grp = await CustomGroup.find({'usn':req.session.usn}).lean().select({id:1,_id:0});
                let gid=[];
                for(i of grp) gid.push(i.id);
                let contest = await Contest.find({$or:[{'batch' : req.session.batch},{'custom_usn':req.session.usn},{customGroup:{$in:gid}}],isReady:true,'timings.ends':{$lt:new Date()}}).select('name url description questions timings image').lean().sort({'timings.starts':-1}).skip((page-1)*12).limit(12);
                //contest = contest.concat(await Contest.find({customGroup:{$in:gid},isReady:true,'timings.ends':{$lt:new Date()}}).lean().select('name url description questions timings')).sort({'timings.starts':-1}).skip((page-1)*12).limit(12);
                if(contest.length <=0) return res.render('contest',{contest:[],count:0,msg:"No ongoing or upcoming contests available."});
                count = await Contest.countDocuments({$or:[{'batch' : req.session.batch},{'custom_usn':req.session.usn},{customGroup:{$in:gid}}],isReady:true,'timings.ends':{$lt:new Date()}});
                res.render('contest',{contest:contest,count:count,type:"past",page:page});
            }
            else{ //query l exists but invalid value
                const grp = await CustomGroup.find({'usn':req.session.usn}).lean().select({id:1,_id:0});
                let gid=[];
                for(i of grp) gid.push(i.id);
                let contest = await Contest.find({$or:[{'batch' : req.session.batch},{'custom_usn':req.session.usn},{customGroup:{$in:gid}}],isReady:true,'timings.ends':{$gt:new Date()}}).select('name url description questions timings image').lean().sort({'timings.starts':1}).skip((page-1)*12).limit(12);
                //contest = contest.concat(await Contest.find({customGroup:{$in:gid},isReady:true,'timings.ends':{$gt:new Date()}}).lean().select('name url description questions timings')).sort({'timings.starts':-1}).skip((page-1)*12).limit(12);
                if(contest.length <=0) return res.render('contest',{contest:[],count:0,msg:"No ongoing or upcoming contests available."});
                count = await Contest.countDocuments({$or:[{'batch' : req.session.batch},{'custom_usn':req.session.usn},{customGroup:{$in:gid}}],isReady:true,'timings.ends':{$gt:new Date()}});
                res.render('contest',{contest:contest,count:count,type:"ongoing",page:page});

            }
            
        }
    }
});

//teacher creates contest page
router.get('/create',authenticate,teacher, (req,res) => {
    if(req.session.staff_id)
    res.render('teacher/createContest');
    else
    res.status(404).end();
});

//Saving the contest in db
router.post('/create',authenticate,teacher, async (req,res)=>{
    const { error } = validateContest(req.body);
    if(error) return res.status(400).send(error.message); 
   
    const createdBy = req.session.staff_id;
    let id=null;
    let lastInserted = await Contest.find({}).sort({_id:-1}).limit(1).lean().select('id');
    if(lastInserted[0]){
    id = lastInserted[0].id;
    id++;
    }
    else{
        id=1;
    }
    let url = req.body.name.trim().replace(/ /g,'-');
    let lastUrl  = await Contest.find({name:new RegExp('\^'+req.body.name.trim()+'\$','i')}).sort({_id:-1}).limit(1).lean().select('url');
    if(lastUrl.length>0){
    let count = lastUrl[0].url.replace(url,"");
    if(count=="")
        url = url+"1";
    else{
        count = Number(count) + 1;
        url = url + count;
    } 
    }
    let contest = new Contest({createdBy:createdBy,id:id,name:req.body.name.trim(),url:url});
    if(req.body.year){
        if(!Array.isArray(req.body.year)){
            contest.batch=[getBatch(req.body.year)];
        }
        else{
            contest.batch=req.body.year.map(getBatch);
        }
    }   
    else contest.batch =[];

    if(req.body.year) contest.year =req.body.year;
    else contest.year =[];
    
    contest.timings.created= moment().format();
    const starts = new Date(req.body.timings.split("-")[0]);
    const ends = new Date(req.body.timings.split("-")[1]);
    if(starts>=ends)
    return res.status(400).send("Incorrect timings");
    contest.timings.ends = ends;
    contest.timings.starts = starts;
    contest.description = req.body.description;
    contest.createdByName = req.session.fname + " "+ req.session.lname;
    no_of_image = config.get('no_of_contest_images');
    contest.image="/contestImage/"+Math.floor(Math.random() * no_of_image)+".jpg";

    await contest.save();
    achievements.addAchievementJob(contest.id,contest.timings.ends);
    res.send(contest);


});


// list the contest made by teacher 
router.get('/manage',authenticate,teacher, async (req,res) => {
    let page=1;
    if(Number.isNaN(req.query.page) || !req.query.page || req.query.page < 1) page=1;
    else page=req.query.page;
    let count=0;
    if(req.session.isAdmin){
        const contest = await Contest.find().lean().sort({_id:-1}).skip((page-1)*12).limit(12);
        count=await Contest.countDocuments();
        return res.render('teacher/manage',{contests:contest,count:count,page:page}); 
    }

    let trcontest = await Contest.find({createdBy:req.session.staff_id}).lean().sort({_id:-1}).skip((page-1)*12).limit(12); 
    count = await Contest.countDocuments({createdBy:req.session.staff_id});
    if(trcontest.length <=0) trcontest=[];
    res.render('teacher/manage',{contests:trcontest,count:count,page:page}); 
    

});


//allowing a group to participate in contest
router.post('/group/allow/:url',authenticate,teacher,async (req,res)=>{
    let contest = await Contest.findOne({url:req.params.url}).select('customGroup');
    if(!contest) return res.status(400).send("Contest not found");

    if(req.body.selectedList){
        contest.customGroup = contest.customGroup.concat(req.body.selectedList);
        await contest.save();
        res.send('Group added to this contest!');
    }
    else
        return res.status(400).send("No group selected!");
  
});

//removing a group from contest
router.get('/group/remove/:curl/:id',authenticate,teacher,async (req,res)=>{
    const contest = await Contest.findOne({url:req.params.curl}).select('customGroup');
    if(!contest) return res.status(400).send('Invalid ID');

    const i =contest.customGroup.findIndex(i => {return i.id == req.params.id});
    if(!i) return res.status(400).send("Group not exisiting in this contest.");

    contest.customGroup.splice(i,1);
    await contest.save();

    res.send("Group removed");
});

//teacher manage contest
router.get('/manage/:name',authenticate,teacher, async (req,res) => {

    let contest = await Contest.findOne({url:req.params.name}).lean();
    if(!contest) return res.status(404).end();

    let custom = await CustomGroup.find({id:{$in: contest.customGroup}}).lean();
    if(!custom) custom=[];

    let questions = [];
    const allQuestions = await ContestQ.find({qid:{$in:contest.questions}}).lean();
    for(i of allQuestions){ let points=0;
        if(i.autoJudge){
            for(j of i.test_cases){
                points+=j.points;
            }
            i.totalPoints = points;
        }
        questions.push(i);
    }
    let signed_up =[0,0,0,0,0];
    for(i of contest.signedUp){
        if(i.year == '-') signed_up[4]++;
         signed_up[i.year-1]++;
    }
    let submissions = [0,0,0,0,0];
    for(i of contest.submissions){
        if(i.year == '-') submissions[4]++;
        submissions[i.year - 1]++;
    }

    let questionNo = [];
    for( i of questions){
        questionNo.push({qid:i.qid,name:i.name, Accepted: 0,Partially_Accepted: 0,Wrong_Answer: 0});
    }

    for (i of contest.submissions){
        if(i.status === "Accepted" ){
            const index = questionNo.findIndex( j => j.qid === i.qid);
            questionNo[index].Accepted++;
        }
        else if(i.status === "Partially Accepted"){
            const index = questionNo.findIndex( j => j.qid === i.qid);
            questionNo[index].Partially_Accepted++;
        }
        else{
            const index = questionNo.findIndex( j => j.qid === i.qid);
            questionNo[index].Wrong_Answer++;
        }
    }

    let stats ={signed_up:signed_up , submissions:submissions};
    if(contest.createdBy == req.session.staff_id || req.session.isAdmin)
       return res.render('teacher/manageContest',{contest:contest, questions:questions,stats:stats,questionNo:questionNo,custom:custom});
    else
        return res.status(404).end();
    
    
});

//teacher editing existing contest
router.post('/manage/:name',authenticate,teacher,async (req,res) =>{
    const { error } = validateContest(req.body);
    if(error) return res.status(400).send(error.message); 
    
    let contest = await Contest.findOne({url:req.params.name});
    if(!contest) return res.status(400).send('Contest Ended!');
    
    if(!req.session.isAdmin){
        if(contest.timings.ends < new Date()){
            return res.status(400).send('Contest Ended!');
        }   
    }
    
    if(!(contest.createdBy==req.session.staff_id || req.session.isAdmin)) return res.status(400).send('Cannot edit this contest');
    const starts = new Date(req.body.timings.split("-")[0]);
    const ends = new Date(req.body.timings.split("-")[1]);
    if(starts>=ends)
    return res.status(400).send("Incorrect timings");
    contest.name = req.body.name;
    contest.timings.ends = ends;
    contest.timings.starts = starts;
    contest.description = req.body.description;
    if(req.body.year){
        if(!Array.isArray(req.body.year)){
            contest.batch=[getBatch(req.body.year)];
        }
        else{
            contest.batch=req.body.year.map(getBatch);
        }
    }   
    else contest.batch =[];
    contest.year = req.body.year || [];
    contest.isReady = (req.body.status == "on"?true:false);

    //editing the achivements job
    if(!(contest.timings.ends < new Date())){
        achievements.clearAchievementJob(contest.id);
        achievements.addAchievementJob(contest.id,contest.timings.ends);    
    }
    
    await contest.save();

    res.send("Changes saved!");
   
});



//sign up for contest
router.get('/sign/:curl',authenticate,contestAuth,async (req,res) => {
   const con = await Contest.findOneAndUpdate({url:req.params.curl, isReady:true,'signedUp.usn':{$ne : req.session.usn || req.session.staff_id},'timings.starts':{$lt:new Date()},'timings.ends':{$gt:new Date()}},{$addToSet :{signedUp : {usn: req.session.usn || req.session.staff_id,name:req.session.fname+" "+req.session.lname,time:new Date(),year:req.session.year || "-"}}},
   (err,doc) => {
    if(err)
    return res.status(404).send("Not Permitted");
   });

    return res.redirect('/contest/'+ req.params.curl);
});

//adding question to contest
router.post('/add/:cname',authenticate,teacher,async (req,res) => {
    const contest = await Contest.findOne({url:req.params.cname});
    if(!contest) return res.status(404);

    if(contest.timings.ends < new Date()) return res.status(400).send("Cannot add a question after contest has ended.");
    const {error} = validateCQ(req.body);
    if(error) return res.status(400).send(error.message);
    let count=0;
    const date = moment().format('DDMMYY');
    let lastInserted = await ContestQ.find({qid:new RegExp('\^'+date)}).sort({_id:-1}).limit(1).lean().select('qid');
    if(lastInserted.length>0){
        count = lastInserted[0].qid.replace(date,"");
    }
    let question = new ContestQ();
    question.name = req.body.name;
    
    question.statement=decodeURIComponent(req.body.statement); 
    question.constraints = req.body.constraints;
    question.input_format = req.body.i_format;
    question.output_format = req.body.o_format;
    question.description = req.body.description;
    question.difficulty = req.body.difficulty;
    question.active = (req.body.active == "on"?true:false);
    question.autoJudge = req.body.judging;
    question.totalPoints = req.body.totalPoints;

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
    question.qid =date + (++count);
    if(Array.isArray(req.body.languages)){
        question.languages = req.body.languages;
      }
      else{
        question.languages=[req.body.languages];
      }
    await question.save();

    contest.questions.push(question.qid);
    await contest.save();

    res.status(200).send("Question added successfully");

});

//fetching submissions
router.get('/submissions/:curl',authenticate,contestAuth, async (req,res) =>{
    const contest = res.locals.contest;
    let student = false;

    //verification
    if(req.session.staff_id){
        if(!(contest.createdBy == req.session.staff_id || req.session.isAdmin || req.session.staff_id && contest.timings.ends < new Date()))
            return res.status(401).end();
        
    }
    else{   student=true;
        if(!(contest.timings.ends < new Date()))
            return res.status(401).end();
    }

    let students = [];
    let teachers =[];
    for(i=0;i<contest.submissions.length;i++){
        if(contest.submissions[i].year != '-')
        students.push(contest.submissions[i].usn);
        else
        teachers.push(contest.submissions[i].usn);

    }
    let studentData={},teacherData={},questions = {};
    let studentResult = await Student.find({usn:{$in:students}}).select('usn fname lname -_id').lean();
    if(!studentResult) studentResult = [];
    else{
        for( i of studentResult)
            studentData[i.usn] = i;
    }

    let teacherResult = await Teacher.find({staff_id:{$in:teachers}}).select('staff_id fname lname -_id').lean();
    if(!teacherResult) teacherResult = [];
    else{
        for( i of teacherResult)
            teacherData[i.staff_id] = i;
    }

    let questionsResult = await ContestQ.find({qid:{$in:contest.questions}}).lean().select('qid name -_id');
    if(!questionsResult) questionsResult=[];
    else{
        for(i of questionsResult)
            questions[i.qid]=i;
    }

    let SendData=[];
    for(i=0;i<contest.submissions.length;i++){ let data={};
        const qid = contest.submissions[i].qid;
        if(student && contest.submissions[i].status != "Accepted")
            continue;
        if(contest.submissions[i].year != '-' ){
            const student = studentData[contest.submissions[i].usn];
            data.usn = student.usn;
            data.name = student.fname + " " + student.lname;
            data.code = '<a data-toggle="modal" data-target="#source" data-usn="'+student.usn+'" data-qid="'+qid +'" href="#">View Code</a>';
        }
        else{
            const teacher = teacherData[contest.submissions[i].usn];
            data.usn = teacher.staff_id;
            data.name = teacher.fname + " " + teacher.lname;
            data.code = '<a data-toggle="modal" data-target="#source" data-usn="'+teacher.staff_id+'" data-qid="'+qid +'" href="#">View Code</a>';
        }
        data.qname = questions[qid].name;
        data.time = convertMS(contest.submissions[i].timestamp - contest.timings.starts);
        data.points =contest.submissions[i].points;
        data.status = contest.submissions[i].status;
        const l = lang(contest.submissions[i].language_id);
        data.lang = l.substr(0,l.length-2); 

        SendData.push(data);
    }

    res.send(SendData);

});


//fetching manual submissions
router.get('/manualSubmissions/:curl',authenticate,teacher, async (req,res) =>{
    const contest = await Contest.findOne({url:req.params.curl}).lean();
    if(!contest) return res.status(404).end();

    //verification
    if(req.session.staff_id){
        if(!(contest.createdBy == req.session.staff_id || req.session.isAdmin || req.session.staff_id && contest.timings.ends < new Date()))
            return res.status(401).end();
        
    }

    let students = [];
    let teachers =[];
    for(i=0;i<contest.submissions.length;i++){
        if(contest.submissions[i].year != '-')
        students.push(contest.submissions[i].usn);
        else
        teachers.push(contest.submissions[i].usn);

    }
    let studentData={},teacherData={},questions = {};
    let studentResult = await Student.find({usn:{$in:students}}).select('usn fname lname -_id').lean();
    if(!studentResult) studentResult = [];
    else{
        for( i of studentResult)
            studentData[i.usn] = i;
    }

    let teacherResult = await Teacher.find({staff_id:{$in:teachers}}).select('staff_id fname lname -_id').lean();
    if(!teacherResult) teacherResult = [];
    else{
        for( i of teacherResult)
            teacherData[i.staff_id] = i;
    }

    let questionsResult = await ContestQ.find({qid:{$in:contest.questions},autoJudge:false}).lean().select('qid name -_id');
    if(!questionsResult) questionsResult=[];
    else{
        for(i of questionsResult)
            questions[i.qid]=i;
    }

    const submissions = await Submission.find({qid:{$in:contest.questions},status:"Pending"}).lean();

    let SendData=[];
    for(i=0;i<submissions.length;i++){ let data={};
        const qid = submissions[i].qid;
        if(submissions[i].year != '-' ){
            const student = studentData[submissions[i].usn];
            data.usn = student.usn;
            data.name = student.fname + " " + student.lname;
            data.code = '<a data-toggle="modal" data-target="#sourceManual" data-usn="'+student.usn+'" data-qid="'+qid +'" data-objid="'+submissions[i]._id +'" href="#">View Code</a>';
        }
        else{
            const teacher = teacherData[submissions[i].usn];
            data.usn = teacher.staff_id;
            data.name = teacher.fname + " " + teacher.lname;
            data.code = '<a data-toggle="modal" data-target="#sourceManual" data-usn="'+teacher.staff_id+'" data-qid="'+qid +'" data-objid="'+submissions[i]._id +'" href="#">View Code</a>';
        }
        data.qname = questions[qid].name;
        data.time = convertMS(submissions[i].timestamp - contest.timings.starts);
        data.status = `<a href="/contest/${contest.url}/${qid}/evaluate/${data.usn}/${submissions[i]._id}" target="_blank">Evaluate</a>`;
        const l = lang(submissions[i].language_id);
        data.lang = l.substr(0,l.length-2); 

        SendData.push(data);
    }

    res.send(SendData);

});

//fetching all manual evaluated submissions
router.get('/allManualSubmissions/:curl',authenticate,teacher, async (req,res) =>{
    const contest = await Contest.findOne({url:req.params.curl}).lean();
    if(!contest) return res.status(404).end();

    //verification
    if(req.session.staff_id){
        if(!(contest.createdBy == req.session.staff_id || req.session.isAdmin || req.session.staff_id && contest.timings.ends < new Date()))
            return res.status(401).end();
        
    }

    let students = [];
    let teachers =[];
    for(i=0;i<contest.submissions.length;i++){
        if(contest.submissions[i].year != '-')
        students.push(contest.submissions[i].usn);
        else
        teachers.push(contest.submissions[i].usn);

    }
    let studentData={},teacherData={},questions = {};
    let studentResult = await Student.find({usn:{$in:students}}).select('usn fname lname -_id').lean();
    if(!studentResult) studentResult = [];
    else{
        for( i of studentResult)
            studentData[i.usn] = i;
    }

    let teacherResult = await Teacher.find({staff_id:{$in:teachers}}).select('staff_id fname lname -_id').lean();
    if(!teacherResult) teacherResult = [];
    else{
        for( i of teacherResult)
            teacherData[i.staff_id] = i;
    }

    let questionsResult = await ContestQ.find({qid:{$in:contest.questions},autoJudge:false}).lean().select('qid name -_id');
    if(!questionsResult) questionsResult=[];
    else{
        for(i of questionsResult)
            questions[i.qid]=i;
    }

    const submissions = await Submission.find({qid:{$in:contest.questions},status:{$ne:"Pending"}}).lean();

    let SendData=[];
    for(i=0;i<submissions.length;i++){ let data={};
        const qid = submissions[i].qid;
        if(submissions[i].year != '-' ){
            const student = studentData[submissions[i].usn];
            data.usn = student.usn;
            data.name = student.fname + " " + student.lname;
            data.code = '<a data-toggle="modal" data-target="#source" data-usn="'+student.usn+'" data-qid="'+qid +'" data-objid="'+submissions[i]._id +'" href="#">View Code</a>';
        }
        else{
            const teacher = teacherData[submissions[i].usn];
            data.usn = teacher.staff_id;
            data.name = teacher.fname + " " + teacher.lname;
            data.code = '<a data-toggle="modal" data-target="#source" data-usn="'+teacher.staff_id+'" data-qid="'+qid +'" href="#">View Code</a>';
        }
        data.qname = questions[qid].name;
        data.time = convertMS(submissions[i].timestamp - contest.timings.starts);
        data.status = submissions[i].status;
        data.evaluate = `<a href="/contest/${contest.url}/${qid}/evaluate/${data.usn}/${submissions[i]._id}" target="_blank">Re-Evaluate</a>`;
        data.points =submissions[i].points;
        const l = lang(submissions[i].language_id);
        data.lang = l.substr(0,l.length-2); 

        SendData.push(data);
    }

    res.send(SendData);

});


//fetching studentReport data
router.get('/studentReport/:curl',authenticate,teacher, async (req,res) =>{
    const contest = await Contest.findOne({url:req.params.curl}).lean();
    if(!contest) return res.status(400).send("Contest not found");

    //verification
    if(!(contest.createdBy == req.session.staff_id || req.session.isAdmin || req.session.staff_id && contest.timings.ends < new Date()))
    return res.status(401).end();
        
    let students = [];
    let teachers =[];
    for(i=0;i<contest.submissions.length;i++){
        if(contest.submissions[i].year != '-')
        students.push(contest.submissions[i].usn);
        else
        teachers.push(contest.submissions[i].usn);

    }
    
    let studentData = await Student.find({usn:{$in:students}}).select('usn fname lname -_id').lean();
    if(!studentData) studentData = [];

    let teacherData = await Teacher.find({staff_id:{$in:teachers}}).select('staff_id fname lname -_id').lean();
    if(!teacherData) teacherData = [];

    // let questions = await ContestQ.find({qid:{$in:contest.questions}}).lean().select('qid name -_id');
    // if(!questions) questions=[];

    let SendData=[];
    
    for(i=0;i<studentData.length;i++){let data={};
        const sub = contest.submissions.filter(j => {return j.usn == studentData[i].usn});
        data.usn = studentData[i].usn;
        data.name = studentData[i].fname + " " + studentData[i].lname;
        data.code = '<a data-toggle="modal" data-target="#source" data-usn="'+studentData[i].usn+'" href="#">View Report</a>';
        data.questions = sub.filter(j => {return j.status != "Wrong Answer" }).length;
        data.time=sub[sub.length-1].timestamp;
        data.lang=new Set();
        data.points=0;
        sub.forEach((item)=>{
            if(item.status != "Wrong Answer"){
                data.points += item.points;
                const l = lang(item.language_id);
                data.lang.add(l.substr(0,l.length-2));
                if(data.time < item.timestamp)
                    data.time = item.timestamp;
            }
        })
        data.time = convertMS(data.time - contest.timings.starts);
        data.lang = Array.from(data.lang).join();

        SendData.push(data);
    }

    for(i=0;i<teacherData.length;i++){let data={};
        const sub = contest.submissions.filter(j => {return j.usn == teacherData[i].staff_id});
        data.usn = teacherData[i].staff_id;
        data.name = teacherData[i].fname + " " + teacherData[i].lname;
        data.code = '<a data-toggle="modal" data-target="#source" data-usn="'+teacherData[i].staff_id+'" href="#">View Report</a>';
        data.questions = sub.filter(j => {return j.status != "Wrong Answer" }).length;
        data.time=sub[sub.length-1].timestamp;
        data.lang=new Set();
        data.points=0;
        sub.forEach((item)=>{
            if(item.status != "Wrong Answer"){
                data.points += item.points;
                const l = lang(item.language_id);
                data.lang.add(l.substr(0,l.length-2));
                if(data.time < item.timestamp)
                    data.time = item.timestamp;
            }
        })
        data.time = convertMS(data.time - contest.timings.starts);
        data.lang = Array.from(data.lang).join();
        SendData.push(data);
    }

    res.send(SendData);

});

//individual student report
router.get('/studentReport/:curl/:id',authenticate,teacher, async (req,res) =>{
    const contest = await Contest.findOne({url:req.params.curl}).lean();
    if(!contest) return res.status(400).send("Contest not found");

    if(!(contest.createdBy == req.session.staff_id || req.session.isAdmin || req.session.staff_id && contest.timings.ends < new Date()))
    return res.status(401).end();

    const subs = contest.submissions.filter( i => {return i.usn == req.params.id && i.status != "Wrong Answer"});

    let questions = await ContestQ.find({qid:{$in:contest.questions}}).lean().select('qid name -_id');
    if(!questions) questions=[];

    let sendData = [];

    for(i=0;i<subs.length;i++){
        let data={};
        data.name = questions.find(j => {return j.qid == subs[i].qid}).name;
        data.time = convertMS(subs[i].timestamp - contest.timings.starts);
        data.status = subs[i].status;
        const l = lang(subs[i].language_id);
        data.language = l.substr(0,l.length-2);
        data.sourceCode = subs[i].sourceCode;
        data.points = subs[i].points;

        sendData.push(data);
    }

    res.send(sendData);

});

//student report download
router.get('/studentReportDownload/:curl/:id',authenticate,teacher, async (req,res) =>{
    const contest = await Contest.findOne({url:req.params.curl}).lean();
    if(!contest) return res.status(400).send("Contest not found");

    //verification
    if(!(contest.createdBy == req.session.staff_id || req.session.isAdmin || req.session.staff_id && contest.timings.ends < new Date()))
    return res.status(401).end();
    
    if(!req.query.download){
        let user;
    const index = contest.submissions.findIndex(i => {return i.usn == req.params.id});
    if(index == -1){
        return res.end(404);
    }
    else{
        user = await Student.findOne({usn:req.params.id}).lean();
        if(!user && !isNaN(req.params.id)){
            user=await Teacher.findOne({staff_id:req.params.id}).lean();
        }
    }
    return res.render('teacher/studentReportPdf',{contest:contest,user:user});
    }
    
    
    (async function() {
        try {
        // launch puppeteer API
        const browser = await puppeteer.launch(); 
        const page = await browser.newPage();
        let host = 'localhost:'+req.app.locals.port;


        await page.setCookie({name:"elab",value:req.cookies.elab,domain:"localhost",path:"/"});   
        await page.goto(`http://${host}/contest/studentReportDownload/${req.params.curl}/${req.params.id}`,{waitUntil:'networkidle0'});
        await page.pdf({
            // name of your pdf file in directory
			path: './reports/'+req.params.curl+'-report-'+req.params.id+'.pdf', 
            //  specifies the format
			format: 'A4', 
            // print background property
            printBackground: true ,
            margin: {top: '2cm', left: 0, right: 0, bottom: '2cm'}
        });
        // console message when conversion  is complete!
        await browser.close();
    } catch (e) {
        winston.error(e);
    }
    })().then(()=>{
        const uploadsDir = path.join(__dirname, '../reports/');
        fs.readdir(uploadsDir, function(err, files) {
            files.forEach(function(file, index) {
              fs.stat(path.join(uploadsDir, file), function(err, stat) {
                var endTime, now;
                if (err) {
                  return winston.error(err);
                }
                now = new Date().getTime();
                endTime = new Date(stat.ctime).getTime() + 1800000;
                if (now > endTime) {
                  return rimraf(path.join(uploadsDir, file), function(err) {
                    if (err) {
                      winston.error(err);
                    }
                  });
                }
              });
            });
          });
        res.set('Content-Type','application/pdf');
        res.sendFile(uploadsDir+req.params.curl+'-report-'+req.params.id+'.pdf');
        //res.download('./reports/'+req.params.curl+'-report-'+req.params.id+'.pdf');
    });
});
//adding solution to a question in contest
router.get('/solution/:curl/:qid',authenticate, async (req,res)=>{
    const contest = await Contest.findOne({url:req.params.curl}).lean().select('questions createdBy timings');
    if(!contest) return res.status(404).send('Contest not found!');

    const question = await ContestQ.findOne({qid:req.params.qid}).lean().select('solution');
    if(!question) return res.status(400).send("Invalid ID");

    if(contest.createdBy == req.session.staff_id || req.session.isAdmin || contest.timings.ends < new Date())
        if(question.solution) res.send(question.solution);
        else res.send('No solutions yet!');
    else
    res.status(404).end();

});

router.post('/solution/:curl/:qid',authenticate,teacher, async (req,res)=>{
    const contest = await Contest.findOne({url:req.params.curl}).lean().select('questions createdBy');
    if(!contest) return res.status(404).send('Contest not found!');

    const question = await ContestQ.findOne({qid:req.params.qid}).select('solution');
    if(!question) return res.status(400).send("Invalid ID");

    if(contest.createdBy == req.session.staff_id || req.session.isAdmin){
        question.solution.language = req.body.language;
        question.solution.sourceCode = req.body.sourceCode;
        question.save();
        res.send("Saved");
    }
    else{
        res.status(401).end();
    }

});
//getting a question to edit
router.get('/edit/:curl/:qid',authenticate,teacher, async (req,res)=>{
    const contest = await Contest.findOne({url:req.params.curl}).lean().select('questions');
    if(!contest) return res.status(404).send('Contest not found!');

    const question = await ContestQ.findOne({qid:req.params.qid}).lean();
    if(!question) return res.status(400).send("Invalid ID");

    res.send(question);
});

//editing questions
router.post('/edit/:curl/:qid',authenticate,teacher,async (req,res)=>{
    const {error} = validateCQ(req.body);
    if(error) return res.status(400).send(error.message);

    const contest = await Contest.findOne({url:req.params.curl}).lean().select('questions timings');
    if(!contest) return res.status(404);

    if(contest.timings.ends < new Date()) return res.status(400).send("Cannot edit a question after contest has ended.");
    if(!contest.questions.includes(req.params.qid)) return res.status(400).send("Invalid ID");

    const question = await ContestQ.findOne({qid:req.params.qid});
    if(!question) return res.status(400).send("Invalid ID");

    question.name = req.body.name;
    question.statement=decodeURIComponent(req.body.statement); 
    question.constraints = req.body.constraints;
    question.input_format = req.body.i_format;
    question.output_format = req.body.o_format;
    question.description = req.body.description;
    question.difficulty = req.body.difficulty;
    question.active = (req.body.active == "on"?true:false);
    question.autoJudge = req.body.judging;

    if (Date.now()<contest.timings.starts)
    question.totalPoints = req.body.totalPoints;

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
        question.languages=[req.body.languages];
      }
    await question.save();

    res.send("Changes Saved Successfully.");

});

//deleting a contest
router.get('/delete/:curl',authenticate,admin,async (req,res) => {
    const contest = await Contest.findOne({url:req.params.curl}).lean();
    if(!contest) return res.status(400).send("Contest has ended!");

    let usnArray=[];
    for (i=0;i<contest.leaderboard.length;i++){
        usnArray.push(contest.leaderboard[i].usn);
        if(i==2) break;
    }

    await Contest.findOneAndDelete({url:req.params.curl}).then(async ()=>{
        await ContestQ.deleteMany({qid:{$in:contest.questions}});
        await Achievements.findOneAndDelete({contest_id:contest.id});
        await Student.updateMany({usn:{$in:usnArray}},{$pull:{achievements:{id:contest.id}}});
        return res.send("Contest deleted");
    } )
    .catch((err)=>{ winston.error(err);
        return res.status(400).send("Error! Unable to delete the contest.");
    });
});


//deleting a question
router.get('/delete/:curl/:qid',authenticate,teacher,async (req,res)=>{

    const contest = await Contest.findOne({url:req.params.curl}).select('questions timings');
    if(!contest) return res.status(404);

    if(!contest.questions.includes(req.params.qid)) return res.status(400).send("Invalid ID");

    if(contest.timings.ends< new Date()) return res.status(400).send("Cannot delete a question after contest is over.");
    
    contest.questions.splice(contest.questions.indexOf(req.params.qid),1);
    await contest.save();

    await ContestQ.findOneAndDelete({qid:req.params.qid});
    await Submission.deleteMany({qid:req.params.qid});

    res.send("Question deleted.");
});

//adding rules to contest
router.post('/rules/:url',authenticate,teacher,async (req,res)=>{
    const contest = await Contest.findOne({url:req.params.url}).select('rules');
    if(!contest) return res.status(404);

    contest.rules =req.body.rules || '';
    await contest.save();
    res.send("Rules saved!");
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
router.get('/source/:curl/:qid',authenticate,contestAuth,async (req,res) =>{
    let source=[];
    const usn = req.session.usn || req.session.staff_id;
    if(req.query.lang){
        let contest = await Contest.findOne({url:req.params.curl},{submissions:{$elemMatch:{usn:usn,qid:req.params.qid,language_id:req.query.lang}}},{_id:0,'submissions.$':1}).lean();
        if(!contest) return res.status(404).end();
        if(!contest.submissions) contest.submissions=[];

        const submission = await Submission.find({usn:usn,qid:req.params.qid,language_id:req.query.lang}).lean();
        source = contest.submissions.concat(submission);
        if(req.session.contest){
            const index = req.session.contest.findIndex(i => {return i.curl == req.params.curl && i.qid == req.params.qid && i.lang == req.query.lang})
            if(index != -1)
            source = source.concat(req.session.contest[index])
        }
        if(source.length == 0){ let sC=""
            if(config.has(`source.${req.query.lang}`)){
                sC = config.get(`source.${req.query.lang}`);
            }
            source=[{sourceCode:sC}];
            return res.send(source);
        }
    }
    else{
        let contest = await Contest.findOne({url:req.params.curl},{submissions:{$elemMatch:{usn:usn,qid:req.params.qid}}},{_id:0,'submissions.$':1}).lean();
        if(!contest) return res.status(404).end();
        if(!contest.submissions) contest.submissions=[];
    
        const submission = await Submission.find({usn:usn,qid:req.params.qid}).lean();
        source = contest.submissions.concat(submission);
        for(i=0;i<source.length;i++){
            source[i].language_id = lang(source[i].language_id);
        }
    }
  
    res.send(source.sort((a,b)=>(a.timestamp>b.timestamp)?1:-1));
});

router.post('/source/:curl/:qid',authenticate,contestAuth,async (req,res)=>{
    req.body.sourceCode = req.body.sourceCode.substr(0,req.body.sourceCode.length-18);
    if(req.body.sourceCode == '') return res.send('');
    if(req.session.contest){
        const found = req.session.contest.findIndex(i =>{return i.qid == req.params.qid && i.curl == req.params.curl && i.lang == req.body.lang.substr(req.body.lang.length-2) });
        if(found!=-1){
            req.session.contest[found].sourceCode = req.body.sourceCode;
            req.session.contest[found].timestamp = new Date();
        }
        else{
            let obj = {};
            obj.curl = req.params.curl;
            obj.qid=req.params.qid;
            obj.lang = req.body.lang.substr(req.body.lang.length-2);
            obj.sourceCode = req.body.sourceCode;
            obj.timestamp = new Date();
            req.session.contest.push(obj);
        }
    }
    else{
        let obj = {};
        obj.curl = req.params.curl;
        obj.qid=req.params.qid;
        obj.lang = req.body.lang.substr(req.body.lang.length-2);
        obj.sourceCode = req.body.sourceCode;
        obj.timestamp = new Date();
        req.session.contest = [];
        req.session.contest.push(obj);
    }

    res.send('');
});

//fetch source code
router.get('/source/:curl/:usn/:qid',authenticate,contestAuth, async (req,res) =>{
    const contest = res.locals.contest;

    if(req.session.staff_id){
        if(req.session.staff_id == contest.createdBy || new Date() > contest.timings.ends || req.session.isAdmin){
            if(req.query.manual){
                const sub = await Submission.findOne({_id:req.query.manual}).lean();
                return res.send(sub.sourceCode);
            }
            else
            res.send(contest.submissions.find(i => i.usn == req.params.usn && i.qid == req.params.qid).sourceCode);
        }
        else return res.end();
    }
    else{
        if(!(contest.timings.ends < new Date())){
            return res.end();
        }
        return res.send(contest.submissions.find(i => i.usn == req.params.usn && i.qid == req.params.qid && i.status == "Accepted").sourceCode);
    }
   
});

//get list of students by year
router.get('/students/:year',authenticate,teacher, async (req,res) =>{
    const students = await Student.find({ year: req.params.year }).lean().select({usn:1,fname:1,_id:0,lname:1});
    if(!students) return res.status(400).send("Students not Found");

    const contest = await Contest.findOne({id:req.query.id}).lean().select('custom_usn -_id');
    if(!contest) return res.status(400).end();
  
    for(i of students)
    {
      i.select = '<input type="checkbox" name="studentListCustom" value="'+i.usn+'" >';
      i.name = i.fname +" "+i.lname;
      delete i.fname;
      delete i.lname;
    }
    res.send(students);
  
  });
  
//get list of all teacher
router.get('/teachers',authenticate,teacher,async (req,res)=>{
    if (isNaN(req.query.id)) return res.status(404).end();
    const contest = await Contest.findOne({id:req.query.id}).lean().select('custom_staff_id createdBy -_id');
    if(!contest) return res.status(400).end();

    let teachers = await Teacher.find({staff_id:{$ne:contest.createdBy}}).lean().select('fname lname staff_id -_id').sort({staff_id:1});
    if(!teachers) return res.send([]);

    for(i of teachers)
    {   
      i.select = '<input type="checkbox" '+(contest.custom_staff_id.includes(i.staff_id.toString())?'checked':'') +' name="teacherListCustom" value="'+i.staff_id+'" >';
      i.name = i.fname +" "+i.lname;
      delete i.fname;
      delete i.lname;
    }
    res.send(teachers);
  });

//adding students to contest
router.post('/students/:id',authenticate,teacher,async (req,res) =>{
    const contest = await Contest.findOne({id:req.params.id});
    if(!contest) return res.status(400).send("Invalid ID");
    contest.custom_usn = (req.body.studentListCustom?req.body.studentListCustom:[]);
    await contest.save();
    res.send("Students Added");
    
  });
  
//retreive students given access in a contest
router.get('/students/id/:id',authenticate,teacher,async (req,res) =>{
    const contest = await Contest.findOne({id:req.params.id}).lean().select('custom_usn');
    if(!contest) return res.status(400).send("Invalid ID");

    let students = await Student.find({usn:{$in:contest.custom_usn}}).lean().select({usn:1,fname:1,lname:1,year:1,_id:0});
    if(!students) students=[];

    return res.send(students);

});

//adding teachers to contest
router.post('/teachers/:id',authenticate,teacher,async (req,res) =>{
    const contest = await Contest.findOne({id:req.params.id}).select('custom_staff_id');
    if(!contest) return res.status(400).send("Invalid ID");
    contest.custom_staff_id = (req.body.teacherListCustom?req.body.teacherListCustom:[]);
    await contest.save();
    res.send("Teachers Added");
    
  });

//retreive teachers given access in a contest
router.get('/teachers/id/:id',authenticate,teacher,async (req,res) =>{
    const contest = await Contest.findOne({id:req.params.id}).lean().select('custom_staff_id -_id');
    if(!contest) return res.status(400).send("Invalid ID");

    let teachers = await Teacher.find({staff_id:{$in:contest.custom_staff_id}}).lean().select({staff_id:1,fname:1,lname:1,_id:0});
    if(!teachers) teachers=[];

    return res.send(teachers);

});

//landing page for contest
router.get('/:curl',authenticate,contestAuth, async (req,res) =>{
    const contest = res.locals.contest;

    const now = new Date();
    
    //teacher 
    if(req.session.staff_id){
        if(contest.createdBy == req.session.staff_id || req.session.isAdmin || contest.timings.ends < new Date())
        {
        let questions = await ContestQ.find({qid:{$in:contest.questions}});
        let totalPoints = [];
        if(!questions) questions=[];
        else
        {
            questions.forEach((item,index)=>{ let total=0;
                if(item.autoJudge){
                    item.test_cases.forEach((itemp)=>{
                        total+=itemp.points;
                    })
                }
                else{
                    total=item.totalPoints;
                }
                totalPoints.push(total);
            });
        }
        questions.test_cases = [];
        return res.render('qdisplay',{contest:contest,questions:questions,totalPoints:totalPoints});
        }
        else if(contest.isReady){
            if(!contest.custom_staff_id.includes(String(req.session.staff_id))) return res.status(404).end();
            if(now > contest.timings.starts && now < contest.timings.ends){
                if(!contest.signedUp.find(({usn}) => usn == req.session.staff_id)){
                    return res.render("timer" , {attempt:"/contest/sign/"+req.params.curl,time:false,contest:contest,rules:contest.rules});
                }
                let questions = await ContestQ.find({qid:{$in:contest.questions}});
                let totalPoints = [];
                if(!questions) questions=[];
                else
                {
                    questions.forEach((item,index)=>{ let total=0;
                        if(item.autoJudge){
                            item.test_cases.forEach((itemp)=>{
                                total+=itemp.points;
                            })
                        }
                        else{
                            total=item.totalPoints;
                        }
                        totalPoints.push(total);
                    });
                }
                questions.test_cases = [];
                //solved questions
                let solved = contest.submissions.filter(element => { return element.usn == req.session.staff_id && element.status=="Accepted" });
                let solved_array=[];
                solved.forEach((item,index)=>{
                    solved_array.push(item.qid);
                });
                return res.render('qdisplay',{contest:contest,questions:questions,totalPoints:totalPoints,solved:solved_array});
                }
                else{
                    const milli = contest.timings.starts - now;
                    return res.render("timer",{time:Date.now() + milli,name:contest.name,rules:contest.rules} );
                }
        }
        else{
            return res.send("Contest Not Ready");
        } 
    }
    
    //student
    else{ 
        
        if(contest.isReady){
            if(now>=contest.timings.starts && now<=contest.timings.ends){ //between contest
                if(!contest.signedUp.find(({usn}) => usn == req.session.usn)){
                   return res.render("timer" , {attempt:"/contest/sign/"+req.params.curl,time:false,contest:contest,rules:contest.rules});
                }
        
                let questions = await ContestQ.find({qid:{$in:contest.questions}});
                let totalPoints = [];
                if(!questions) questions=[];
                else
                {
                    questions.forEach((item,index)=>{ let total=0;
                        if(item.autoJudge){
                            item.test_cases.forEach((itemp)=>{
                                total+=itemp.points;
                            })
                        }
                        else{
                            total=item.totalPoints;
                        }
                        totalPoints.push(total);
                    });
                }
                questions.test_cases = [];
                //solved questions
                let solved = contest.submissions.filter(element => { return element.usn == req.session.usn && element.status=="Accepted" });
                let solved_array=[];
                solved.forEach((item,index)=>{
                    solved_array.push(item.qid);
                });
                return res.render('qdisplay',{contest:contest,questions:questions,totalPoints:totalPoints,solved:solved_array});
                }
        
                if(now < contest.timings.starts) //before contest
                {   const milli = contest.timings.starts - now; //stores milli seconds
                    
                    return res.render("timer",{time:Date.now() + milli,contest:contest,rules:contest.rules} );
                }
        
                if(now > contest.timings.ends) //after contest
                {
                    let questions = await ContestQ.find({qid:{$in:contest.questions}});
                    let totalPoints = [];
                    if(!questions) questions=[];
                    else
                    {
                        questions.forEach((item,index)=>{ let total=0;
                            if(item.autoJudge){
                                item.test_cases.forEach((itemp)=>{
                                    total+=itemp.points;
                                })
                            }
                            else{
                                total=item.totalPoints;
                            }
                            totalPoints.push(total);
                        });
                    }
                    questions.test_cases = [];
                    //solved questions
                    let solved = contest.submissions.filter(element => { return element.usn == req.session.usn && element.status=="Accepted" });
                    let solved_array=[];
                    solved.forEach((item,index)=>{
                        solved_array.push(item.qid);
                    });
                return res.render('qdisplay',{contest:contest,questions:questions,totalPoints:totalPoints,solved:solved_array});
                }
        }
        else{
            return res.status(404).end();
        }
        
    }
    

});

//leaderboard route
router.get('/:curl/leaderboard',authenticate,contestAuth,async (req,res) =>{
    const contest = res.locals.contest;
    res.render('leaderboard',{contest:contest});
});

//submissions pug
router.get('/:curl/submissions',authenticate,contestAuth,async (req,res)=>{
    const contest = res.locals.contest;
    const manual = await ContestQ.aggregate([{$match:{qid:{$in:contest.questions}}},{$project:{autoJudge:1,_id:0}}]);
    let manualSubmission=false;
    for (i of manual){
        if(!i.autoJudge)
            manualSubmission=true;
    }
    //teacher
    if(contest.createdBy == req.session.staff_id || req.session.isAdmin || req.session.staff_id && contest.timings.ends < new Date())
    return res.render('teacher/submission',{contest:contest,manualSubmission});
    else{ //student
        return res.render('submission',{contest:contest});
    }
});

//oldManualSubmissions pug
router.get('/:curl/oldManualSubmissions',authenticate,teacher,async (req,res)=>{
    const contest = await Contest.findOne({url:req.params.curl}).lean().select('url name createdBy timings -_id');
    if(!contest) return res.status(400).send("Contest not found");

    return res.render('teacher/oldManualSubmissions',{contest});

    // const manual = await ContestQ.aggregate([{$match:{qid:{$in:contest.questions}}},{$project:{autoJudge:1,_id:0}}]);
    // let manualSubmission=false;
    // for (i of manual){
    //     if(!i.autoJudge)
    //         manualSubmission=true;
    // }
    // //teacher
    // if(contest.createdBy == req.session.staff_id || req.session.isAdmin || req.session.staff_id && contest.timings.ends < new Date())
    // return res.render('teacher/submission',{contest:contest,manualSubmission});
    // else{ //student
    //     return res.render('submission',{contest:contest});
    // }
});

//student report 
router.get('/:curl/studentReport',authenticate,teacher,async (req,res)=>{
    const contest = await Contest.findOne({url:req.params.curl}).lean().select('url name createdBy timings -_id');
    if(!contest) return res.status(400).send("Contest not found");

    if(contest.createdBy == req.session.staff_id || req.session.isAdmin || req.session.staff_id && contest.timings.ends < new Date())
    return res.render('teacher/studentReport',{contest:contest});
    else
    return res.status(401).end();
});

router.get('/:curl/reportDownload',authenticate,teacher,async (req,res)=>{
    let print="all";
    if(req.query.print && req.query.print == "leaderboard") print=req.query.print; 
    if(req.query.print && req.query.print == "signedup") print=req.query.print;
    (async function() {
        try {
        // launch puppeteer API
        const browser = await puppeteer.launch(); 
        const page = await browser.newPage();
        // await page.setContent(html);
        // await page.emulateMedia('screen');
        let host = 'localhost';
        if (process.env.NODE_ENV != 'production') {
            host='localhost:'+req.app.locals.port;
           }
        const elabIndex = req.headers.cookie.indexOf("elab");
        await page.setCookie({name:"elab",value:req.headers.cookie.substr(elabIndex+5),domain:"localhost",path:"/"});   
        await page.goto(`http://${host}/contest/${req.params.curl}/report?print=${print}`,{waitUntil:'networkidle0'});
        await page.pdf({
            // name of your pdf file in directory
			path: './reports/'+req.params.curl+'-report-'+print+'.pdf', 
            //  specifies the format
			format: 'A4', 
            // print background property
            printBackground: true ,
            margin: {top: '2cm', left: 0, right: 0, bottom: '2cm'}
        });
        // console message when conversion  is complete!
        await browser.close();
    } catch (e) {
        winston.error(e);
    }
    })().then(()=>{
        const uploadsDir = path.join(__dirname, '../reports/');
        fs.readdir(uploadsDir, function(err, files) {
            files.forEach(function(file, index) {
              fs.stat(path.join(uploadsDir, file), function(err, stat) {
                var endTime, now;
                if (err) {
                  return winston.error(err);
                }
                now = new Date().getTime();
                endTime = new Date(stat.ctime).getTime() + 1800000;
                if (now > endTime) {
                  return rimraf(path.join(uploadsDir, file), function(err) {
                    if (err) {
                      winston.error(err);
                    }
                  });
                }
              });
            });
          });
        res.set('Content-Type','application/pdf');
        res.sendFile(uploadsDir+req.params.curl+'-report-'+print+'.pdf');
        //res.download('./reports/'+req.params.curl+'-report-'+print+'.pdf');
    });

});


router.get('/:curl/report',authenticate,teacher,async (req,res)=>{
    let contest = await Contest.findOne({url:req.params.curl}).lean();
    if(!contest)    return res.status(404).end();

    let signed_up =[0,0,0,0,0];
    for(i of contest.signedUp){
        if(i.year == '-') signed_up[4]++;
         signed_up[i.year-1]++;
    }
    let submissions = [0,0,0,0,0];
    for(i of contest.submissions){
        if(i.year == '-') submissions[4]++;
        submissions[i.year - 1]++;
    }
    let questions = [];
    for(i of contest.questions){ let points=0;
        let q = await ContestQ.findOne({qid:i}).lean();
        for(i of q.test_cases){
            points+=i.points;
        }
        q.totalPoints = points;
        questions.push(q);
    }

    let questionNo = [];
    for( i of questions){
        questionNo.push({qid:i.qid,name:i.name, Accepted: 0,Partially_Accepted: 0,Wrong_Answer: 0});
    }

    for (i of contest.submissions){
        if(i.status === "Accepted" ){
            const index = questionNo.findIndex( j => j.qid === i.qid);
            questionNo[index].Accepted++;
        }
        else if(i.status === "Partially Accepted"){
            const index = questionNo.findIndex( j => j.qid === i.qid);
            questionNo[index].Partially_Accepted++;
        }
        else{
            const index = questionNo.findIndex( j => j.qid === i.qid);
            questionNo[index].Wrong_Answer++;
        }
    }

    let stats ={signed_up:signed_up , submissions:submissions};
let query = null;
if(req.query.print) query=req.query.print;
res.render('teacher/reports',{contest:contest,stats:stats,questionNo:questionNo,curl:req.params.curl,query:query});
});

//Not signed up list
router.get('/:curl/notSigned',authenticate,teacher,async (req,res)=>{
    let contest = await Contest.findOne({url:req.params.curl}).lean().select('year custom_usn custom_staff_id customGroup signedUp');
    if(!contest) return res.status(404).end();

    let students = [];
    let signedUSN=new Set();
    for(i of contest.signedUp){
        signedUSN.add(i.usn);
    }

    for(i of contest.batch){
        const list = await Student.find({batch:i}).select('fname lname year usn -_id').lean();
        students=students.concat(list);
    };

    const groups = await CustomGroup.find({id:{$in: contest.customGroup}}).limit().select({usn:1,_id:0});
    let grp_usn = [];
    for(i of groups)
        grp_usn = grp_usn.concat(i.usn);

    const custom = await Student.find({usn:{$in:contest.custom_usn.concat(grp_usn)}}).select('fname lname year usn -_id').lean();
    const studentSet = new Set(students.concat(custom));

    const custom_staff = new Set(await Teacher.find({staff_id:{$in:contest.custom_staff_id}}).lean().select('fname lname staff_id -_id'));

    let notSigned = new Set([...studentSet].filter(x => !signedUSN.has(x.usn)));
    let notSignedStaff = new Set([...custom_staff].filter(x => !signedUSN.has(String(x.staff_id))));
    notSigned = [...notSigned].sort((a,b)=> (a.year > b.year)?1:(a.year === b.year) ? ((a.usn > b.usn) ? 1 : -1) : -1 );
    res.send([...notSignedStaff].concat(notSigned));
});


//viewing question
router.get('/:curl/:qid',authenticate,contestAuth,async (req,res)=>{
    const contest = res.locals.contest;
    
    if(!(contest.createdBy == req.session.staff_id || req.session.isAdmin || contest.timings.starts < new Date()))
    return res.status(404).end();

    if(!contest.questions.includes(req.params.qid)){
        return res.status(404).end();
    }
    let question = await ContestQ.findOne({qid:req.params.qid}).catch(err => {
        return res.status(404).end();
    });
    
    return res.render('editorContest',{question : _.pick(question,['name','qid','statement','constraints', 'input_format','output_format','sample_cases','explanation','difficulty','description','languages']),contest:contest})


});

function leaderboardSort(contest){
    contest.leaderboard.sort((a,b) =>{
        if(a.points > b.points) return -1;
        else if(a.points < b.points) return 1;
        else if(a.points == b.points){
            if(a.timestamp<b.timestamp) return -1;
            else if(a.timestamp>b.timestamp) return 1;
            else return 0;
        }
    });
}

//submission of contest
router.post('/:curl/:qid',authenticate,contestAuth,async (req,res)=>{
    const contest = res.locals.contest;

    if(!contest.questions.includes(req.params.qid)){
        return res.status(404).end();
    }

    const question = await ContestQ.findOne({qid:req.params.qid}).lean().catch(err => {
        res.status(404).end();
    });

    if(contest.createdBy == req.session.staff_id || req.session.isAdmin ){}
    else if(contest.timings.starts > new Date())
    {
        return res.status(401).send("Cannot submit to this contest.");
    }

    if(req.session.isAdmin){}
    else if(req.session.staff_id && req.session.staff_id!=contest.createdBy){
        if(contest.custom_staff_id.includes(String(req.session.staff_id))){}
        else
            return res.status(400).send("Not authorized to make a submission!");
    }
  const testcase = question.test_cases;
  let question_points = 0;
  testcase.forEach((item,index) =>{
    question_points +=item.points;
  });

  //Checking for unauthorized submissions
  if(req.body.source.substr(req.body.source.length-18) == "undefinedundefined")
  req.body.source = req.body.source.substr(0,req.body.source.length-18);
  else
  return res.status(401).send("Unauthorized");
  if(!question.languages.includes(req.body.language.toString()))
    return res.status(400).send("Not permitted to submit in this language!");

  if(req.body.source.trim()=='')
  return res.send("Source Code cannot be empty!");

  const usn = req.session.usn || req.session.staff_id.toString();
  const year = req.session.year || '-';

  if(!question.autoJudge){ //Manual Submission
    if(contest.timings.ends < new Date()){ //if contest has ended
        return res.status(400).send("Submission cannot be evaluated.");
    }

    // const user_submission = contest.submissions.find(i => i.usn == usn && i.qid == req.params.qid);

    // if(!user_submission){ 
    //     let obj ={};
    //     obj.qid = req.params.qid;
    //     obj.timestamp = new Date();
    //     obj.usn = usn;
    //     obj.year = year;
    //     obj.sourceCode = req.body.source;
    //     obj.points = 0;
    //     obj.language_id = req.body.language;
    //     obj.status = "Pending";
    //     contest.submissions.push(obj);
    //     await contest.save();
    //     return res.send("Submission Made.");
    // }
    // else{
        let sub = new Submission();
        const subCount = await Submission.countDocuments({usn:usn,qid:req.params.qid});
        console.log(subCount);
        if(subCount == 20){
            sub = await Submission.findOne({usn:usn,qid:req.params.qid}).sort({timestamp:1});
        }
        sub.qid = req.params.qid;
        sub.timestamp = new Date();
        sub.usn = usn;
        sub.year = year;
        sub.sourceCode = req.body.source;
        sub.status = "Pending";
        sub.points = 0;
        sub.language_id = req.body.language;

        await sub.save();
        return res.send("Submission Made.");
    //}

  }

  let result = [];
  for(let i=0;i<testcase.length;i++){
    const data ={
      language : req.body.language,
      source : req.body.source,
      input : testcase[i].input,
      output : testcase[i].output
    };

    result.push(run(data));
  }

  Promise.all(result)
    .then(async (data) => {
      let desc= [];

      data.forEach(store);
      function store(data,index){ let points=0;
          if(data.status.id == 3){
            points = testcase[index].points;
          }
        desc.push({id:data.status.id,description:data.status.description,points:points}); 
      }
    

    //if(req.session.code == req.body.source+req.params.qid) return res.send(desc);
    //req.session.code = req.body.source + req.params.qid;
    let total_points  = 0;
    desc.forEach((item,index) =>{
            total_points+= item.points;
    });

    //created by or admin submission
    if(contest.createdBy == req.session.staff_id || req.session.isAdmin ){
        return res.send(desc);
    }

    if(contest.timings.ends < new Date()){ //if contest has ended
        if(req.session.staff_id){
            return res.send(desc);
        }
        else{

            let sub = new Submission();
            const subCount = await Submission.countDocuments({usn:usn,qid:req.params.qid});
            if(subCount == 20){
                sub = await Submission.findOne({usn:usn,qid:req.params.qid}).sort({timestamp:1});
            }
            sub.qid = req.params.qid;
            sub.timestamp = new Date();
            sub.usn = usn;
            sub.year = year;
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
            sub.points = total_points;
            sub.language_id = req.body.language;

            await sub.save();
            return res.send(desc);

        }
    }
   
    const user_submission = contest.submissions.find(i => i.usn == usn && i.qid == req.params.qid);
    
    if(!user_submission){ 
        
        let obj ={};
        obj.qid = req.params.qid;
        obj.timestamp = new Date();
        obj.usn = usn;
        obj.year = year;
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
        contest.submissions.push(obj);

        //leaderboard
        if(total_points>0){
            const index = contest.leaderboard.findIndex(item=>{
                return item.usn == usn;
            });
            if(index == -1){
                let leadObj = {};
                leadObj.usn=usn;
                leadObj.timestamp = new Date()- contest.timings.starts;
                leadObj.name = req.session.fname + " " + req.session.lname;
                leadObj.year = year;
                leadObj.points = total_points; 
                 
                contest.leaderboard.push(leadObj);
            }
            else
            {
                contest.leaderboard[index].points += total_points;
                contest.leaderboard[index].timestamp = new Date()- contest.timings.starts;
            }
            leaderboardSort(contest);
        }
        await contest.save();
        return res.send(desc);
    }
    else{
        let sub = new Submission();
        const subCount = await Submission.countDocuments({usn:usn,qid:req.params.qid});
        if(subCount == 20){
            sub = await Submission.findOne({usn:usn,qid:req.params.qid}).sort({timestamp:1});
        }
        if(total_points == question_points && user_submission.status == "Accepted"){
            
            sub.qid = req.params.qid;
            sub.timestamp = new Date();
            sub.usn = usn;
            sub.year = year;
            sub.sourceCode = req.body.source;
            sub.status = "Accepted";
            sub.language_id = req.body.language;
            sub.points = total_points;
            await sub.save();
            return res.send(desc);
        }
        else if (total_points == question_points ){
            
            const i= contest.submissions.indexOf(user_submission);
            let previous_sub =  new Submission(_.pick(contest.submissions[i].toJSON(),['usn','sourceCode','status','timestamp','language_id','points','qid']));
            await previous_sub.save();
            const old_points = contest.submissions[i].points;
            contest.submissions.splice(i,1);
            let obj ={};
            obj.qid = req.params.qid;
            obj.timestamp = new Date();
            obj.usn = usn;
            obj.year = year;
            obj.sourceCode = req.body.source;
            obj.status = "Accepted";
            obj.points = total_points;
            obj.language_id = req.body.language;
            contest.submissions.push(obj);

            //leaderboard
            const index = contest.leaderboard.findIndex(item=>{
                return item.usn == usn;
            });
            if(index == -1){
                let leadObj = {};
                leadObj.usn=usn;
                leadObj.timestamp = new Date()- contest.timings.starts;
                leadObj.name = req.session.fname + " " + req.session.lname;
                leadObj.year = year;
                leadObj.points = total_points; 
                
                contest.leaderboard.push(leadObj);
            }
            else
            {
                contest.leaderboard[index].points += total_points - old_points;
                contest.leaderboard[index].timestamp = new Date()- contest.timings.starts;
            }
            leaderboardSort(contest);
            await contest.save();
            return res.send(desc);
        }
        else if(total_points > user_submission.points){
            const i= contest.submissions.indexOf(user_submission);
            let previous_sub =  new Submission(_.pick(contest.submissions[i].toJSON(),['usn','sourceCode','status','timestamp','language_id','points','qid']));
            await previous_sub.save();
            const old_points = contest.submissions[i].points;
            contest.submissions.splice(i,1);
            let obj ={};
            obj.qid = req.params.qid;
            obj.timestamp = new Date();
            obj.usn = usn;
            obj.year = year;
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
            contest.submissions.push(obj);

            //leaderboard
            const index = contest.leaderboard.findIndex(item =>{
                return item.usn == usn;
            });
            if(index == -1){
                let leadObj = {};
                leadObj.usn=usn;
                leadObj.timestamp = new Date() -  contest.timings.starts;
                leadObj.name = req.session.fname + " " + req.session.lname;
                leadObj.year = year;
                leadObj.points = total_points; 
                
                contest.leaderboard.push(leadObj);
            }
            else
            {
                contest.leaderboard[index].points += total_points - old_points;
                contest.leaderboard[index].timestamp = new Date()- contest.timings.starts;
            }

            leaderboardSort(contest);
            await contest.save();
            return res.send(desc);
        }
        else {
    
            sub.qid = req.params.qid;
            sub.timestamp = new Date();
            sub.usn = usn;
            sub.year = year;
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
    }

    }).catch(err => {
        winston.error(err);
      res.send(err);
    });



});

//execution for approval
router.post('/:curl/:qid/execute',authenticate,teacher,async (req,res)=>{
    if(!req.body.usn || !req.body.id) return res.status(400).end();
    if(!req.body.input) req.body.input="";

    let contest = await Contest.findOne({url:req.params.curl}).lean();
    if(!contest)    return res.status(404).end();

    //fetching question
    if(!contest.questions.includes(req.params.qid)) return res.status(404).end();
    const question = await ContestQ.findOne({qid:req.params.qid}).lean();

    let submission = contest.submissions.find(e => e.usn == req.body.usn);
    if(!submission) return res.status(400).send("No submissions yet!");

    if (submission._id != req.body.id){
        submission = await Submission.findOne({_id:req.body.id}).lean();
    }

    const data ={
        language : submission.language_id,
        source : submission.sourceCode,
        input : req.body.input,
        output : "1"
      };

    run(data).then((response)=>{
        let output="";
        const json_res = JSON.parse(JSON.stringify(response));
        
        if(json_res.stdout!=null) output=json_res.stdout;
        else if(json_res.stderr!=null) output=json_res.stderr;
        else if(json_res.compile_output!=null) output=json_res.compile_output;
        const r = {output:decode64(output),id:response.status.id,description:response.status.description};
        
        res.send(r);
    }).catch((err)=>{
        winston.error(err);
        res.send("Something went wrong!");
    });
});

//Evaluating submission
router.get('/:curl/:qid/evaluate/:usn/:id',authenticate,teacher,async (req,res)=>{
    let contest = await Contest.findOne({url:req.params.curl}).lean();
    if(!contest)    return res.status(404).end();

    //fetching question
    if(!contest.questions.includes(req.params.qid)) return res.status(404).end();
    const question = await ContestQ.findOne({qid:req.params.qid}).lean();

    if(question.autoJudge) return res.status(404).end();

    const student = await Student.findOne({usn:req.params.usn}).select('usn fname lname -_id').lean();
    if(!student) return res.status(404).end();

    submission=await Submission.findOne({_id:req.params.id}).lean();
    if(!submission) return res.status(404).end();
    submission.name = student.fname + " " + student.lname;

    res.render('teacher/evaluation',{contest,question,submission:submission});
});

//updating the submission status
router.post('/:curl/:qid/evaluate/:usn/:id',authenticate,teacher,async (req,res)=>{
    const status = req.body.status;
    if(["Accepted","Wrong Answer"].indexOf(status) == -1) return res.status(400).send("Invalid Status");

    let contest = await Contest.findOne({url:req.params.curl});
    if(!contest)    return res.status(404).end();

    //fetching question
    if(!contest.questions.includes(req.params.qid)) return res.status(404).end();
    const question = await ContestQ.findOne({qid:req.params.qid}).lean();

    if(question.autoJudge) return res.status(404).end();

    let student = await Student.findOne({usn:req.params.usn}).select('usn fname lname -_id').lean();
    if(!student) return res.status(404).end();

    const contest_submission_index = contest.submissions.findIndex(e => e.usn == req.params.usn && e.qid==req.params.qid);
    let submission = await Submission.findOne({_id:req.params.id});
    if(!submission) return res.status(404).end();
    
    let new_points=0;
    if(status=="Accepted"){
        new_points = question.totalPoints;
    }
    else{
        new_points= 0;
    }

    if(contest_submission_index==-1){
        let obj ={};
        obj.qid = submission.qid;
        obj.timestamp = submission.timestamp;
        obj.usn = submission.usn;
        obj.year = submission.year;
        obj.sourceCode = submission.sourceCode;
        obj.status=status;
        obj.language_id = submission.language_id;
        obj.points=new_points;
        contest.submissions.push(obj);
    }
    else{
        const i = contest_submission_index;
        if(status=="Accepted" && contest.submissions[i].status!="Accepted"){
            contest.submissions[i].timestamp=submission.timestamp;
            contest.submissions[i].sourceCode=submission.sourceCode;
            contest.submissions[i].language_id=submission.language_id;
            contest.submissions[i].status=status;
            contest.submissions[i].points=question.totalPoints;
        }
        else{
            if(status=="Accepted"){
                if(contest.submissions[i].timestamp > submission.timestamp){
                    const index = contest.leaderboard.findIndex(item=>{
                        return item.usn == student.usn;
                    });
                    const time = contest.submissions[i].timestamp.valueOf() - submission.timestamp.valueOf();
                    contest.leaderboard[index].timestamp = contest.leaderboard[index].timestamp.valueOf() - time;
                    contest.submissions[i].timestamp = submission.timestamp;
                    contest.submissions[i].sourceCode=submission.sourceCode;
                    contest.submissions[i].language_id=submission.language_id;
                    leaderboardSort(contest);
                    
                    await contest.save();

                    submission.status=status;
                    submission.points=new_points;
                    await submission.save();

                }
                return res.send("Submission Evaluated");
            }
        }

    }

    const accepted_sub= await Submission.find({usn:req.params.usn,qid:req.params.qid,status:"Accepted"}).sort({timestamp:1}).lean();
    let flag = false;
    if (accepted_sub.length>0)
        flag = accepted_sub[0]._id == req.params.id;


    //leaderboard
    if(status=="Accepted" || (status!="Accepted"&&flag)){
        const index = contest.leaderboard.findIndex(item=>{
            return item.usn == student.usn;
        });
        if(index == -1){
            let leadObj = {};
            leadObj.usn = student.usn;
            leadObj.timestamp = submission.timestamp- contest.timings.starts;
            leadObj.name = student.fname + " " + student.lname;
            leadObj.year = submission.year;
            leadObj.points = new_points; 
            contest.leaderboard.push(leadObj);
        }
        else
        {   if(new_points!=0){
                contest.leaderboard[index].points += new_points;
                contest.leaderboard[index].timestamp =  Math.max(contest.leaderboard[index].timestamp,submission.timestamp- contest.timings.starts);
            }
            else{
                    if(accepted_sub.length==1){
                        contest.leaderboard[index].points -= question.totalPoints;
                        contest.submissions[contest_submission_index].status=status;
                        contest.submissions[contest_submission_index].points=new_points;

                        
                        let last = contest.submissions.filter(item=>{return item.usn==student.usn && item.status=="Accepted" && item.qid!=submission.qid});
                        last.sort((a,b)=>{if(a.timestamp>b.timestamp) return -1});

                        if(last.length==0){
                            contest.leaderboard.splice(index,1);
                        }
                        else{
                            contest.leaderboard[index].timestamp = last[0].timestamp - contest.timings.starts;
                        }
                    }
                    else{
                        contest.submissions[contest_submission_index].timestamp=accepted_sub[1].timestamp;
                        contest.submissions[contest_submission_index].sourceCode=accepted_sub[1].sourceCode;
                        contest.submissions[contest_submission_index].language_id=accepted_sub[1].language_id;
                        
                        contest.leaderboard[index].timestamp = contest.leaderboard[index].timestamp.valueOf() + accepted_sub[1].timestamp.valueOf() - accepted_sub[0].timestamp.valueOf();
                    }
            }
        }
        leaderboardSort(contest);
    }
    await contest.save();

    submission.status=status;
    submission.points=new_points;
    await submission.save();

    res.send("Submission Evaluated");

});

module.exports = router;
