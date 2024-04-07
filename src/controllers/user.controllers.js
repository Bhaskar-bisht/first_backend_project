import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadCloudinary } from "../utils/coludinary.js";

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

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingAccessToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingAccessToken) {
    throw new ApiError(401, "Unauthorize access");
  }

  try {
    const decodeToken = jwt.verify(
      incomingAccessToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodeToken?._id);

    if (!user) {
      throw new ApiError(401, "invalid refresh Token");
    }

    if (incomingAccessToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is Expire OR Invalid");
    }

    const option = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", newRefreshToken, option)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(501, error?.message || "Invalid token ");
  }
});

// change current password

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body; //this data will be coming in frontend

  // if user is login i access the user from request.
  // and access the user i find the User From database Using the user._id

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "The Password is incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Change Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(200, req.user, "Current User Get Successfully");
});

// update the account details

const accountDetailsUpdate = asyncHandler(async (req, res) => {
  // request for changing account details

  const { fullName, email } = req.body;

  if (!(fullName || email)) {
    throw new ApiError(400, "please fill out the field");
  }

  // with the help of user _id i found the user in database and update the field

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    // this is mongoDB Opearter for set the value in database
    {
      $set: {
        // the $set Operater Accept the one Object I
        fullName, // i write Also fullname : fullname
        email,
      },
    },
    {
      new: true, // the new Object is true so the data will be return a updated Values
    }
  ).select("-password"); // the select method simplay not return the field there inside is write

  return res
    .status(200)
    .json(new ApiResponse(200, user, "The Details are Updated Sucessfully"));
});

// update a user avatar

const uploadUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is Required");
  }

  const avatar = await uploadCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error On Uploading File in Cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url, //the avatar feild save on database and change the avatar
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Update Successfully"));
});

// upload cover image

const coverImageUpdate = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "cover Image Is required");
  }

  const coverImage = await uploadCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error On uploading image is Cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image Update Successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    // This is first Stage
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel", // ye kha pe hoga ye foreignField main bataya jata hai
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber", // ye kha pe hoga ye foreignField main bataya jata hai
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers", // ye size operater oun document ko count karta hai jinme vo valuse pass ki jati hai
        },
        channelsSubscribedToCount: {
          $size: "$subscribersTo",
        },
        isSubscribed: {
          $cond: {
            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
            then: true,
            else: false
          }
        }
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      }
    }
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not Exit")
  }

  return res
  .status(200)
  .json(new ApiResponse(
    200,
    channel[0],
    "User Channel Fetch Successfully"
  ))
});


const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res
  .status(200)
  .json( new ApiResponse (
    200,
    user[0].watchHistory,
    "watch history fetch Successfully"
  ))
})


export {
  accountDetailsUpdate,
  changeCurrentPassword,
  coverImageUpdate,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  logOutUser,
  loginUser,
  refreshAccessToken,
  registerUser,
  uploadUserAvatar
};

