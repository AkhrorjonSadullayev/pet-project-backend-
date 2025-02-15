import { body, param } from "express-validator";

export const addVuser = () => [
  body("name")
    .notEmpty()
    .withMessage("Name is required!")
    .isString()
    .withMessage("Name must be a valid string!"),

  body("email")
    .notEmpty()
    .withMessage("Email is required!")
    .isEmail()
    .withMessage("Email must be valid!"),

  body("phone")
    .notEmpty()
    .withMessage("Phone is required!")
    .isMobilePhone("ko-KR")
    .withMessage("Only valid South Korean numbers are allowed!"),

  body("password")
    .notEmpty()
    .withMessage("Password is required!")
    .isString()
    .withMessage("Password must be a valid string!"),
];

export const updateVuser = () => [
  param("id").isMongoId().withMessage("ID must be a valid MongoDB ObjectID!"),

  body("name")
    .optional()
    .isString()
    .withMessage("Name must be a valid string!"),

  body("email").optional().isEmail().withMessage("Email must be valid!"),

  body("phone")
    .optional()
    .isMobilePhone("ko-KR")
    .withMessage("Only valid South Korean numbers are allowed!"),

  body("password")
    .optional()
    .isString()
    .withMessage("Password must be a valid string!"),
];
