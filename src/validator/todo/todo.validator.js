import { body,param } from "express-validator";

export const  addV = () => [
    body("title", "Title is required!").notEmpty(),
    body("title", "Title must be a string!").isString(),
    body("desc", "Desc is required!").notEmpty(),
    body("desc", "Desc must be a string!").isString(),
    body("type", "Type is required!").notEmpty(),
    body("type", "Type must be a string!").isString(),
    body("price", "Price is required!").notEmpty(),
    body("price", "Price must be a number!").isNumeric(),
    body("phone", "Phone must be a number!").isNumeric(),
    body("phone", "Only valid South Korean numbers are allowed!").isMobilePhone("ko-KR"),
    body("color", "Color is required!!").notEmpty(),
    body("color", "Color must be a string!").isString(),
]
export const  addCartV = () => [
    body('todo_id',"Todo id is MongoID!").isMongoId(),
]

export const updateV = () => [
    param('id',"Id is MongoID!").isMongoId(),
    body("title", "Title must be a string!").optional().isString(),
    body("desc", "Desc must be a string!").optional().isString()
] 