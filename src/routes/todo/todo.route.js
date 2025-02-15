import { Router } from 'express';
import { addLike, addToCart, deleteCartItem, deleteLike,  deleteLikeOne, deleteTodo, getAll, getById, getCart,
     getChart,
     getLikes,
     getLikeStatus,
     getProductsByUser, todoAdd, todoEdit, 
     updateCart} from '../../controllers/todo/todo.controller.js';
import { addV, updateV } from '../../validator/todo/todo.validator.js';
import { validate } from '../../validator/validator.js';
import { auth } from '../../middleware/auth.middleware.js';

// import { authorMiddleware } from '../../middleware/author.middleware.js'

export const router = Router();

router.post("/add",auth,addV(),validate,todoAdd);
router.put("/edit/:id",auth,updateV(), validate, todoEdit);
//AUTHOR HAS TO BE HERE
router.get("/get/:id", getById);
router.get('/products',  auth,getProductsByUser);
router.get("/get-all", getAll);
router.delete("/delete/:id",auth,deleteTodo);
//AUTHOR HAS TO BE HERE
/////

router.post("/order", auth,addToCart);
router.put("/update/:id", auth, updateCart);
router.get("/order-get", auth,getCart);
router.post('/order-delete/:cartId', deleteCartItem);


///////Like

router.post("/like", auth,addLike);
router.get("/like-get", auth,getLikes);
router.get("/like-status/:todo_id", auth, getLikeStatus);
router.post("/like-delete", auth, deleteLike);
router.post("/like-delete-one", auth, deleteLikeOne);



router.get("/todo-analysis",auth,getChart)