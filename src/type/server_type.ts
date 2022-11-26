import { TgoogleId } from "./db_type";

export interface TokenData{
    id:string,
    access_token:string
}

// 가공한 youtube data type
export interface CustomSubscription{
    topicIds:string[]
}