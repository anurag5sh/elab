const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { Student } = require("../models/student");
const { Teacher } = require("../models/teacher");
const admin = require("../middleware/admin");
const teacher = require("../middleware/teacher");
const fs = require("fs");
const request = require("request-promise");
const config = require("config");
const path = require("path");
const winston = require("winston");
const rimraf = require("rimraf");
const { Lab, validateLab } = require("../models/lab");
const { LabQ, validateLQ } = require("../models/labQ");
const moment = require("moment");
const { CustomGroup } = require("../models/customGroup");
const labAuth = require("../middleware/labAuth");

function encode64(string){ //encoding to base64
    const b = new Buffer.from(string);
  return b.toString('base64');
  }
  
  function decode64(string64){//decode to utf8
    const b = new Buffer.from(string64, 'base64')
  return b.toString();
  }


router.get("/", authenticate, async (req, res) => {
    if (req.session.staff_id) {
        let labs;
        if (req.session.isAdmin) {
            labs = await Lab.find().lean();
        } else {
            labs = await Lab.find({ $or:[{createdBy: req.session.staff_id},{custom_staff_id:req.session.staff_id}] }).lean();
        }
        res.render("teacher/lab/lab", { labs: labs });
    } else {
        const groups = await CustomGroup.find({ usn: req.session.usn })
            .select("-_id id")
            .lean();
        groupsArray = [];
        for (i of groups) {
            groupsArray.push(i.id);
        }
        const labs = await Lab.find({
            customGroup: { $in: groupsArray },
            isReady:true
        }).lean();
        res.render("lab", { labs: labs });
    }
});

//create Lab page
router.get("/create", authenticate, teacher, (req, res) => {
    if (req.session.staff_id) res.render("teacher/lab/createLab");
    else res.status(404).end();
});

//Saving the Lab in db
router.post("/create", authenticate, teacher,teacher, async (req, res) => {
    const { error } = validateLab(req.body);
    if (error) return res.status(400).send(error.message);

    const createdBy = req.session.staff_id;
    let id = null;
    let lastInserted = await Lab.find({})
        .sort({ _id: -1 })
        .limit(1)
        .lean()
        .select("id");
    if (lastInserted[0]) {
        id = lastInserted[0].id;
        id++;
    } else {
        id = 1;
    }
    let url = req.body.name.trim().replace(/ /g, "-");
    let lastUrl = await Lab.find({
        name: new RegExp("^" + req.body.name.trim() + "$", "i"),
    })
        .sort({ _id: -1 })
        .limit(1)
        .lean()
        .select("url");
    if (lastUrl.length > 0) {
        let count = lastUrl[0].url.replace(url, "");
        if (count == "") url = url + "1";
        else {
            count = Number(count) + 1;
            url = url + count;
        }
    }
    let lab = new Lab({
        createdBy: createdBy,
        id: id,
        name: req.body.name.trim(),
        url: url,
    });

    lab.timings.created = moment().format();
    lab.description = req.body.description;
    lab.createdByName = req.session.fname + " " + req.session.lname;
    no_of_image = config.get("no_of_contest_images");
    lab.image =
        "/contestImage/" + Math.floor(Math.random() * no_of_image) + ".jpg";

    await lab.save();
    res.send(lab);
});

//allowing a group to participate in lab
router.post("/group/allow/:url", authenticate, teacher,labAuth, async (req, res) => {
    const lab = res.locals.lab;

    if (req.body.selectedList) {
        lab.customGroup = lab.customGroup.concat(req.body.selectedList);
        await lab.save();
        res.send("Group added to this Lab!");
    } else return res.status(400).send("No group selected!");
});

//removing a group from lab
router.get("/group/remove/:url/:id", authenticate,teacher,labAuth,async (req, res) => {
        const lab = res.locals.lab;

        const i = lab.customGroup.findIndex((i) => {
            return i.id == req.params.id;
        });
        if (!i) return res.status(400).send("Group not exisiting in this lab.");

        lab.customGroup.splice(i, 1);
        await lab.save();

        res.send("Group removed");
    }
);

