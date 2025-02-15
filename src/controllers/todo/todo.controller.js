import { NewTodo } from "../../models/todo/todo.model.js";
import { HttpException } from "../../utils/http.exception.js";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { asyncHandler } from "../../middleware/async.handler.js";
import { deleteFileFromS3 } from "../../utils/s3.js";
import { MyCart } from "../../models/my-cart/myCart.model.js";
import mongoose from "mongoose";
import { Like } from "../../models/like/like.model.js";
export const todoAdd = asyncHandler(async (req, res) => {
  const {
    phone,
    location,
    type,
    title,
    desc,
    price,
    color,
    kg,
    main,
    detail,
    detailtwo,
    detailthree,
  } = req.body;
  // Foydalanuvchi identifikatori
  const author = req.user.id;

  // Yangi todo yaratish
  const newTodo = await NewTodo.create({
    author,
    phone,
    location,
    type,
    title,
    desc,
    price,
    color,
    kg,
    main,
    detail,
    detailtwo,
    detailthree,
  });

  // Javob qaytarish
  res.status(201).json({
    success: true,
    message: "Yangi todo muvaffaqiyatli yaratildi",
    todo: newTodo,
  });
});
export const todoEdit = async (req, res) => {
  const { type, title, desc, price, main,phone, detail,location,detailtwo, detailthree } =
    req.body;
  const { id } = req.params;

  try {
    const todo = await NewTodo.findById(id);
    if (!todo) {
      return res.status(404).json({ success: false, msg: "Todo not found!" });
    }
    const updated = { type, title, desc,phone,location, price };
    const handleImageUpdate = async (field, newValue) => {
      if (newValue) {
        if (todo[field] !== newValue) {
          updated[field] = newValue;
          if (todo[field]) {
            const key = todo[field].split("s3.timeweb.cloud/")[1];
            if (key) await deleteFileFromS3(key);
          }
        }
      }
    };
    await handleImageUpdate("main", main);
    await handleImageUpdate("detail", detail);
    await handleImageUpdate("detailtwo", detailtwo);
    await handleImageUpdate("detailthree", detailthree);
    const updatedTodo = await NewTodo.findByIdAndUpdate(id, updated, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: updatedTodo });
  } catch (error) {
    console.error("Error updating todo:", error);
    res.status(500).json({
      success: false,
      msg: error.message || "An unexpected error occurred.",
    });
  }
};
export const getById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const data = await NewTodo.findById(id);
    if (!data) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        ReasonPhrases.BAD_REQUEST,
        ReasonPhrases.NOT_FOUND
      );
    }

    res.status(StatusCodes.OK).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});
