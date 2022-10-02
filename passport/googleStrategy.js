import dotenv from 'dotenv';
import passport from "passport";
import Google from "passport-google-oauth20";
const GoogleStrategy = Google.Strategy;
// import db from "../../lib/mysql";
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
    if (process.env.CLIENT_ID == undefined) {
        console.log('OAuth2.0 client id undefined');
    }
    else if (process.env.CLIENT_SECRET == undefined) {
        console.log('OAuth2.0 client secret undefined');
    }
    else {
        passport.use(new GoogleStrategy({
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            callbackURL: `http://localhost:${process.env.PORT}/auth/google/callback`,
        }, function (accessToken, refreshToken, profile, done) {
            console.log('여기 결과 : ', accessToken, refreshToken);
            user_token = accessToken;
            // db.query('SELECT * FROM users WHERE userId = ?',[profile._json.email],function(err,user){
            //     if (!user[0]){
            //         db.query('INSERT INTO users (userId,userPw) VALUES(?,?)',[profile._json.email,1234],function(err,result){
            //             return done(null,profile._json.email)
            //         })
            //     } else {
            //         console.log('excuted!!!!')
            //         return done(null,profile._json.email)
            //     }
            // })
        }));
    }
}
