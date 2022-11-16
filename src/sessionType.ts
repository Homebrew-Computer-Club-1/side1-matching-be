export interface IPassport {
    user: User;
}

export interface User {
    id:          string;
    displayName: string;
    name:        Name;
    photos:      Photo[];
    provider:    string;
    _raw:        string;
    _json:       JSON;
}

export interface JSON {
    sub:         string;
    name:        string;
    given_name:  string;
    family_name: string;
    picture:     string;
    locale:      string;
}

export interface Name {
    familyName: string;
    givenName:  string;
}

export interface Photo {
    value: string;
}