const StoreModel = require("../models/StoreModel");
const WidgetModel = require("../models/WidgetModel");
const FoundationModel = require("../models/FoundationModel");
const UserModel = require("../models/UserModel");
const uploadFile = require("../components/uploadFile");
const ObjectId = require("mongodb").ObjectId;
const { decodedToken } = require("../components/token");
const paginate = require("../middleware/pagination");

const dashboardData = async (req, res) => {
  try {
    let TotalFoundation = await FoundationModel.countDocuments({});
    let TotalStore = await StoreModel.countDocuments({});
    let activeFoundation = await UserModel.countDocuments({
      role: "foundation",
      pause: false,
    });
    let totalCash = await FoundationModel.aggregate([
      {
        $unwind: "$donations",
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$donations.amount" },
        },
      },
    ]);
    res.status(200).json({
      TotalStore: TotalStore,
      TotalFoundation: TotalFoundation,
      activeFoundation: activeFoundation,
      totalCash: totalCash[0].totalAmount,
    });
  } catch (error) {
    console.log("===============err", error);
    res.status(500).json({ message: error });
  }
};

const donationData = async (req, res) => {
  const { page } = req.query;
  const query = {};

  try {
    const result = await paginate(FoundationModel, query, {}, page);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getDataWithFilter = async (req, res) => {
  try {
    const { name, fromDate, toDate, status } = req.query;
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
    if (status) {
      condition.push({ $eq: ["$$donation.paymentStatus", status] });
    }
    let foundations = await FoundationModel.aggregate([
      {
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
      },
      {
        $match: {
          donations: { $ne: [] }, // Exclude objects with empty donation arrays
        },
      },
    ]);
    res.status(200).json(foundations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
};
const getStoreDonations = async (req, res) => {
  try {
    const { page } = req.query;
    const perPage = 10; // Number of items per page
    const aggregationStages = [
      {
        $unwind: "$donations",
      },
      {
        $group: {
          _id: "$donations.storeId",
          foundationData: {
            $first: "$$ROOT",
          },
          totalAmount: {
            $sum: "$donations.amount",
          },
        },
      },
      {
        $lookup: {
          from: "stores",
          localField: "foundationData.donations.storeId",
          foreignField: "user",
          as: "store",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "foundationData.donations.storeId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $project: {
          foundationData: 0,
          "user.password": 0,
          "user.forgotPasswordToken": 0,
          "user.createdAt": 0,
          "user.updatedAt": 0,
          "user._id": 0,
          "store.assignWidget": 0,
        },
      },
    ];

    const result = await paginate(FoundationModel, {}, aggregationStages, page);

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
};

module.exports = {
  getStoreDonations,
};

const getRegisterFoundations = async (req, res) => {
  try {
    let userId = req.query.storeId;
    userId = new ObjectId(userId);
    let foundations = await FoundationModel.aggregate([
      {
        $match: {
          "donations.storeId": userId,
        },
      },

      {
        $lookup: {
          from: "users", // The collection you want to join with
          localField: "user", // The field in the current collection
          foreignField: "_id", // The field in the foreign collection
          as: "user", // The alias for the resulting joined documents
        },
      },
      {
        $project: {
          donations: 0,
          "user.password": 0,
          "user.forgotPasswordToken": 0,
          "user.createdAt": 0,
          "user.updatedAt": 0,
          "user._id": 0,
        },
      },
    ]);

    res.status(200).json(foundations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
};

const getRegisterStores = async (req, res) => {
  try {
    let userId = req.query.foundationId;
    userId = new ObjectId(userId);
    let foundations = await FoundationModel.aggregate([
      {
        $match: {
          user: userId,
        },
      },
      {
        $unwind: "$donations",
      },
      {
        $group: {
          _id: "$donations.storeId",
          foundationData: {
            $first: "$$ROOT",
          },
          totalAmount: {
            $sum: "$donations.amount",
          },
        },
      },
      {
        $addFields: {
          storeName: "$foundationData.donations.storeName", // Add storeName to foundationData
        },
      },
      {
        $project: {
          foundationData: 0,
        },
      },
    ]);

    res.status(200).json(foundations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
};

const getFoundationsDonations = async (req, res) => {
  const { page } = req.params;
  try {
    const aggregationStages = [
      {
        $unwind: "$donations",
      },

      {
        $group: {
          _id: {
            foundationId: "$user",
          },
          foundationData: {
            $first: "$$ROOT",
          },
          totalAmount: {
            $sum: "$donations.amount",
          },
        },
      },

      {
        $lookup: {
          from: "users", // The collection you want to join with
          localField: "foundationData.user", // The field in the current collection (foundations)
          foreignField: "_id", // The field in the foreign collection (users)
          as: "user", // The alias for the resulting joined documents
        },
      },

      {
        $project: {
          "foundationData.donations": 0, // Remove the donations object from foundationData
          "user.password": 0,
          "user.forgotPasswordToken": 0,
          "user.createdAt": 0,
          "user.updatedAt": 0,
          "user._id": 0,
        },
      },
    ];
    let foundations = await paginate(
      FoundationModel,
      {},
      aggregationStages,
      page
    );

    res.status(200).json(foundations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    let { userId } = req.body;
    userId = new ObjectId(userId);
    console.log("userid", userId);
    const user = await UserModel.findOne({ _id: userId });
    if (!user) {
      res.status(404).json({
        message: "This User Does not exist",
      });
    }

    user.pause = !user.pause;
    const updateUser = await user.save();
    if (updateUser) {
      res.status(200).json({ message: "Status Updated Successfully" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const activeCheck = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findById({ _id: id });
    if (user) {
      res
        .status(200)
        .json({ message: "User updated successfully", user: user });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const activeRequest = async (req, res) => {
  const { id } = req.body;
  try {
    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: id },
      { active: true },
      { new: true }
    );
    if (updatedUser) {
      console.log("--------------------updatedddd");
      res
        .status(200)
        .json({ message: "User updated successfully", user: updatedUser });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const findInactiveUsers = async (req, res) => {
  try {
    const { page } = req.query;
    const query = { active: false };

    const inactiveUsers = await paginate(UserModel, query, {}, page);

    res.status(200).json({ users: inactiveUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = findInactiveUsers;

module.exports = {
  dashboardData,
  donationData,
  getDataWithFilter,
  getStoreDonations,
  getRegisterFoundations,
  getRegisterStores,
  getFoundationsDonations,
  updateUserStatus,
  activeCheck,
  activeRequest,
  findInactiveUsers,
};
