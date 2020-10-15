/** imports **/
const express = require("express");
const { check } = require("express-validator");
const HttpError = require("../models/http-error");

const router = express.Router();
// v v v Middleware v v v
const usersControllers = require("../controllers/users-controller");
const fileUpload = require("../middleware/file-upload");
/***/

router.get("/", usersControllers.getUsers);

router.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersControllers.createNewUser
);

router.post("/login", usersControllers.loginUser);

module.exports = router;
