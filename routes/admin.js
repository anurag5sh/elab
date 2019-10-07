const express = require('express');
const router = express.Router();
const admin = require('../middleware/admin');


router.get('/', admin, (req,res)=> {
    res.render('admin/admin',{name:req.session.name});
});

router.get('/add',admin, (req,res) => {
    res.render('admin/addAccount');
});


module.exports = router;