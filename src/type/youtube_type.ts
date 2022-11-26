// Youtube API 원본 데이터 형식
// any인 부분은 사용하지 않거나, 세부적인 내용 필요 없어서 구체화 X

export interface SubscribedChannel{
    kind:string,
    etag:string,
    id:string,
    snippet:{
        publishedAt:string,
        title:string,
        description:string,
        resourceId:{
            kind: string,
            channelId: string,
        },
        channelId:string,
        thumbnails:any
    },
    topicDetails:{
        topicIds:string[],
        topicCategories:string[]
    }
}
