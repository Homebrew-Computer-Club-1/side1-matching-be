import passport from "passport";
import {google} from "./googleStrategy.js";

export default function(){
    passport.serializeUser(function(data, done){
        console.log('serialize');
        done(null, data);
    })
    passport.deserializeUser(function(data:Express.User, done){
        console.log('deserialize');
        done(null, data);
    })
    google();
}