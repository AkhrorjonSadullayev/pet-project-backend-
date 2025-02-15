import pkg from 'jsonwebtoken';
const { sign, verify } = pkg;
import { JWT_SECRET } from './secrets.js';

export class JwtHelper {
    static sign = (id, roles) => {
        return sign({ id, roles }, JWT_SECRET, { expiresIn: "24h" }); // roles argumentini qo'shdik
    };

    static verify = (token) => {
        return verify(token, JWT_SECRET);
    };
}