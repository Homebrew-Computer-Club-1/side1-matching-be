import express = require('express');
import * as bodyParser from 'body-parser';

const app = express();

app.use("/router", require("./routes/routes"));

app.listen('8080', function(){
    console.log("listening to 8080");
});

app.get('/',function(req:express.Request, res:express.Response){
    res.send('home');
});