// list the labs made by teacher
router.get("/manage", authenticate, teacher, async (req, res) => {
    let page = 1;
    if (Number.isNaN(req.query.page) || !req.query.page || req.query.page < 1)
        page = 1;
    else page = req.query.page;
    let count = 0;
    if (req.session.isAdmin) {
        const lab = await Lab
            .find()
            .lean()
            .sort({ _id: -1 })
            .skip((page - 1) * 12)
            .limit(12);
        count = await Lab.estimatedDocumentCount();
        return res.render("teacher/lab/manageList", {
            lab: lab,
            count: count,
            page: page,
        });
    }

    let labTeacher = await Lab.find({ $or:[{createdBy: req.session.staff_id},{custom_staff_id:req.session.staff_id}] })
        .lean()
        .sort({ _id: -1 })
        .skip((page - 1) * 12)
        .limit(12);
    count = await Lab.countDocuments({ $or:[{createdBy: req.session.staff_id},{custom_staff_id:req.session.staff_id}] });
    if (labTeacher.length <= 0) labTeacher = [];
    res.render("teacher/lab/manageList", {
        lab: labTeacher,
        count: count,
        page: page,
    });
});

//teacher manage lab
router.get("/manage/:url", authenticate, teacher,labAuth, async (req, res) => {
    const lab  = res.locals.lab;

    let custom = await CustomGroup.find({
        id: { $in: lab.customGroup },
    }).lean();
    if (!custom) custom = [];

    let questions = await LabQ.find({qid:{$in:lab.questions}}).lean();


    // for (i of lab.questions) {
    //     let points = 0;
    //     let q = await LabQ.findOne({ qid: i }).lean();
    //     for (i of q.test_cases) {
    //         points += i.points;
    //     }
    //     q.totalPoints = points;
    //     questions.push(q);
    // }


    let questionNo = [];
    let totalNoOfSubs = 0;
    for (i of questions) {
        questionNo.push({
            qid: i.qid,
            name: i.name,
            Accepted: Number(i.submissions.filter(e => e.status == "Accepted").length),
            Pending: Number(i.submissions.filter(e => e.status == "Pending").length),
            Wrong_Answer: Number(i.submissions.filter(e => e.status == "Wrong Answer").length),
        });

        totalNoOfSubs +=i.submissions.length;
    }

    // for (i of lab.submissions) {
    //     if (i.status === "Accepted") {
    //         const index = questionNo.findIndex((j) => j.qid === i.qid);
    //         questionNo[index].Accepted++;
    //     } else if (i.status === "Partially Accepted") {
    //         const index = questionNo.findIndex((j) => j.qid === i.qid);
    //         questionNo[index].Partially_Accepted++;
    //     } else {
    //         const index = questionNo.findIndex((j) => j.qid === i.qid);
    //         questionNo[index].Wrong_Answer++;
    //     }
    // }

    
    return res.render("teacher/lab/manageLab", {
        lab: lab,
        questions: questions,
        totalNoOfSubs : totalNoOfSubs,
        questionNo: questionNo,
        custom: custom,
    });
});

//teacher editing existing contest
router.post("/manage/:url", authenticate,teacher ,labAuth, async (req, res) => {
    const { error } = validateLab(req.body);
    if (error) return res.status(400).send(error.message);

    const lab = await Lab.findOne({ url: req.params.url });
    if (!lab) return res.status(404);

    lab.name = req.body.name;
    lab.description = req.body.description;
    lab.year = req.body.year || [];
    lab.isReady = req.body.status == "on" ? true : false;

    await lab.save();

    res.send("Changes saved!");
});

//adding question to lab
router.post("/add/:url", authenticate,teacher ,labAuth, async (req, res) => {
    const lab = await Lab.findOne({ url: req.params.url });
    if (!lab) return res.status(404);

    const { error } = validateLQ(req.body);
    if (error) return res.status(400).send(error.message);
    let count = 0;
    const date = moment().format("DDMMYY");
    let lastInserted = await LabQ.find({ qid: new RegExp("^" + date) })
        .sort({ _id: -1 })
        .limit(1)
        .lean()
        .select("qid");
    if (lastInserted.length > 0) {
        count = lastInserted[0].qid.replace(date, "");
    }
    let question = new LabQ();
    question.name = req.body.name;
    const starts = new Date(req.body.timings.split("-")[0]);
    const ends = new Date(req.body.timings.split("-")[1]);
    if (starts >= ends) return res.status(400).send("Incorrect timings");
    question.timings.ends = ends;
    question.timings.starts = starts;
    question.statement = decodeURIComponent(req.body.statement);
    question.constraints = req.body.constraints;
    question.input_format = req.body.i_format;
    question.output_format = req.body.o_format;
    question.description = req.body.description;
    question.difficulty = req.body.difficulty;
    question.autoJudge = req.body.judging;
    question.autoApproval = req.body.autoApproval;
    question.active = (req.body.active == "on"?true:false);

    if (Array.isArray(req.body.i_sample1)) {
        for (let i = 0; i < req.body.i_sample1.length; i++) {
            question.sample_cases.push({
                input: req.body.i_sample1[i],
                output: req.body.o_sample1[i],
            });
        }
    } else {
        question.sample_cases.push({
            input: req.body.i_sample1,
            output: req.body.o_sample1,
        });
    }

    if (Array.isArray(req.body.i_testcase1)) {
        for (let i = 0; i < req.body.i_testcase1.length; i++) {
            question.test_cases.push({
                input: req.body.i_testcase1[i],
                output: req.body.o_testcase1[i],
                points: req.body.points[i],
            });
        }
    } else {
        question.test_cases.push({
            input: req.body.i_testcase1,
            output: req.body.o_testcase1,
            points: req.body.points,
        });
    }

    question.explanation = req.body.explanation;
    question.qid = date + ++count;
    if (Array.isArray(req.body.languages)) {
        question.languages = req.body.languages;
    } else {
        question.languages = [req.body.languages];
    }
    await question.save();

    lab.questions.push(question.qid);
    await lab.save();

    res.status(200).send("Question added successfully");
});

