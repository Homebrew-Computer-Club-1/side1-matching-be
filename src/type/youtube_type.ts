// Youtube API 원본 데이터 형식
// any인 부분은 사용하지 않거나, 세부적인 내용 필요 없어서 구체화 X

export interface SubscribedChannel{
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
