const WidgetModel = require("../models/WidgetModel");
const StoreModel = require("../models/StoreModel");
const FoundationModel = require("../models/FoundationModel");
const uploadFile = require("../components/uploadFile");
const dotenv = require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;
const { decodedToken } = require("../components/token");

const addWidget = async (req, res) => {
  try {
    let token = req.get("Authorization");
    let { userId } = decodedToken(token);

    const widgetData = req.body;
    const logo = await uploadFile(req.file.path);
    widgetData.logo = logo;
    widgetData.foundationId = new ObjectId(userId);
    const widget = new WidgetModel({ ...widgetData });
    await widget.save();
    res.status(200).json({ message: "widget created", data: widget });
  } catch (error) {
    console.log("===============err", error);
    res
      .status(500)
      .json({ message: "An error occurred during creating widget" });
  }
};

const editWidget = async (req, res) => {
  try {
    let { ...widgetData } = req.body;
    let { id } = req.params;
    id = new ObjectId(id);
    let widget = await WidgetModel.findOne({ _id: id });
    if (widget) {
      if (req.file) {
        widget.logo = await uploadFile(req.file.path);
      }

      widget.title = widgetData.title;
      widget.description = widgetData.description;
      await widget.save();
      res.status(200).json({ message: "widget updated" });
    } else {
      res.status(404).json({ message: "Widget not found" });
    }
  } catch (error) {
    console.log("===============err", error);
    res
      .status(500)
      .json({ message: "An error occurred during creating widget" });
  }
};

const getWidget = async (req, res) => {
  try {
    let token = req.get("Authorization");
    let { userId } = decodedToken(token);
    let { id } = req.params;
    id = new ObjectId(id);
    let widget = await WidgetModel.findOne({
      _id: id,
      // foundationId: userId,
    });
    if (widget) {
      res.status(200).json(widget);
    } else {
      res.status(404).json({ message: "Widget not found" });
    }
  } catch (error) {
    console.log("===============err", error);
    res
      .status(500)
      .json({ message: "An error occurred during creating widget" });
  }
};

const getWidgets = async (req, res) => {
  try {
    let token = req.get("Authorization");
    let { userId } = decodedToken(token);
    console.log("userId", userId);
    userId = new ObjectId(userId);
    const widgets = await WidgetModel.find({ foundationId: userId });
    res.status(200).json(widgets);
  } catch (error) {
    console.log("===============err", error);
    res
      .status(500)
      .json({ message: "An error occurred during creating widget" });
  }
};

const delWidget = async (req, res) => {
  try {
    let token = req.get("Authorization");
    let { userId } = decodedToken(token);
    let { id } = req.params;
    id = new ObjectId(id);
    userId = new ObjectId(userId);
    const widget = await WidgetModel.findOne({ _id: id, foundationId: userId });
    if (widget) {
      // finding all the stores which has this widget id
      let stores = await StoreModel.find({
        "assignWidget.widgetID": id,
      });
      let data;
      for (let i = 0; i < stores.length; i++) {
        data = stores[i].assignWidget.filter((data) => {
          return !id.equals(data.widgetID);
        });
        stores[i].assignWidget = data;
        await stores[i].save();
      }
      const delWidget = await WidgetModel.deleteOne({ _id: id });
      res.status(200).json({ message: "widget deleted" });
    } else {
      res.status(404).json({ message: "This foundation have not this widget" });
    }
  } catch (error) {
    console.log("===============err", error);
    res
      .status(500)
      .json({ message: "An error occurred during creating widget" });
  }
};

// XXXXXXXXXXXXXXXXXXXXXXXXAssign Widgets XXXXXXXXXXXXXXXXXXXXXXXXXXX

