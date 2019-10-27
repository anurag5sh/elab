const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');


router.get('/',authenticate, (req,res)=> {
    res.render('example');
});

module.exports = router;