//getting a question to edit
router.get("/edit/:url/:qid", authenticate, teacher,labAuth, async (req, res) => {
    const lab = res.locals.lab;

    const question = await LabQ.findOne({ qid: req.params.qid }).lean();
    if (!question) return res.status(400).send("Invalid ID");

    res.send(question);
});

//editing questions
router.post("/edit/:url/:qid", authenticate, teacher, labAuth,async (req, res) => {
    const { error } = validateLQ(req.body);
    if (error) return res.status(400).send(error.message);

    const lab = res.locals.lab;

    if (!lab.questions.includes(req.params.qid))
        return res.status(400).send("Invalid ID");

    const question = await LabQ.findOne({ qid: req.params.qid });
    if (!question) return res.status(400).send("Invalid ID");

    question.name = req.body.name;
    const starts = new Date(req.body.timings.split("-")[0]);
    const ends = new Date(req.body.timings.split("-")[1]);
    if (starts >= ends) return res.status(400).send("Incorrect timings");
    question.timings.ends = ends;
    question.timings.starts = starts;
    question.statement = decodeURIComponent(req.body.statement);
    question.constraints = req.body.constraints;
    question.input_format = req.body.i_format;
    question.output_format = req.body.o_format;
    question.description = req.body.description;
    question.difficulty = req.body.difficulty;
    question.autoJudge = req.body.judging;
    question.autoApproval = req.body.autoApproval;
    question.active = (req.body.active == "on"?true:false);

    question.sample_cases = [];
    question.test_cases = [];

    if (Array.isArray(req.body.i_sample1)) {
        for (let i = 0; i < req.body.i_sample1.length; i++) {
            question.sample_cases.push({
                input: req.body.i_sample1[i],
                output: req.body.o_sample1[i],
            });
        }
    } else {
        question.sample_cases.push({
            input: req.body.i_sample1,
            output: req.body.o_sample1,
        });
    }

    if (Array.isArray(req.body.i_testcase1)) {
        for (let i = 0; i < req.body.i_testcase1.length; i++) {
            question.test_cases.push({
                input: req.body.i_testcase1[i],
                output: req.body.o_testcase1[i],
                points: req.body.points[i],
            });
        }
    } else {
        question.test_cases.push({
            input: req.body.i_testcase1,
            output: req.body.o_testcase1,
            points: req.body.points,
        });
    }

    question.explanation = req.body.explanation;

    
    if (Array.isArray(req.body.languages)) {
        question.languages = req.body.languages;
    } else {
        question.languages = [req.body.languages];
    }
    await question.save();

    res.send("Changes Saved Successfully.");
});

//get list of all teacher
router.get('/teachers/all/:url',authenticate,teacher,labAuth,async (req,res)=>{
    const lab = res.locals.lab;

    let teachers = await Teacher.find({staff_id:{$ne:lab.createdBy}}).lean().select('fname lname staff_id -_id').sort({staff_id:1});
    if(!teachers) return res.send([]);

    for(i of teachers)
    {   
      i.select = '<input type="checkbox" '+(lab.custom_staff_id.includes(i.staff_id.toString())?'checked':'') +' name="teacherListCustom" value="'+i.staff_id+'" >';
      i.name = i.fname +" "+i.lname;
      delete i.fname;
      delete i.lname;
    }
    res.send(teachers);
});

