const StoreModel = require("../models/StoreModel");
const WidgetModel = require("../models/WidgetModel");
const FoundationModel = require("../models/FoundationModel");
const UserModel = require("../models/UserModel");
const ObjectId = require("mongodb").ObjectId;
const uploadFile = require("../components/uploadFile");
const { decodedToken } = require("../components/token");
const paginate = require("../middleware/pagination");

const donationToFundation = async (req, res) => {
  try {
    let { orderID, customerID, storeId, storeName, date, foundations } =
      req.body;
    if (orderID && storeId && foundations) {
      storeId = new ObjectId(storeId);
      let foundationId = "";
      let foundationData = "";
      let donations = "";
      let donationData = "";
      let store = "";
      let save = "";
      let widgetId = "";
      let widget = "";
      console.log("storeId", req.body);
      store = await StoreModel.findOne({ user: storeId });
      if (!store) {
        return res.status(404).json({ message: "This Store Does not exist" });
      }
      for (let i = 0; i < foundations.donationDetails.length; i++) {
        foundationId = foundations.donationDetails[i].foundationid;
        foundationId = new ObjectId(foundationId);
        widgetId = foundations.donationDetails[i].widgetId;
        widgetId = new ObjectId(widgetId);
        foundationData = await FoundationModel.findOne({ user: foundationId });
        widget = await WidgetModel.findOne({ _id: widgetId });

        if (foundationData && widget) {
          donations = foundationData.donations;
          let currentDate = new Date();
          donationData = {
            orderID: orderID,
            customerID: customerID,
            storeId: storeId,
            storeName: storeName,
            date: currentDate,
            widgetId: widgetId,
            amount: foundations.donationDetails[i].amount,
          };
          donations.push(donationData);
          foundationData.donations = donations;
          save = await foundationData.save();
        }
      }
      return res.status(200).json({ message: "Data saved" });
    } else {
      res.status(404).json({ message: "invalid data format" });
    }
  } catch (error) {
    console.log("===============err", error);
    res.status(500).json({ message: error });
  }
};

