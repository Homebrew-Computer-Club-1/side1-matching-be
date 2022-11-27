import express from 'express';
import passport from 'passport';
import session from 'express-session'
import * as expressSession from 'express-session';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import {googleRouter} from './routes/google.js';
import {youtubeRouter, updateYoutubeLikes, updateYoutubeSubscriptions} from './api/youtube_api.js';
import passportConfig from './passport/index.js';
import {connection} from './lib/mysql.js'
import cors from "cors";
import MySQLStore from 'express-mysql-session';
import { MysqlError } from 'mysql';
import { user_tokens, tokenExists, updateToken } from './passport/googleStrategy.js';
import refresh from 'passport-oauth2-refresh';

import {IPassport} from './sessionType';
import { IuserDataOnBE, IyoutubeData } from './type/db_type.js';
import { CustomSubscription } from './type/server_type.js';

import path from "path";
import axios from 'axios';
import { youtubeMlResult } from './type/youtube_type.js';
const __dirname = path.resolve();
dotenv.config({path : path.join(__dirname, '../.env')});


passportConfig();

const port = process.env.PORT || 8080;
const app = express();
export const db=connection;
const mysqlStore = MySQLStore(expressSession);

app.set("trust proxy", 1);
const session_options = {
    host     : process.env.DB_HOST as string,
    user     : process.env.DB_USER as string,
    password : process.env.DB_PW as string,
    database : process.env.DB_NAME as string
}

const sessionStore = new mysqlStore(session_options);

