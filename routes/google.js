import { Router } from 'express';
import passport from 'passport';
export const googleRouter = Router();
googleRouter.get('/', passport.authenticate('google', {
    scope: ['email']
}));
googleRouter.get('/callback', passport.authenticate('google', {
    successRedirect: '../../',
    failureRedirect: '/login-fail'
}));
