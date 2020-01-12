const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const contestAuth = require('../middleware/contestAuth');
const {Contest,validateContest} = require('../models/contest');
const {ContestQ} = require('../models/contestQ');
const crypto = require("crypto");
const moment = require('moment');
const _ = require('lodash');

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



router.get('/',authenticate, (req,res)=> {
    if(req.session.name.endsWith(" "))
    res.render('teacher/trcontest');
    else
    res.render('contest');
});

//teacher creates contest 
//auth : pending
router.get('/create',authenticate, (req,res) => {
    if(req.session.name.endsWith(" "))
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
    const secret = crypto.randomBytes(20).toString('hex');
    const createdBy = req.session.userId;
    let id = await Contest.countDocuments();
    id++;
    let url = req.body.name.replace(/ /g,'-');
    let count  = await Contest.countDocuments({name:req.body.name.trim()});
    if(count>0)
        url = url+count;
    
    let contest = new Contest({secret:secret,createdBy:createdBy,id:id,name:req.body.name.trim(),url:url,year:req.body.year});
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
    console.log(trcontest);
    res.render('teacher/manage',{q:trcontest}); 
    

});

//teacher manage contest
router.get('/manage/:name', async (req,res) => {
    if(!req.session.name.endsWith(" ")) return res.status(404).end();

    let contest = await Contest.findOne({url:req.params.name});
    if(!contest) return res.status(404).end();

    let questions = [];
    for(i of contest.questions){
        questions.push(await ContestQ.findOne({qid:i}));
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
    let contest = await Contest.findOne({url:req.params.curl}).lean().select('timings signedUp');
    if(!contest) return res.status(404).end();

    if(Date.now()>=contest.timings.starts && Date.now()<=contest.timings.ends){
        if(!contest.signedUp.find(({usn}) => usn == req.session.usn)){
           return res.send("Attempt");
        }

        res.send("questions");
    }

    if(Date.now() < contest.timings.starts)
    {
        res.send("Timer");
    }

    if(Date.now() > contest.timings.ends)
    {
        res.send("Ended");
    }

});

//sign up for contest
router.get('/sign/:curl',authenticate,contestAuth,async (req,res) => {
   const con = await Contest.findOneAndUpdate({url:req.params.curl, 'signedUp.usn':{$ne : req.session.usn}},{$addToSet :{signedUp : {usn: req.session.usn,time:Date.now()}}},
   (err,doc) => {
      if(err) 
    res.status(404).send("Not Found");
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
    
    return res.render('editor',{question : _.pick(question,['statement','constraints', 'input_format','output_format','sample_cases','explanation'])})


});



module.exports = router;