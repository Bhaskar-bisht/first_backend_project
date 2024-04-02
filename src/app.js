import express from 'express'
import cors from "cors"
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
})) // is ki madhiyam se hum url ke data easy se access kr sakte hai 

app.use(express.static("public")) // ies ka use hum kbhi frontend se koi file, image, pdf aaye hai to ouse hum apne  local server main store krke rakh sakte hai or ise publicly koi bhe access kr sakta hai
app.use(cookieParser())


// routes

import userRouter from './routes/user.routes.js'

// routes Declear
 
app.use("/api/v1/users", userRouter)

export {app}