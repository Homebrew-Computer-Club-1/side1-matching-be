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
            db.query(`select EXISTS (SELECT google_id FROM user_info WHERE google_id=? AND (name IS NULL OR age IS NULL) limit 1) as success`,[req.user.id],function (err,result){
                console.log(result[0].success,req.user?.id)
                if (result[0].success === 1){
                    //처음 가입하는 유저 [ if google_id = req.user.id && (name || age = NULL) 일 경우] , 이름/나이 입력 페이지로 이동
                    res.redirect(`${process.env.CLIENT_URL}/auth/inputUserInfo/name`);
                } else {
                    // 그외, matching 페이지로.
                    res.redirect(`${process.env.CLIENT_URL}/matching`)
                }
            })
        }

    }
);