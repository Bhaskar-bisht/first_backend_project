import mongoose from "mongoose";
import { DATABASE_NAME } from "../constants.js";

const DB_Connection = async () => {
    try {
       const connectDataBase =  await mongoose.connect(`${process.env.MONGODB_URI}/${DATABASE_NAME}`)
       console.log(`MongoDB is Connect on Host ${connectDataBase.connection.host}`);
    } catch (error) {
        console.error("Error : ", error);
        process.exit(1)
    }
}

export default DB_Connection;