import express from "express";
import dotenv from 'dotenv';
import passport from "passport";
import Google from "passport-google-oauth20";
import {db} from "../server.js";
const GoogleStrategy = Google.Strategy;

dotenv.config();

export let user_token:undefined|string;

export function checkToken(req:express.Request, res:express.Response, next:express.NextFunction){
    if(user_token===undefined){
        res.render('Cannot excute query: Token is needed.');
    }else{
        next();
    }
}

export function google(){
    if (process.env.CLIENT_ID == undefined || process.env.CLIENT_SECRET == undefined) {
        console.log(`OAuth2.0 ${!process.env.CLIENT_SECRET ? "CLIENT_SECRET," : undefined} ${!process.env.CLEINT_ID ? "CLIENT_ID" : undefined} is undefined`);
    }else{
        passport.use(new GoogleStrategy(
            {
                clientID: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                callbackURL: `${process.env.SERVER_URL}/auth/google/callback`,
            },
            function(accessToken, refreshToken, profile, done) {
                console.log(accessToken,refreshToken)
                const user_id = profile.id;
                user_token = accessToken;
                console.log(profile.id);
                // user_info에 google_id 존재 확인
                db.query(`select EXISTS (select google_id from user_info where google_id=${user_id} limit 1) as success`, function (error, results, fields) {
                    if (error){
                        throw error;
                        return;
                    }
                    if(results[0].success==0){
                        // user_info에 새로 추가
                        db.query(`INSERT INTO user_info VALUES(?,DEFAULT,DEFAULT)`,[user_id], function (error, results, fields) {
                            if (error)
                                throw error;
                                return;
                        });
                    }
                    // google_token에 google_id 확인
                    db.query(`select EXISTS (select google_id from google_token where google_id=? limit 1) as success`,[user_id], function (error, results, fields) {
                        if (error){
                            throw error;
                            return
                        }
                        if(results[0].success==0){
                            // google_token에 새로 추가
                            db.query(`INSERT INTO google_token (google_id,refresh_token) VALUES(?,?)`,[user_id,refreshToken], function (error, results, fields) {
                                if (error){
                                    throw error;
                                    return;
                                }
                            });
                        }else{
                            // google_token 데이터 수정
                            db.query(`UPDATE google_token SET refresh_token=? WHERE google_id=?`,[refreshToken,user_id], function (error, results, fields) {
                                if (error){
                                    throw error;
                                    return;
                                }
                            });
                        }
                    });
                });
                done(null, profile);
            }
        ));
    }
}