const getFoundationWeeklyData = async (req, res) => {
  try {
    let token = req.get("Authorization");
    let { userId } = decodedToken(token);

    if (userId.length === 24) {
      userId = new ObjectId(userId);

      let foundation = await FoundationModel.findOne({
        user: userId,
      });

      if (foundation) {
        // Filter donations for the current week based on the 'date' field
        const today = new Date();
        const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
        const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6);

        const weeklyData = foundation.donations.filter((donation) => {
          const donationDate = new Date(donation.date);
          return donationDate >= startOfWeek && donationDate <= endOfWeek;
        });

        // Create an object to hold day-wise transaction amounts
        let weeklyTransactions = {
          Sun: 0,
          Mon: 0,
          Tue: 0,
          Wed: 0,
          Thu: 0,
          Fri: 0,
          Sat: 0,
        };

        // Sum donation amounts for each day of the week
        weeklyData.forEach((donation) => {
          const dayOfWeek = donation.date.toLocaleDateString('en-US', { weekday: 'short' });
          weeklyTransactions[dayOfWeek] += donation.amount;
        });

        res.status(200).json({ weeklyTransactions });
      } else {
        res.status(404).json({ message: "Foundation Not Found" });
      }
    } else {
      res.status(404).json({ message: "Invalid Foundation Id" });
    }
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



const getFoundation = async (req, res) => {
  const { page } = req.params;
  try {
    let token = req.get("Authorization");
    let { userId } = decodedToken(token);
    userId = new ObjectId(userId);
    const query = { user: userId };
    let foundation = await paginate(FoundationModel, query, {}, page);
    if (foundation) {
      res.status(200).send(foundation); // Send the foundation object in an array
    } else {
      res.status(404).send({ message: "This Foundation does not exist" });
    }
  } catch (error) {
    console.log("===============err", error);
    res
      .status(500)
      .json({ message: "An error occurred during finding foundation" });
  }
};

const dashboardData = async (req, res) => {
  try {
    let token = req.get("Authorization");
    let { userId } = decodedToken(token);
    const { page } = req.params;

    if (userId.length === 24) {
      userId = new ObjectId(userId);

      // Find the foundation by userId
      let foundation = await FoundationModel.findOne({ user: userId });

      if (foundation) {
        let storeDonations = {};
        let totalDonation = 0;

        // Iterate through donations in the foundation
        foundation.donations.forEach((donation) => {
          const storeId = donation.storeId.toString();
          if (!storeDonations[storeId]) {
            storeDonations[storeId] = {
              storeName: donation.storeName,
              storeId,
              widgetIds: donation.widgetId,
              totalDonation: 0,
            };
          }
          storeDonations[storeId].totalDonation += donation.amount;
          totalDonation += donation.amount;
        });

        // Convert object to array for response
        const storeDonationsArray = Object.values(storeDonations);

        // Response with store donations to the foundation
        res.status(200).json({
          storeDonations: storeDonationsArray,
          totalStores: storeDonationsArray.length,
          totalDonation,
        });
      } else {
        res.status(404).json({ message: "Foundation Not Found" });
      }
    } else {
      res.status(404).json({ message: "Invalid Foundation Id" });
    }
  } catch (error) {
    console.log("===============err", error);
    res.status(500).json({ message: error });
  }
};

const getProfile = async (req, res) => {
  try {
    let userId = req.params.id;
    if (!userId.length == 24) {
      res.status(401).json({ message: "Invalid Foundation Id" });
    }
    userId = new ObjectId(userId);
    let foundation = await FoundationModel.findOne({ user: userId });
    let user = await UserModel.findOne({ _id: userId });
    if (foundation && user) {
      let userData = {
        user: { email: user.email, _id: user._id },
        foundation: foundation,
      };
      res.status(200).json(userData);
    } else {
      res.status(404).json({ message: "invalid FOundation id" });
    }
  } catch (error) {
    console.log("===============err", error);
    res.status(500).json({ message: error });
  }
};
const updateProfile = async (req, res) => {
  try {
    let {
      userId,
      foundationName,
      websiteUrl,
      phoneNumber,
      address,
      city,
      username,
      password,
    } = req.body;

    if (userId.length !== 24) {
      res.status(401).json({ message: "Invalid Foundation Id" });
    }
    userId = new ObjectId(userId);
    let foundation = await FoundationModel.findOne({ user: userId });
    let user = await UserModel.findOne({ _id: userId });
    if (foundation && user) {
      if (req.file) {
        let logo = await uploadFile(req.file.path);
        foundation.logo = logo;
      }
      foundation.foundationName = foundationName;
      foundation.websiteUrl = websiteUrl;
      foundation.phoneNumber = phoneNumber;
      foundation.address = address;
      foundation.city = city;
      foundation.username = username;
      await foundation.save();
      if (password) {
        user.password = password;
        await user.save();
      }
      res.status(200).json({ message: "Foundation Updated" });
    } else {
      res.status(404).json({ message: "invalid foundation id" });
    }
  } catch (error) {
    console.log("===============err", error);
    res.status(500).json({ message: error });
  }
};
const getDataWithFilter = async (req, res) => {
  try {
    const { name, fromDate, toDate, paymentStatus } = req.query;
    let condition = [];
    if (name) {
      condition.push({ $eq: ["$$donation.storeName", name] });
    }
    if (fromDate) {
      condition.push({ $gte: ["$$donation.date", new Date(fromDate)] });
    }

    if (toDate) {
      condition.push({ $lte: ["$$donation.date", new Date(toDate)] });
    }
    if (paymentStatus) {
      condition.push({ $eq: ["$$donation.paymentStatus", paymentStatus] });
    }
    let token = req.get("Authorization");
    let { userId } = decodedToken(token);
    userId = new ObjectId(userId);
    let pipeline = [
      {
        $match: {
          user: userId,
        },
      },
    ];
    if (name) {
      pipeline.push({
        $match: {
          "donations.storeName": name,
        },
      });
    }
    pipeline.push({
      $addFields: {
        donations: {
          $filter: {
            input: "$donations",
            as: "donation",
            cond: {
              $and: condition,
            },
          },
        },
      },
    });
    /*
    [
      { $eq: ["$$donation.storeName", name] },
      { $gte: ["$$donation.date", new Date(fromDate)] },
      { $lte: ["$$donation.date", new Date(toDate)] },
    ],
    */

    const foundation = await FoundationModel.aggregate(pipeline);

    res.status(200).json({ foundation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    let { userId, donationKey, statusValue } = req.body;
    userId = new ObjectId(userId);
    donationKey = new ObjectId(donationKey);
    let foundation = await FoundationModel.findOne({
      user: userId,
    });
    if (!foundation) {
      return res.status(404).json({ message: "Foundation Does not exist" });
    }
    donationObj = foundation.donations.find((data) => {
      return donationKey.equals(data._id);
    });
    if (!donationObj) {
      return res.status(404).json({ message: "This object does not exist" });
    }
    donationObj.paymentStatus = statusValue;
    await foundation.save();
    return res
      .status(200)
      .json({ message: "Payment Stataus Updated Successfully" });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ error: "An error occurred." });
  }
};
const updateStatus = async (req, res) => {
  try {
    const { storeid, status, foundationid } = req.body;
    let updateQuery;

    if (status === "active") {
      updateQuery = { $pull: { pausedBy: storeid } };
    } else if (status === "pause") {
      updateQuery = { $addToSet: { pausedBy: storeid } };
    } else {
      return res.status(400).json({ message: "Invalid status" });
    }

    const foundation = await FoundationModel.findOneAndUpdate(
      { user: foundationid },
      updateQuery,
      {
        new: true,
      }
    );

    if (!foundation) {
      return res.status(404).json({ message: "Foundation not found" });
    }

    res.json(foundation);
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ error: "An error occurred." });
  }
};
module.exports = {
  donationToFundation,
  getFoundation,
  getFoundationWeeklyData,
  dashboardData,
  getProfile,
  updateProfile,
  getDataWithFilter,
  updatePaymentStatus,
  updateStatus,
};
