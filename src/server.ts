import express from 'express';
import passport from 'passport';
import session from 'express-session'
import * as expressSession from 'express-session';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import axios, {AxiosResponse} from 'axios';
import {googleRouter} from './routes/google.js';
import {youtubeRouter} from './api/youtube_api.js';
import passportConfig from './passport/index.js';
import {connection} from './lib/mysql.js'
import cors from "cors";
import MySQLStore from 'express-mysql-session';

dotenv.config();

passportConfig();

const port = process.env.PORT || 8080;
const app = express();
export const db=connection;
const mysqlStore = MySQLStore(expressSession);

const session_options = {
    host     : process.env.DB_HOST as string,
    user     : process.env.DB_USER as string,
    password : process.env.DB_PW as string,
    database : process.env.DB_NAME as string
}

const sessionStore = new mysqlStore(session_options);

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    store: sessionStore,
    saveUninitialized: true,
    cookie: { secure: false }
}));

declare global {
    namespace Express{
        interface User{
            id:string|undefined;
        }
    }
}

app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json())

app.use("/auth/google", googleRouter);
app.use("/youtube", youtubeRouter);
app.use(cors({ origin: `${process.env.CLIENT_URL}`}));

app.get('/',function(req:express.Request, res:express.Response){
    res.send('home');
});

app.get('/get-data', function(req,res){
    db.query(`SELECT * FROM youtube_data`, function (error, results, fields) {
        if (error){
            throw error;
        }
        res.send(results);
    });
});

app.get('/get-google-id',function(req:express.Request, res:express.Response){
    console.log('getgoogleid')
        console.log(req.user?.id);
        res.json({googleId: req.user?.id});
    // if(req.user != undefined){

    // }
})

app.post('/update-user-info', function(req,res){
    console.log('updateuserinfo')
    db.query(`UPDATE user_info SET name=?, age=? WHERE google_id=?`, [req.body.name, req.body.age, req.body.googleId], function (error, results, fields) {
        if (error){
            throw error;
        }
        console.log(req.body)
        console.log('executed')
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

app.get('/get-current-user-data',function(req,res){
    console.log('getcurrentuserdata')
    db.query(`SELECT * FROM user_info WHERE google_id=?`,[req.user?.id],function(err,result){
        console.log(result[0])
        res.json(result[0])
    })
})

app.listen(port, function () {
    // db.connect();
    console.log(`listening to ${port}`);
});
