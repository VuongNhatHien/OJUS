import bcrypt from "bcryptjs";

import dotenv from "dotenv";
dotenv.config();

import { PrismaClient, User } from "@prisma/client";
import { Request as RequestExpress, Response } from "express";
import { formatResponse } from "../utils/formatResponse";
import { STATUS_CODE } from "../utils/constants";
import {
  Controller,
  Get,
  Middlewares,
  Path,
  Route,
  SuccessResponse,
  Request,
  Tags,
  UploadedFile,
  Patch,
  Delete,
} from "tsoa";
import { verifyToken } from "../middlewares/verify-token";
import {
  GetAllACSubmissionsFromUserInterface,
  GetAllSubmissionsFromUserInterface,
  SuccessResponseInterface,
  UpdateAvatarInterface,
  UserResponseInterface,
  UserWithAvatarInterface,
  UserWithAvatarResponseInterface,
} from "../interfaces/api-interface";
import {
  addProblemToSubmissions,
  filterSubmissionsAC,
  findAvatarById,
  findSubmissionsUser,
  findUserById,
  findUserByName,
  uploadAvatar,
} from "../services/user.services/user.services";

interface ProfileRequest extends RequestExpress {
  params: {
    username: string;
  };
}
interface UserRequest extends RequestExpress {
  params: {
    userId: string;
  };
}
interface UpdateProfileRequest extends RequestExpress {
  body: {
    fullname?: string;
    gender?: string;
    birthday?: Date;
    facebookLink?: string;
    githubLink?: string;
    currentPassword?: string;
    newPassword?: string;
  };
  user?: { userId: number };
}

const prisma = new PrismaClient();

const updateProfile = async (req: UpdateProfileRequest, res: Response) => {
  try {
    // Ensure user is authenticated
    if (!req.userId) {
      return formatResponse(
        res,
        "Authentication required!",
        STATUS_CODE.UNAUTHORIZED,
      );
    }

    const userId = req.userId;
    const { fullname, facebookLink, githubLink, currentPassword, newPassword } =
      req.body;

    if (fullname === null) {
      return formatResponse(
        res,
        "Fullname is required!",
        STATUS_CODE.BAD_REQUEST,
      );
    }

    // Find the existing user
    const existingUser = await prisma.user.findUnique({
      where: { userId },
    });

    if (!existingUser) {
      return formatResponse(res, "User not found!", STATUS_CODE.BAD_REQUEST);
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return formatResponse(
          res,
          "Current password is required to change password!",
          STATUS_CODE.BAD_REQUEST,
        );
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        existingUser.password,
      );

      if (!isPasswordValid) {
        return formatResponse(
          res,
          "Current password is incorrect!",
          STATUS_CODE.BAD_REQUEST,
        );
      }
    }

    // Hash new password if provided
    let updatePassword = existingUser.password;
    if (newPassword) {
      const saltRounds = 10;
      updatePassword = await bcrypt.hash(newPassword, saltRounds);
    }
    const updateUserData: User = {
      ...existingUser,
      fullname: fullname === undefined ? existingUser.fullname : fullname,
      facebookLink:
        facebookLink === undefined ? existingUser.facebookLink : facebookLink,
      githubLink:
        githubLink === undefined ? existingUser.githubLink : githubLink,
      password: updatePassword,
    };

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: updateUserData,
    });

    // Remove sensitive information before sending response
    const { password, ...safeUser } = updatedUser;

    return res.status(200).json({
      message: "Profile updated successfully!",
      data: {
        user: safeUser,
      },
    });
  } catch (err: any) {
    console.error("Profile update error:", err);
    return formatResponse(res, err.message, STATUS_CODE.INTERNAL_SERVER_ERROR);
  }
};

