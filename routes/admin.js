const express = require('express');
const router = express.Router();
const admin = require('../middleware/admin');


router.get('/', admin, (req,res)=> {
    res.render('navbar',{name:req.session.name});
});

module.exports = router;