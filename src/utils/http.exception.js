export class HttpException extends Error {
       constructor(statusCode, statusMsg,msg){
        super(msg)
        this.statusCode = statusCode;
        this.statusMsg = statusMsg;
        this.msg = msg;
    } 
}

new HttpException(404,"Bad Request","Hato so'rov yuborildi!");