// const getProfileByName = async (req: ProfileRequest, res: Response) => {
//   try {
//     const username = req.params.username;
//
//     const user = await prisma.user.findFirst({
//       where: {
//         username: username,
//       },
//     });
//
//     if (!user) {
//       return formatResponse(
//         res,
//         "Username not exists!",
//         STATUS_CODE.BAD_REQUEST,
//       );
//     }
//
//     let avatar = null;
//     if (user.avatarId) {
//       avatar = await prisma.files.findFirst({
//         where: {
//           fileId: user.avatarId,
//         },
//       });
//     }
//     return res.status(200).json({
//       message: "Get profile successfully!",
//       data: {
//         user: {
//           ...user,
//           avatar: avatar,
//         },
//       },
//     });
//   } catch (err: any) {
//     return formatResponse(res, err.message, STATUS_CODE.INTERNAL_SERVER_ERROR);
//   }
// };

@Route("/api/user")
@Tags("User")
export class UserController extends Controller {
  @Get("/")
  @Middlewares(verifyToken)
  @SuccessResponse(200, "Successfully fetched user profile")
  public async getUserProfile(
    @Request() req: RequestExpress,
  ): Promise<SuccessResponseInterface<UserWithAvatarResponseInterface>> {
    const userId = req.userId;
    const user = await findUserById(userId);
    const avatar = await findAvatarById(user.avatarId);
    return {
      data: {
        user: {
          ...user,
          avatar: avatar,
        },
      },
    };
  }

  @Get("/{username}")
  @SuccessResponse(200, "Successfully fetched user profile")
  public async getUserByName(
    @Path() username: string,
  ): Promise<SuccessResponseInterface<UserWithAvatarResponseInterface>> {
    const user = await findUserByName(username);
    const avatar = await findAvatarById(user.avatarId);
    return {
      data: {
        user: {
          ...user,
          avatar: avatar,
        },
      },
    };
  }

  @Get("/submissions")
  @Middlewares(verifyToken)
  @SuccessResponse(200, "Successfully fetched submissions from user")
  public async getSubmissionsFromUser(
    @Request() req: RequestExpress,
  ): Promise<SuccessResponseInterface<GetAllSubmissionsFromUserInterface>> {
    const userId = req.userId;
    const submissions = await findSubmissionsUser(userId);
    return {
      data: { submissions: submissions },
    };
  }

  @Get("/{userId}/submissions/AC")
  @SuccessResponse(200, "Successfully fetched submissions from user")
  public async getACSubmissionsFromUser(
    @Path() userId: number,
  ): Promise<SuccessResponseInterface<GetAllACSubmissionsFromUserInterface>> {
    const submissions = await findSubmissionsUser(userId);
    const submissionFilteredAC = await filterSubmissionsAC(submissions);
    const submissionsWithProblem =
      await addProblemToSubmissions(submissionFilteredAC);
    return {
      data: { submissions: submissionsWithProblem },
    };
  }

  @SuccessResponse("200", "Update avatar successfully")
  @Patch("/avatar")
  @Middlewares(verifyToken) // Middleware to verify the user's token
  public async uploadAvatar(
    @Request() req: RequestExpress, // Request object for user ID and file
    @UploadedFile()
    file: Express.Multer.File,
  ): Promise<SuccessResponseInterface<UpdateAvatarInterface>> {
    const avatar = await uploadAvatar(file);

    //update avatarId in user table
    const userId = req.userId;
    const user = await prisma.user.update({
      where: { userId },
      data: {
        avatarId: avatar.fileId,
      },
    });
    return {
      data: {
        user: {
          ...user,
          avatar: avatar,
        },
      },
    };
  }

  @SuccessResponse("200", "Delete avatar successfully")
  @Delete("/avatar")
  @Middlewares(verifyToken) // Middleware to verify the user's token
  public async deleteAvatar(
    @Request() req: RequestExpress, // Request object for user ID and file
  ): Promise<SuccessResponseInterface<UserResponseInterface>> {
    const userId = req.userId;
    const user = await findUserById(userId);
    await prisma.user.update({
      where: { userId },
      data: {
        avatarId: null,
      },
    });
    return {
      data: {
        user: user,
      },
    };
  }
}

export { updateProfile };
