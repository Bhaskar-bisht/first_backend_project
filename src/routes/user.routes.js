import { Router } from "express";
import { logOutUser, loginUser, refreshAccessToken, registerUser } from "../controllers/user.controllers.js";
import {upload} from '../middleware/multer.middleware.js'
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser 
     )

router.route("/login").post( loginUser)

// secure Route 
router.route("/logout").post(verifyJWT,  logOutUser)


router.route("/refresh_token").post( refreshAccessToken )

export default router