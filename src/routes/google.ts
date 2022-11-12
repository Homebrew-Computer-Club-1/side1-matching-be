import express from 'express';
import passport from 'passport';
import dotenv from 'dotenv';
import {db} from '../server.js';
export const googleRouter = express.Router();

dotenv.config();

googleRouter.get('/', passport.authenticate('google', {
    scope: ['profile', 'https://www.googleapis.com/auth/youtube'],
    accessType : "offline"
}));

googleRouter.get('/callback',
    passport.authenticate('google', {failureRedirect: '/login-fail'}),
    function(req, res) {
        if(req.user){
            // 사용자의 이름, 나이 정보 유무 확인
            db.query(`select EXISTS (select google_id from user_info where google_id=${req.user.id} AND (name=NULL OR age=NULL) limit 1) as success`,function (err,result){
                if (result[0].success==0){
                    // name 혹은 age 없는 경우, 이름/나이 입력 페이지로 이동
                    res.redirect(`${process.env.CLIENT_URL}/auth/inputUserInfo/name`);
                } else {
                    // name 혹은 age 있는 경우, 매칭 페이지로 이동
                    res.redirect(`${process.env.CLIENT_URL}/matching`)
                }
            })
        }

    }
);