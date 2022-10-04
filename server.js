import express from 'express';
import passport from 'passport';
import session from 'express-session';
import dotenv from 'dotenv';
import axios from 'axios';
import { googleRouter } from './routes/google';
import { youtubeRouter } from './api/youtube_api';
import passportConfig from './passport';
dotenv.config();
passportConfig();
const app = express();
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use("/auth/google", googleRouter);
app.use("/youtube", youtubeRouter);
app.listen(process.env.PORT, function () {
    console.log("listening to 8080");
});
app.get('/', function (req, res) {
    res.send('home');
});
app.get('/get-data', function (req, res) {
    const config = {
    /* Your settings here like Accept / Headers etc. */
    };
    axios.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=25&key=${process.env.API_KEY}`, config)
        .then(function (response) {
        console.log(response.data);
        console.log(response.status);
        console.log(response.statusText);
        console.log(response.headers);
        console.log(response.config);
    });
    res.redirect('/');
});
