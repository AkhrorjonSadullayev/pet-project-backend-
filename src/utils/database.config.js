import { connect } from "mongoose";

import { DB_URL } from "./secrets.js";

export const MONGODB_CONNECT  = async () =>{
    try {
        const { connections } = await connect(DB_URL);
        console.log(`DB CONNECTED! NAME:${connections[0].name}! HOST:${connections[0].host}`);
        
    } catch (error) {
        console.log(error);
        
    }
};