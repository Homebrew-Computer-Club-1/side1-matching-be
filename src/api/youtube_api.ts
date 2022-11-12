import {Router} from 'express';
import { checkToken, user_token } from '../passport/googleStrategy.js';
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
    }
}

// 가공된 데이터 형식
interface Subscription{
    categoryId: Number
}

interface SubscriptionData{
    subs_count: Number,
    subs_cat_list: Array<Subscription>
}


function filter_subscription(list:Array<any>){
    let result:SubscriptionData = {
        subs_count: 0,
        subs_cat_list: []
    };
    result.subs_count = list.length;
    
    // youtube api 데이터에서 categoryId만 뽑아내는 코드
    let cat_list = list.map(x=> { 
        if(typeof x.snippet.categoryId == "number"){
            const subscription:Subscription = {"categoryId": x.snippet.categoryId};
            return subscription;
        }else{
            return {categoryId:0};
        }
    });
    result.subs_cat_list = cat_list;
}

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
        res.send('좋아요한 동영상 데이터 불러오기 완료.'+JSON.stringify(response.data.items));
    }).catch(function (error) {
        console.log(error);
        res.send('Error occurred: ' + error);
    });
});

youtubeRouter.get('/get-subscription', checkToken, function(req, res){
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
        let result:Array<JSON> = [];
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
                    result.push(response.data.items[0]);
                })
            );
        }
        Promise.all(promises_list).then(() =>{
            if(req.user){
                db.query(`select EXISTS (select google_id from user_info where google_id=${req.user.id} limit 1) as success`, function (error, results, fields) {
                    if (error)
                        throw error;

                    console.log(results);

                    // youtube_data 테이블에 해당 사용자 데이터 없을 시,
                    if(results[0].success==0){
                        if(req.user){
                            db.query(`INSERT INTO youtube_data VALUES("${req.user.id}",DEFAULT,"${JSON.stringify(result)}")`, function (error, results, fields) {
                                if (error)
                                    throw error;
                                res.status(200);
                            });
                        }
                    // youtube_data 테이블에 해당 사용자 데이터 존재 시,
                    }else{
                        if(req.user){
                            db.query(`UPDATE youtube_data SET subs_data='${JSON.stringify(result)}' WHERE google_id="${req.user.id}"`, function (error, results, fields) {
                                if (error)
                                    throw error;
                                res.status(200);
                            });
                        }
                    }
                });
                
                res.send(JSON.stringify(result));
                console.log(result);
            }else{
                res.send('로그인을 확인할 수 없습니다.');
                console.log('req.user is undefined');
            }
            
        });
    }).catch(function (error) {
        console.log(error);
        res.send('Error occurred: ' + error);
    });
});