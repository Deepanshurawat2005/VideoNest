import asyncHandler from "./../utils/asyncHandler.js";
import ApiError from "./../utils/ApiError.js";
import user from "../models/user.models.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
  //get data from req.body
  //validate data
  //check if user already exists
  //check for avatar image
  //upload avatar image to cloudinary
  //url of the uploaded image
  //create user object and save to database - create user in database
  //remove password from refresh token field from response
  //check for user creation success
  //retrun response to client
  const { fullName, email, username, password } = req.body;
  console.log("email: ", email);
  if (
    [fullName, email, username, password].some((field) => {
      return field?.trim() === "";
    })
  ) {
    throw new ApiError(400, "Please provide all required fields");
  }

  const existedUser = await user.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exits");
  }
const avatarLocalPath = req.files?.avatar?.[0]?.path;
const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

if (!avatarLocalPath) {
  throw new ApiError(400, "Avatar is required");
}
const avatar = await uploadOnCloudinary(avatarLocalPath);

const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath): "";

  if (!avatar) {
    throw new ApiError(400, "Avatar image is required");
  }
  const registeredUser = await user.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  const createdUser = await user
    .findById(registeredUser._id)
    .select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});
export { registerUser };