export const getAll = async (req, res) => {
  const { search } = req.query;
  const query = {};
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { desc: { $regex: search, $options: "i" } },
    ];
  }

  try {
    const data = await NewTodo.find(query);

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
    next(error);
  }
};
export const getProductsByUser = asyncHandler(async (req, res) => {
  try {
    // Token orqali foydalanuvchi ID'ni olish
    const userId = req.user._id;  // Bu yerda userId auth middleware'dan olinadi
    console.log("Foydalanuvchi ID:", req.user.id); 
    // Mahsulotlar ro'yxatini olish, faqat o'sha user tomonidan qo'shilgan
    const products = await NewTodo.find({ author: req.user.id });

    // Agar mahsulotlar topilmasa
    if (!products) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Siz biror mahsulot qo'shmagansiz.",
      });
    }

    // Mahsulotlar topilgan bo'lsa, ularni qaytarish
    return res.status(StatusCodes.OK).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Xato yuz berdi:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Serverda kutilmagan xato yuz berdi. Iltimos, qayta urinib ko'ring.",
    });
  }
});
export const deleteTodo = async (req, res) => {
  const { id } = req.params;

  try {
    // Find and delete the todo item
    const todo = await NewTodo.findByIdAndDelete(id);

    if (!todo) {
      return res.status(404).json({ success: false, msg: "Todo not found!" });
    }

    // Delete associated files if they exist
    const fileFields = ["main", "detail", "detailtwo", "detailthree"];
    for (const field of fileFields) {
      if (todo[field]) {
        await deleteFileFromS3(todo[field].split("s3.timeweb.cloud/")[1]);
      }
    }

    res.status(200).json({ success: true, msg: "Successfully deleted!" });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({
      success: false,
      msg: "Failed to delete todo.",
      error: error.message,
    });
  }
};
export const getCart = asyncHandler(async (req, res) => {
  const { user } = req;
  const my_cart = await MyCart.findOne({ user: user._id }).populate([
    { path: "todo",select: "title -_id  price" },
    { path: "user",select: "_id  name email phone" },
  ]);

  res.status(201).json({ success: true, my_cart });
});
 export const addToCart = asyncHandler(async (req, res) => {
  const  userId  = req.user.id
  const { todo_id, title, main, quantity = 1, price = 0 } = req.body;

  const totalPrice = price * quantity;

  // ID tekshirish
  if (!mongoose.Types.ObjectId.isValid(todo_id) || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, msg: "Invalid ID provided" });
  }

  // Foydalanuvchining savatini izlash
  let userCart = await MyCart.findOne({ user: userId });

  // Agar savat mavjud bo'lsa, mahsulotni qo'shish yoki yangilash
  if (userCart) {
    const existingProductIndex = userCart.todo.findIndex(item => item.product.toString() === todo_id);
    if (existingProductIndex > -1) {
      // Mahsulot mavjud, miqdorini yangilash
      userCart.todo[existingProductIndex].quantity += quantity;
      userCart.totalAmount += totalPrice;
    } else {
      // Mahsulot mavjud emas, yangi mahsulot qo'shish
      userCart.todo.push({ product: todo_id, title, main, quantity, price });
      userCart.totalAmount += totalPrice;
    }

    await userCart.save();
    return res.status(200).json({ success: true, msg: "Updated cart", cart: userCart });
  } else {
    // Agar savat bo'lmasa, yangi savat yaratish
    const newCart = new MyCart({
      user: new mongoose.Types.ObjectId(userId),
      todo: [{ product: todo_id, title, main, quantity, price }],
      totalAmount: totalPrice,
    });

    await newCart.save();
    return res.status(201).json({ success: true, msg: "Added to cart", cart: newCart });
  }
});
export const updateCart = asyncHandler(async (req, res) => {
  const { todo_id, quantity } = req.body;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(todo_id)) {
    return res.status(400).json({ success: false, msg: "Invalid ID provided" });
  }

  try {
    // Mahsulotni olish
    const product = await NewTodo.findById(todo_id);
    if (!product) {
      return res.status(404).json({ success: false, msg: "Product not found" });
    }

    // Miqdorni tekshirish
    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ success: false, msg: "Invalid quantity" });
    }

    let price = parseFloat(product.price); // Mahsulotning narxini olish

    if (isNaN(price)) {
      return res.status(400).json({ success: false, msg: "Invalid product cost" });
    }

    // Mahsulot narxi o'zgarmaydi, faqat quantityni yangilaymiz
    const updatedPrice = price * quantity;  // Narxni quantity bilan ko'paytirmaymiz

    // Cartni yangilash
    const updatedCart = await MyCart.findOneAndUpdate(
      { _id: id, "todo.product": todo_id },
      {
        $set: {
          "todo.$.quantity": quantity, // Quantityni yangilash
          "todo.$.price": price, // Mahsulotning asl narxi saqlanadi
        },
      },
      { new: true }
    );

    // Agar cartda mahsulot bo'lmasa, yangisi yaratiladi
    if (!updatedCart) {
      const newCart = await MyCart.findByIdAndUpdate(
        id,
        {
          $addToSet: { todo: { product: todo_id, quantity, price: price } },
        },
        { new: true }
      );
      return res.status(200).json({ success: true, cart: newCart });
    }

    // Total Amountni yangilash
    let totalAmount = 0;

    // Har bir mahsulotni ko'rib chiqib, umumiy summani hisoblash
    updatedCart.todo.forEach(item => {
      totalAmount += item.quantity * item.price; // Har bir itemning narxi * quantity
    });

    // TotalAmountni yangilash
    updatedCart.totalAmount = totalAmount;

    // Cartni saqlash
    await updatedCart.save();

    res.status(200).json({ success: true, cart: updatedCart });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Server error", error: error.message });
  }
});
export const deleteCartItem = asyncHandler(async (req, res) => {
  const { todo_id } = req.body; // Todo ID body orqali olinadi
  const { cartId } = req.params; // Cart ID URL parametri orqali olinadi

  console.log("Received cartId:", cartId);
  console.log("Received todo_id:", todo_id);

  if (!mongoose.Types.ObjectId.isValid(cartId) || !mongoose.Types.ObjectId.isValid(todo_id)) {
    return res.status(400).json({ success: false, msg: "Invalid ID provided" });
  }

  try {
    // Cart ichidan todo'ni olib tashlash
    const updatedCart = await MyCart.findOneAndUpdate(
      { _id: cartId }, // Cartni topish
      { $pull: { todo: { _id: todo_id } } }, // Todo ID'ga mos kelgan itemni olib tashlash
      { new: true }
    );

    if (!updatedCart) {
      return res.status(404).json({ success: false, msg: "Cart not found or item does not exist" });
    }

    // Total amountni yangilash
    updatedCart.totalAmount = updatedCart.todo.reduce((acc, item) => acc + item.quantity * item.price, 0);

    // Cartni saqlash
    await updatedCart.save();

    res.status(200).json({ success: true, cart: updatedCart });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Server error", error: error.message });
  }
});


