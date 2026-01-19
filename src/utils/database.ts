import { stringify } from "querystring";
import {supabase} from "../app";
import * as appTypes from "../types/common";

// ----------------------------------------- REUSABLE FUNCTIONS -------------------------------

// will fetch a field from the specified tables and returns the result
// RETURNED VALUE: returns an array of records of the respective type
// PARAMS: table name of type tableName and colNames (if left empty it will default to * which returns all fields)
export async function getData<T>(tableName: appTypes.tableNames, ...colNames: (keyof T)[] ): Promise<T[] | null>{
  
  const colParam = colNames.length ? colNames.join(",") : "*"; // if empty all fields are returned

  // fetching data
  const {data, error} = await supabase.from(tableName).select(colParam);

  if(error){

    console.log("Error: ", error);
    return null;

  }else {

    return data as T[];

  }

}