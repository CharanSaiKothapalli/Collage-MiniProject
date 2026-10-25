import mongoose, { Schema, Document } from "mongoose";
import { USER_ROLE, UserRoleType } from "@keytrace/shared";

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: UserRoleType;
  accountStatus: "active" | "suspended" | "pending_deletion";
  hasConsent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 32,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLE),
      default: USER_ROLE.USER,
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "pending_deletion"],
      default: "active",
      index: true,
    },
    hasConsent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>("User", UserSchema);
