import mongoose, { Document } from "mongoose";
import bcrypt from "bcryptjs";

interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: "ADMIN" | "USER" | "MANAGER";
  status: boolean;
  comparePass: (pass: string) => Promise<boolean>;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["ADMIN", "USER", "MANAGER"],
    },
    status: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
UserSchema.methods.comparePass = async function (
  pass: string
): Promise<boolean> {
  return await bcrypt.compare(pass, this.password);
};

const User = mongoose.model("User", UserSchema);
export default User;
