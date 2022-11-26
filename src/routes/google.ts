import express from 'express';
import passport from 'passport';
import dotenv from 'dotenv';
import {db} from '../server.js';
export const googleRouter = express.Router();
import path from "path";
const __dirname = path.resolve();
dotenv.config({path : path.join(__dirname, '../.env')});

const ROOT_URL = process.env.NODE_ENV === 'dev' ? 'http://localhost:3000' : '';

googleRouter.get('/', passport.authenticate('google', {
    scope: ['profile', 'https://www.googleapis.com/auth/youtube'],
    accessType : "offline"
}));

googleRouter.get('/callback',
    passport.authenticate('google', {failureRedirect: '/login-fail'}),
    function(req, res) {
        // <redirection to FE logic>
        console.log('<redirection to FE logic>')
        console.log(req.user);
        // 1. userInfo (name,age) 중 null 있는지 확인
        console.log('1. checking null on db - user_info - userInfo')
        db.query(`select EXISTS (SELECT google_id FROM user_info WHERE google_id=? AND (name IS NULL OR age IS NULL) limit 1) as success`, [req.user?.id], function (err,result){
            if (result[0].success === 1){
                // i. null 인게 있으면 [ if google_id = req.user.id && (name || age = NULL) 일 경우] , userInfo 입력 페이지로 이동
                console.log('i. null exists. redirecting to inputUserInfo')
                res.redirect(`${ROOT_URL}/auth/inputUserInfo/name`);
            } else {
                // ii. "" 없으면 matching 페이지로.
                console.log('ii. null not exists. redirecting to matching')
                res.redirect(`${ROOT_URL}/matching`)
            }
        })
    }
);