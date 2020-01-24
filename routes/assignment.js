const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const teacher = require('../middleware/teacher');
const admin = require('../middleware/admin');
const _ = require('lodash');
const request = require("request-promise");
const {Assignment,validateAssignment} = require('../models/assignment');
const {AssignmentQ,validateAQ} = require('../models/assignmentQ');
const moment = require('moment');

//Load the current assignment questions for students
router.get('/',authenticate, async (req,res) => {
    
});

//get an assignment
router.get('/:id',teacher,async (req,res) => {
    const assignment = await Assignment.findOne({id:req.params.id}).lean();
    if(!assignment) return res.status(400).send("Not Found");
  
    let questions = await AssignmentQ.find({assignmentId:req.params.id}).lean();
    if(!questions) questions = [];

    res.send({assignment:assignment,questions:questions});
  });

  //get an assignment question
router.get('/:id/:qid',teacher,async (req,res) => {
    const assignment = await Assignment.findOne({id:req.params.id}).lean().select('questions id');
    if(!assignment) return res.status(400).send("Error! Not Found");

    let question = await AssignmentQ.findOne({qid:req.params.qid}).lean();
    if(!question) return res.status(400).send("Not Found!");

    if(assignment.questions.includes(req.param.qid) || question.assignmentId == assignment.id){
        res.send(question);
    }
    else
    {
        res.status(400).send("Not found!");
    }

});

//adding a question to assignment
router.post('/add',authenticate,teacher,async (req,res) => {
    const {error} = validateAQ(req.body);
    if(error) return res.status(400).send(error.message);

    let count=1;
    let lastInserted = await AssignmentQ.findOne({assignmentId:new RegExp('\^'+req.body.aId),qid:new RegExp('\^'+moment().format('DDMMYY'))}).sort({_id:-1}).lean().select('qid');
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



module.exports = router;