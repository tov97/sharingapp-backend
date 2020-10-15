// controller defines all the middleware functions needed
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");
const User = require("../models/user");
const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
let DUMMY_USERS = [
  {
    id: "u1",
    name: "Trevor Tovsen",
    email: "trevor@email.com",
    password: "123456",
  },
];

const getUsers = async (req, res, next) => {
  // const users = DUMMY_USERS;
  // if (!users || users.length === 0) {
  //   return next(new HttpError("Could not find users.", 404));
  // }
  // res.json({ users });
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError("Fetching users failed!", 500);
    return next(error);
  }
  res.json({
    users: users.map((user) => user.toObject({ getters: true })),
  });
};

const createNewUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid inputs", 422));
  }
  // "object destructuring"
  const { name, email, password } = req.body;
  // const hasUser = DUMMY_USERS.find((u) => u.email === email);
  // if (hasUser) {
  //   throw new HttpError("Could not create user, email already exists.", 404);
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Signup failed!", 500);
    return next(error);
  }
  if (existingUser) {
    const error = new HttpError("Email already exists!", 500);
    return next(error);
  }
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Didn't work, try again", 500);
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    image: req.file.path,
    places: [],
  });
  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("Creating user failed, please try agin", 500);
    return next(error);
  }
  //auth token for signup
  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      // process.env.JWT_KEY,
      "pk_dont_share",
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Creating user failed, please try agin", 500);
    return next(error);
  }

  // DUMMY_USERS.push(createdUser);
  res.status(201).json({
    name: createdUser.name,
    userId: createdUser.id,
    email: createdUser.email,
    token: token,
  });
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Login failed!", 500);
    return next(error);
  }
  if (!existingUser) {
    const error = new HttpError("Invalid credentials!", 403);
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "Unable to login, check credentials and try again!",
      500
    );
    return next(error);
  }
  if (!isValidPassword) {
    const error = new HttpError(
      "Unable to login, check credentials and try again!",
      403
    );
    return next(error);
  }
  //auth token for login
  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      // process.env.JWT_KEY,
      "pk_dont_share",
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Login failed, please try agin", 500);
    return next(error);
  }

  // const identifiedUser = DUMMY_USERS.find((u) => u.email === email);
  // if (!identifiedUser || identifiedUser.password !== password) {
  //   throw new HttpError(
  //     "Could not find user, or your password is incorrect",
  //     401
  //   );
  // }
  res.json({
    userId: existingUser.id,
    name: existingUser.name,
    email: existingUser.email,
    token: token,
  });
};

exports.getUsers = getUsers;
exports.createNewUser = createNewUser;
exports.loginUser = loginUser;
