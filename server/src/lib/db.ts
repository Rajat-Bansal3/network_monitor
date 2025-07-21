import mongoose from "mongoose";
import env from "src/env";
import productionConfig from "src/lib/productionConfig";

export const connect = async () => {
  await mongoose.connect(env.MONGO_URI, productionConfig.mongoOptions);
};
