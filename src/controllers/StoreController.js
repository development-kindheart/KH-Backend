const StoreModel = require("../models/StoreModel");
const WidgetModel = require("../models/WidgetModel");
const FoundationModel = require("../models/FoundationModel");
const UserModel = require("../models/UserModel");
const uploadFile = require("../components/uploadFile");
const ObjectId = require("mongodb").ObjectId;
const { decodedToken } = require("../components/token");
const paginate = require("../middleware/pagination");

// in this method i will check both foundation and store is paused by admin or not
const isPauseByAdmin = async (id) => {
  let user = await UserModel.findById(id);
  return user.pause;
};

const getStore = async (req, res) => {
  try {
    let { id } = req.params;
    if (id.length == 24) {
      id = new ObjectId(id);
      let store = await StoreModel.findOne({
        user: id,
      });
      if (store) {
        res.status(200).json(store);
      } else {
        res.status(404).json({ message: "Store Not Found" });
      }
    } else {
      res.status(404).json({ message: "invalid Store Id" });
    }
  } catch (error) {
    console.log("===============err", error);
    res.status(500).json({ message: "An error occurred during finding store" });
  }
};

const getStoreWidgets = async (req, res) => {
  try {
    let { id } = req.query; //id is the user id
    if (id.length !== 24) {
      return res.status(401).json({ message: "Pleae enter a valid id" });
    }
    id = new ObjectId(id);
    let store = await StoreModel.findOne({
      user: id,
    });
    if (!store) {
      return res.status(404).json({ message: "Store Not Found" });
    }
    // checking either store is pause by admin or not
    let pauseStoreByAdmin = await isPauseByAdmin(id);
    if (pauseStoreByAdmin) {
      return res.status(401).json({ message: "Store Paused By Admin" });
    }

    let widgetData = [];
    let widgetId;
    let data;
    if (store.assignWidget) {
      for (let i = 0; i < store.assignWidget.length; i++) {
        widgetId = store.assignWidget[i].widgetID;
        widgetId = new ObjectId(widgetId);
        data = await WidgetModel.findOne({ _id: widgetId });

        if (data) {
          // Fetch the associated foundation by ID
          const foundationId = data.foundationId;
          // if the doundation is paused by admin then foundation widget show not show
          let pauseFoundationByAdmin = await isPauseByAdmin(foundationId);
          if (pauseFoundationByAdmin) {
            continue;
          }

          const foundation = await FoundationModel.findOne({
            user: foundationId,
          });

          if (foundation) {
            const isPaused = foundation.pausedBy.includes(new ObjectId(id));

            if (!isPaused) {
              widgetData.push(data);
            }
          }
        }
      }
      res.status(200).json({ widgetData });
    } else {
    }
  } catch (error) {
    console.log("===============err", error);
    res.status(500).json({ message: "An error occurred during finding store" });
  }
};

const getDashboardData = async (req, res) => {
  try {
    let token = req.get("Authorization");
    let { userId } = decodedToken(token);
    const { page } = req.params;
    if (userId.length == 24) {
      userId = new ObjectId(userId);
      let store = await StoreModel.findOne({
        user: userId,
      });
      if (store) {
        const aggregationStages = [
          {
            $addFields: {
              donations: {
                $filter: {
                  input: "$donations",
                  as: "donation",
                  cond: { $eq: ["$$donation.storeId", userId] },
                },
              },
            },
          },
          {
            $unwind: "$donations",
          },
          {
            $group: {
              _id: "$_id",
              foundationData: {
                $first: "$$ROOT",
              },
              totalAmount: {
                $sum: "$donations.amount",
              },
            },
          },
          {
            $project: {
              _id: 0,
              foundationData: 1,
              donations: {
                widgetId: "$foundationData.donations.widgetId",
                totalAmount: "$totalAmount",
              },
            },
          },
        ];

        let foundations = await paginate(
          FoundationModel,
          {},
          aggregationStages,
          page
        );
        let pauseFoundations = await FoundationModel.aggregate([
          {
            $match: {
              pausedBy: userId,
            },
          },
        ]);
        let totalFoundations = await FoundationModel.aggregate(
          aggregationStages
        );

        let activeFoundations =
          totalFoundations.length - pauseFoundations.length;

        res.status(200).json({
          totalFoundations: totalFoundations.length,
          activeFoundations: activeFoundations,
          pauseFoundations: pauseFoundations.length,
          foundations: foundations,
        });
      } else {
        res.status(404).json({ message: "Store Not Found" });
      }
    } else {
      res.status(404).json({ message: "Invalid Store Id" });
    }
  } catch (error) {
    console.log("===============err", error);
    res.status(500).json({ message: error });
  }
};

