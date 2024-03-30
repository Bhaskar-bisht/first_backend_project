// require('dotenv').config()
import dotenv from "dotenv";
import DB_Connection from "./db/database.js";
import { app } from "./app.js";

dotenv.config({ path: "./env" });

DB_Connection()
  .then((res) => {
    app.listen(process.env.PORT, () => {
        console.log(`App is Listening On Port : ${process.env.PORT}`);
    })
  })
  .catch((err) => {
    console.log("Mongo DB Connection Error is ", err);
  });

/*
import express from 'express'

const app = express()

( async () => {
    try {
       await mongoose.connect(`${process.env.MONGODB_URI}/${DATABASE_NAME}`)
       app.listen(process.env.PORT, () => {
        console.log(`App on Listen on Port : ${process.env.PORT}`);
       })
    } catch (error) {
        console.error("Error :", error);
    }
})()
*/
