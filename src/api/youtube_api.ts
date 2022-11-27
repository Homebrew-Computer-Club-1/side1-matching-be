import {Router} from 'express';
import express from "express";
import { checkToken, user_tokens } from '../passport/googleStrategy.js';
import axios from 'axios';
import {db} from '../server.js';
import { SubscribedChannel } from '../type/youtube_type.js';
import { CustomSubscription } from '../type/server_type.js';

export const youtubeRouter: Router = Router();

// Youtube API 구독 데이터를 가공하는 함수
function filter_subscription(data:SubscribedChannel){
    const result:CustomSubscription = {
        topicIds: data.topicDetails?.topicIds // 여기 data.topicDetails가 undefined 로 뜰떄도 있어 수정함.
    };

    return result;
}

export function updateYoutubeSubscriptions(user_id:string, user_token:string){
    return new Promise(async(resolve,reject)=>{
        // nextPageToken 데이터 있으면 = 다음 데이터가 있다는 의미(다음 페이지를 요청해야 한다.)
        // nextPageToken 존재를 확인하며 불러오기 반복
        let is_nextpage_exist:boolean = true;
        let next_page_token:string|undefined = undefined;
        let channel_id_list:Array<string> = [];
        let channel_promise_list = [];
        let result:Array<CustomSubscription> = [];

        // nextPageToken 있으면 계속 불러오기
        while (is_nextpage_exist){
            let request_config = {
                params: {
                    part: 'snippet',
                    mine: true,
                    maxResults: 50,
                    pageToken: null
                },
                headers: {
                    Authorization: `Bearer ${user_token}`
                }
            };

            // 요청 조건에 pageToken 데이터로 nextPageToken 입력
            if(next_page_token!=undefined){
                request_config.params.pageToken = next_page_token;
            }

            // youtube data 요청
            await axios.get('https://www.googleapis.com/youtube/v3/subscriptions', request_config)
            .then(function(response){
                // console.log('response data : ',response.data);
                if(response.data.nextPageToken != undefined){
                    // nextPageToken 있으면, next_page_token 업데이트
                    next_page_token=response.data.nextPageToken;
                    console.log('Next page token: ',response.data.nextPageToken);
                }else{
                    // nextPageToken 없으면, while 조건 탈출
                    console.log('No next page token.');
                    is_nextpage_exist = false;
                }
                const data:Array<SubscribedChannel> = response.data.items;
                channel_id_list.push(...data.map(x=>x.snippet.resourceId.channelId));
            });
        }

        // 모든 구독 정보에서 채널 ID를 순환하며 채널 데이터 불러오는 Promise 추가
        // 이후 Promise들 모두 실행할 것.
        // * 구독 데이터에는 채널 정보가 부족(카테고리 데이터)
        for(const subscribed_channel_id of channel_id_list){
            channel_promise_list.push(
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

        // 모든 추가된 Promise들 실행
        // 실제로 youtube data를 불러오는 단계
        Promise.all(channel_promise_list).then(() =>{
                db.query(`select EXISTS (select google_id from youtube_data where google_id=? limit 1) as success`,[user_id], function (error, results, fields) {
                    if (error)
                        throw error;

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
    res.sendStatus(200);
});

