import express from 'express';
import passport from 'passport';
import session from 'express-session';
import * as expressSession from 'express-session';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import axios from 'axios';
import { googleRouter } from './routes/google';
import { youtubeRouter } from './api/youtube_api';
import passportConfig from './passport';
import { connection } from './lib/mysql';
import cors from "cors";
import MySQLStore from 'express-mysql-session';
dotenv.config();
passportConfig();
const app = express();
const db = connection;
const mysqlStore = MySQLStore(expressSession);
const session_options = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PW,
    database: process.env.DB_NAME
};
const sessionStore = new mysqlStore(session_options);
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    store: sessionStore,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());

app.use("/auth/google", googleRouter);
app.use("/youtube", youtubeRouter);

app.use(cors({ origin: 'http://localhost:3000'}));
app.get('/', function (req, res) {
    res.send('home');
});
app.get('/get-data', function (req, res) {
    const config = {
    /* Your settings here like Accept / Headers etc. */
    };
    axios.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=25&key=${process.env.API_KEY}`, config)
        .then(function (response) {
        console.log(response.data);
        console.log(response.status);
        console.log(response.statusText);
        console.log(response.headers);
        console.log(response.config);
    });
    res.redirect('/');
});
app.get('/get-google-id', function (req, res) {
    if (req.user != undefined) {
        console.log(req.user.id);
        res.json({ googleId: req.user.id });
    }
});
app.post('/insert-userdata', function (req, res) {
    db.query(`INSERT INTO user_info(googleId,name,age) VALUES(?,?,?)`,[req.body.googleId, req.body.name, req.body.age] ,function (error, results, fields) {
        if (error)
            throw error;
        console.log(`A new tuple inserted : ( ${req.body.googleId}, ${req.body.name}, ${req.body.age})`);
        res.status(200);
    });
});

app.get('/match',function(req,res){
    db.query(`SELECT * FROM user_info`, function (error, results, fields) {
        if (error)
            throw error;
        res.send({
            allOtherUsers: results,
            mlResult: ["123", "456"]
        });
    });
})

app.get('/get-currentUserData',function(req,res){
    db.query(`SELECT * FROM user_info WHERE googleID=?`,[req.user?.id],function(err,result){
        res.json(result[0])
    })
})


app.listen(process.env.PORT, function () {
    db.connect();
    console.log(`listening to ${process.env.PORT}`);
});
