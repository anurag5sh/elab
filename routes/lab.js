const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {Student} = require('../models/student');
const {Teacher} = require('../models/teacher');
const admin = require('../middleware/admin');
const teacher = require('../middleware/teacher');
const fs = require('fs');
const request = require("request-promise");
const config = require('config');
const path = require('path');
const winston = require('winston');
const rimraf = require('rimraf');

router.get('/',authenticate, async (req,res)=> {
    if(req.session.staff_id){
        res.render('teacher/lab');
    }
    else{
        res.render('lab')
    }
});

module.exports = router;