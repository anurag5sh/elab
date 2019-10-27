const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');


router.get('/',authenticate, (req,res)=> {
    res.render('contest');
});

module.exports = router;