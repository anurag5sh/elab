var express = require('express');
var router = express.Router();
const {Practice,validatePractise} = require('../models/practice');
const {ContestQ} = require('../models/contestQ');
const {AssignmentQ} = require('../models/assignmentQ');
const {LabQ} = require('../models/labQ');
const Joi = require('@hapi/joi');
const authenticate = require('../middleware/auth');
const winston = require('winston');
const {run} = require('../compiler/api');

function decode64(string64){//decode to utf8
  const b = new Buffer.from(string64, 'base64')
return b.toString('ascii');
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
    return res.status(400).send("Source Code cannot be empty!");

  let result = [];

  for(let i=0;i<sample.length;i++){
    const data={
      language : req.body.language,
      source : req.body.source,
      input : sample[i].input,
      output : sample[i].output
    };
    
    result.push(run(data));
  }

  Promise.all(result)
    .then((response) => { 
      let responses=[];
      for(let i=0;i<response.length;i++){
        let output="";
        const json_res = JSON.parse(JSON.stringify(response[i]));
        
        if(json_res.stdout!=null) output=json_res.stdout;
        else if(json_res.stderr!=null) output=json_res.stderr;
        else if(json_res.compile_output!=null) output=json_res.compile_output;
        responses.push({output:decode64(output),id:response[i].status.id,description:response[i].status.description})
      }
      
      res.send(responses);
      
    })
    .catch((err) => { winston.error(err);
      res.status(400).send("Unable to execute!");
    });
}); 
 
module.exports = router;