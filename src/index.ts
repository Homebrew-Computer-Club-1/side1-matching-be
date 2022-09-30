import express from 'express';
import * as bodyParser from 'body-parser';
import dotenv from 'dotenv';
import axios, {AxiosResponse} from 'axios';
import {router} from './routes';

dotenv.config();

const app = express();

let user_token:undefined|string;

function checkToken(req:express.Request, res:express.Response, next:express.NextFunction){
    if(user_token===undefined){
        res.render('Cannot excute query: Token is needed.');
    }else{
        next();
    }
}

app.use("/router", router);

app.listen(process.env.PORT, function(){
    console.log("listening to 8080");
});

app.get('/',function(req:express.Request, res:express.Response){
    res.send('home');
});

app.get('/get-data', function(req,res){
    const config = {
        /* Your settings here like Accept / Headers etc. */
    };
    axios.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=25&key=${process.env.API_KEY}`, config)
    // axios.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet&myRating=like&maxResults=25&key=${process.env.API_KEY}`, config)
        .then(function (response: AxiosResponse) {
        console.log(response.data);
        console.log(response.status);
        console.log(response.statusText);
        console.log(response.headers);
        console.log(response.config);
    });
    res.redirect('/')    
});

app.get('/auth', function(req, res){
    res.redirect(`https://accounts.google.com/o/oauth2/auth?client_id=${process.env.CLIENT_ID}&redirect_uri=http://localhost:8080/oauth2callback&scope=https://www.googleapis.com/auth/youtube&response_type=code`)
});

app.get('/oauth2callback', function(req, res){
    if(req.query.error){
        res.send('error occurred: '+ req.query.error);
    }else if(req.query.code){
        axios.post('https://accounts.google.com/o/oauth2/token',{
            code: req.query.code,
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_PW,
            redirect_uri:`http://localhost:${process.env.PORT}/oauth2callback`,
            grant_type:'authorization_code'
        }).then(function(response:AxiosResponse){
            user_token=response.data.access_token;
            console.log(user_token);
            res.redirect('/');
        }).catch(function(error){
            console.log(error);
        });
    }else{
        res.send('query got no known parameters');
    }
});

app.get('/get-liked', checkToken, function(req, res){
    axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
            part: 'snippet',
            myRating: 'like',
            maxResults: 25
        },
        headers: {
            Authorization: `Bearer ${user_token}`
        }
    }).then(function (response) {
        console.log(response.data.items);
        res.send('좋아요한 동영상 데이터 불러오기 완료.');
    }).catch(function (error) {
        console.log(error);
        res.send('Error occurred: ' + error);
    });
});