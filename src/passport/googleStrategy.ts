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

export function google(){
    if (process.env.CLIENT_ID == undefined || process.env.CLIENT_SECRET == undefined) {
        console.log(`OAuth2.0 ${!process.env.CLIENT_SECRET ? "CLIENT_SECRET," : undefined} ${!process.env.CLEINT_ID ? "CLIENT_ID" : undefined} is undefined`);
    }else{
        const google_strategy = new GoogleStrategy(
            {
                clientID: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                callbackURL: `${process.env.SERVER_URL}/auth/google/callback`,
            },
            function(accessToken, refreshToken, profile, done) {
                console.log(`token got,`,`user:${profile.id}`)
                const user_id = profile.id;
                user_tokens.push({id:user_id, access_token:accessToken});
                // user_info에 google_id 존재 확인
                db.query(`select EXISTS (select google_id from user_info where google_id=? limit 1) as success`,[user_id],function (error, results, fields) {
                    if (error){
                        throw error;
                    }
                    if(results[0].success==0){
                        // user_info에 새로 추가
                        db.query(`INSERT INTO user_info VALUES(?,DEFAULT,DEFAULT)`,[user_id], function (error, results, fields) {
                            if (error)
                                throw error;
                        });
                    }
                    // google_token에 google_id 확인
                    db.query(`select EXISTS (select google_id from google_token where google_id=? limit 1) as success`,[user_id], function (error, results, fields) {
                        if (error){
                            throw error;
                        }
                        console.log(user_tokens);
                        if(results[0].success==0){
                            // google_token에 새로 추가
                            db.query(`INSERT INTO google_token (google_id,refresh_token) VALUES(?,?)`,[user_id,refreshToken], function (error, results, fields) {
                                if (error){
                                    throw error;
                                }
                            });
                        }else{
                            // google_token 데이터 수정
                            db.query(`UPDATE google_token SET refresh_token=? WHERE google_id=?`,[refreshToken,user_id], function (error, results, fields) {
                                if (error){
                                    throw error;
                                }
                            });
                        }
                    });
                });
                done(null, profile);
            }
        );
        passport.use(google_strategy);
        refresh.use(google_strategy);
    }
}