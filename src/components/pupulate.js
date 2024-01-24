const mongoose = require("mongoose");
const User = mongoose.model("User");
const bcrypt = require("bcrypt");

module.exports = async function Populate() {
  try {
    const user = new User({
      username: "Alex",
      email: "admin@example.com",
      password: "12345678",
      role: "admin",
      isAdmin: true,
      active: "true",
    });
    await user.save();
    console.log(user);
    console.log("created");
  } catch (err) {
    return console.log("error", err);
  }
};