app.use(session({
    secret: 'keyboard cat',
    resave: true,
    store: sessionStore,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
    }
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

app.use(express.static(path.join(__dirname, '/build_be/build_fe')));



app.use("/api",function(req,res,next){
    console.log(`req.user : ${req.user?.id}`)
    next();
})

app.use("/api/auth/google", googleRouter);
app.use("/api/youtube", youtubeRouter);
app.use(cors({
    credentials:true,
    origin: process.env.CLIENT_URL
}));



app.get('/api/login-check',function(req,res){
console.log('<logged in check logic>')
    if (req.session.passport){
        res.send({loggedIn:true})
    } else {
        res.send({loggedIn:false})
    }
})

app.get('/api/get-all-user-datas',function(req,res){
    db.query(`SELECT * FROM user_info`,function(err,allUserDatas){
        res.send(allUserDatas);
    })
})

// 어떤 용도의 데이터인지 파악 x

// interface ImlResult {
//     [key :TgoogleId] : TgoogleId[];
// }

// app.get('/api/match', function(req,res){
//     db.query(`SELECT * FROM youtube_data`, function (error: MysqlError|undefined, allYoutubeDatas:IyoutubeData[], fields: any) {
//         if (error){
//             throw error;
//         }
//         // 1. youtube 데이터 ML 서버 전송전 전처리
//         const sendList = allYoutubeDatas.map(x => { 
//             return {
//                 google_id : x.google_id,
//                 like_data: x.like_data,
//                 subs_data: JSON.parse(x.subs_data)
//             };
//         });
//         // 2. ML 서버로 데이터 전송 => 매칭 결과 받아서 FE로 전송

//         // axios.post(`${process.env.ML_URL}/result/matching`, sendData)
//         // .then(response => {
//         //     const mlResult : ImlResult = response.data;
//         // });

//         // 임시 코드
//         db.query(`SELECT * FROM user_info`,function(err: MysqlError|undefined,allUserDatas : IuserDataOnBE[]){

//             const result = allUserDatas.map(userData => {
//                 return userData.google_id
//             });
//             function shuffle(array : string[]) {
//                 return array.sort(() => Math.random() - 0.5);
//             }
//             res.send(shuffle(result));
//         })

//     });
// });

app.get('/api/logout',function(req,res){
console.log('<logout logic>')
    req.logout(function(){  
        req.session.destroy(()=>{
                // res.clearCookie('connect.sid');
            res.sendStatus(200);
        });
    });
})


app.get('/api/get-google-id',function(req:express.Request, res:express.Response){
    console.log('<get-google-id logic>',`req.user.id : ${req.user?.id}`)
        res.json({googleId: req.user?.id});
    // if(req.user != undefined){

    // }
})

app.post('/api/update-user-info', function(req,res){
    console.log('<updateuserinfo logic>')
    console.log(`1. req.body : ${JSON.stringify(req.body)}`)
        function reqBodyToQuery(reqBody : any){
            const reqBody_ = deleteGoogleId(reqBody);
            const keys = Object.keys(reqBody_);
            const query = String(keys.map(key => `${key}=?`))
            return query
        }
            function deleteGoogleId(reqBody : any){
                const newReqBody = {...reqBody}
                delete newReqBody.googleId
                return newReqBody;
            }
    db.query(`UPDATE user_info SET ${reqBodyToQuery(req.body)} WHERE google_id=?`, [...Object.values(deleteGoogleId(req.body)), req.body.googleId], function (error, results, fields) {
        if (error){
            // throw error;
        }
        console.log(`2. UPDATE db finished. result : ${JSON.stringify(results)}`)
        res.sendStatus(200);
    });
});


app.get('/api/get-current-user-data',function(req,res){
    console.log('getcurrentuserdata')
    db.query(`SELECT * FROM user_info WHERE google_id=?`,[req.user?.id],function(err,result){
        console.log(result[0])
        res.json(result[0])
    })
});

app.get('/api/update-tokens',function(req,res,next){
    // DB에서 가져온 google_token의 데이터 형식
    interface RefreshTokenData{
        google_id:string,
        refresh_token:string
    }

    // 비동기적 콜백 실행을 위한 함수
    function promiseNewAccessToken(token_data:RefreshTokenData){
        const error_msg = "access token is undefined";
        return new Promise((resolve, reject)=>{
            refresh.requestNewAccessToken(
                'google',
                token_data.refresh_token,
                function (err, accessToken, refreshToken) {
                    if(accessToken==undefined) reject(error_msg);
                    const user_id = token_data.google_id;
                    if(tokenExists(user_id)){
                        updateToken(user_id, accessToken);
                        console.log('inside: ' + user_tokens);
                    }else{
                        user_tokens.push({
                            id:user_id,
                            access_token:accessToken
                        });
                    }
                    resolve(true);
                }
            );
        });
    }

    db.query(`SELECT * FROM google_token`,async function(err, result){
        // 갱신 전 확인
        // console.log(user_tokens);

        if(err) throw err;
        // DB google_token에 있는 refresh token 으로 각각의 access token 저장(갱신) 
        for (const token_data of result){
            try{
                await promiseNewAccessToken(token_data);
            }catch(error){
                console.log(error);
            }
        }
        // 갱신 후 확인
        // console.log(user_tokens);
        res.send("Access Token 업데이트 성공.<br/>" + JSON.stringify(user_tokens)); 
    });
});

app.get('/api/update-youtube-data', async function(req,res){
    console.log(user_tokens);
    for (const token_data of user_tokens){
        console.log(token_data);
        const {id:id, access_token:token} = token_data;
        await updateYoutubeLikes(id,token);
        await updateYoutubeSubscriptions(id,token);
    }
    res.send('유튜브 데이터 갱신 성공');
});

app.get('/api/match', function(req,res){
    db.query(`SELECT * FROM youtube_data`,async function(err:MysqlError, result:IyoutubeData[]){
        if(err) throw err;
        let total_result : (string[])[]= [];
        // total_result.push();
        result.map(x=>{
            const subs_data:CustomSubscription[] = JSON.parse(x.subs_data);
            let cur_array:string[] = [];
            let subs_count = 0;
            cur_array.push(x.google_id);
            console.log("subscription data : \n",subs_data);
            subs_data.map(y=>{
                // console.log(y);
                if(y.topicIds==undefined) console.log("undefined topicIds : ",y);
                cur_array.push(...(y.topicIds));
                subs_count++;
            })
            cur_array.splice(1,0,subs_count.toString());
            total_result.push(cur_array);
        });
        axios.post(`${process.env.ML_URL}/result/matching`, total_result)
            .then(response => {
                const mlResult : youtubeMlResult = response.data;
            });
    });
    res.status(200);
});

app.get('/api',function(req:express.Request, res:express.Response){
    res.send('home');
});

// app.get('*', (req,res) =>{
//     res.sendFile(path.join(__dirname+'/build_be/build_fe/index.html'));
// });

app.listen(port, function () {
    console.log(`listening to ${port}`);
});
