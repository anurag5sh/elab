const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');


router.get('/',authenticate, (req,res)=> {
    res.render('contest');
});

//teacher creates contest 
//auth : pending
router.get('/create',(req,res) => {
    res.render('createContest');
});

//teacher manage contest
router.get('/manage/:id',(req,res) => {
    res.render('manageContest');
});

//viewing list of question
router.get('/:curl',(req,res) =>{

});

//viewing question
router.get('/:curl/:id',(req,res)=>{

});

router.get('/')
module.exports = router;