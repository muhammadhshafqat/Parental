
// ----------------------- DATABASE RELEVANT TYPES ------------------------------

export type eventRecord = {

    id:string,
    name: string,
    location: string,
    time: Date, // until I find something better
    interests: string[]

}

export type childrenRecord = {
    id: string,
    name: string,
    age: number,
    interests: string[],
    events: eventRecord[]
}

export type userRecord = {
    id: string,
    name: string,
    email: string,
    dob: Date,
    children?: childrenRecord[]
}

export type tableNames = "Children" | "ChildrenEvents" | "Events" |  "users" | "UserChildren" ; 
