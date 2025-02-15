import { Schema, model } from "mongoose";
import { DB_CONSTANTS } from "../../constants/db.constants.js";

const todoSchema = new Schema(
  {
    author: { type: Schema.ObjectId, ref: 'User'},
    title: { type: String, required: true },
    location: { type: String, required: true },
    desc: { type: String, required: true },
    phone: { type: Number },
    type: { type: String, required: true },
    price: { type: Number, required: true },
    color: { type: String, required: true },
    kg:{ type: Number, required: true },
    main: { type: String, required: true },
    detail: { type: String, required: true },
    detailtwo:{ type: String, required: true },
    detailthree:{ type: String, required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

export const NewTodo = model(DB_CONSTANTS.NEWTODO, todoSchema, DB_CONSTANTS.NEWTODO);
