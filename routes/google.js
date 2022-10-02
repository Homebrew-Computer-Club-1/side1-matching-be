import { Router } from 'express';
import axios from 'axios';
export const googleRouter = Router();
export let user_token;
export function checkToken(req, res, next) {
    if (user_token === undefined) {
        res.render('Cannot excute query: Token is needed.');
    }
    else {
        next();
    }
}
googleRouter.get('/auth', function (req, res) {
    res.redirect(`https://accounts.google.com/o/oauth2/auth?client_id=${process.env.CLIENT_ID}&redirect_uri=http://localhost:${process.env.PORT}/google/oauth2callback&scope=https://www.googleapis.com/auth/youtube&response_type=code`);
});
googleRouter.get('/oauth2callback', function (req, res) {
    if (req.query.error) {
        res.send('error occurred: ' + req.query.error);
    }
    else if (req.query.code) {
        axios.post('https://accounts.google.com/o/oauth2/token', {
            code: req.query.code,
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_PW,
            redirect_uri: `http://localhost:${process.env.PORT}/google/oauth2callback`,
            grant_type: 'authorization_code'
        }).then(function (response) {
            user_token = response.data.access_token;
            console.log(user_token);
            res.redirect('../');
        }).catch(function (error) {
            console.log(error);
        });
    }
    else {
        res.send('query got no known parameters');
    }
});
