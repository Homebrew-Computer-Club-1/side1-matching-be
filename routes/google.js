import { Router } from 'express';
import passport from 'passport';
import dotenv from 'dotenv';
dotenv.config();
export const googleRouter = Router();
googleRouter.get('/', passport.authenticate('google', {
    scope: ['profile', 'https://www.googleapis.com/auth/youtube']
}));
googleRouter.get('/callback', passport.authenticate('google', {
    successRedirect: process.env.CLIENT_REDIRECT_URL,
    failureRedirect: '/login-fail'
}));
