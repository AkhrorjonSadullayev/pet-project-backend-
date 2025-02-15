import { Router } from "express";
import { uploadFiles } from "../../controllers/upload/upload.controller.js";
import { uploadMulter } from "../../utils/multer.js";

export const uploadRouter = Router();

uploadRouter.post("/",uploadMulter.fields([{name:'main',maxCount:1},{name:'detail',maxCount:1},{name:'detailtwo',maxCount:1},{name:'detailthree',maxCount:1}]),uploadFiles)