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
const {CustomGroup,validateGroup} = require('../models/customGroup');
const crypto = require("crypto");
const moment = require('moment');
const _ = require('lodash');
const request = require("request-promise");
const config = require('config');
const pug = require('pug');
const puppeteer = require('puppeteer'); 


function encode64(string){ //encoding to base64
    const b = new Buffer.from(string);
  return b.toString('base64');
  }
  
  function decode64(string64){//decode to utf8
    const b = new Buffer.from(string64, 'base64')
  return b.toString();
  }


  function two(x) {return ((x>9)?"":"0")+x}
  function three(x) {return ((x>99)?"":"0")+((x>9)?"":"0")+x}

  function time(ms) { //convert to dd:mm:hh:ss
  var sec = Math.floor(ms/1000)
  ms = ms % 1000
  t = three(ms)

  var min = Math.floor(sec/60)
  sec = sec % 60
  t = two(sec) + ":" + t

  var hr = Math.floor(min/60)
  min = min % 60
  t = two(min) + ":" + t

  var day = Math.floor(hr/60)
  hr = hr % 60
  t = two(hr) + ":" + t
  t = day + ":" + t

  return t
  }



router.get('/',authenticate, async (req,res)=> {
    let page=1;
    if(Number.isNaN(req.query.page) || !req.query.page || req.query.page < 1) page=1;
    else page=req.query.page;
    let count=0;
    if(req.session.staff_id){
        let contest=null;
        if(!req.query.l){ //query l does not exist
            contest = await Contest.find({'timings.ends':{$gt:new Date()}}).lean().sort({'timings.starts':-1}).skip((page-1)*12).limit(12);
            if(contest.length <=0) return res.render('teacher/trcontest',{contest:[],count:0,msg:"No ongoing or upcoming contests available."});
            count = await Contest.countDocuments({'timings.ends':{$gt:new Date()}});
        }
        else if(req.query.l == 'past'){
            contest = await Contest.find({'timings.ends':{$lt:new Date()}}).lean().sort({'timings.starts':-1}).skip((page-1)*12).limit(12);
            if(contest.length <=0) return res.render('teacher/trcontest',{contest:[],count:0,msg:"No ongoing or upcoming contests available."});
            count = await Contest.countDocuments({'timings.ends':{$lt:new Date()}}).lean().sort({'timings.starts':-1});
            return res.render('teacher/trcontest',{contest:contest,count:count,type:"past",page:page});
        }
        else{
            contest = await Contest.find({'timings.ends':{$gt:new Date()}}).lean().sort({'timings.starts':-1}).skip((page-1)*12).limit(12);
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
            let contest = await Contest.find({$or:[{'year' : req.session.year},{'custom_usn':req.session.usn},{customGroup:{$in:gid}}],isReady:true,'timings.ends':{$gt:new Date()}}).select('name url description questions timings').lean().sort({'timings.starts':-1}).skip((page-1)*12).limit(12);
            //-contest = contest.concat(await Contest.find({customGroup:{$in:gid},isReady:true,'timings.ends':{$gt:new Date()}}).lean().select('name url description questions timings')).sort({'timings.starts':-1}).skip((page-1)*12).limit(12);
            if(contest.length <=0) return res.render('contest',{contest:[],count:0,msg:"No ongoing or upcoming contests available."});
            count = await Contest.countDocuments({$or:[{'year' : req.session.year},{'custom_usn':req.session.usn},{customGroup:{$in:gid}}],isReady:true,'timings.ends':{$gt:new Date()}});
            res.render('contest',{contest:contest,count:count,type:"ongoing",page:page});
        }
        else{

            

            if(req.query.l == 'past'){ //l=past
                const grp = await CustomGroup.find({'usn':req.session.usn}).lean().select({id:1,_id:0});
                let gid=[];
                for(i of grp) gid.push(i.id);
                let contest = await Contest.find({$or:[{'year' : req.session.year},{'custom_usn':req.session.usn},{customGroup:{$in:gid}}],isReady:true,'timings.ends':{$lt:new Date()}}).select('name url description questions timings').lean().sort({'timings.starts':-1}).skip((page-1)*12).limit(12);
                //contest = contest.concat(await Contest.find({customGroup:{$in:gid},isReady:true,'timings.ends':{$lt:new Date()}}).lean().select('name url description questions timings')).sort({'timings.starts':-1}).skip((page-1)*12).limit(12);
                if(contest.length <=0) return res.render('contest',{contest:[],count:0,msg:"No ongoing or upcoming contests available."});
                count = await Contest.countDocuments({$or:[{'year' : req.session.year},{'custom_usn':req.session.usn},{customGroup:{$in:gid}}],isReady:true,'timings.ends':{$lt:new Date()}});
                res.render('contest',{contest:contest,count:count,type:"past",page:page});
            }
            else{ //query l exists but invalid value
                const grp = await CustomGroup.find({'usn':req.session.usn}).lean().select({id:1,_id:0});
                let gid=[];
                for(i of grp) gid.push(i.id);
                let contest = await Contest.find({$or:[{'year' : req.session.year},{'custom_usn':req.session.usn},{customGroup:{$in:gid}}],isReady:true,'timings.ends':{$gt:new Date()}}).select('name url description questions timings').lean().sort({'timings.starts':-1}).skip((page-1)*12).limit(12);
                //contest = contest.concat(await Contest.find({customGroup:{$in:gid},isReady:true,'timings.ends':{$gt:new Date()}}).lean().select('name url description questions timings')).sort({'timings.starts':-1}).skip((page-1)*12).limit(12);
                if(contest.length <=0) return res.render('contest',{contest:[],count:0,msg:"No ongoing or upcoming contests available."});
                count = await Contest.countDocuments({$or:[{'year' : req.session.year},{'custom_usn':req.session.usn},{customGroup:{$in:gid}}],isReady:true,'timings.ends':{$gt:new Date()}});
                res.render('contest',{contest:contest,count:count,type:"ongoing",page:page});

            }
            
        }
    }
});

