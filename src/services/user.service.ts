import { UploadedFile } from "express-fileupload";

import { ApiError } from "../errors";
import { User } from "../models/User.mode";
import { userRepository } from "../repositories/user.repository";
import { IUser } from "../types/user.type";
import { s3Service } from "./s3.service";

class UserService {
  public async findAll(): Promise<IUser[]> {
    return await User.find();
  }

  public async create(data: IUser): Promise<IUser> {
    return await userRepository.create(data);
  }

  public async findById(id: string): Promise<IUser> {
    return await this.getOneByIdOrThrow(id);
  }

  public async updateById(userId: string, dto: Partial<IUser>): Promise<IUser> {
    await this.getOneByIdOrThrow(userId);

    return await User.findOneAndUpdate(
      { _id: userId },
      { ...dto },
      { returnDocument: "after" }
    );
  }

  public async deleteById(userId: string): Promise<void> {
    await this.getOneByIdOrThrow(userId);

    await User.deleteOne({ _id: userId });
  }

  public async uploadAvatar(
    userId: string,
    avatar: UploadedFile
  ): Promise<IUser> {
    const user = await this.getOneByIdOrThrow(userId);

    if (user.avatar) {
      await s3Service.deleteFile(user.avatar);
    }
    const pathToFile = await s3Service.uploadFile(avatar, "user", userId);
    return await User.findByIdAndUpdate(
      userId,
      { $set: { avatar: pathToFile } },
      { new: true }
    );
  }

  private async getOneByIdOrThrow(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError("User not found", 422);
    }
    return user;
  }
}

export const userService = new UserService();
