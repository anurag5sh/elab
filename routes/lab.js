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

router.get("/", authenticate, async (req, res) => {
    if (req.session.staff_id) {
        let labs;
        if (req.session.isAdmin) {
            labs = await Lab.find().lean();
        } else {
            labs = await Lab.find({ createdBy: req.session.staff_id }).lean();
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
router.post("/create", authenticate, teacher, async (req, res) => {
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
router.post("/group/allow/:url", authenticate, teacher, async (req, res) => {
    let lab = await Lab.findOne({ url: req.params.url }).select("customGroup");
    if (!lab) return res.status(400).send("Lab not found");

    if (req.body.selectedList) {
        lab.customGroup = lab.customGroup.concat(req.body.selectedList);
        await lab.save();
        res.send("Group added to this Lab!");
    } else return res.status(400).send("No group selected!");
});

//removing a group from lab
router.get(
    "/group/remove/:url/:id",
    authenticate,
    teacher,
    async (req, res) => {
        const lab = await Lab.findOne({ url: req.params.url }).select(
            "customGroup"
        );
        if (!lab) return res.status(400).send("Invalid ID");

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
        const lab = await lab
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

    let labTeacher = await Lab.find({ createdBy: req.session.staff_id })
        .lean()
        .sort({ _id: -1 })
        .skip((page - 1) * 12)
        .limit(12);
    count = await Lab.countDocuments({ createdBy: req.session.staff_id });
    if (labTeacher.length <= 0) labTeacher = [];
    res.render("teacher/lab/manageList", {
        lab: labTeacher,
        count: count,
        page: page,
    });
});

//teacher manage lab
router.get("/manage/:name", authenticate, teacher, async (req, res) => {
    let lab = await Lab.findOne({ url: req.params.name }).lean();
    if (!lab) return res.status(404).end();

    let custom = await CustomGroup.find({
        id: { $in: lab.customGroup },
    }).lean();
    if (!custom) custom = [];

    let questions = [];
    for (i of lab.questions) {
        let points = 0;
        let q = await LabQ.findOne({ qid: i }).lean();
        for (i of q.test_cases) {
            points += i.points;
        }
        q.totalPoints = points;
        questions.push(q);
    }

    let submissions = [0, 0, 0, 0, 0];
    for (i of lab.submissions) {
        if (i.year == "-") submissions[4]++;
        submissions[i.year - 1]++;
    }

    let questionNo = [];
    for (i of questions) {
        questionNo.push({
            qid: i.qid,
            name: i.name,
            Accepted: 0,
            Partially_Accepted: 0,
            Wrong_Answer: 0,
        });
    }

    for (i of lab.submissions) {
        if (i.status === "Accepted") {
            const index = questionNo.findIndex((j) => j.qid === i.qid);
            questionNo[index].Accepted++;
        } else if (i.status === "Partially Accepted") {
            const index = questionNo.findIndex((j) => j.qid === i.qid);
            questionNo[index].Partially_Accepted++;
        } else {
            const index = questionNo.findIndex((j) => j.qid === i.qid);
            questionNo[index].Wrong_Answer++;
        }
    }

    let stats = { submissions: submissions };
    if (lab.createdBy == req.session.staff_id || req.session.isAdmin)
        return res.render("teacher/lab/manageLab", {
            lab: lab,
            questions: questions,
            stats: stats,
            questionNo: questionNo,
            custom: custom,
        });
    else return res.status(404).end();
});

//teacher editing existing contest
router.post("/manage/:name", authenticate, teacher, async (req, res) => {
    const { error } = validateLab(req.body);
    if (error) return res.status(400).send(error.message);

    let lab = await Lab.findOne({ url: req.params.name });
    if (!lab) return res.status(400).send("Contest Ended!");

    if (!req.session.isAdmin) {
        if (lab.timings.ends < new Date()) {
            return res.status(400).send("Lab Ended!");
        }
    }

    if (!(lab.createdBy == req.session.staff_id || req.session.isAdmin))
        return res.status(400).send("Cannot edit this contest");
    
    lab.name = req.body.name;
    lab.description = req.body.description;
    lab.year = req.body.year || [];
    lab.isReady = req.body.status == "on" ? true : false;

    await lab.save();

    res.send("Changes saved!");
});

//adding question to lab
router.post("/add/:url", authenticate, teacher, async (req, res) => {
    const lab = await Lab.findOne({ url: req.params.url });
    if (!lab) return res.status(404);

    if (lab.timings.ends < new Date())
        return res
            .status(400)
            .send("Cannot add a question after contest has ended.");
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
router.get("/edit/:url/:qid", authenticate, teacher, async (req, res) => {
    const lab = await Lab.findOne({ url: req.params.url })
        .lean()
        .select("questions");
    if (!lab) return res.status(404).send("Contest not found!");

    const question = await LabQ.findOne({ qid: req.params.qid }).lean();
    if (!question) return res.status(400).send("Invalid ID");

    res.send(question);
});

//editing questions
router.post("/edit/:url/:qid", authenticate, teacher, async (req, res) => {
    const { error } = validateLQ(req.body);
    if (error) return res.status(400).send(error.message);

    const lab = await Lab.findOne({ url: req.params.url })
        .lean()
        .select("questions timings");
    if (!lab) return res.status(404);

    if (lab.timings.ends < new Date())
        return res
            .status(400)
            .send("Cannot edit a question after lab has ended.");
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

    if (question.autoJudge) {
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
    }
    
    if (Array.isArray(req.body.languages)) {
        question.languages = req.body.languages;
    } else {
        question.languages = [req.body.languages];
    }
    await question.save();

    res.send("Changes Saved Successfully.");
});

//get list of all teacher
router.get('/teachers',authenticate,teacher,async (req,res)=>{
    if (isNaN(req.query.id)) return res.status(404).end();
    const lab = await Lab.findOne({id:req.query.id}).lean().select('custom_staff_id createdBy -_id');
    if(!lab) return res.status(400).end();

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
router.get('/teachers/id/:id',authenticate,teacher,async (req,res) =>{
    const lab = await Lab.findOne({id:req.params.id}).lean().select('custom_staff_id -_id');
    if(!lab) return res.status(400).send("Invalid ID");

    let teachers = await Teacher.find({staff_id:{$in:lab.custom_staff_id}}).lean().select({staff_id:1,fname:1,lname:1,_id:0});
    if(!teachers) teachers=[];

    return res.send(teachers);

});

//adding teachers to lab
router.post('/teachers/:id',authenticate,teacher,async (req,res) =>{
    const lab = await Lab.findOne({id:req.params.id}).select('custom_staff_id');
    if(!lab) return res.status(400).send("Invalid ID");
    lab.custom_staff_id = (req.body.teacherListCustom?req.body.teacherListCustom:[]);
    await lab.save();
    res.send("Teachers Added");
    
});

//adding rules to lab
router.post('/rules/:url',authenticate,teacher,async (req,res)=>{
    const lab = await Lab.findOne({url:req.params.url}).select('rules');
    if(!lab) return res.status(404);

    lab.rules =req.body.rules || '';
    await lab.save();
    res.send("Rules saved!");
});


//landing page for lab
router.get("/:url", authenticate, labAuth, async (req, res) => {
    const lab = res.locals.lab;

    const questions = await LabQ.find({ qid: { $in: lab.questions } }).lean();

    if (req.session.isTeacher) {
        res.render("teacher/lab/qdisplayLab", { lab: lab, questions });
    } else {
        res.render("qdisplayLab", { lab: lab, questions });
    }
});


module.exports = router;
