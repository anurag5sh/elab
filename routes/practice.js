const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const _ = require('lodash');
const session = require('express-session');
const authenticate = require('../middleware/auth');
const {Practice,validatePractise} = require('../models/practice');


router.get('/', authenticate,async (req,res)=> {
    const questions = await Practice.find().sort({date:-1});
    
    res.render('practice', {q:questions});
  });

router.post('/',async (req,res)=>{

    const {error} = validatePractise(req.body);
    if(error) return res.send(error.message);

    let question = new Practice(_.pick(req.body, ['statement', 'constraints', 'input_format','output_format','test_cases','sample_cases']));
    await question.save();

    res.send(question);
});

module.exports = router;