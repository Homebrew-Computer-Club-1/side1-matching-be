export type TgoogleId = string;

export interface IyoutubeData {
    google_id: TgoogleId;
    like_data: string,
    subs_data: string
}

export interface IuserDataOnBE {
    google_id:TgoogleId;
    name:string;
    age:number;
}