const postAssignWidget = async (req, res) => {
  try {
    let token = req.get("Authorization");
    let { userId } = decodedToken(token); //foundation's user id
    let { storeId, storeName, widgetId } = req.body;
    if (storeId.length !== 24) {
      return res.status(401).send({ message: "Invalid Store Id" });
    }
    if (widgetId.length !== 24 || widgetId === "") {
      return res.status(401).send({ message: "Invalid widget Id" });
    }
    userId = new ObjectId(userId);
    storeId = new ObjectId(storeId);
    widgetId = new ObjectId(widgetId);
    const widget = await WidgetModel.findOne({ _id: widgetId });
    const store = await StoreModel.findOne({ user: storeId });

    if (widget && store) {
      let assignWidgetExist = store.assignWidget.find((storeData) => {
        return userId.equals(storeData.assignByFoundation);
      });
      if (assignWidgetExist) {
        return res
          .status(409)
          .send({ message: "You have already assigned widget to this store" });
      }
      store.assignWidget.push({
        assignByFoundation: userId,
        widgetID: widgetId,
      });
      let savestore = await store.save();
      if (savestore) {
        // saving 0 donation to a foundation to get the 0 amount
        let foundation = await FoundationModel.findOne({ user: userId });
        let donations = foundation.donations;
        // today date
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0"); // Add 1 to the month since it's 0-based
        const day = String(today.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;
        //
        let donationData = {
          orderID: 0,
          customerID: 0,
          storeId: storeId,
          storeName: store.storeName,
          date: formattedDate,
          widgetId: widgetId,
          amount: 0,
        };
        donations.push(donationData);
        foundation.donations = donations;
        let savefoundation = await foundation.save();
        if (savefoundation) {
          res.status(200).send({
            message: "This Widget assigned to the store successfully",
          });
        }
      }
    } else {
      res.status(404).send({ message: "Invalid Widget ID or Store ID" });
    }
  } catch (error) {
    console.log("===============err", error);
    res
      .status(500)
      .json({ message: "An error occurred during assigning a widget" });
  }
};

const findWidgetAssignedStores = async (req, res) => {
  try {
    let token = req.get("Authorization");
    let { userId } = decodedToken(token);
    userId = new ObjectId(userId);
    let stores = await StoreModel.find({
      "assignWidget.assignByFoundation": userId,
    });
    if (stores) {
      let data = null;
      for (let i = 0; i < stores.length; i++) {
        data = stores[i].assignWidget.find((data) => {
          return userId.equals(data.assignByFoundation);
        });
        if (data) {
          stores[i].assignWidget = data;
        }
      }

      const widgets = await WidgetModel.find({
        foundationId: userId,
      });
      res.status(200).json({ stores: stores, widgets: widgets });
    } else {
      res
        .status(404)
        .json({ message: "No Stores exist which have assigned widget" });
    }
  } catch (error) {
    console.log("===============err", error);
    res
      .status(500)
      .json({ message: "An error occurred during assigning a widget" });
  }
};

const editAssignWidget = async (req, res) => {
  try {
    let { storeId, widgetId } = req.body;
    let token = req.get("Authorization");
    let { userId } = decodedToken(token);
    userId = new ObjectId(userId);
    storeId = new ObjectId(storeId);
    widgetId = widgetId.split(",");
    let oldWidgetId = new ObjectId(widgetId[0]);
    let newWidgetId = new ObjectId(widgetId[1]);
    let store = await StoreModel.findOne({
      _id: storeId,
    });
    let oldWidget = await WidgetModel.findOne({
      _id: oldWidgetId,
    });
    let newWidget = await WidgetModel.findOne({
      _id: newWidgetId,
    });

    if (!store || !oldWidget || !newWidget) {
      return res
        .status(404)
        .json({ message: "store or oldwidget or newwidget not found" });
    }

    let data = null;

    data = store.assignWidget.find((widgetData) => {
      console.log("widgetData.widgetID", widgetData.widgetID);
      console.log("oldWidgetId", oldWidgetId);
      return oldWidgetId.equals(widgetData.widgetID);
    });
    if (data) {
      data.widgetID = newWidgetId;
      store.assignWidget = data;
      await store.save();
      res
        .status(200)
        .json({ message: "Edit assign widget to store successfully" });
    } else {
      res.status(404).json({ message: "Widget does not exist" });
    }
  } catch (error) {
    console.log("===============err", error);
    res
      .status(500)
      .json({ message: "An error occurred during assigning a widget" });
  }
};

const removeAssignWidget = async (req, res) => {
  try {
    let { storeId, widgetId } = req.body;
    let token = req.get("Authorization");
    let { userId } = decodedToken(token);
    userId = new ObjectId(userId);
    storeId = new ObjectId(storeId);
    widgetId = new ObjectId(widgetId);

    let store = await StoreModel.findOne({
      _id: storeId,
    });
    let widget = await WidgetModel.findOne({
      _id: widgetId,
      foundationId: userId,
    });
    if (!store || !widget) {
      res.status(404).json({ message: "store or widget does not exist" });
    }
    let data = null;

    data = store.assignWidget.filter((data) => {
      return !widgetId.equals(data.widgetID);
    });
    if (data) {
      store.assignWidget = data;
    }
    await store.save();
    res
      .status(200)
      .json({ message: "Widget Remove from the store successfully" });
  } catch (error) {
    console.log("===============err", error);
    res
      .status(500)
      .json({ message: "An error occurred during assigning a widget" });
  }
};

module.exports = {
  addWidget,
  editWidget,
  getWidget,
  getWidgets,
  delWidget,
  postAssignWidget,
  findWidgetAssignedStores,
  removeAssignWidget,
  editAssignWidget,
};