//teacher creates contest 
router.get('/create',authenticate,teacher, (req,res) => {
    if(req.session.staff_id)
    res.render('teacher/createContest');
    else
    res.status(404).end
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
    let url = req.body.name.replace(/ /g,'-');
    let lastUrl  = await Contest.find({name:new RegExp('\^'+req.body.name.trim()+'\$','i')}).sort({_id:-1}).limit(1).lean().select('url');
    if(lastUrl.length>0){
    let count = lastUrl[0].url.replace(url,"");
    if(count!="")
        url = url+"1";
    else
        url = url + (++count);
    }
    let contest = new Contest({createdBy:createdBy,id:id,name:req.body.name.trim(),url:url});
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

    await contest.save();
    res.send(contest);


});


// list the contest made by teacher 
router.get('/manage',authenticate,teacher, async (req,res) => {

    if(req.session.isAdmin){
        const contest = await Contest.find().lean();
        return res.render('teacher/manage',{q:contest}); 
    }

    let trcontest = await Contest.find({createdBy:req.session.staff_id}).lean(); 
    if(!trcontest) res.send.status(404).end();
    res.render('teacher/manage',{q:trcontest}); 
    

});

//contest group add
router.post('/group/add',authenticate,teacher,async (req,res)=>{
    let usnArray = req.body.usn.split(",").filter(function(value,index,arr){
        return value.trim() != '';
    });
    req.body.usn = Array.from(new Set(usnArray));
    req.body.usn = req.body.usn.map(f=>{ return f.toUpperCase(); });

    const {error} = validateGroup(req.body);
    if(error) return res.status(400).send(error.message);


    let id=null;
    const lastInserted = await CustomGroup.findOne().sort({_id:-1}).lean().select('id');
    if(lastInserted) id=++lastInserted.id;
    else id=1;

    let group = new CustomGroup();

    const lastName = await CustomGroup.findOne({name:req.body.name}).lean().select('name');
    if(lastName) return res.status(400).send("Group with name "+ req.body.name +" already exists!");
    group.name = req.body.name;
    group.description = req.body.description;
    group.id = id;
    group.date = new Date();
    group.createdBy = req.session.staff_id;
    group.usn = req.body.usn;
    
    await group.save().catch((err)=>{
        return res.send(err);
    });

    res.send("Group saved.");
    
});

