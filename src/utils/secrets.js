import dotenv from 'dotenv'

dotenv.config();

export const PORT = process.env.PORT || 7070;
export const ENVIRONMENT = process.env.ENVIRONMENT || 7070;
export const REG_KEY = process.env.REG_KEY; 
export const DB_URL = process.env.DB_URL; 
export const JWT_SECRET = process.env.JWT_SECRET ; 
export const JWT_REFRESH = process.env.JWT_REFRESH; 