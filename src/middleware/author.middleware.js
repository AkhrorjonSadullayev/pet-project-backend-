import { NewTodo } from "../models/todo/todo.model.js";
import { HttpException } from "../utils/http.exception.js";

export const authorMiddleware = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return next(new HttpException(401, "Unauthorized", "Authentication required"));
    }
    if (!req.params.id) {
      return next(new HttpException(400, "Bad Request", "Todo ID is required"));
    }
    const post = await NewTodo.findById(req.params.id);
    if (!post) {
      return next(new HttpException(404, "Not Found", "Todo not found"));
    }

    const authorId = req.user._id.toString();
    if (post.author.toString() !== authorId) {
      return next(new HttpException(403, "Forbidden", "Only the author can access this resource"));
    }
    next();
  } catch (error) {
    console.error("Error in authorMiddleware:", error);
    return next(new HttpException(500, "Internal Server Error", "An error occurred while verifying the author"));
  }
};
