var express = require('express');
var router = express.Router();
const request = require("request-promise");
const {Practice,validatePractise} = require('../models/practice');
const {ContestQ} = require('../models/contestQ');
const {AssignmentQ} = require('../models/assignmentQ');
const {LabQ} = require('../models/labQ');
const Joi = require('@hapi/joi');
const authenticate = require('../middleware/auth');
const winston = require('winston');

function encode64(string){ //encoding to base64
  const b = new Buffer.from(string);
return b.toString('base64');
}

function decode64(string64){//decode to utf8
  const b = new Buffer.from(string64, 'base64')
return b.toString();
}

router.post('/', authenticate,async (req,res)=>{ 

  //verifying the request body
  function validate(body)
  {
    const schema = Joi.object({
        source : Joi.string().required().allow(''),
        language : Joi.number().required(),
        qid: Joi.string().required(),
        custom: Joi.string().allow('')
    });

    return schema.validate(body);
  }

  const { error } = validate(req.body); 
  if (error) return res.status(400).send("Invalid Request");

  const pathname = req.body.qid.split("/");

  let question = undefined;
  if(pathname[1] == "practice"){
    let qid = pathname[2];
    question = await Practice.findOne({qid:qid }).lean().select('sample_cases');
    if(!question) return res.send("Question not found.");
  }
  else if(pathname[1] == "contest")
  {
    let qid = pathname[3];
    question = await ContestQ.findOne({qid:qid}).lean().select('sample_cases');
    if(!question) return res.send("Question not found.");
  }
  else if(pathname[1] == "assignment"){
    let qid = pathname[2];
    question = await AssignmentQ.findOne({qid:qid}).lean().select('sample_cases');
    if(!question) return res.send("Question not found.")
  }
  else if(pathname[1] == "lab"){
    let qid = pathname[3];
    question = await LabQ.findOne({qid:qid}).lean().select('sample_cases');
    if(!question) return res.send("Question not found.");
  }
  else return res.status(404).end();
  let sample = null;

  //if lab
  if (!question.sample_cases[0].output){
    req.body.custom = req.body.custom ||  ' ';
  }

  if(req.body.custom){
    sample = [ { input: req.body.custom, output: "1" }];
  }
  else{
    sample = question.sample_cases;
  }

  if(req.body.source.substr(req.body.source.length-18) == "undefinedundefined")
  req.body.source = req.body.source.substr(0,req.body.source.length-18);
  else
  return res.status(400).send("Unauthorized");
  if(req.body.source.trim()=='')
    return res.send("Source Code cannot be empty!");

  let result = [];

  let compiler_opt = null;
  if (req.body.language == 50){
    compiler_opt = "-lm";
  }

  for(let i=0;i<sample.length;i++){
  let options = { method: 'POST',
  url: 'http://127.0.0.1:3000/submissions?base64_encoded=true&wait=true',
  body: { "source_code": encode64(req.body.source), "language_id": req.body.language ,"stdin":encode64(sample[i].input),
      "expected_output":encode64(sample[i].output), "compiler_options":compiler_opt},

  json: true };

  result.push(request(options));
  }
    Promise.all(result)
    .then((response) => { 
      let r=[];
      for(let i=0;i<response.length;i++){
        let output="";
      const json_res = JSON.parse(JSON.stringify(response[i]));
      
      if(json_res.stdout!=null) output=json_res.stdout;
      else if(json_res.stderr!=null) output=json_res.stderr;
      else if(json_res.compile_output!=null) output=json_res.compile_output;
      r.push({output:decode64(output),id:response[i].status.id,description:response[i].status.description})
      }
      
      res.send(r);
      
    })
    .catch((err) => { winston.error(err);
      res.send(err);
    });
  
 
  
}); 
 


  module.exports = router;