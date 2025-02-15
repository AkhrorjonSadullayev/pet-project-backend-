import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { HttpException } from "../utils/http.exception.js";
import { JwtHelper } from "../utils/jwt.helper.js";

export const checkRoles = (roles) => {
  return (req, res, next) => {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new HttpException(
        StatusCodes.UNAUTHORIZED,
        ReasonPhrases.UNAUTHORIZED,
        ReasonPhrases.UNAUTHORIZED
      );
    }
    const { roles: userRoles } = JwtHelper.verify(token, process.env.JWT_SECRET);
    console.log("Decoded User Roles:", userRoles); // Debug
    console.log("Required Roles:", roles); // Debug

    // Check roles
    let hasRoles = userRoles.some((role) => roles.includes(role));
    if (!hasRoles) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "You do not have the required roles" });
    }

    next();
  };
};
