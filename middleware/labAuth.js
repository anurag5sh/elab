const { Lab } = require("../models/lab");
const { CustomGroup } = require("../models/customGroup");

module.exports = async function (req, res, next) {
    const lab = await Lab.findOne({ url: req.params.url }).lean();
    if (!lab) return res.status(404).end();
    res.locals.lab = lab;
    if (req.session.staff_id) {
        if (req.session.isAdmin) return next();
        else {
            if (req.session.staff_id == lab.createdBy || lab.custom_staff_id.includes(String(req.session.staff_id))) next();
            else return res.status(404).end();
        }
    } else {
        if(!lab.isReady) return res.status(404).end();
        const groups = await CustomGroup.find({ id: { $in: lab.customGroup } })
            .lean()
            .select("usn -_id");
        let grp_usn = [];
        for (i of groups) {
            grp_usn = grp_usn.concat(i.usn);
        }

        if (grp_usn.includes(req.session.usn)) return next();
        else return res.status(404).end();
    }
};