// export const deleteCartItem = asyncHandler(async (req, res) => {
// const latestCart = await MyCart.findOne().sort({ created_at: -1 }); 
//   const { todo_id } = req.body; // Body orqali keladi



//   if (!mongoose.Types.ObjectId.isValid(latestCart) || !mongoose.Types.ObjectId.isValid(todo_id)) {
//     return res.status(400).json({ success: false, msg: "Invalid ID provided" });
//   }

//   try {
//     // Cartni topish va todo_idni olib tashlash
//     const updatedCart = await MyCart.findOneAndUpdate(
//       { _id: latestCart, "todo.product": todo_id },
//       {
//         $pull: { "todo": { product: todo_id } }
//       },
//       { new: true }
//     );

//     if (!updatedCart) {
//       return res.status(404).json({ success: false, msg: "Cart not found or item does not exist" });
//     }

//     // Total Amountni yangilash
//     let totalAmount = 0;
//     updatedCart.todo.forEach(item => {
//       totalAmount += item.quantity * item.price;
//     });

//     updatedCart.totalAmount = totalAmount;
//     await updatedCart.save();

//     res.status(200).json({ success: true, cart: updatedCart });

//   } catch (error) {
//     res.status(500).json({ success: false, msg: "Server error", error: error.message });
//   }
// });
export const addLike = asyncHandler(async (req, res) => {
  const user = req.user;
  const { todo_id } = req.body;

  if (!user || !todo_id) {
    return res.status(400).json({ success: false, message: "Invalid data" });
  }

  // Check if like already exists
  const existingLike = await Like.findOne({ user: user._id, todo: todo_id });

  if (existingLike) {
    return res.status(400).json({ success: false, message: "Already liked" });
  }

  // Add like if it doesn't exist
  await Like.findOneAndUpdate(
    { user: user._id },
    { $addToSet: { todo: todo_id } },
    { upsert: true, new: true }
  );

  res.status(200).json({ success: true, message: "Liked successfully" });
});
export const getLikes = asyncHandler(async (req, res) => {
  const user = req.user;

  // Foydalanuvchi tomonidan yoqtirilgan barcha todo larni olish
  const myLikes = await Like.find({ user: user._id })
    .populate([
      { path: "todo", select: "title main price type" },
      { path: "user", select: "name phone email" }
    ]);

  res.status(200).json({ success: true, myLikes });
});
export const deleteLike = asyncHandler(async (req, res) => {
  const user = req.user;
  const { todo_id } = req.body;

  if (!user || !todo_id) {
    return res.status(400).json({ success: false, message: "Invalid data" });
  }

  await Like.findOneAndUpdate(
    { user: user._id },
    { $pull: { todo: todo_id } }, // Remove todo_id from liked list
    { new: true }
  );

  res.status(200).json({ success: true, message: "Like removed" });
});


export const deleteLikeOne = asyncHandler(async (req, res) => {
  const { todoId } = req.body;
  const user = req.user; // Assumed user is already available via middleware

  if (!todoId) {
    return res.status(400).json({ success: false, msg: "Todo ID is required." });
  }

  try {
    // Find the user's cart and remove the todo from the liked todos
    const myCart = await Like.findOne({ user: user._id });

    if (!myCart) {
      return res.status(404).json({ success: false, msg: "Cart not found." });
    }

    // Ensure that 'likes' exists and is an array
    if (!Array.isArray(myCart.likes)) {
      myCart.likes = []; // Initialize likes as an empty array if it doesn't exist
    }

    // Filter out the todo from the likes
    const updatedLikes = myCart.likes.filter((like) => like.todo.toString() !== todoId);

    // Update the cart with the new likes array
    myCart.likes = updatedLikes;
    await myCart.save();

    return res.status(200).json({ success: true, msg: "Like removed." });
  } catch (error) {
    console.error("Error removing like:", error);
    return res.status(500).json({ success: false, msg: "Error removing like." });
  }
});



