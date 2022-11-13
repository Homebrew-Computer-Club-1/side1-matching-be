import {Router} from 'express';
import express from "express";
import { checkToken, user_tokens } from '../passport/googleStrategy.js';
import axios from 'axios';
import {db} from '../server.js';

export const youtubeRouter: Router = Router();

// 원본 데이터 형식
// any인 부분은 사용하지 않거나, 세부적인 내용 필요 없어서 구체화 X
interface SubscribedChannel{
    kind:String,
    etag:String,
    id:String,
    snippet:{
        publishedAt:String,
        title:String,
        description:String,
        resourceId:{
            kind: string,
            channelId: string,
        },
        channelId:String,
        thumbnails:any
    },
    topicDetails:{
        topicIds:String[],
        topicCategories:String[]
    }
}

// 가공된 데이터 형식
interface Subscription{
    topicIds:String[]
}

function filter_subscription(data:SubscribedChannel){
    // youtube api 데이터에서 categoryId만 뽑아내는 코드
    const result:Subscription = {
        topicIds: data.topicDetails.topicIds
    };

    return result;
}

function saveYoutubeLikes(req:express.Request, res:express.Response, next:express.NextFunction){
    const user_token = user_tokens.find(x=>x.id==req.user?.id);
    axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
            part: 'snippet',
            myRating: 'like',
            maxResults: 25
        },
        headers: {
            Authorization: `Bearer ${user_token?.access_token}`
        }
    }).then(function (response) {
        console.log("좋아요 데이터 저장 성공");
        next();
    }).catch(function (error) {
        console.log(error);
        res.send('Error occurred: ' + error);
    });
}

function saveYoutubeSubscriptions(req:express.Request, res:express.Response, next:express.NextFunction){
    const user_id=req.user?.id;
    const user_token = user_tokens.find(x=>x.id==user_id)?.access_token;
    console.log(user_token);
    axios.get('https://www.googleapis.com/youtube/v3/subscriptions', {
        params: {
            part: 'snippet',
            mine: true,
            maxResults: 25
        },
        headers: {
            Authorization: `Bearer ${user_token}`
        }
    }).then(function (response) {
        let data:Array<SubscribedChannel> = response.data.items;
        // console.log(response.data.items);
        const channel_id_list: Array<string> = data.map(x=>x.snippet.resourceId.channelId);
        let result:Array<Subscription> = [];
        let promises_list = [];
        for(const subscribed_channel_id of channel_id_list){
            promises_list.push(
                axios.get("https://www.googleapis.com/youtube/v3/channels",{
                    params: {
                        part: 'topicDetails',
                        maxResults: 25,
                        id: subscribed_channel_id
                    },
                    headers: {
                        Authorization: `Bearer ${user_token}`
                    }
                }).then(function(response){
                    const filtered_result = filter_subscription(response.data.items[0]);
                    result.push(filtered_result);
                })
            );
        }
        Promise.all(promises_list).then(() =>{
            if(req.user){
                db.query(`select EXISTS (select google_id from youtube_data where google_id=? limit 1) as success`,[user_id], function (error, results, fields) {
                    if (error)
                        throw error;

                    // console.log(results);

                    // youtube_data 테이블에 해당 사용자 데이터 없을 시,
                    if(results[0].success==0){
                        db.query(`INSERT INTO youtube_data VALUES(?,DEFAULT,?)`,[user_id,JSON.stringify(result)], function (error, results, fields) {
                            if (error)
                                throw error;
                            res.status(200);
                        });
                        
                    // youtube_data 테이블에 해당 사용자 데이터 존재 시,
                    }else{
                        db.query(`UPDATE youtube_data SET subs_data=? WHERE google_id=?`,[JSON.stringify(result), user_id], function (error, results, fields) {
                            if (error)
                                throw error;
                            res.status(200);
                        });
                        
                    }
                });
                
                console.log("구독 데이터 저장 성공");
                next();
            }else{
                res.send('로그인을 확인할 수 없습니다.');
                console.log('req.user is undefined');
            }
        });
        
    }).catch(function (error) {
        console.log(error);
        res.send('Error occurred: ' + error);
    });
}

youtubeRouter.get('/save-youtube-data',checkToken, saveYoutubeLikes, saveYoutubeSubscriptions, function(req,res){
    res.send("DB: 유튜브 데이터 저장 성공");
});

