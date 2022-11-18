import passport from "passport";
import {google} from "./googleStrategy.js";

export default function(){
    passport.serializeUser(function(data, done){
        console.log('serialize : ',data.id);
        done(null, data);
    })
    passport.deserializeUser(function(data:Express.User, done){
        console.log('deserialize :',data.id);
        done(null, data);
    })
    google();
}