const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const teacherAuth = require('../middleware/teacher');
const {Contest,validateContest} = require('../models/contest');
const {ContestQ,validateCQ} = require('../models/contestQ');
const crypto = require("crypto");
const moment = require('moment');


//adding a question to contest
router.post('/:cname',authenticate,teacherAuth,async (req,res) => {
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
    question.qid+= ++count;
    await question.save();

    contest.questions.push(question.qid);
    await contest.save();

    res.status(200).send("Question added successfully");

});

module.exports = router;