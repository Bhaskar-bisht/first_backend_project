import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadCloudinary } from "../utils/coludinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { response, text } from "express";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId); // simpaly this user find user Object in database  accessToken
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // console.log("THis is 1st : ", accessToken);
    // console.log("THis is 2nd : ", refreshToken);

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something want Wrong");
    // console.log(error);
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password } = req.body;
  console.log("this is a request of a body", req.body);

  // validition for data is empty or not

  if (
    [username, email, fullName, password].some((items) => items?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //check if user alardy exite in database

  const exitUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (exitUser) {
    throw new ApiError(409, "User Alardy exit");
  }

  // checking for images are upload or not

  const avatarPath = req.files?.avatar[0]?.path;
  //    const coverImagePath = req.files?.coverImage[0]?.path;

  //    check avatar is upload or not

  if (!avatarPath) {
    throw new ApiError(400, "Avatar is required");
  }

  let coverImagePath;

  if (req.files && Array.isArray(req.files.coverImagePath).length > 0) {
    coverImagePath = req.files.coverImage[0];
  }

  const avatar = await uploadCloudinary(avatarPath);
  const coverImage = await uploadCloudinary(coverImagePath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }
  console.log("This is a req.files responses : ", req.files);

  // ye hamare database main is field ko create karega is ke ander hum jo bhe  field
  // likhange vo sub database main store honge...?

  const userAfterCreate = await User.create({
    username: username.toLowerCase(),
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "", // agar cover image upload hui hai to ous main se url database main store kr dange agar image upload nahi hui hai to " " store kr do
  });

  // check the User is Create In database or not

  const ifCreateUser = await User.findById(userAfterCreate._id).select(
    // { .select() method ke use se hum jo field hume frontend ko nahi bhajne hote hai vo hum select kr sakte hai }
    "-password -refreshToken"
  );

  if (!ifCreateUser) {
    throw new ApiError(500, "Something want Wrong While Registering the User ");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, ifCreateUser, "User Created Successfully")); // is function ke ander jo user database main create hua hai ouse hum return kr dange
});

const loginUser = asyncHandler(async (req, res) => {
  // request come for frontend

  const { username, email, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }

  // if username || email or password provide after then find the user in database

  const user = await User.findOne({
    // jab hume 2 condition main se koi ek condition check karni ho to
    // yaa to database main username ho ya email
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User Not Found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password); // ye vo password hai jo request body se aaya hai

  // check if password is true or false

  if (!isPasswordValid) {
    throw new ApiError(401, "Please Enter a Valid Password");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  // console.log("this is refreshToken : ", refreshToken);
  // console.log("this is accessToken : ", accessToken);

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, option)
    .cookie("accessToken", accessToken, option)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Login Successfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, "User Logged Out"));
});

// automatic genrate access token using refresh token

const refreshAccessToken = asyncHandler( async (req, res) => {

  const incomingAccessToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingAccessToken) {
    throw new ApiError(401, "Unauthorize access")
  }

  try {
    const decodeToken = jwt.verify(incomingAccessToken, process.env.REFRESH_TOKEN_SECRET)
  
    const user = await User.findById(decodeToken?._id)
  
    if (!user) {
      throw new ApiError(401, "invalid refresh Token")
    }
  
    if (incomingAccessToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is Expire OR Invalid")
    }
  
    const option = {
      httpOnly: true,
      secure: true
    }
  
    const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
  
    return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", newRefreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          accessToken, refreshToken: newRefreshToken
     },
     "Access Token Refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(501, error?.message || "Invalid token ")
  }

} )

export { registerUser, loginUser, logOutUser, refreshAccessToken };
