const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const userRoute = require("./routes/UserRoute");
const widgetRoute = require("./routes/WidgetRoute");
const storeRoute = require("./routes/StoreRoute");
const foundationRoute = require("./routes/FoundationRoute");
const AdminRoute = require("./routes/AdminRoute");
const socketRoutes = require("./routes/SocketRoutes");
const { initSocket } = require("./socket/index");
const populate = require("./components/pupulate");
const cors = require("cors");
const UserModel = require("./models/UserModel");
const dotenv = require("dotenv").config();
const app = express();

populateAdmin();

const corsOptions = {
  origin: process.env.REACT_BASE_URL,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser(process.env.COOKIE_SIGNATURE));
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
// Enable CORS
// app.use(cors());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
// const activeAll = async (req, res) => {
//   try {
//     // Update all users to set active status to true
//     await UserModel.updateMany({}, { active: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };
// activeAll();
// XXXXXXXXXXX Adding Dummy AdminXXXXXXXXXXXXX
// Dummy Admin.
/*
const dummyAdmin = async () => {
  const User = require("./models/UserModel");
  const Admin = require("./models/AdminModel");
  try {
    const userExist = await User.find({ email: "admin@gmail.com" });
    if (userExist.length === 0) {
      const user = new User({
        email: "admin@gmail.com",
        password: "admin",
        role: "admin",
        active: "active",
      });

      const userData = await user.save();

      if (userData) {
        const admin = new Admin({
          username: "Aiva Creative",
          phoneNumber: "admin",
          address: "admin",
          city: "Lahore",
          logo: "https://res.cloudinary.com/dqpt6iyfh/image/upload/v1693574350/aiva_v8vpm3.PNG",
          user: user._id,
        });

        if (await admin.save()) {
          console.log("Admin created");
        }
      } else {
        console.log("User not created");
      }
    } else {
      console.log("Admin already exists");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};
dummyAdmin();
*/

app.use("/admin", AdminRoute);
app.use("/user", userRoute);
app.use("/widget", widgetRoute);
app.use("/store", storeRoute);
app.use("/foundation", foundationRoute);
// app.use("/api/users", socketRoutes);
// populate().then((result) => console.log(result)).catch((err) => console.log(err));
async function populateAdmin() {
  try {
    const admin = await populate();
    console.log('Admin => ', admin);
  } catch (error) {
    console.log(error);
  }
}
app.use((error, req, res, next) => {
  console.log("index-----error", error);
  const status = error.statusCode || 500;
  const message = error.message;
  res.status(status).json({ message: message });
});
// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

const mongoUri = process.env.DB_URL;
console.log(mongoUri, "ur");
if (!mongoUri) {
  throw new Error(
    `MongoURI was not supplied.  Make sure you watch the video on setting up Mongo DB!`
  );
}
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 60000,
});
mongoose.connection.on("connected", () => {
  console.log("Connected to mongo instance");
});
mongoose.connection.on("error", (err) => {
  console.error("Error connecting to mongo ", err);
});

const port = app.listen(process.env.PORT, function () {
  console.log(process.env.PORT);
  console.log(`Server started on port ${process.env.PORT}...`);
});
// socket.io
// initSocket(port, corsOptions);

module.exports = app;
