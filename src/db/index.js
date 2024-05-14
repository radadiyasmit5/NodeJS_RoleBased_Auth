import mongoose from "mongoose";
import { APP_DB } from '../config/index.js';


const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(APP_DB, {
      //   useFindAndModify: true,
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    console.log(
      `\n mongoDb is connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("MONGODB conenction Failed", error);
    process.exit(1);
  }
};

export default connectDB;
