import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.models.js";
import { uploadCloudinary } from "../utils/coludinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"


const registerUser = asyncHandler( async (req, res) => {
    

    const {username, email, fullName, password, } = req.body
    console.log("email :",email);


    // validition for data is empty or not 

    if (
        [username, email, fullName, password].some( (items) => 
        items?.trim() === "" )
    ) {
        throw new ApiError(400, "All fields are required")
    }

    //check if user alardy exite in database 

    const exitUser = User.findOne({
        $or: [{username}, {email}]
    })
    if (exitUser) {
        throw new ApiError(409, "User Alardy exit")
    }

    // checking for images are upload or not 

   const avatarPath =  req.files?.avatar[0]?.path;
   const coverImagePath = req.files?.coverImage[0]?.path;

//    check avatar is upload or not 
     
     if (!avatarPath) {
        throw new ApiError(400, "Avatar is required")
     }

        const avatar = await uploadCloudinary(avatarPath)
        const coverImage = await uploadCloudinary(coverImagePath)

        if (!avatar) {
            throw new ApiError(400, "Avatar is required")
        }


        // ye hamare database main is field ko create karega is ke ander hum jo bhe  field 
        // likhange vo sub database main store honge...?


       const userAfterCreate = await User.create({
            username: username.toLowerCase(),
            fullName,
            email,
            password,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",  // agar cover image upload hui hai to ous main se url database main store kr dange agar image upload nahi hui hai to " " store kr do 
        })

        // check the User is Create In database or not

        const ifCreateUser = await User.findById(userAfterCreate._id).select( // { .select() method ke use se hum jo field hume frontend ko nahi bhajne hote hai vo hum select kr sakte hai }
            "-password -refreshToken"
        )

        if (!ifCreateUser) {
            throw new ApiError(500, "Something want Wrong While Registering the User ")
        }

        return res.statue(201).json(
            new ApiResponse(
                200,
                 ifCreateUser,
                "User Created Successfully"
                 )
        )// is function ke ander jo user database main create hua hai ouse hum return kr dange 


        console.log("this is a user on create database : ", userAfterCreate);
} )

export {registerUser}