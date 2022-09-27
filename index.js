"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const app = express();
app.use("/router", require("./routes/routes"));
app.listen('8080', function () {
    console.log("listening to 8080");
});
app.get('/', function (req, res) {
    res.send('home');
});
