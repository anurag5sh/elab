const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {Contest,validateContest} = require('../models/contest');
const crypto = require("crypto");
const moment = require('moment');

function setDate(req,res,next){
    let date = req.body.starts[0];
    let time = req.body.starts[1];
    date=date.split('-');
    time=time.split(':');
    req.body.starts = new Date(date[0],date[1],date[2],time[0],time[1]);

    date = req.body.ends[0];
    time = req.body.ends[1];
    date=date.split('-');
    time=time.split(':');
    req.body.ends = new Date(date[0],date[1],date[2],time[0],time[1]);

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
router.get('/create',(req,res) => {
    res.render('teacher/createContest');
});

//Saving the contest in db
router.post('/create',setDate, async (req,res)=>{
    const { error } = validateContest(req.body);
    if(error) return res.send(error.message); 
    const secret = crypto.randomBytes(20).toString('hex');
    const createdBy = req.session.userId;
    let id = await Contest.countDocuments();
    id++;
    const url = req.body.name.replace(/ /g,'-');
    
    let contest = new Contest({secret:secret,createdBy:createdBy,id:id,name:req.body.name,url:url,year:req.body.year});
    contest.timings.created= moment().format();
    contest.timings.starts = req.body.starts;
    contest.timings.ends = req.body.ends;

    await contest.save();
    res.send(contest);


});


//teacher manage contest
router.get('/manage',(req,res) => {
    res.render('teacher/manageContest');
});

//landing page for contest
router.get('/:curl',(req,res) =>{

});

//viewing question
router.get('/:curl/:id',(req,res)=>{

});

router.get('/')
module.exports = router;