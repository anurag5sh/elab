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

//Saving the contest in db
router.post('/create', (req,res)=>{

});


//teacher manage contest
router.get('/manage/:id',(req,res) => {
    res.render
});

//landing page for contest
router.get('/:curl',(req,res) =>{

});

//viewing question
router.get('/:curl/:id',(req,res)=>{

});

router.get('/')
module.exports = router;