export const getLikeStatus = asyncHandler(async (req, res) => {
  const { todo_id } = req.params;
  const user = req.user;

  // Foydalanuvchining like holatini tekshirish
  const like = await Like.findOne({ user: user._id, todo: todo_id });

  res.status(200).json({
    success: true,
    isLiked: like ? true : false,
  });
});


export const getChart = asyncHandler(async (req, res) => {
  try {
    const stats = await NewTodo.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
          count: { $sum: 1 }, // Count todos per date
        },
      },
      { $sort: { _id: 1 } }, // Sort by date
    ]);

    res.status(200).json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching todo stats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
})




























































// import { NewTodo } from "../../models/todo/todo.model.js";
// import { HttpException } from "../../utils/http.exception.js";
// import { StatusCodes, ReasonPhrases } from "http-status-codes";
// import { asyncHandler } from "../../middleware/async.handler.js";
// import { deleteFileFromS3 } from "../../utils/s3.js";
// import { MyCart } from "../../models/my-cart/myCart.model.js";
// import mongoose from "mongoose";

// export const todoAdd = asyncHandler(async (req, res) => {
//   const {
//     phone,
//     location,
//     type,
//     title,
//     desc,
//     price,
//     main,
//     detail,
//     detailtwo,
//     detailthree,
//     color
//   } = req.body;

//   const author = req.user.id;

//   const newTodo = await NewTodo.create({
//     phone,
//     type,
//     title,
//     desc,
//     main,
//     detail,
//     detailtwo,
//     detailthree,
//     price,
//     color,
//     location,
//     author,
//   });

//   res.status(201).json({ success: true, todo: newTodo });
// });
// export const todoEdit = async (req, res) => {
//   const { type, title, desc, price, main,phone, detail,location,detailtwo, detailthree } =
//     req.body;
//   const { id } = req.params;

//   try {
//     const todo = await NewTodo.findById(id);
//     if (!todo) {
//       return res.status(404).json({ success: false, msg: "Todo not found!" });
//     }
//     const updated = { type, title, desc,phone,location, price };
//     const handleImageUpdate = async (field, newValue) => {
//       if (newValue) {
//         if (todo[field] !== newValue) {
//           updated[field] = newValue;
//           if (todo[field]) {
//             const key = todo[field].split("s3.timeweb.cloud/")[1];
//             if (key) await deleteFileFromS3(key);
//           }
//         }
//       }
//     };
//     await handleImageUpdate("main", main);
//     await handleImageUpdate("detail", detail);
//     await handleImageUpdate("detailtwo", detailtwo);
//     await handleImageUpdate("detailthree", detailthree);
//     const updatedTodo = await NewTodo.findByIdAndUpdate(id, updated, {
//       new: true,
//       runValidators: true,
//     });

//     res.status(200).json({ success: true, data: updatedTodo });
//   } catch (error) {
//     console.error("Error updating todo:", error);
//     res.status(500).json({
//       success: false,
//       msg: error.message || "An unexpected error occurred.",
//     });
//   }
// };
// export const getById = asyncHandler(async (req, res) => {
//   try {
//     const { id } = req.params;

//     const data = await NewTodo.findById(id);
//     if (!data) {
//       throw new HttpException(
//         StatusCodes.NOT_FOUND,
//         ReasonPhrases.BAD_REQUEST,
//         ReasonPhrases.NOT_FOUND
//       );
//     }

//     res.status(StatusCodes.OK).json({ success: true, data });
//   } catch (error) {
//     next(error);
//   }
// });
// export const getAll = async (req, res) => {
//   const { search } = req.query;
//   const query = {};
//   if (search) {
//     query.$or = [
//       { title: { $regex: search, $options: "i" } },
//       { desc: { $regex: search, $options: "i" } },
//     ];
//   }

//   try {
//     const data = await NewTodo.find(query);

//     res.status(200).json({ success: true, data });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Server error", error });
//     next(error);
//   }
// };
// export const getProductsByUser = asyncHandler(async (req, res) => {
//   try {
//     // Token orqali foydalanuvchi ID'ni olish
//     const userId = req.user._id;  // Bu yerda userId auth middleware'dan olinadi
//     console.log("Foydalanuvchi ID:", req.user.id); 
//     // Mahsulotlar ro'yxatini olish, faqat o'sha user tomonidan qo'shilgan
//     const products = await NewTodo.find({ author: req.user.id });

