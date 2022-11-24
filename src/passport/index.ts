import passport from "passport";
import { db } from "../server.js";
import {google} from "./googleStrategy.js";

export default function(){
    passport.serializeUser(function(data, done){
        console.log('serialize : ',data.id);
        done(null, data.id);
    })
    passport.deserializeUser(function(userId, done){
        db.query(`SELECT google_id FROM user_info WHERE google_id=?`,[userId],function(err,result){
            console.log(`deserialize : ${result[0].google_id}`)
            done(null, {id : result[0].google_id});
        })
    })
    google();
}