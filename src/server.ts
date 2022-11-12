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
    const config = {
        /* Your settings here like Accept / Headers etc. */
    };
    axios.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=25&key=${process.env.API_KEY}`, config)
        .then(function (response: AxiosResponse) {
        console.log(response.data);
        console.log(response.status);
        console.log(response.statusText);
        console.log(response.headers);
        console.log(response.config);
    });
    res.redirect('/')    
});

app.get('/get-google-id',function(req:express.Request, res:express.Response){
    if(req.user != undefined){
        console.log(req.user.id);
        res.json({googleId: req.user.id});
    }
})

app.post('/insert-user-data', function(req,res){
    // google_id 존재 여부 체크
    db.query(`select EXISTS (select google_id from user_info where google_id=${req.body.googleId} limit 1) as success`, function (error, results, fields) {
        if (error)
            throw error;
        if(results[0].success==0){
            // user_info에 사용자 새로 추가
            db.query(`INSERT INTO user_info(googleId,name,age) VALUES(?,?,?)`,[req.body.googleId, req.body.name, req.body.age] ,function (error, results, fields) {
                if (error)
                    throw error;
                console.log(`A new tuple inserted : ( ${req.body.googleId}, ${req.body.name}, ${req.body.age})`);
                res.status(200);
            });
        }else{
            // user_info의 기존 사용자 정보 수정
            db.query(`UPDATE user_info SET name=?, age=? WHERE google_id=?`, [req.body.name, req.body.age, req.body.googleId], function (error, results, fields) {
                if (error)
                    throw error;
                res.status(200);
            });
        }
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
    db.query(`SELECT * FROM user_info WHERE google_id=?`,[req.user?.id],function(err,result){
        res.json(result[0])
    })
})

app.listen(port, function () {
    // db.connect();
    console.log(`listening to ${port}`);
});
