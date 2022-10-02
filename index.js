import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import { router } from './routes/routes';
import { googleRouter } from './routes/google';
import { youtubeRouter } from './api/youtube_api';
dotenv.config();
const app = express();
app.use("/router", router);
app.use("/google", googleRouter);
app.use("/youtube-api", youtubeRouter);
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
