import { Schema, model } from "mongoose";

const roleSchema = new Schema(
  {
    value: { type: String, unique: true, default: 'User' },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

export const Role = model("Role", roleSchema);

