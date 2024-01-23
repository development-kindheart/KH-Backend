const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true },
    phoneNumber: { type: String, },
    address: { type: String, },
    city: { type: String, },
    logo: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", },
  },
  {
    timestamps: true, // This option will enable automatic timestamps
  }
);
const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;
