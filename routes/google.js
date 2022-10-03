import { Router } from 'express';
import passport from 'passport';
export const googleRouter = Router();
googleRouter.get('/', passport.authenticate('google', {
    scope: ['profile', 'https://www.googleapis.com/auth/youtube']
}));
googleRouter.get('/callback', passport.authenticate('google', {
    successRedirect: '../../',
    failureRedirect: '/login-fail'
}));
