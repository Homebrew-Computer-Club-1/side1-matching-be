import {Router} from 'express';
import express from "express";
import { checkToken, user_tokens } from '../passport/googleStrategy.js';
import axios from 'axios';
import {db} from '../server.js';
import { SubscribedChannel } from '../type/youtube_type.js';
import { CustomSubscription } from '../type/server_type.js';

export const youtubeRouter: Router = Router();

// 원본 데이터 형식
// any인 부분은 사용하지 않거나, 세부적인 내용 필요 없어서 구체화 X


// 가공된 데이터 형식


// Youtube API 구독 데이터를 가공하는 함수
function filter_subscription(data:SubscribedChannel){
    const result:CustomSubscription = {
        topicIds: data.topicDetails?.topicIds // 여기 data.topicDetails가 undefined 로 뜰떄도 있어 수정함.
    };

    return result;
}

export function updateYoutubeSubscriptions(user_id:string, user_token:string){
    return new Promise((resolve,reject)=>{
        console.log(user_token);
        axios.get('https://www.googleapis.com/youtube/v3/subscriptions', {
            params: {
                part: 'snippet',
                mine: true,
                // 최대 50개까지 가능하므로, 추후 더 필요하다면 계속 요청하는 방식으로 불러오기 필요.
                maxResults: 25
            },
            headers: {
                Authorization: `Bearer ${user_token}`
            }
        }).then(function (response) {
            let data:Array<SubscribedChannel> = response.data.items;
            // console.log(response.data.items);
            const channel_id_list: Array<string> = data.map(x=>x.snippet.resourceId.channelId);

            let result:Array<CustomSubscription> = [];

            let promises_list = [];
            for(const subscribed_channel_id of channel_id_list){
                promises_list.push(
                    axios.get("https://www.googleapis.com/youtube/v3/channels",{
                        params: {
                            part: 'topicDetails',
                            maxResults: 1,
                            id: subscribed_channel_id
                        },
                        headers: {
                            Authorization: `Bearer ${user_token}`
                        }
                    }).then(function(response){

                        const filtered_result:CustomSubscription = filter_subscription(response.data.items[0]);

                        result.push(filtered_result);
                    })
                );
            }
            Promise.all(promises_list).then(() =>{
                    db.query(`select EXISTS (select google_id from youtube_data where google_id=? limit 1) as success`,[user_id], function (error, results, fields) {
                        if (error)
                            throw error;

                        // console.log(results);

                        // youtube_data 테이블에 해당 사용자 데이터 없을 시,
                        if(results[0].success==0){
                            db.query(`INSERT INTO youtube_data VALUES(?,DEFAULT,?)`,[user_id,JSON.stringify(result)], function (error, results, fields) {
                                if (error)
                                    throw error;
                            });
                            
                        // youtube_data 테이블에 해당 사용자 데이터 존재 시,
                        }else{
                            db.query(`UPDATE youtube_data SET subs_data=? WHERE google_id=?`,[JSON.stringify(result), user_id], function (error, results, fields) {
                                if (error)
                                    throw error;
                            });
                        }
                    });
                    console.log("구독 데이터 저장 성공");
                    resolve(true);
                }
            ).catch(function(error){
                reject(error);
            });
        }).catch(function (error) {
            return error;
        });
    });
}

export function updateYoutubeLikes(user_id:string, user_token:string){
    return new Promise((resolve,reject)=>{
        axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                part: 'snippet',
                myRating: 'like',
                // 최대 50개까지 가능하므로, 추후 더 필요하다면 계속 요청하는 방식으로 불러오기 필요.
                maxResults: 25
            },
            headers: {
                Authorization: `Bearer ${user_token}`
            }
        }).then(function (response) {
        
            // 데이터 저장 로직 구현 필요.
            
            console.log("좋아요 데이터 저장 성공");
            resolve(true);
        }).catch(function (error) {
            console.log(error);
            reject(error);
        });
    })
}

async function saveYoutubeData(req:express.Request, res:express.Response, next:express.NextFunction){
    const user_id = req.user?.id;
    const user_token = user_tokens.find(x=>x.id==req.user?.id)?.access_token;
    if(user_id!=undefined && user_token!=undefined){
        await updateYoutubeLikes(user_id, user_token);
        await updateYoutubeSubscriptions(user_id, user_token);  
    } 
    else console.log("user_id or user_token is undefined");
    next();
}

youtubeRouter.get('/save-youtube-data', checkToken, saveYoutubeData, function(req:express.Request,res:express.Response){
    res.send("DB: 유튜브 데이터 저장 성공");
});

