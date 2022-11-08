import dotenv from 'dotenv';
import passport from "passport";
import Google from "passport-google-oauth20";
import { connection } from "../lib/mysql";
const GoogleStrategy = Google.Strategy;
const db = connection;
dotenv.config();
export let user_token;
export function checkToken(req, res, next) {
    if (user_token === undefined) {
        res.render('Cannot excute query: Token is needed.');
    }
    else {
        next();
    }
}
export function google() {
    if (process.env.CLIENT_ID == undefined || process.env.CLIENT_SECRET == undefined) {
        console.log(`OAuth2.0 ${!process.env.CLIENT_SECRET ? "CLIENT_SECRET," : undefined} ${!process.env.CLEINT_ID ? "CLIENT_ID" : undefined} is undefined`);
    }
    else {
        passport.use(new GoogleStrategy({
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            callbackURL: `http://localhost:${process.env.PORT}/auth/google/callback`,
        }, function (accessToken, refreshToken, profile, done) {
            const user_id = profile.id;
            console.log(profile.id);
            // user_info에 google_id 존재 확인
            db.query(`select EXISTS (select google_id from user_info where google_id=${user_id} limit 1) as success`, function (error, results, fields) {
                if (error)
                    throw error;
                if (results[0].success == 0) {
                    // user_info에 새로 추가
                    db.query(`INSERT INTO user_info VALUES("${user_id}",DEFAULT,DEFAULT)`, function (error, results, fields) {
                        if (error)
                            throw error;
                    });
                }
                // google_token에 google_id 확인
                db.query(`select EXISTS (select google_id from google_token where google_id=${user_id} limit 1) as success`, function (error, results, fields) {
                    if (error)
                        throw error;
                    if (results[0].success == 0) {
                        // google_token에 새로 추가
                        db.query(`INSERT INTO google_token VALUES("${user_id}","${accessToken}","${refreshToken}")`, function (error, results, fields) {
                            if (error)
                                throw error;
                        });
                    }
                    else {
                        // google_token 데이터 수정
                        db.query(`UPDATE google_token SET access_token="${accessToken}", refresh_token="${refreshToken}" WHERE google_id="${user_id}"`, function (error, results, fields) {
                            if (error)
                                throw error;
                        });
                    }
                });
            });
            done(null, profile);
        }));
    }
}