//get list of groups
router.get('/group',authenticate,teacher,async (req,res)=>{

    if(!req.query.page) req.query.page=1;

    let totalCount = await CustomGroup.estimatedDocumentCount();
    if(!totalCount) totalCount=0;

    let list = await CustomGroup.find().sort({date:-1}).lean().skip((req.query.page-1)*10).limit(10);
    if(!list) list=[]

    return res.send({groups:list,total:totalCount});
});

//get a specific group
router.get('/group/:id',authenticate,teacher,async (req,res)=>{

    let group = await CustomGroup.findOne({id:req.params.id}).lean();
    if(!group) return res.status(400).send("Invalid ID");

    return res.send(group);
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
        return res.status(400).send("Nothing to add");
  
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

//deleting a group
router.get('/group/delete/:id',authenticate,teacher,async (req,res)=>{
    const group = await CustomGroup.findOne({id:req.params.id});
    if(!group) return res.status(400).send("Invalid ID");

    const list = await Contest.find({customGroup:req.params.id}).lean().select('name');

    let lst=[];
    if(list.length == 0){
        await CustomGroup.deleteOne({id:group.id});
        return res.send("Group deleted!");
    } 
    else{
        for(i of list){
            lst.push(i.name);
        }
        return res.status(400).send("Group is currently used in the following contests:"+lst);
    } 
});

//teacher manage contest
router.get('/manage/:name',authenticate,teacher, async (req,res) => {

    let contest = await Contest.findOne({url:req.params.name}).lean();
    if(!contest) return res.status(404).end();

    let custom = await CustomGroup.find({id:{$in: contest.customGroup}}).lean();
    if(!custom) custom=[];

    let questions = [];
    for(i of contest.questions){ let points=0;
        let q = await ContestQ.findOne({qid:i}).lean();
        for(i of q.test_cases){
            points+=i.points;
        }
        q.totalPoints = points;
        questions.push(q);
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

    let contest = await Contest.findOne({url:req.params.name,'timings.ends':{$gt:new Date()}});
    if(!contest) return res.status(400).send('Contest Ended!');
    if(!(contest.createdBy==req.session.staff_id || req.session.isAdmin)) return res.status(400).send('Cannot edit this contest');
    const starts = new Date(req.body.timings.split("-")[0]);
    const ends = new Date(req.body.timings.split("-")[1]);
    if(starts>=ends)
    return res.status(400).send("Incorrect timings");
    contest.name = req.body.name;
    contest.timings.ends = ends;
    contest.timings.starts = starts;
    contest.description = req.body.description;
    contest.year = req.body.year || [];
    contest.isReady = (req.body.status == "on"?true:false);

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
    await question.save();

    contest.questions.push(question.qid);
    await contest.save();

    res.status(200).send("Question added successfully");

});

//fetching submissions
router.get('/submissions/:curl',authenticate,teacher,async (req,res) =>{
    const contest = await Contest.findOne({url:req.params.curl}).lean().select('submissions questions -_id');
    if(!contest) return res.status(400).send("Contest not found");

    function time_noDays(ms) {var sec = Math.floor(ms/1000);  ms = ms % 1000;  t = three(ms);  var min = Math.floor(sec/60);  sec = sec % 60;  t = two(sec) + ":" + t;  var hr = Math.floor(min/60);  min = min % 60;  t = two(min) + ":" + t; var day = Math.floor(hr/60);  hr = hr % 60;  t = two(hr) + ":" + t;   return t;  }

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

    let questions = await ContestQ.find({qid:{$in:contest.questions}}).lean().select('qid name -_id');
    if(!questions) questions=[];

    let SendData=[];
    for(i=0;i<contest.submissions.length;i++){ let data={};
        if(contest.submissions[i].year != '-' ){
            const index = studentData.findIndex(j => j.usn == contest.submissions[i].usn);
            data.usn = studentData[index].usn;
            data.name = studentData[index].fname + " " + studentData[index].lname;
            data.code = '<a data-toggle="modal" data-target="#source" data-usn="'+studentData[index].usn+'" data-qid="'+contest.submissions[i].qid +'" href="#">View Code</a>';
        }
        else{
            const index1 = teacherData.findIndex(j => j.staff_id == contest.submissions[i].usn);
            data.usn = teacherData[index1].staff_id;
            data.name = teacherData[index1].fname + " " + teacherData[index1].lname;
            data.code = '<a data-toggle="modal" data-target="#source" data-usn="'+teacherData[index1].staff_id+'" data-qid="'+contest.submissions[i].qid +'" href="#">View Code</a>';
        }
        data.qname = questions[questions.findIndex(j => j.qid == contest.submissions[i].qid)].name;
        data.time = time_noDays(contest.submissions[i].timestamp);
        data.points =contest.submissions[i].points;
        data.status = contest.submissions[i].status;
        const l = lang(contest.submissions[i].language_id);
        data.lang = l.substr(0,l.length-2); 

        SendData.push(data);
    }

    res.send(SendData);

});

//adding solution to a question in contest
router.get('/solution/:curl/:qid',authenticate,teacher, async (req,res)=>{
    const contest = await Contest.findOne({url:req.params.curl}).lean().select('questions createdBy timings');
    if(!contest) return res.status(404).send('Contest not found!');

    const question = await ContestQ.findOne({qid:req.params.qid}).lean().select('solution');
    if(!question) return res.status(400).send("Invalid ID");

    if(contest.createdBy == req.session.staff_id || req.session.isAdmin || contest.timings.ends < new Date())
        if(question.solution) res.send(question.solution);
        else res.send('');
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

    const contest = await Contest.findOne({url:req.params.curl}).lean().select('questions');
    if(!contest) return res.status(404);

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
    await question.save();

    res.send("Changes Saved Successfully.");

});

//deleting a contest
router.get('/delete/:curl',authenticate,teacher,async (req,res) => {
    const contest = await Contest.findOne({url:req.params.curl,'timings.ends':{$gt: new Date()}}).lean().select('questions');
    if(!contest) return res.status(400).send("Contest has ended!");

    await Contest.findOneAndDelete({url:req.params.curl}).then(async ()=>{
        await ContestQ.deleteMany({qid:{$in:contest.questions}});
        return res.send("Contest deleted");
    } )
    .catch((err)=>{
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
        if(source.length == 0){
            source=[{sourceCode:config.get(`source.${req.query.lang}`)}];
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

//fetch source code for teacher
router.get('/source/:curl/:usn/:qid',authenticate,teacher,async (req,res) =>{
    const contest = await Contest.findOne({url:req.params.curl}).lean().select('custom_staff_id createdBy submissions timings -_id');
    if(!contest) return res.status(400).send("Contest not found!");

    if(req.session.staff_id == contest.createdBy || new Date() > contest.timings.ends || req.session.isAdmin){
        res.send(contest.submissions.find(i => i.usn == req.params.usn && i.qid == req.params.qid).sourceCode);
    }
    else res.end();
});

//get list of students by year
router.get('/students/:year',authenticate,teacher, async (req,res) =>{
    const students = await Student.find({ year: req.params.year }).lean().select({usn:1,fname:1,_id:0,lname:1});
    if(!students) return res.status(400).send("Students not Found");

    const contest = await Contest.findOne({id:req.query.id}).lean().select('custom_usn -_id');
    if(!contest) return res.status(400).end();
  
    for(i of students)
    {
      i.select = '<input type="checkbox" '+(contest.custom_usn.includes(i.usn)?'checked':'') +' name="studentListCustom" value="'+i.usn+'" >';
      i.name = i.fname +" "+i.lname;
      delete i.fname;
      delete i.lname;
    }
    res.send(students);
  
  });
  
//get list of all teacher
router.get('/teachers',authenticate,teacher,async (req,res)=>{
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
    contest.custom_usn = contest.custom_usn = (req.body.studentListCustom?req.body.studentListCustom:[]);
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
    let contest = await Contest.findOne({url:req.params.curl}).lean().select('timings signedUp name questions url createdBy createdByName rules description isReady');
    if(!contest) return res.status(404).end();

    const now = new Date();
    

    //teacher 
    if(req.session.staff_id){
        if(contest.createdBy == req.session.staff_id || req.session.isAdmin || contest.timings.ends < new Date())
        {
        let questions = await ContestQ.find({qid:{$in:contest.questions}}).select('name difficulty qid description _id test_cases')
        let totalPoints = [];
        if(!questions) questions=[];
        else
        {
            questions.forEach((item,index)=>{ let total=0;
                item.test_cases.forEach((itemp)=>{
                    total+=itemp.points;
                })
                totalPoints.push(total);
            });
        }
        questions.test_cases = [];
        return res.render('qdisplay',{contest:contest,questions:questions,totalPoints:totalPoints});
        }
        else if(contest.isReady){
            if(now > contest.timings.starts && now < contest.timings.ends){
                if(!contest.signedUp.find(({usn}) => usn == req.session.staff_id)){
                    return res.render("timer" , {attempt:"/contest/sign/"+req.params.curl,time:false,contest:contest,rules:contest.rules});
                }
                let questions = await ContestQ.find({qid:{$in:contest.questions}}).select('name difficulty qid description _id test_cases')
                let totalPoints = [];
                if(!questions) questions=[];
                else
                {
                    questions.forEach((item,index)=>{ let total=0;
                        item.test_cases.forEach((itemp)=>{
                            total+=itemp.points;
                        })
                        totalPoints.push(total);
                    });
                }
                questions.test_cases = [];
                return res.render('qdisplay',{contest:contest,questions:questions,totalPoints:totalPoints});
                }
                else{
                    const milli = contest.timings.starts - now;
                    return res.render("timer",{time:Date.now() + milli,name:contest.name,rules:contest.rules} );
                }
        }
        else{
            return res.status(404).end();
        } 
    }
    
    //student
    else{ 
        
        if(contest.isReady){
            if(now>=contest.timings.starts && now<=contest.timings.ends){ //between contest
                if(!contest.signedUp.find(({usn}) => usn == req.session.usn)){
                   return res.render("timer" , {attempt:"/contest/sign/"+req.params.curl,time:false,contest:contest,rules:contest.rules});
                }
        
                let questions = await ContestQ.find({qid:{$in:contest.questions}}).select('name difficulty qid description _id test_cases')
                let totalPoints = [];
                if(!questions) questions=[];
                else
                {
                    questions.forEach((item,index)=>{ let total=0;
                        item.test_cases.forEach((itemp)=>{
                            total+=itemp.points;
                        })
                        totalPoints.push(total);
                    });
                }
                questions.test_cases = [];
                return res.render('qdisplay',{contest:contest,questions:questions,totalPoints:totalPoints});
                }
        
                if(now < contest.timings.starts) //before contest
                {   const milli = contest.timings.starts - now; //stores milli seconds
                    
                    return res.render("timer",{time:Date.now() + milli,contest:contest,rules:contest.rules} );
                }
        
                if(now > contest.timings.ends) //after contest
                {
                    let questions = await ContestQ.find({qid:{$in:contest.questions}}).select('name difficulty qid description _id test_cases')
                    let totalPoints = [];
                    if(!questions) questions=[];
                    else
                    {
                        questions.forEach((item,index)=>{ let total=0;
                            item.test_cases.forEach((itemp)=>{
                                total+=itemp.points;
                            })
                            totalPoints.push(total);
                        });
                    }
                    questions.test_cases = [];
                return res.render('qdisplay',{contest:contest,questions:questions,totalPoints:totalPoints});
                }
        }
        else{
            return res.status(404).end();
        }
        
    }
    

});

//leaderboard route
router.get('/:curl/leaderboard',authenticate,contestAuth,async (req,res) =>{
    const contest =  await Contest.findOne({url:req.params.curl}).lean().select('leaderboard url name');
    if(!contest) return res.send("Invalid ID");

    res.render('leaderboard',{contest:contest});
});

router.get('/:curl/submissions',authenticate,teacher, async (req,res)=>{
    const contest = await Contest.findOne({url:req.params.curl}).lean().select('url createdBy timings -_id');
    if(!contest) return res.status(400).send("Contest not found");

    if(contest.createdBy == req.session.staff_id || req.session.isAdmin || contest.timings.ends < new Date())
    return res.render('teacher/submission',{contest:contest});
    else return res.status(401).send("Unauthorized");
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
        await page.setCookie({name:"elab",value:req.headers.cookie.substr(5),domain:"localhost",path:"/"});
        await page.goto(`http://localhost:4000/contest/${req.params.curl}/report?print=${print}`,{waitUntil:'networkidle0'});
        await page.pdf({
            // name of your pdf file in directory
			path: './public/testpdf.pdf', 
            //  specifies the format
			format: 'A4', 
            // print background property
			printBackground: true 
        });
        // console message when conversion  is complete!
        await browser.close();
    } catch (e) {
        console.log('our error', e);
    }
    })().then(()=>{
        res.download('./public/testpdf.pdf');
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




//viewing question
router.get('/:curl/:qid',authenticate,contestAuth,async (req,res)=>{
    let contest = await Contest.findOne({url:req.params.curl}).lean().select('questions name url timings');
    if(!contest) return res.status(404).end();
    
    if(!(contest.createdBy == req.session.staff_id || req.session.isAdmin || contest.timings.starts < new Date()))
    return res.status(404).end();

    if(!contest.questions.includes(req.params.qid)){
        return res.status(404).end();
    }
    let question = await ContestQ.findOne({qid:req.params.qid}).catch(err => {
        return res.status(404).end();
    });
    
    return res.render('editorContest',{question : _.pick(question,['name','statement','constraints', 'input_format','output_format','sample_cases','explanation']),contest:contest})


});



//submission of contest
router.post('/:curl/:qid',authenticate,contestAuth,async (req,res)=>{
    let contest = await Contest.findOne({url:req.params.curl}).select('questions submissions leaderboard timings custom_staff_id createdBy');
    if(!contest) return res.status(404).end();

    if(!contest.questions.includes(req.params.qid)){
        return res.status(404).end();
    }

    const question = await ContestQ.findOne({qid:req.params.qid}).select('test_cases').lean().catch(err => {
        res.status(404).end();
    });

if(contest.timings.starts > new Date() || contest.timings.ends < new Date())
{
    return res.status(400).send("Cannot submit to this contest.");
}

if(req.session.staff_id && req.session.staff_id!=contest.createdBy){
    if(contest.custom_staff_id.includes(req.session.staff_id.toString())){}
    else
        return res.status(400).send("Not authorized to make a submission!");
}
  const testcase = question.test_cases;
  let question_points = 0;
  testcase.forEach((item,index) =>{
    question_points +=item.points;
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
    .then(async (data) => {
      let desc= [];
      
      data.forEach(store);
      function store(data,index){ let points=0;
          if(data.status.id == 3){
            points = testcase[index].points;
          }
        desc.push({id:data.status.id,description:data.status.description,points:points}); 
      }
    
    if(req.session.code == req.body.source+req.params.qid) return res.send(desc);
    let total_points  = 0;
    desc.forEach((item,index) =>{
            total_points+= item.points;
    });
   
    req.session.code = req.body.source + req.params.qid;
    const usn = req.session.usn || req.session.staff_id.toString();
    const year = req.session.year || '-';
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
            leaderboardSort();
        }
        await contest.save();
        return res.send(desc);
    }

    let sub = new Submission();
    const subCount = await Submission.estimatedDocumentCount({usn:usn,qid:req.params.qid});
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
        leaderboardSort();
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

        leaderboardSort();
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

    function leaderboardSort(){
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
    
    
    }).catch(err => {
        console.log(err);
      res.send(err);
    });



});



module.exports = router;