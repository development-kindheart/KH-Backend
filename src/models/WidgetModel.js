const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const widgetSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      required: true,
    },
    foundationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, // This option will enable automatic timestamps
  }
);

module.exports = mongoose.model("Widget", widgetSchema);
