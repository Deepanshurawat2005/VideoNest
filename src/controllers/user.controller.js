import asyncHandler from "./../utils/asyncHandler.js";
import ApiError from "./../utils/ApiError.js";
import user from "../models/user.models.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
const generateAccessAndRefreshTokens=async(userId){
  try{

  }catch(error){
    throw new ApiError(500,"Error while generating access and refresh token")
  }
}
const registerUser = asyncHandler(async (req, res) => {
  /*  
  Steps:->

  1.get data from req.body
  2.validate data
  3.check if user already exists
  4.check for avatar image
  5.upload avatar image to cloudinary
  6.url of the uploaded image
  7.create user object and save to database - create user in database
  8.remove password from refresh token field from response
  9.check for user creation success
  10.retrun response to client
  */
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

  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : "";

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
const loginUser = asyncHandler(async (req, res) => {
  /*
  Steps:->

  1. take data from body
  2. username or email present or not
  3. find the user
  4. password check 
  5. if password is correct then create access and refesh token
  6. send cookie and result that user successfully login

*/

  const { email, username, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "please enter username or email");
  }
  const isUserPresent = await user.findOne({
    $or: [{ username }, { email }],
  });
  if (!isUserPresent) {
    throw new ApiError(401, "user not exit");
  }
  const isPasswordValid = await isUserPresent.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

});

export { registerUser, loginUser };
