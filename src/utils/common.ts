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

// -------------------------------------- General TYpes ------------- //
declare global {
  namespace Express {
    interface Request {
      user?: import("@supabase/supabase-js").User;
    }
  }
};

export type chatDbType = {

    role: string,
    message: string

};

export type SearchResultEntry = {
  name: string;  // The title of the search result
  place: string; // The location context (e.g., "Lahore, Punjab, Pakistan")
  data: string;  // The description or snippet text
  time: string;  // The ISO or UTC timestamp of the search
  url: string;   // The destination link
};