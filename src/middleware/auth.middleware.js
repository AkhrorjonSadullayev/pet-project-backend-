import { HttpException } from "../utils/http.exception.js";
import { JwtHelper } from "../utils/jwt.helper.js";
import { asyncHandler } from './async.handler.js'
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import { NewUser } from "../models/user/user.model.js";

export const auth = asyncHandler(async(req,res,next)=>{
    let token; 

    if(req.headers.authorization?.startsWith("Bearer")){
        token = req.headers.authorization.split(" ")[1];
    }
    if(!token){
        throw new HttpException(
            StatusCodes.UNAUTHORIZED,
            ReasonPhrases.UNAUTHORIZED,
            ReasonPhrases.UNAUTHORIZED,
        ); 
    } 
    const decoded = JwtHelper.verify(token);
    
    if(!decoded){
        throw new HttpException(
            StatusCodes.UNAUTHORIZED,
            ReasonPhrases.UNAUTHORIZED,
            ReasonPhrases.UNAUTHORIZED,
        ); 
    } 
    const user = await NewUser.findById(decoded.id)
    if(!user){
            throw new HttpException(
                StatusCodes.UNAUTHORIZED,
                ReasonPhrases.UNAUTHORIZED,
                ReasonPhrases.UNAUTHORIZED,
            ); 
        } 
        req.user = user;
    next();
})