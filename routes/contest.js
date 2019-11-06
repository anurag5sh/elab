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
router.get('/create',authenticate, (req,res) => {
    if(req.session.name.endsWith(" "))
    res.render('teacher/createContest');
    else
    res.status(404).end
});

//Saving the contest in db
router.post('/create',setDate, async (req,res)=>{
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

    if(contest.createdBy == req.session.userId)
       return res.render('teacher/manageContest',{contest:contest});
    else
        return res.status(404).end();
    
    
});

//teacher editing existing contest
router.post('/manage/:name',async (req,res) =>{
    res.send("Saved");
});

//landing page for contest
router.get('/:curl',(req,res) =>{

});

//viewing question
router.get('/:curl/:id',(req,res)=>{

});



module.exports = router;