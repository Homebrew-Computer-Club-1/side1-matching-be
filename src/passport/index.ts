import passport from "passport";
import {google} from "./googleStrategy";

export default function(){
    passport.serializeUser(function(data, done){
        done(null, data);
    })
    passport.deserializeUser(function(data:Express.User, done){
        console.log('serialize');
        done(null, data);
    })

    google();
}