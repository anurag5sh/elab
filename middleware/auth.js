module.exports= function (req, res, next) {
    if (req.session && (req.session.usn || req.session.staff_id)) {
      return next();
    } else {
      var err = new Error('You must be logged in to view this page.');
      err.status = 401;
      return res.send(err.message);
    }
  }