//retreive teachers given access in a lab
router.get('/teachers/:url',authenticate,teacher,labAuth,async (req,res) =>{
   const lab = res.locals.lab;

    let teachers = await Teacher.find({staff_id:{$in:lab.custom_staff_id}}).lean().select({staff_id:1,fname:1,lname:1,_id:0});
    if(!teachers) teachers=[];

    return res.send(teachers);

});

//adding teachers to lab
router.post('/teachers/:url',authenticate,teacher,labAuth,async (req,res) =>{
    const lab = await Lab.findOne({url:req.params.url}).select('custom_staff_id');
    if(!lab) return res.status(404).end();
    lab.custom_staff_id = (req.body.teacherListCustom?req.body.teacherListCustom:[]);
    await lab.save();
    res.send("Teachers Added");
    
});

//adding rules to lab
router.post('/rules/:url',authenticate,teacher,labAuth,async (req,res)=>{
    const lab = await Lab.findOne({url:req.params.url}).select('rules');
    if(!lab) return res.status(404);

    lab.rules =req.body.rules || '';
    await lab.save();
    res.send("Rules saved!");
});

//deleting a lab
router.get('/delete/:url',authenticate,admin,async (req,res) => {
    const lab = await Lab.findOne({url:req.params.url}).lean();
    if(!lab) return res.status(400).send("Some error occured!");

    await Lab.findOneAndDelete({url:req.params.url}).then(async ()=>{
        await LabQ.deleteMany({qid:{$in:lab.questions}});
        return res.send("Lab deleted");
    } )
    .catch((err)=>{ winston.error(err);
        return res.status(400).send("Error! Unable to delete this lab.");
    });
});


//deleting a question
router.get('/delete/:url/:qid',authenticate,teacher,labAuth,async (req,res)=>{

    const lab = await Lab.findOne({url:req.params.url}).select('questions');
    if(!lab) return res.status(404);

    if(!lab.questions.includes(req.params.qid)) return res.status(400).send("Invalid ID");
    
    lab.questions.splice(lab.questions.indexOf(req.params.qid),1);
    await lab.save();

    await LabQ.findOneAndDelete({qid:req.params.qid});

    res.send("Question deleted.");
});


//adding solution to a question in contest
router.get('/solution/:url/:qid',authenticate,labAuth,async (req,res)=>{
    const lab = res.locals.lab;

    if(!lab.questions.includes(req.params.qid)) return res.status(400).send("Invalid ID");

    const question = await LabQ.findOne({qid:req.params.qid}).lean().select('solution active');
    if(!question) return res.status(400).send("Invalid ID");

    if(req.session.staff_id || question.active)
        if(question.solution) res.send(question.solution);
        else res.send('No solutions yet!');
    else
    res.status(404).end();

});

router.post('/solution/:url/:qid',authenticate,teacher,labAuth, async (req,res)=>{
    const lab = res.locals.lab;

    if(!lab.questions.includes(req.params.qid)) return res.status(400).send("Invalid ID");

    const question = await LabQ.findOne({qid:req.params.qid}).select('solution');
    if(!question) return res.status(400).send("Invalid ID");

    question.solution.language = req.body.language;
    question.solution.sourceCode = req.body.sourceCode;
    question.save();
    res.send("Saved");

});


//fetching source code
function lang(l){
    switch (l){
        case 50 : return "C50";
        case 54 : return "C++54";
        case 51 : return "C#51";
        case 62 : return "Java62";
        case 63 : return "Javascript63";
        case 71 : return "Python71";
    }   
}

router.get('/source/:url/:qid',authenticate,labAuth,async (req,res) =>{
    
    const lab = res.locals.lab;

    if(!lab.questions.includes(req.params.qid)) return res.status(400).send("Invalid ID");
    const question = await LabQ.findOne({qid:req.params.qid}).lean();
    
    let source=[];
    const usn = req.session.usn || req.session.staff_id;
    if(req.query.lang){
        let submission = question.submissions.find( sub => {return sub.usn == usn && sub.language_id == req.query.lang});
        if(!submission) submission=[];

        source = source.concat(submission);
        if(req.session.lab){
            const index = req.session.lab.findIndex(i => {return i.url == req.params.url && i.qid == req.params.qid && i.lang == req.query.lang})
            if(index != -1)
            source = source.concat(req.session.lab[index])
        }
        if(source.length == 0){ let sC=""
            if(config.has(`source.${req.query.lang}`)){
                sC = config.get(`source.${req.query.lang}`);
            }
            source=[{sourceCode:sC}];
            return res.send(source);
        }
    }
    else{
        let submission = question.submissions.find( sub => {return sub.usn == usn && sub.language_id == req.query.lang});
        if(!submission) submission=[];
        else submission.language_id = lang(submission.language_id);
        return res.send([submission]);
    }
  
    res.send(source.sort((a,b)=>(a.timestamp>b.timestamp)?1:-1));
});

