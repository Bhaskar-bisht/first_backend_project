import { Router } from "express";
import { accountDetailsUpdate, changeCurrentPassword, coverImageUpdate, getCurrentUser, getUserChannelProfile, getWatchHistory, logOutUser, loginUser, refreshAccessToken, registerUser, uploadUserAvatar } from "../controllers/user.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from '../middleware/multer.middleware.js';

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
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-details").patch(verifyJWT, accountDetailsUpdate)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), uploadUserAvatar)
router.route("/cover_image_upload").patch(verifyJWT, upload.single("coverImage"), coverImageUpdate)


router.route("/c/:username").get(verifyJWT, getUserChannelProfile) // is main hum params yani url se user ka username access kr rahe hai
router.route("/history").get(verifyJWT, getWatchHistory)

export default router