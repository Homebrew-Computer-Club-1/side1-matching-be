import express from 'express';
import {Router} from 'express';
import passport from 'passport';
import axios, {AxiosResponse} from 'axios';

export const googleRouter: Router = Router();

googleRouter.get('/', passport.authenticate('google', {
    scope:['profile', 'https://www.googleapis.com/auth/youtube']
}));

googleRouter.get('/callback', passport.authenticate('google', {
    successRedirect: '../../',
    failureRedirect: '/login-fail'
}));

