const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {Student} = require('../models/student');
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
    if(req.session.staff_id){
     const contest = await Contest.find().lean();
     if(!contest) return res.render('teacher/trcontest',{contest:[]});

    res.render('teacher/trcontest',{contest:contest});
    }
    else{
    let contest = await Contest.find({$or:[{'year' : req.session.year},{'custom_usn':req.session.usn}],isReady:true}).select('name url description').lean();
    const grp = await CustomGroup.find({'usn':req.session.usn}).lean().select({id:1,_id:0});
    let gid=[];
    for(i of grp) gid.push(i.id);
    contest = contest.concat(await Contest.find({customGroup:{$in:gid},isReady:true}).lean().select('name url description'));
    if(!contest) return res.render('contest',{contest:[]});

    res.render('contest',{contest:contest});
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
    for(i of contest.questions){
        questions.push(await ContestQ.findOne({qid:i}).lean());
    }
    let signed_up =[0,0,0,0];
    for(i of contest.signedUp){
         signed_up[i.year-1]++;
    }
    let submissions = [0,0,0,0];
    for(i of contest.submissions){
        submissions[i.year - 1]++;
    }

    let questionNo = [];
    for( i of questions){
        questionNo.push({qid:i.qid,name:i.name, Accepted: 0,Partially_Accepted: 0,Wrong_Answer: 0});
    }

    for (i of contest.submissions){
        if(i.status === "Accepted" ){
            const index = questionNo.findIndex( j => j.qid === i.qid);
            console.log(index);
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
   const con = await Contest.findOneAndUpdate({url:req.params.curl, 'signedUp.usn':{$ne : req.session.usn},'timings.starts':{$lt:new Date()},'timings.ends':{$gt:new Date()}},{$addToSet :{signedUp : {usn: req.session.usn,name:req.session.fname+" "+req.session.lname,time:new Date(),year:req.session.year}}},
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

//View Profile
router.get('/:curl/viewProfile/:usn',authenticate,async (req,res,next)=>{
    if(req.session.staff_id){
      const student = await Student.findOne({usn:req.params.usn}).lean();
      return res.render('viewProfile',{student:student});
    }
    else next();
  }, (req,res)=> {
    res.render('login');
  });
  

//editing questions
router.post('/edit/:curl/:qid',authenticate,teacher,async (req,res)=>{
    const {error} = validateCQ(req.body);
    if(error) return res.status(400).send(error.message);

    const contest = await Contest.findOne({url:req.params.curl}).lean().select('questions');
    if(!contest) return res.status(404);

    if(!contest.questions.include(req.params.qid)) return res.status(400).send("Invalid ID");

    const question = await ContestQ.findOne({qid:req.params.qid});
    if(!question) return res.status(400).send("Invalid ID");

    question.name = req.body.name;
    question.statement=decodeURIComponent(req.body.statement); 
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
    if(!contest) return res.status(400).send("Invalid ID");

    await Contest.findOneAndDelete({url:req.params.curl}).then(async ()=>{
        await ContestQ.deleteMany({qid:{$in:contest.questions}});
        return res.send("Contest deleted");
    } )
    .catch((err)=>{
        return res.send("Error! Unable to delete the contest.");
    });
});


//deleting a question
router.get('/delete/:curl/:qid',authenticate,teacher,async (req,res)=>{

    const contest = await Contest.findOne({url:req.params.curl}).lean().select('questions');
    if(!contest) return res.status(404);

    if(!contest.questions.include(req.params.qid)) return res.status(400).send("Invalid ID");

    if(contest.timings.ends< new Date()) return res.status(400).send("Cannot delete a question after contest is over.");
    
    await ContestQ.findOneAndDelete({qid:req.params.qid});
    await Submission.deleteMany({qid:req.params.qid});

    res.send("Question deleted.");
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
    if(req.query.lang){
        let contest = await Contest.findOne({url:req.params.curl},{submissions:{$elemMatch:{usn:req.session.usn,qid:req.params.qid,language_id:req.query.lang}}},{_id:0,'submissions.$':1}).lean();
        if(!contest) return res.status(404).end();
        if(!contest.submissions) contest.submissions=[];

        const submission = await Submission.find({usn:req.session.usn,qid:req.params.qid,language_id:req.query.lang}).lean();
        source = contest.submissions.concat(submission);
        if(source.length == 0){
            source=[{sourceCode:config.get(`source.${req.query.lang}`)}];
            return res.send(source);
        }
    }
    else{
        let contest = await Contest.findOne({url:req.params.curl},{submissions:{$elemMatch:{usn:req.session.usn,qid:req.params.qid}}},{_id:0,'submissions.$':1}).lean();
        if(!contest) return res.status(404).end();
        if(!contest.submissions) contest.submissions=[];
    
        const submission = await Submission.find({usn:req.session.usn,qid:req.params.qid}).lean();
        source = contest.submissions.concat(submission);
        for(i=0;i<source.length;i++){
            source[i].language_id = lang(source[i].language_id);
        }
    }
  
    res.send(source.sort((a,b)=>(a.timestamp>b.timestamp)?-1:1));
});

//landing page for contest
router.get('/:curl',authenticate,contestAuth, async (req,res) =>{
    let contest = await Contest.findOne({url:req.params.curl}).lean().select('timings signedUp name questions url');
    if(!contest) return res.status(404).end();

    const now = new Date();
    

    //teacher 
    if(req.session.staff_id){
        if(now > contest.timings.starts)
        return res.send("questions");
        else{
            const milli = contest.timings.starts - now;
            return res.render("timer",{time:Date.now() + milli,name:contest.name,type: "teacher"} );
        }
    }
    
    //student
    else{ 
        
        if(now>=contest.timings.starts && now<=contest.timings.ends){ //between contest
        if(!contest.signedUp.find(({usn}) => usn == req.session.usn)){
           return res.render("timer" , {attempt:"/contest/sign/"+req.params.curl,time:false,type: "student"});
        }

        let questions = await ContestQ.find({qid:{$in:contest.questions}}).select('name difficulty qid description -_id')
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
        return res.render('qdisplay',{contest:contest,questions:questions,totalPoints:totalPoints});
        }

        if(now < contest.timings.starts) //before contest
        {   const milli = contest.timings.starts - now; //stores milli seconds
            
            return res.render("timer",{time:Date.now() + milli,name:contest.name} );
        }

        if(now > contest.timings.ends) //after contest
        {
            return res.send("Ended");
        }
    }
    

});

//leaderboard route
router.get('/:curl/leaderboard',authenticate,contestAuth,async (req,res) =>{
    const contest =  await Contest.findOne({url:req.params.curl}).lean().select('leaderboard url name');
    if(!contest) return res.send("Invalid ID");

    res.render('leaderboard',{contest:contest});
});



//viewing question
router.get('/:curl/:qid',authenticate,contestAuth,async (req,res)=>{
    let contest = await Contest.findOne({url:req.params.curl},{submissions:{$elemMatch:{usn:req.session.usn,qid:req.params.qid}}},{_id:0,'submissions.$':1}).lean().select('questions');
    if(!contest) return res.status(404).end();
    
    if(!contest.questions.includes(req.params.qid)){
        return res.status(404).end();
    }
    let question = await ContestQ.findOne({qid:req.params.qid}).catch(err => {
        return res.status(404).end();
    });
    
    return res.render('editorContest',{question : _.pick(question,['name','statement','constraints', 'input_format','output_format','sample_cases','explanation'])})


});



//submission of contest
router.post('/:curl/:qid',authenticate,contestAuth,async (req,res)=>{
    let contest = await Contest.findOne({url:req.params.curl}).select('questions submissions leaderboard timings');
    if(!contest) return res.status(404).end();

    if(!contest.questions.includes(req.params.qid)){
        return res.status(404).end();
    }

    const question = await ContestQ.findOne({qid:req.params.qid}).select('test_cases').lean().catch(err => {
        res.status(404).end();
    });

if(contest.timings.starts > new Date() && contest.timings.ends < new Date())
{
    return res.status(400).send("Cannot submit to this contest.");
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
    .then(async (data) => {
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
   
    if(req.session.staff_id){
        req.session.usn = req.session.staff_id;
        req.session.year = '';
    }

    const user_submission = contest.submissions.find(i => i.usn === req.session.usn && i.qid === req.params.qid);

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
        contest.submissions.push(obj);

        //leaderboard
        if(total_points>0){
            let leadObj = {};
            leadObj.usn=req.session.usn;
            leadObj.timestamp = new Date() - contest.timings.starts;
            leadObj.name = req.session.fname;
            leadObj.year = req.session.year;
            leadObj.points = total_points; 
             
            contest.leaderboard.push(leadObj);
        }
        leaderboardSort();
        await contest.save();
        return res.send(desc);
    }

    let sub = new Submission();
    const subCount = await Submission.estimatedDocumentCount({usn:req.session.usn,qid:req.params.qid});
    if(subCount == 20){
        sub = await Submission.findOne({usn:req.session.usn,qid:req.params.qid}).sort({timestamp:1});
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
        
        const i= contest.submissions.indexOf(user_submission);
        let previous_sub =  new Submission(_.pick(contest.submissions[i].toJSON(),['usn','sourceCode','status','timestamp','language_id','points']));
        await previous_sub.save();
        contest.submissions.splice(i,1);
        let obj ={};
        obj.qid = req.params.qid;
        obj.timestamp = new Date();
        obj.usn = req.session.usn;
        obj.sourceCode = req.body.source;
        obj.status = "Accepted";
        obj.points = total_points;
        obj.language_id = req.body.language;
        contest.submissions.push(obj);

        //leaderboard
        const index = contest.leaderboard.findIndex((item,index)=>{
            return item.usn == req.session.usn;
        });
        if(index == -1){
            let leadObj = {};
            leadObj.usn=req.session.usn;
            leadObj.timestamp = new Date()- contest.timings.starts;
            leadObj.name = req.session.fname;
            leadObj.year = req.session.year;
            leadObj.points = total_points; 
             
            contest.leaderboard.push(leadObj);
        }
        else
        {
            contest.leaderboard[index].points += total_points;
            contest.leaderboard[index].timestamp = new Date()- contest.timings.starts;
        }
        leaderboardSort();
        await contest.save();
        return res.send(desc);
    }
    else if(total_points > user_submission.points){
        const i= contest.submissions.indexOf(user_submission);
        let previous_sub =  new Submission(_.pick(contest.submissions[i].toJSON(),['usn','sourceCode','status','timestamp','language_id','points']));
        await previous_sub.save();
        contest.submissions.splice(i,1);
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
        contest.submissions.push(obj);

        //leaderboard
        const index = contest.leaderboard.findIndex((item,index)=>{
            return item.usn == req.session.usn;
        });
        if(index == -1){
            let leadObj = {};
            leadObj.usn=req.session.usn;
            leadObj.timestamp = new Date() -  contest.timings.starts;
            leadObj.name = req.session.fname;
            leadObj.year = req.session.year;
            leadObj.points = total_points; 
             
            contest.leaderboard.push(leadObj);
        }
        else
        {
            contest.leaderboard[index].points += total_points;
            contest.leaderboard[index].timestamp = new Date()- contest.timings.starts;
        }

        leaderboardSort();
        await contest.save();
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