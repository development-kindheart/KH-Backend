const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    storeName: { type: String, required: true },
    website: { type: String },
    phoneNumber: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    logo: { type: String },
    username: { type: String, required: true },
    assignWidget: [
      {
        assignByFoundation: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Foundation",
        },
        widgetID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Widget",
        },
      },
    ],
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true, // This option will enable automatic timestamps
  }
);

const Store = mongoose.model("Store", storeSchema);

storeSchema.pre("save", function (next) {
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

storeSchema.pre("findOneAndUpdate", function (next) {
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

storeSchema.methods.comparePassword = function (candidatePassword) {
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

module.exports = Store;