router.post('/source/:url/:qid',authenticate,labAuth,async (req,res)=>{
    const lab = res.locals.lab;

    if(!lab.questions.includes(req.params.qid)) return res.status(400).send("Invalid ID");
    
    req.body.sourceCode = req.body.sourceCode.substr(0,req.body.sourceCode.length-18);
    if(req.body.sourceCode == '') return res.send('');
    if(req.session.lab){
        const found = req.session.lab.findIndex(i =>{return i.qid == req.params.qid && i.url == req.params.url && i.lang == req.body.lang.substr(req.body.lang.length-2) });
        if(found!=-1){
            req.session.lab[found].sourceCode = req.body.sourceCode;
            req.session.lab[found].timestamp = new Date();
        }
        else{
            let obj = {};
            obj.url = req.params.url;
            obj.qid=req.params.qid;
            obj.lang = req.body.lang.substr(req.body.lang.length-2);
            obj.sourceCode = req.body.sourceCode;
            obj.timestamp = new Date();
            req.session.lab.push(obj);
        }
    }
    else{
        let obj = {};
        obj.url = req.params.url;
        obj.qid=req.params.qid;
        obj.lang = req.body.lang.substr(req.body.lang.length-2);
        obj.sourceCode = req.body.sourceCode;
        obj.timestamp = new Date();
        req.session.lab = [];
        req.session.lab.push(obj);
    }

    res.send('');
});

//individual student's source code
router.get('/source/:url/:qid/:usn',authenticate,teacher,labAuth,async (req,res) =>{
    
    const lab = res.locals.lab;

    if(!lab.questions.includes(req.params.qid)) return res.status(400).send("Invalid ID");
    const question = await LabQ.findOne({qid:req.params.qid}).lean();
    
    const sourceCode = question.submissions.find(e => e.usn==req.params.usn).sourceCode;

    res.send(sourceCode);
});



//landing page for lab
router.get("/:url", authenticate, labAuth, async (req, res) => {
    const lab = res.locals.lab;

    const questions = await LabQ.find({ qid: { $in: lab.questions },active:true }).lean();

    if (req.session.isTeacher) {
        res.render("teacher/lab/qdisplayLab", { lab: lab, questions });
    } else {
        res.render("qdisplayLab", { lab: lab, questions });
    }
});

//submissions pug
router.get('/:url/:qid/submissions',authenticate,teacher,labAuth,async (req,res)=>{
    const lab = res.locals.lab;

    //fetching question
    if(!lab.questions.includes(req.params.qid)) return res.status(404).end();
    const question = await LabQ.findOne({qid:req.params.qid}).lean();

    //render pug
    return res.render('teacher/lab/submission',{lab,question});
});

//fetching submissions
router.get('/:url/:qid/submissions/all',authenticate,teacher,labAuth, async (req,res) =>{
    const lab = res.locals.lab;
    //fetching question
    if(!lab.questions.includes(req.params.qid)) return res.status(404).end();
    const question = await LabQ.findOne({qid:req.params.qid}).lean();

    let students = [];
    for(i of question.submissions){
        students.push(i.usn);
    }
    
    let studentData = {};

    let result = await Student.find({usn:{$in:students}}).select('usn fname lname -_id').lean();
    if(!result) result = [];
    else{
        for (i of result)
            studentData[i.usn] = i;
    }

    let SendData=[];
    for(i of question.submissions){
        let data={};
        data.usn = i.usn;
        data.name = studentData[i.usn].fname + " " + studentData[i.usn].lname;
        data.code = '<a data-toggle="modal" data-target="#source" data-usn="'+i.usn+'" data-qid="'+req.params.qid +'" href="#">View Code</a>';
        data.time ={timestamp:moment(i.timestamp).format('x'),display:moment(i.timestamp).format('LLL')};
        if(i.status == "Pending")
            data.evaluate = `<a href="/lab/${lab.url}/${question.qid}/evaluate/${i.usn}" target="_blank">Evaluate</a>`;
        else data.evaluate="";
        data.status = i.status;
        const l = lang(i.language_id);
        data.lang = l.substr(0,l.length-2); 
        SendData.push(data);
    }
    res.send(SendData);
});


