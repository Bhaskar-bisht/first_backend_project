// require('dotenv').config()
import dotenv from "dotenv"
import DB_Connection from "./db/database.js";


dotenv.config({path: './env'})

DB_Connection()








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