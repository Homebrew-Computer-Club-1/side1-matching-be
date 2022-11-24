import express from "express";
import dotenv from 'dotenv';
import passport from "passport";
import Google from "passport-google-oauth20";
import {db} from "../server.js";
import refresh from 'passport-oauth2-refresh';
const GoogleStrategy = Google.Strategy;

dotenv.config();

interface TokenData{
    id:string,
    access_token:string
}

export let user_tokens:TokenData[];
user_tokens=[];

export function tokenExists(id:string){
    return (user_tokens.find(x=>x.id==id)!=undefined);
}

export function updateToken(id:string, token:string){
    user_tokens.forEach(element=>{
        if(element.id==id){
            element.access_token=token;
        }
    });
}

export function checkToken(req:express.Request, res:express.Response, next:express.NextFunction){
    if(req.user!=undefined && req.user.id!=undefined){
        const user_id = req.user.id;
        if(tokenExists(user_id)){
            next();
        }else{
            res.render('Cannot execute query: Token is needed.');
        }
        
    }else{
        res.render('Cannot execute query: Login is needed.');
    }
}

// <google login logic>
export function google(){
    console.log('<google login logic>')
    // 1. process.env체크
    console.log('1.check process.env')
    if (process.env.CLIENT_ID == undefined || process.env.CLIENT_SECRET == undefined) {
        console.log(`OAuth2.0 ${!process.env.CLIENT_SECRET ? "CLIENT_SECRET," : undefined} ${!process.env.CLEINT_ID ? "CLIENT_ID" : undefined} is undefined`);
    // 2. googleStrategy 실행
    } else{
        console.log('2.execute GoogleStrategy')
        const google_strategy = new GoogleStrategy(
            {
                clientID: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`,
            },
            function(accessToken, refreshToken, profile, done) {
                // 1) 토큰, 유저 정보 가져오기
                console.log(`1)token got,`,`user:${profile.id}`)
                const user_id = profile.id;
                user_tokens.push({id:user_id, access_token:accessToken});
                // 2) mysql 로직 - 회원가입체크, 토큰 INSERT , user_info INSERT
                console.log('2) mysql logic')
                 // (1) 가입된 유저인지 체크 (user_info에 google_id 존재 확인)
                    console.log('(1) register check')
                    db.query(`select EXISTS (select google_id from user_info where google_id=? limit 1) as success`,[user_id],function (error, results, fields) {
                        if (error){
                            throw error;
                        }
                        // i. 미 가입자 일시
                        if(results[0].success === 0){
                            console.log('i. not registered user')
                            // ((1)) 회원가입 (user_info에 google_id,null,null 삽입)
                            console.log('((1)) inserting googleId into db - user_info')
                            db.query(`INSERT INTO user_info VALUES(?,DEFAULT,DEFAULT)`,[user_id], function (error, results, fields) {
                                if (error)
                                    throw error;
                                // ((2)) refresh token 삽입 (google_token에 refresh_token 삽입)
                                console.log('((2)) inserting refresh token into db - google_token')
                                db.query(`INSERT INTO google_token (google_id,refresh_token) VALUES(?,?)`,[user_id,refreshToken], function (error, results, fields) {
                                    if (error){
                                        throw error;
                                    }
                                    // ((3)) 완료
                                    console.log('complete')
                                    done(null,profile)
                                });
                            });
                        // ii. 기 가입자 일시
                        } else {
                            console.log('ii. already registered user')
                            // 완료
                            console.log('complete')
                            done(null,profile)
                        }
                    })
            }
        )
        passport.use(google_strategy);
        refresh.use(google_strategy);
    }
}