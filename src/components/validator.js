const { validationResult } = require("express-validator");
exports.checkValidation = (req) => {
  let validation_errors = [];
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    validation_errors = errors.errors.map((err) => err.msg);
  }
  return validation_errors;
};
