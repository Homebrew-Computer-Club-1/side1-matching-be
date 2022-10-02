import {Router} from 'express';
import { checkToken, user_token } from '../passport/googleStrategy';
import axios from 'axios';

export const youtubeRouter: Router = Router();

youtubeRouter.get('/get-liked', checkToken, function(req, res){
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