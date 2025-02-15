import { router as TodoRouter } from "./todo/todo.route.js";
import { router as UserRouter } from "./user/user.route.js"
import { API_CONSTANTS } from "../constants/api.constants.js";
import { uploadRouter } from "./upload/upload.route.js";

export const Routes = [
    { path: API_CONSTANTS.TODO, router: TodoRouter },
    { path: API_CONSTANTS.USER, router: UserRouter },
    { path: API_CONSTANTS.UPLOAD, router: uploadRouter }
];
