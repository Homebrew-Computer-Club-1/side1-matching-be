import express from 'express';
import passport from 'passport';
import dotenv from 'dotenv';
import { db } from '../server';
export const googleRouter = express.Router();
dotenv.config();
googleRouter.get('/', passport.authenticate('google', {
    scope: ['profile', 'https://www.googleapis.com/auth/youtube']
}));
googleRouter.get('/callback', passport.authenticate('google', { failureRedirect: '/login-fail' }), function (req, res) {
    var _a;
    db.query(`SELECT * FROM user_info WHERE google_id=?`, [(_a = req.user) === null || _a === void 0 ? void 0 : _a.id], function (err, result) {
        if (!result[0]) {
            res.redirect(`${process.env.CLIENT_URL}/auth/inputUserInfo/name`);
        }
        else {
            res.redirect(`${process.env.CLIENT_URL}/matching`);
        }
    });
});
