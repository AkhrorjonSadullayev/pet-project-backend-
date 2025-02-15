import { Schema, model } from "mongoose";
import { DB_CONSTANTS } from "../../constants/db.constants.js";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    roles: [{ type: String, ref: "Role", default: [] }],
    password: { type: String, required: true, select: false }, // Parolni default holda yashirish

    otp: { type: String, required: false },
    otpExpiration: { type: Date, required: false },

    activation: { type: Boolean, default: false }, // Faollik holati
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, // Avtomatik vaqtlar
    versionKey: false, // `__v` maydonini olib tashlash
  }
);

export const NewUser = model(DB_CONSTANTS.NEWUSER, userSchema, DB_CONSTANTS.NEWUSER);
