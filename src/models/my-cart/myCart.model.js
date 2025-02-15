import { Schema, model } from "mongoose";
import { DB_CONSTANTS } from "../../constants/db.constants.js";

const myCartSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: DB_CONSTANTS.NEWUSER,
      required: true,
    },
    todo: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: DB_CONSTANTS.NEWTODO, // `NEWTODO`dan foydalanish to'g'ri
          required: true,
        },
        title: {
          type: String, // Title maydonini qo'shamiz
          required: true,
        },
        main: {
          type: String, // Title maydonini qo'shamiz
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

// Har safar kartaga mahsulot qo'shilganda `totalAmount`ni yangilash mumkin.
myCartSchema.pre('save', function(next) {
  let totalAmount = 0;
  
  this.todo.forEach(item => {
    totalAmount += item.price * item.quantity;
  });

  this.totalAmount = totalAmount;
  next();
});

export const MyCart = model(DB_CONSTANTS.MY_CART, myCartSchema, DB_CONSTANTS.MY_CART);
