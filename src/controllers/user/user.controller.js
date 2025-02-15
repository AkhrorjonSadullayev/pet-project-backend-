import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { asyncHandler } from "../../middleware/async.handler.js";
import { NewUser } from "../../models/user/user.model.js";
import { HttpException } from "../../utils/http.exception.js";
import { HashingHelpers } from "../../utils/hashing.helper.js";
import { JwtHelper } from "../../utils/jwt.helper.js";
import { generateOTP } from "../../utils/generate.otp.js";
import  MailService  from "../../service/mail.service.js"; // Email xizmatini import qilish
import { Role } from "../../models/user/role.model.js";

let storedOTP = null;
let otpExpirationTime = null; // Amal qilish muddatini saqlash uchun degisken
export class UserController {
  
  // Регистрация пользователя
  
  static signUp = asyncHandler(async (req, res) => {
    const { name, email, phone,password } = req.body;
    // Проверка на существующий email
    const existingUser = await NewUser.findOne({ email });
    if (existingUser) {
      throw new HttpException(
        StatusCodes.CONFLICT,
        ReasonPhrases.CONFLICT,
        "This email is already used!"
      );
    }
    const userRole = await Role.findOne({value: 'User'});

    const newUser = await NewUser.create({
      name,
      email,
      phone,
      password: await HashingHelpers.generatePassword(password),
      roles:[userRole.value],
    });

    const otp = generateOTP();
    newUser.otp = otp;
    newUser.otpExpiration = Date.now() + 5 * 60 * 1000; // OTPning amal qilish muddati 5 daqiqa
    await newUser.save();
    res.status(StatusCodes.CREATED).json({
      success: true,
      msg: "Successfully signed up! Please check your email for the OTP to activate your account.",
    });
  });
   // Авторизация пользователя
   static login = asyncHandler(async (req,res) => {
    const { email,password } = req.body;
    const user = await NewUser.findOne({email}).select("+password")
    if(!user){
        throw new HttpException(
            StatusCodes.UNAUTHORIZED,
            ReasonPhrases.UNAUTHORIZED,
            "Invalid login credentials!"
        );
    }
    if(!(await HashingHelpers.comparePassword(password,user.password))){
        throw new HttpException(
            StatusCodes.UNAUTHORIZED,
            ReasonPhrases.UNAUTHORIZED,
            "Invalid login credentials!" 
        )     
    }
    user.activation = true;
    await user.save(); // Saqlash
     const access_token = JwtHelper.sign(user._id, user.roles)
     console.log(email,user,password);
    res.status(StatusCodes.OK).json({ success:true, user,access_token}); 
   })

   static loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Foydalanuvchini topish va parolni tekshirish
    const user = await NewUser.findOne({ email }).select("+password");
    if (!user || !(await HashingHelpers.comparePassword(password, user.password))) {
        throw new HttpException(
            StatusCodes.UNAUTHORIZED,
            ReasonPhrases.UNAUTHORIZED,
            "Invalid login credentials!"
        );
    }

    // Agar foydalanuvchi admin bo'lsa, token yaratish
    if (!user.roles.includes("ADMIN")) {
        throw new HttpException(
            StatusCodes.FORBIDDEN,
            ReasonPhrases.FORBIDDEN,
            "You are not authorized to access this resource"
        );
    }

    // JWT tokenni yaratish va yuborish
    const access_token = JwtHelper.sign(user._id, user.roles);
    res.status(StatusCodes.OK).json({
        success: true,
        user: { _id: user._id, name: user.name, email: user.email, roles: user.roles },
        access_token,
    });
});

  // Получение профиля пользователя
  static getProfile = asyncHandler(async (req, res) => {
    const user = req.user; 
    res.status(StatusCodes.OK).json({ success: true, data: user });
});
static forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  // 1. Foydalanuvchi mavjudligini tekshirish
  const user = await NewUser.findOne({ email });
  if (!user) {
    throw new HttpException(
      StatusCodes.NOT_FOUND,
      ReasonPhrases.NOT_FOUND,
      "User not found!"
    );
  }
  // 2. Yangi OTP yaratish
  const otp = generateOTP();
  user.otp = otp;
  user.otpExpiration = Date.now() + 5 * 60 * 1000; // OTP 5 daqiqa davomida amal qiladi

  await user.save();

  // 3. Email yuborish
  const emailBody = `Your OTP for password reset is: ${otp}. It will expire in 5 minutes.`;
  await MailService.sendMail(email, "Password Reset OTP", emailBody);

  // 4. Javob qaytarish
  res.status(StatusCodes.OK).json({
    success: true,
    msg: "Password reset OTP has been sent to your email. Please check your inbox.",
  });
});

static resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await NewUser.findOne({ email });

  if (!user) {
    throw new HttpException(
      StatusCodes.NOT_FOUND,
      ReasonPhrases.NOT_FOUND,
      "User not found!"
    );
  }

  // 5. OTPni tekshirish va amal qilish muddati
  if (!user.otp || user.otp !== otp || user.otpExpiration < Date.now()) {
    throw new HttpException(
      StatusCodes.BAD_REQUEST,
      ReasonPhrases.BAD_REQUEST,
      "Invalid or expired OTP!"
    );
  }

  // 6. Parolni yangilash
  user.password = await HashingHelpers.generatePassword(newPassword);
  user.otp = null;  // OTPni o'chirish
  user.otpExpiration = null;  // OTP muddati o'chirish
  await user.save();

  res.status(StatusCodes.OK).json({
    success: true,
    msg: "Password has been successfully updated!",
  });
});




  // Активация пользователя
  // static activation = asyncHandler(async (req, res) => {
  //   const userId = req.params.id;

  //   // Поиск пользователя
  //   const user = await NewUser.findById(userId);
  //   if (!user) {
  //     throw new HttpException(
  //       StatusCodes.UNAUTHORIZED,
  //       ReasonPhrases.UNAUTHORIZED,
  //       "Invalid user ID!"
  //     );
  //   }

  //   if (user.activation) {
  //     return res.status(StatusCodes.BAD_REQUEST).json({
  //       msg: "User is already activated!",
  //     });
  //   }

  //   // Активация пользователя
  //   user.activation = true;
  //   await user.save();

  //   return res.redirect("https://youtube.com")
  // });

  static sendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;
  
    // Check if user already exists
    const existingUser = await NewUser.findOne({ email });
    if (existingUser) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "Email is already used!",
      });
    }
  
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000); 
    storedOTP = otp;
    otpExpirationTime = Date.now() + 5 * 60 * 1000; // OTP expires in 5 minutes
  
    // Send OTP email
    const mailSubject = "🔐 Your OTP Code";
    const mailBody = `
      <div style="
          font-family: Arial, sans-serif; 
          max-width: 400px; 
          margin: auto; 
          padding: 20px; 
          border: 1px solid #ddd; 
          border-radius: 10px; 
          text-align: center; 
          background-color: #f9f9f9;
      ">
          <h2 style="color: #7F4D4F;">🔐 Your One-Time Password (OTP)</h2>
          <p style="font-size: 16px; color: #555;">Use the code below to verify your email.</p>
          
          <div style="
              font-size: 24px; 
              font-weight: bold; 
              color: #fff; 
              background: #7F4D4F; 
              display: inline-block; 
              padding: 10px 20px; 
              border-radius: 5px; 
              margin: 15px 0;
          ">
              ${otp}
          </div>
  
          <p style="font-size: 14px; color: #666;">This code is valid for <strong>5 minutes</strong>.</p>
          <p style="font-size: 14px; color: #666;">If you didn’t request this, please ignore this email.</p>
          
          <footer style="margin-top: 20px; font-size: 12px; color: #999;">
              © 2024 YourCompany. All rights reserved.
          </footer>
      </div>
    `;
  
    const sendMailResult = await MailService.sendMail(email, mailSubject, mailBody);
  
    if (!sendMailResult.success) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to send OTP email. Please try again.",
      });
    }
  
    res.status(StatusCodes.OK).json({
      success: true,
      message: "OTP sent successfully.",
    });
  });
  
  static VerifyOTP = asyncHandler(async (req, res) => {
    const { otp } = req.body;
    if (!storedOTP || Date.now() > otpExpirationTime) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "OTP amal qilish muddati tugagan.",
      });
    }
    if (parseInt(otp, 10) === storedOTP) {
      storedOTP = null; // Clear OTP after successful verification
      otpExpirationTime = null; // Clear expiration time
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "OTP muvaffaqiyatli tasdiqlandi!",
      });
    }
  
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "OTP noto'g'ri.",
    });
  });



  
}
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
    const data = await NewUser.find(query);

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
    next(error);
  }
};

export const getByIdUser = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const user = await NewUser.findById(id);
    if (!user) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        ReasonPhrases.BAD_REQUEST,
        ReasonPhrases.NOT_FOUND
      );
    }

    res.status(StatusCodes.OK).json({ success: true, user });
  } catch (error) {
    next(error);
  }
});


export const getChartUser = asyncHandler(async(req,res)=>{
  try {
    const stats = await NewUser.aggregate([
      {
        $group:{
          _id:{$dateToString:{format:"%Y-%m-%d",date:"$created_at"}},count:{$sum:1},
       },
      },
      {$sort:{_id:1}},
    ])
    res.status(200).json({success:true,stats})
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
})