//     // Agar mahsulotlar topilmasa
//     if (!products) {
//       return res.status(StatusCodes.NOT_FOUND).json({
//         success: false,
//         message: "Siz biror mahsulot qo'shmagansiz.",
//       });
//     }

//     // Mahsulotlar topilgan bo'lsa, ularni qaytarish
//     return res.status(StatusCodes.OK).json({
//       success: true,
//       data: products,
//     });
//   } catch (error) {
//     console.error("Xato yuz berdi:", error);
//     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: "Serverda kutilmagan xato yuz berdi. Iltimos, qayta urinib ko'ring.",
//     });
//   }
// });
// export const deleteTodo = async (req, res) => {
//   const { id } = req.params;

//   try {
//     // Find and delete the todo item
//     const todo = await NewTodo.findByIdAndDelete(id);

//     if (!todo) {
//       return res.status(404).json({ success: false, msg: "Todo not found!" });
//     }

//     // Delete associated files if they exist
//     const fileFields = ["main", "detail", "detailtwo", "detailthree"];
//     for (const field of fileFields) {
//       if (todo[field]) {
//         await deleteFileFromS3(todo[field].split("s3.timeweb.cloud/")[1]);
//       }
//     }

//     res.status(200).json({ success: true, msg: "Successfully deleted!" });
//   } catch (error) {
//     console.error("Error deleting todo:", error);
//     res.status(500).json({
//       success: false,
//       msg: "Failed to delete todo.",
//       error: error.message,
//     });
//   }
// };






// export const getCart = asyncHandler(async (req, res) => {
//   const { user } = req;
//   const my_cart = await MyCart.findOne({ user: user._id }).populate([
//     { path: "todo",select: "title -_id  price" },
//     { path: "user",select: "_id  name email phone" },
//   ]);

//   res.status(201).json({ success: true, my_cart });
// });
// export const addToCart = asyncHandler(async (req, res) => {
//   const userId = req.user?.id;
//   const { todo_id, quantity = 1, price = 0 } = req.body; // Default qiymatlar

//   // ID tekshirish
//   if (!mongoose.Types.ObjectId.isValid(todo_id) || !mongoose.Types.ObjectId.isValid(userId)) {
//     return res.status(400).json({ success: false, msg: "Invalid ID provided" });
//   }
//   // Savatni yangilash yoki yaratish
//   const updatedCart = await MyCart.findOneAndUpdate(
//     { user: userId },
//     {
//       $addToSet: {
//         todo: { product: todo_id, quantity, price },
//       },
//       $set: { user: userId },
//     },
//     { upsert: true, new: true }
//   );

//   res.status(201).json({ success: true, msg: "Added to cart", cart: updatedCart });
// });
// export const updateCart = asyncHandler(async (req, res) => {
//   const { todo_id, quantity } = req.body;
//   const { id } = req.params;
//   if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(todo_id)) {
//     return res.status(400).json({ success: false, msg: "Invalid ID provided" });
//   }
//   try {
//     const product = await NewTodo.findById(todo_id);
//     if (!product) {
//       return res.status(404).json({ success: false, msg: "Product not found" });
//     }
//     if (isNaN(quantity) || quantity <= 0) {
//       return res.status(400).json({ success: false, msg: "Invalid quantity" });
//     }
//     let price = parseFloat(product.price);
//     if (isNaN(price)) {
//       return res.status(400).json({ success: false, msg: "Invalid product cost" });
//     }
//     price *= quantity;
//     const updatedCart = await MyCart.findOneAndUpdate(
//       { _id: id, "todo.product": todo_id },
//       { $set: { "todo.$.quantity": quantity, "todo.$.price": price } },
//       { new: true }
//     );
//     if (!updatedCart) {
//       const newCart = await MyCart.findByIdAndUpdate(
//         id,
//         { $addToSet: { todo: { product: todo_id, quantity, price } } },
//         { new: true }
//       );
//       return res.status(200).json({ success: true, cart: newCart });
//     }
//     res.status(200).json({ success: true, cart: updatedCart });
//   } catch (error) {
//     res.status(500).json({ success: false, msg: "Server error", error: error.message });
//   }
// });









  
  
  