import express from 'express';
import path from "path";
import dotenv from 'dotenv';

export const authRouter = express.Router();
const __dirname = path.resolve();
dotenv.config({path : path.join(__dirname, '../.env')});

const ROOT_URL = process.env.NODE_ENV === 'dev' ? 'http://localhost:3000' : '';

const isAuthenticated = (req : req, res : res, next : next)  => {
    console.log('<logged in check logic>')
    // If the user is authenticated, continue to the next middleware or route handler
    if (req.session.passport) {
      return next();
    }
  
    // Otherwise, redirect the user to the login page
    return res.redirect(`${ROOT_URL}/auth/login`);
};

authRouter.get('/login-check',isAuthenticated,function(req,res){
    res.send({loggedIn:true})   
})

type req = express.Request;
type res = express.Response;
type next = express.NextFunction;

// Define the isAuthenticated function
