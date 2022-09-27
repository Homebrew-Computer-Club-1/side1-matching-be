"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/route-1', function (req, res) {
    res.send('This is route-1');
});
module.exports = router;
