const StoreModel = require("../models/StoreModel");
const User = require("../models/UserModel");
const Store = require("../models/StoreModel");
const Foundation = require("../models/FoundationModel");
const jwt = require("jsonwebtoken");
const FoundationModel = require("../models/FoundationModel");
const AdminModel = require("../models/AdminModel");
const uploadFile = require("../components/uploadFile");
const randomstring = require("randomstring");
const mailer = require("../components/mailer");
const dotenv = require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;
// Store signup
const registerStore = async (req, res) => {
  try {
    const { email, password, ...storeData } = req.body;

    // Check if the email is already in use by querying the User model
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already exists" });
    }
    const existingUsername = await StoreModel.findOne({
      username: storeData.username,
    });
    if (existingUsername) {
      return res.status(409).json({ message: "User Name already exists" });
    }
    const existingStorename = await StoreModel.findOne({
      storeName: storeData.storeName,
    });
    if (existingStorename) {
      return res.status(409).json({ message: "Store Name already exists" });
    }

    // The email is unique, proceed with store registration
    const user = new User({ email, password, role: "store" });
    await user.save();

    const logo = await uploadFile(req.file.path);
    storeData.logo = logo;
    const store = new StoreModel({ ...storeData, user: user._id });
    await store.save();
    //
    const token = jwt.sign({ userId: user._id }, process.env.TOKEN_SECRET);
    res.status(200).json({
      token: token,
      userId: user._id,
      role: user.role,
      active: user.active,
      message: "Store signup successful",
    });
  } catch (error) {
    console.log("===============err", error);
    res.status(500).json({ message: "An error occurred during signup" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (user) {
      const validity = await user.comparePassword(password);
      if (!validity) {
        res.status(400).json({ message: "Invalid Email or Password" });
      } else {
        const token = jwt.sign({ userId: user._id }, process.env.TOKEN_SECRET);
        res.status(200).json({
          token: token,
          userId: user._id,
          role: user.role,
          active: user.active,
        });
      }
    } else {
      res.status(404).json({ message: "Invalid Email or Password" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
// Foundation signup
const registerFoundation = async (req, res) => {
  try {
    const { email, password, ...foundationData } = req.body;

    const existingFoundation = await FoundationModel.findOne({
      username: foundationData.username,
    });
    if (existingFoundation) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const user = new User({ email, password, role: "foundation" });
    await user.save();
    const logo = await uploadFile(req.file.path);
    foundationData.logo = logo;
    const foundation = new FoundationModel({
      ...foundationData,
      user: user._id,
    });
    await foundation.save();
    //
    const token = jwt.sign({ userId: user._id }, process.env.TOKEN_SECRET);
    res.status(200).json({
      token: token,
      userId: user._id,
      role: user.role,
      active: user.active,
      message: "Foundation signup successful",
    });
  } catch (error) {
    res.status(500).json({ message: "An error occurred during signup" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      const forgotPasswordToken = randomstring.generate();
      await mailer(email, forgotPasswordToken);
      user.forgotPasswordToken = forgotPasswordToken;
      await user.save();
      res.status(200).json({
        message: "We have sent email to you. Please check your inbox",
      });
    } else {
      res.status(404).json({ message: "Invalid Email" });
    }
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

const resetPassword = async (req, res) => {
  try {
    let forgotPasswordToken = req.query.token;
    const { password } = req.body;
    const user = await User.findOne({ forgotPasswordToken });
    if (user) {
      user.password = password;
      user.forgotPasswordToken = "";
      await user.save();
      res.status(200).json({
        message: "Your Password reset successfully",
      });
    } else {
      res.status(404).json({ message: "Your Token has expired" });
    }
  } catch (error) {
    res.status(500).json({ message: error });
  }
};
const userDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let userDetails = {};

    if (user.role === "store") {
      // Fetch details from StoreModel
      const storeDetails = await StoreModel.findOne({ user: id });
      if (storeDetails) {
        userDetails = {
          name: storeDetails.storeName,
          logo: storeDetails.logo,
        };
      }
    } else if (user.role === "foundation") {
      // Fetch details from FoundationModel
      const foundationDetails = await FoundationModel.findOne({ user: id });
      if (foundationDetails) {
        userDetails = {
          name: foundationDetails.foundationName,
          logo: foundationDetails.logo,
        };
      }
    } else if (user.role === "admin") {
      // For admin, you can set default values or provide appropriate behavior
      const adminDetails = await AdminModel.findOne({ user: id });
      userDetails = {
        name: adminDetails.username,
        logo: adminDetails.logo,
      };
    }

    res.json(userDetails);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const refresh = async(req, res, next) => {
  const cookies = req.signedCookies
  if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' })
  const refreshToken = cookies.jwt
  jwt.verify(
    refreshToken, 
    process.env.REFRESH_TOKEN_SECERT, 
    async (err, decoded) => {
      if(err) return res.status(403).json({ message: 'Forbidden' })
      
      // check if user exist
      const username = decoded.username
      const user = await User.findOne({ name: username })
      if (!user) return res.status(401).json({ message: 'Unauthorized' })

      // resign accessToken & return to the client
      const accessToken = jwt.sign(
        { username },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1h' }
      )

      return res.json({ accessToken })
    }
  )
}

module.exports = {
  registerStore,
  login,
  registerFoundation,
  forgotPassword,
  resetPassword,
  userDetails,
  refresh,
};
