import express from 'express';

export const authRouter = express.Router();

authRouter.get('/login-check',function(req,res){
    console.log('<login-check-logic>')
    if (req.session.passport){
        res.sendStatus(200);
    } else {
        res.sendStatus(401);
    }
})