const getDashboardWeeklyData = async (req, res) => {
  try {
    let token = req.get("Authorization");
    let { userId } = decodedToken(token);
    if (userId.length == 24) {
      userId = new ObjectId(userId);
      let store = await StoreModel.findOne({
        user: userId,
      });
      if (store) {
        const aggregationStages = [
          {
            $match: {
              "donations.storeId": userId,
            },
          },
          {
            $unwind: "$donations",
          },
          {
            $addFields: {
              dayOfWeek: { $dayOfWeek: "$donations.date" }, // Extract day of the week from date
            },
          },
          {
            $group: {
              _id: "$dayOfWeek",
              totalAmount: { $sum: "$donations.amount" },
            },
          },
        ];

        let weeklyData = await FoundationModel.aggregate(aggregationStages);

        // Map the day numbers to their corresponding names
        const dayNames = {
          1: "Sun",
          2: "Mon",
          3: "Tue",
          4: "Wed",
          5: "Thu",
          6: "Fri",
          7: "Sat",
        };

        // Create an object to hold day-wise transaction amounts
        let weeklyTransactions = {};

        // Assign the total amounts to the corresponding day names
        weeklyData.forEach((dayData) => {
          weeklyTransactions[dayNames[dayData._id]] = dayData.totalAmount;
        });

        res.status(200).json({ weeklyTransactions });
      } else {
        res.status(404).json({ message: "Store Not Found" });
      }
    } else {
      res.status(404).json({ message: "Invalid Store Id" });
    }
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getDonationData = async (req, res) => {
  try {
    let token = req.get("Authorization");
    let { userId } = decodedToken(token);
    const { page } = req.params;
    if (userId.length == 24) {
      userId = new ObjectId(userId);
      let store = await StoreModel.findOne({
        user: userId,
      }).populate("user");
      if (store) {
        const aggregationStages = [
          {
            $addFields: {
              donations: {
                $filter: {
                  input: "$donations",
                  as: "donation",
                  cond: { $eq: ["$$donation.storeId", userId] },
                },
              },
            },
          },
        ];
        let foundations = await paginate(
          FoundationModel,
          {},
          aggregationStages,
          page
        );

        res.status(200).json({
          totalFoundations: foundations.length,
          foundations: foundations,
        });
      } else {
        res.status(404).json({ message: "Store Not Found" });
      }
    } else {
      res.status(404).json({ message: "invalid Store Id" });
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
      res.status(401).json({ message: "Invalid store Id" });
    }
    userId = new ObjectId(userId);
    let store = await StoreModel.findOne({ user: userId });
    let user = await UserModel.findOne({ _id: userId });
    if (store && user) {
      let userData = {
        user: user,
        store: store,
      };
      res.status(200).json(userData);
    } else {
      res.status(404).json({ message: "invalid Store id" });
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
      storeName,
      website,
      phoneNumber,
      address,
      city,
      username,
      password,
    } = req.body;
    console.log(req.body);
    if (userId.length !== 24) {
      res.status(401).json({ message: "Invalid store Id" });
    }
    userId = new ObjectId(userId);
    let store = await StoreModel.findOne({ user: userId });
    let user = await UserModel.findOne({ _id: userId });
    if (store && user) {
      if (req.file) {
        console.log("req.file", req.file);
        let logo = await uploadFile(req.file.path);
        store.logo = logo;
      }
      store.storeName = storeName;
      store.website = website;
      store.phoneNumber = phoneNumber;
      store.address = address;
      store.city = city;
      store.username = username;
      await store.save();
      if (password) {
        user.password = password;
        await user.save();
      }
      res.status(200).json({ message: "Store Profile Updated Successfully" });
    } else {
      res.status(404).json({ message: "invalid Store id" });
    }
  } catch (error) {
    console.log("===============err", error);
    res.status(500).json({ message: error });
  }
};

const getDataWithFilter = async (req, res) => {
  try {
    let token = req.get("Authorization");
    let { userId } = decodedToken(token);
    userId = new ObjectId(userId);
    const { name, fromDate, toDate, paymentStatus } = req.query;
    // e.g if khadi hitting this appi then only get own data not others store data
    let condition = [{ $eq: ["$$donation.storeId", userId] }];

    // if user enter the fromDate
    if (fromDate) {
      condition.push({ $gte: ["$$donation.date", new Date(fromDate)] });
    }

    // if user enter the toDate
    if (toDate) {
      condition.push({ $lte: ["$$donation.date", new Date(toDate)] });
    }
    // if user enter the paymentStatus
    if (paymentStatus) {
      condition.push({ $eq: ["$$donation.paymentStatus", paymentStatus] });
    }
    let pipeline = [];
    if (name) {
      pipeline.push({
        $match: {
          foundationName: name,
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

const findStoreWidget = async (req, res) => {
  try {
    let { foundationUserId } = req.query;
    let token = req.get("Authorization");
    let { userId } = decodedToken(token);
    foundationUserId = new ObjectId(foundationUserId);
    userId = new ObjectId(userId);
    let store = await StoreModel.aggregate([
      {
        $match: {
          user: userId,
        },
      },
      {
        $addFields: {
          assignWidget: {
            $filter: {
              input: "$assignWidget",
              as: "widget",
              cond: { $eq: ["$$widget.assignByFoundation", foundationUserId] },
            },
          },
        },
      },
    ]);
    if (store) {
      let widgetID = store[0].assignWidget[0].widgetID;
      widgetID = new ObjectId(widgetID);

      let widgetData = await WidgetModel.findOne({ _id: widgetID });
      return res.status(200).json(widgetData);
    }
    return res.status(404).json({ message: "Store Does not exist" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
};

module.exports = {
  getStore,
  getStoreWidgets,
  getDashboardData,
  getDashboardWeeklyData,
  getDonationData,
  getProfile,
  updateProfile,
  getDataWithFilter,
  findStoreWidget,
};
