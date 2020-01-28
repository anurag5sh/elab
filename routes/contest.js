const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const teacher = require('../middleware/teacher');
const contestAuth = require('../middleware/contestAuth');
const {Contest,validateContest} = require('../models/contest');
const {ContestQ} = require('../models/contestQ');
const crypto = require("crypto");
const moment = require('moment');
const _ = require('lodash');
const request = require("request-promise");


function setDate(req,res,next){
    let date = req.body.starts[0];
    let time = req.body.starts[1];
    date=date.split('-');
    time=time.split(':');
    req.body.starts = new Date(date[0],date[1]-1,date[2],time[0],time[1]);


    date = req.body.ends[0];
    time = req.body.ends[1];
    date=date.split('-');
    time=time.split(':');
    req.body.ends = new Date(date[0],date[1]-1,date[2],time[0],time[1]);

    next();
}


function encode64(string){ //encoding to base64
    const b = new Buffer.from(string);
  return b.toString('base64');
  }
  
  function decode64(string64){//decode to utf8
    const b = new Buffer.from(string64, 'base64')
  return b.toString();
  }



router.get('/',authenticate, async (req,res)=> {
    if(req.session.staff_id){
     const contest = await Contest.find().lean();
     if(!contest) return res.render('teacher/trcontest',{contest:[]});

    res.render('teacher/trcontest',{contest:contest});
    }
    else{
    const contest = await Contest.find({$or:[{'year' : req.session.year},{'custom_usn':req.session.usn}]}).select('name url').lean();
    if(!contest) return res.render('contest',{contest:[]});

    res.render('contest',{contest:contest});
    }
});

//teacher creates contest 
//auth : pending
router.get('/create',authenticate, (req,res) => {
    if(req.session.staff_id)
    res.render('teacher/createContest');
    else
    res.status(404).end
});

//Saving the contest in db
router.post('/create',authenticate,setDate, async (req,res)=>{
    const { error } = validateContest(req.body);
    if(error) return res.status(400).send(error.message); 
    if(req.body.starts>=req.body.ends)
        return res.status(400).send("Incorrect timings");
    const createdBy = req.session.userId;
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
    let contest = new Contest({createdBy:createdBy,id:id,name:req.body.name.trim(),url:url,year:req.body.year});
    contest.timings.created= moment().format();
    contest.timings.starts = req.body.starts;
    contest.timings.ends = req.body.ends;

    await contest.save();
    res.send(contest);


});


// list the contest made by teacher 
router.get('/manage',authenticate, async (req,res) => {
    let trcontest = await Contest.find({createdBy:req.session.userId}); 
    if(!trcontest) res.send.status(404).end();
    res.render('teacher/manage',{q:trcontest}); 
    

});

//teacher manage contest
router.get('/manage/:name',authenticate,teacher, async (req,res) => {

    let contest = await Contest.findOne({url:req.params.name}).lean();
    if(!contest) return res.status(404).end();

    let questions = [];
    for(i of contest.questions){
        questions.push(await ContestQ.findOne({qid:i}).lean());
    }
    if(contest.createdBy == req.session.userId)
       return res.render('teacher/manageContest',{contest:contest, questions:questions});
    else
        return res.status(404).end();
    
    
});

//teacher editing existing contest
router.post('/manage/:name',authenticate,async (req,res) =>{
    res.send("Saved");
});

//landing page for contest
router.get('/:curl',authenticate,contestAuth, async (req,res) =>{
    let contest = await Contest.findOne({url:req.params.curl}).lean().select('timings signedUp name');
    if(!contest) return res.status(404).end();

    const now = new Date();
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
        
        if(now>=contest.timings.starts && now<=contest.timings.ends){
        if(!contest.signedUp.find(({usn}) => usn == req.session.usn)){
           return res.render("timer" , {attempt:"/contest/sign/"+req.params.curl,time:false,type: "student"});
        }

        return res.send("questions");
        }

        if(now < contest.timings.starts)
        {   const milli = contest.timings.starts - now; //stores milli seconds
            
            return res.render("timer",{time:Date.now() + milli,name:contest.name} );
        }

        if(now > contest.timings.ends)
        {
            return res.send("Ended");
        }
    }
    

});

//sign up for contest
router.get('/sign/:curl',authenticate,contestAuth,async (req,res) => {
   const con = await Contest.findOneAndUpdate({url:req.params.curl, 'signedUp.usn':{$ne : req.session.usn},'timings.starts':{$lt:new Date()},'timings.ends':{$gt:new Date()}},{$addToSet :{signedUp : {usn: req.session.usn,name:req.session.name,time:new Date()}}},
   (err,doc) => {
    if(err)
    return res.status(404).send("Not Permitted");
   });

    return res.redirect('/contest/'+ req.params.curl);
});

//viewing question
router.get('/:curl/:qid',authenticate,contestAuth,async (req,res)=>{
    let contest = await Contest.findOne({url:req.params.curl}).lean().select('questions');
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
    let contest = await Contest.findOne({url:req.params.curl}).lean().select('questions');
    if(!contest) return res.status(404).end();

    if(!contest.questions.includes(req.params.qid)){
        return res.status(404).end();
    }

    const question = await ContestQ.findOne({qid:req.params.qid}).select('test_cases').lean().catch(err => {
        res.status(404).end();
    });
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
      function store(data){ let points=0;
          if(data.status.id == 3){
            points = testcase[i++].points;
          }
        desc.push({id:data.status.id,description:data.status.description,points:points}); 
      }
      res.send(desc);

    }).catch(err => {
      res.send(err);
    });



});



module.exports = router;