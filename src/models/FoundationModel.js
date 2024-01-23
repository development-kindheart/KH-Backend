const mongoose = require("mongoose");

const foundationSchema = new mongoose.Schema(
  {
    govtIssuedFoundationId: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    websiteUrl: { type: String },
    foundationName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    logo: { type: String },
    pausedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "Store" }],
    donations: [
      {
        storeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        widgetId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Widget",
        },
        amount: {
          type: Number,
        },
        orderID: {
          type: String,
        },
        customerID: {
          type: String,
        },
        date: {
          type: Date,
        },
        storeName: {
          type: String,
        },
        paymentStatus: {
          type: String,
          default: "Pending",
          enum: ["Pending", "Approved"],
        },
      },
    ],
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true, // This option will enable automatic timestamps
  }
);

const Foundation = mongoose.model("Foundation", foundationSchema);

foundationSchema.pre("save", function (next) {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }

  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }

    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

foundationSchema.pre("findOneAndUpdate", function (next) {
  const user = this;
  if (!user._update.password) {
    return next();
  }

  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }

    bcrypt.hash(user._update.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }
      user._update.password = hash;
      next();
    });
  });
});

foundationSchema.methods.comparePassword = function (candidatePassword) {
  const user = this;

  return new Promise((resolve) => {
    bcrypt.compare(candidatePassword, user.password, (err, isMatch) => {
      if (err || !isMatch) {
        return resolve(false);
      }

      resolve(true);
    });
  });
};

module.exports = Foundation;
