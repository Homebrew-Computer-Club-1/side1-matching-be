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
import { ListFormat } from 'typescript';
import { MysqlError } from 'mysql';
import {IPassport} from './sessionType';

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

declare module 'express-session' {
    export interface SessionData {
      passport:IPassport
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

app.get('/login-check',function(req,res){
    if (req.session.passport){
        res.send({loggedIn:true})
    } else {
        res.send({loggedIn:false})
    }
})

app.get('/get-all-user-datas',function(req,res){
    db.query(`SELECT * FROM user_info`,function(err,allUserDatas){
        res.send(allUserDatas);
    })
})

type TgoogleId = string;

interface IyoutubeData {
    google_id: TgoogleId;
    like_data: string,
    subs_data: string
}
interface ImatchPostData {

}

interface ImlResult {
    [key :TgoogleId] : TgoogleId[];
}
interface IuserDataOnBE {
    google_id:TgoogleId;
    name:string;
    age:number;
}

app.get('/match', function(req,res){
    db.query(`SELECT * FROM youtube_data`, function (error: MysqlError|undefined, allYoutubeDatas:IyoutubeData[], fields: any) {
        if (error){
            throw error;
        }
        // 1. youtube 데이터 ML 서버 전송전 전처리
        const sendList = allYoutubeDatas.map(x => { 
            return {
                google_id : x.google_id,
                like_data: x.like_data,
                subs_data: JSON.parse(x.subs_data)
            };
        });
        // 2. ML 서버로 데이터 전송 => 매칭 결과 받아서 FE로 전송

        // axios.post(`${process.env.ML_URL}/result/matching`, sendData)
        // .then(response => {
        //     const mlResult : ImlResult = response.data;
        // });

        // 임시 코드
        db.query(`SELECT * FROM user_info`,function(err,allUserDatas : IuserDataOnBE[]){
            const result = allUserDatas.map(userData => {
                return userData.google_id
            });
            function shuffle(array : string[]) {
                return array.sort(() => Math.random() - 0.5);
            }
            res.send(shuffle(result));
        })

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


app.get('/get-current-user-data',function(req,res){
    console.log('getcurrentuserdata')
    db.query(`SELECT * FROM user_info WHERE google_id=?`,[req.user?.id],function(err,result){
        console.log(result[0])
        res.json(result[0])
    })
})

app.listen(port, function () {
    console.log(`listening to ${port}`);
});
