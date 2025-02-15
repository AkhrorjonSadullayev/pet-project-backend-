import { Schema, model } from "mongoose";
import { DB_CONSTANTS } from "../../constants/db.constants.js";

const likeSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: DB_CONSTANTS.NEWUSER,
      required: true,
    },
    todo:{
        type: [Schema.Types.ObjectId],
        ref: DB_CONSTANTS.NEWTODO,
        required: true
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

export const Like = model(DB_CONSTANTS.LIKE, likeSchema, DB_CONSTANTS.LIKE);
