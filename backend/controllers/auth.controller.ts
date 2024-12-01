import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Response } from "express";
import nodemailer from "nodemailer";

import { formatResponseNew } from "../utils/formatResponse";
import { STATUS_CODE } from "../utils/constants";
import {
  ChangePasswordConfig,
  CustomRequest,
  LoginInterface,
  RegisterConfig,
  SendResetLinkConfig,
} from "../interfaces/api-interface";
import prisma from "../prisma/client";
import {
  createUser,
  hashPassword,
  validateRegisterBody,
} from "../services/auth.services/register.service";
import {
  signToken,
  validateLoginBody,
} from "../services/auth.services/login.service";

dotenv.config();

const register = async (
  req: CustomRequest<RegisterConfig, any>,
  res: Response,
) => {
  const { email, fullname, password, username } = req.body;
  await validateRegisterBody(req.body);

  const hashedPassword = hashPassword(password);
  const user = await createUser(email, fullname, hashedPassword, username);
  return formatResponseNew(
    res,
    "USER_CREATED",
    "Register successfully",
    STATUS_CODE.CREATED,
    { user },
  );
};

const login = async (
  req: CustomRequest<LoginInterface, any>,
  res: Response,
) => {
  const user = await validateLoginBody(req.body);
  const token = await signToken(user.userId);

  return formatResponseNew(
    res,
    "USER_LOGINED",
    "Login successfully",
    STATUS_CODE.SUCCESS,
    { user: user, token: token },
  );
};

const sendResetLink = async (
  req: CustomRequest<SendResetLinkConfig, any>,
  res: Response,
) => {
  const { email } = req.body;

  try {
    // Check if the user exists
    const user = await prisma.user.findFirst({
      where: { email: email },
    });
    if (!user) {
      return formatResponseNew(
        res,
        "INVALID_EMAIL",
        "Invalid email",
        STATUS_CODE.BAD_REQUEST,
        {},
      );
    }

    // Create a JWT reset token
    const resetToken = jwt.sign(
      { email: user.email }, // Payload: email to identify the user
      process.env.JWT_RESET as string, // Secret key for signing the token
      { expiresIn: "1h" }, // Token expiration time (1 hour)
    );

    // Construct the reset link
    const resetLink = `${process.env.CLIENT_URL}/accounts/password/reset/key/${resetToken}`;

    // Create reusable transporter object using SMTP transport
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS, // Your password
      },
    });

    // Set up email data
    const mailOptions = {
      from: '"OJUS" <no-reply@ojus.com>', // Sender address
      to: email, // Receiver's email
      subject: "Password Reset E-mail",
      // text: `You're receiving this e-mail because you or someone else has requested a password reset for your user account at.

      // Click the link below to reset your password:
      // ${resetLink}
      // If you did not request a password reset you can safely ignore this email.`,
      html: `<p>You're receiving this e-mail because you or someone else has requested a password reset for your user account.</p>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>If you did not request a password reset you can safely ignore this email.</p>`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return formatResponseNew(
      res,
      "RESET_LINK_SENT",
      "Password reset link sent to your email",
      STATUS_CODE.SUCCESS,
      {},
    );
  } catch (err: any) {
    return formatResponseNew(
      res,
      "INTERNAL_SERVER_ERROR",
      err.message,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      {},
    );
  }
};

const changePassword = async (
  req: CustomRequest<ChangePasswordConfig, any>,
  res: Response,
) => {
  const { token, newPassword } = req.body;

  try {
    // Verify the JWT token
    const decodedToken: any = jwt.verify(
      token,
      process.env.JWT_RESET as string,
    );

    if (!decodedToken || !decodedToken.email) {
      return formatResponseNew(
        res,
        "INVALID_TOKEN",
        "Invalid token",
        STATUS_CODE.BAD_REQUEST,
        {},
      );
    }

    // Check if user with the decoded email exists
    const user = await prisma.user.findFirst({
      where: { email: decodedToken.email },
    });

    if (!user) {
      return formatResponseNew(
        res,
        "USER_NOT_FOUND",
        "User not found",
        STATUS_CODE.BAD_REQUEST,
        {},
      );
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password
    await prisma.user.update({
      where: { email: decodedToken.email },
      data: { password: hashedPassword },
    });
    return formatResponseNew(
      res,
      "SUCCESS",
      "Password changed successfully",
      STATUS_CODE.SUCCESS,
      {},
    );
  } catch (err: any) {
    return formatResponseNew(
      res,
      "INTERNAL_SERVER_ERROR",
      err.message,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      {},
    );
  }
};

export { register, login, sendResetLink, changePassword };
