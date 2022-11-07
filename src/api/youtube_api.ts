import {Router} from 'express';
import { checkToken, user_token } from '../passport/googleStrategy';
import axios from 'axios';

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
            res.send(JSON.stringify(result));
            console.log(result);
        });
        // res.send('구독 데이터 불러오기 완료.' + JSON.stringify(response.data.items[0].snippet.resourceId));
    }).catch(function (error) {
        console.log(error);
        res.send('Error occurred: ' + error);
    });
});