//Evaluating submission
router.get('/:url/:qid/evaluate/:usn',authenticate,teacher,labAuth,async (req,res)=>{
    const lab = res.locals.lab;

    //fetching question
    if(!lab.questions.includes(req.params.qid)) return res.status(404).end();
    const question = await LabQ.findOne({qid:req.params.qid}).lean();

    const submission = question.submissions.find(e => e.usn == req.params.usn);
    
    res.render('teacher/lab/evaluation',{lab,question,submission});
});

//viewing question
router.get('/:url/:qid',authenticate,labAuth,async (req,res)=>{
    const lab = res.locals.lab;
    
    if(!lab.questions.includes(req.params.qid)){
        return res.status(404).end();
    }
    let question = await LabQ.findOne({qid:req.params.qid,active:true}).lean();
    if(!question)  return res.status(404).end();

    
    if(!(lab.createdBy == req.session.staff_id || req.session.isAdmin || question.timings.starts < new Date()))
    return res.status(404).end();
    
    return res.render('editorLab',{question ,lab})

});

//submission route
router.post('/:url/:qid',authenticate,labAuth,async (req,res)=>{
    const lab = res.locals.lab;

    //fetching question
    if(!lab.questions.includes(req.params.qid)) return res.status(404).end();
    
    let question;
    if(req.session.staff_id){
        question = await LabQ.findOne({qid:req.params.qid}).lean();
    }else{
        question = await LabQ.findOne({qid:req.params.qid,active:true,'timings.ends':{$gt:new Date()}});
    }
    if(!question)  return res.status(404).end();


    //Checking for unauthorized submissions
    if(req.body.source.substr(req.body.source.length-18) == "undefinedundefined")
    req.body.source = req.body.source.substr(0,req.body.source.length-18);
    else
    return res.status(401).send("Unauthorized");
    if(!question.languages.includes(req.body.language.toString()))
        return res.status(400).send("Not permitted to submit in this language!");

    if(req.body.source.trim()=='')
    return res.send("Source Code cannot be empty!");


    //inserting a submission
    function insertSubmission(submission){
        const index = question.submissions.findIndex(item => {return item.usn == submission.usn});
    
        if(index!=-1){
            question.submissions.splice(index,1);
        }
        question.submissions.push(submission);
    }
    
    
    //storing submission based on the settings
    if(question.autoJudge){ //testcase judging by api
        
        let result = [];    
        const testcase = question.test_cases;
        let compiler_opt = null;
        if (req.body.language == 50){
            compiler_opt = "-lm";
        }

        for(let i=0;i<testcase.length;i++){
            let options = { method: 'POST',
            url: 'http://127.0.0.1:3000/submissions?base64_encoded=true&wait=true',
            body: { "source_code": encode64(req.body.source), "language_id": req.body.language, "stdin":encode64(testcase[i].input),
                    "expected_output":encode64(testcase[i].output) ,"compiler_options":compiler_opt},
            json: true };

            result.push(request(options));

        }

        Promise.all(result)
            .then(async (data) => {
                let desc= [];
                wrong = false;
                data.forEach(store);
                function store(data,index){ let points=0;
                    if(data.status.id != 3){
                        wrong = true;
                    }
                    desc.push({id:data.status.id,description:data.status.description}); 
                }

                if(req.session.staff_id){
                    return res.send(desc);
                }

                let submission = {};
                submission.usn = req.session.usn;
                submission.timestamp = new Date();
                submission.language_id = req.body.language;
                submission.sourceCode = req.body.source;

                if(wrong){
                    submission.status = "Wrong Answer";
                }
                else{
                    submission.status = "Accepted";
                }

                insertSubmission(submission);
                question.save();

                return res.send(desc);
            }).catch(err => {
                winston.error(err);
              res.send(err);
            });

    }
    else if(question.autoApproval){ // by default accept

        let submission = {};
        submission.usn = req.session.usn;
        submission.timestamp = new Date();
        submission.language_id = req.body.language;
        submission.sourceCode = req.body.source;
        submission.status = "Accepted";

        insertSubmission(submission);
        question.save();
        return res.send("Submitted");
    }
    else{ //manually approve

        let submission = {};
        submission.usn = req.session.usn;
        submission.timestamp = new Date();
        submission.language_id = req.body.language;
        submission.sourceCode = req.body.source;
        submission.status = "Pending";

        insertSubmission(submission);
        question.save();
        return res.send("Submission made.");
    }

});


module.exports = router;