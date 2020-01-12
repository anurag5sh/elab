const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {Contest,validateContest} = require('../models/contest');
const {ContestQ,validateCQ} = require('../models/contestQ');
const crypto = require("crypto");
const moment = require('moment');

router.post('/:cname',authenticate,async (req,res) => {
    const contest = await Contest.findOne({url:req.params.cname});
    if(!contest) return res.status(404);

    const {error} = validateCQ(req.body);
    if(error) return res.status(400).send(error.message);

    const date = moment().format('DDMMYY');
    let count = await ContestQ.countDocuments({qid: new RegExp("^"+date)});

    let question = new ContestQ();
    question.name = req.body.name;
    question.statement= req.body.statement;
    question.constraints = req.body.constraints;
    question.input_format = req.body.i_format;
    question.output_format = req.body.o_format;

    console.log(req.body.i_sample1);

    for(let i=0;i<req.body.i_sample1.length;i++){
        question.sample_cases.push({input:req.body.i_sample1[i], output:req.body.o_sample1[i]});
    }

    for(let i=0;i<req.body.i_testcase1.length;i++){
        question.test_cases.push({input:req.body.i_testcase1[i], output:req.body.o_testcase1[i]});
    }
 
    question.explanation= req.body.explanation;
    question.qid+= ++count;
    await question.save();

    contest.questions.push(question.qid);
    await contest.save();

    res.status(200).send("Question added successfully");

});

module.exports = router;