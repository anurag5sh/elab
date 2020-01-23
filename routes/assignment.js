const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const teacher = require('../middleware/teacher');
const admin = require('../middleware/admin');
const _ = require('lodash');
const request = require("request-promise");
const {Assignment,validateAssignment} = require('../models/assignment');
const {AssignmentQ,validateAQ} = require('../models/assignmentQ');

//Load the current assignment questions for students
router.get('/',authenticate, async (req,res) => {
    
});

//adding a question to assignment
router.post('/add',authenticate,teacher,async (req,res) => {
    const {error} = validateAQ(req.body);
    if(error) res.status(400).send(error.message);

    let count=1;
    let lastInserted = await AssignmentQ.findOne({qid:new RegExp('\^'+req.body.assignmentId)}).sort({_id:-1}).lean().select('qid');
    if(lastInserted){
        count = Number(lastInserted.substr(lastInserted.indexOf('Q')+1));
        count++;
    }

    let question = new AssignmentQ({assignmentId:req.body.assignmentId});
    question.name = req.body.name;
    question.statement= req.body.statement;
    question.constraints = req.body.constraints;
    question.input_format = req.body.i_format;
    question.output_format = req.body.o_format;

    if(Array.isArray(req.body.i_sample1)){

        for(let i=0;i<req.body.i_sample1.length;i++){
            question.sample_cases.push({input:req.body.i_sample1[i], output:req.body.o_sample1[i]});
        }
    
        for(let i=0;i<req.body.i_testcase1.length;i++){
            question.test_cases.push({input:req.body.i_testcase1[i], output:req.body.o_testcase1[i],points:req.body.points[i]});
        }
        }
        else{
            question.sample_cases.push({input:req.body.i_sample1, output:req.body.o_sample1});
            question.test_cases.push({input:req.body.i_testcase1, output:req.body.o_testcase1,points:req.body.points});
        }

    question.explanation= req.body.explanation;
    question.qid = moment().format('DDMMYY'); + "Q" + count;
    await question.save();

    res.status(200).send("Question added successfully");

});



module.exports = router;