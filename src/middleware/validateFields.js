function validateRequiredFields(requiredFields) {
  return function (req, res, next) {
    console.log("---------test", req.body);
    const missingFields = [];

    for (const field of requiredFields) {
      if (!(field in req.body)) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `The following fields are required: ${missingFields.join(
          ", "
        )}`,
      });
    }

    // If all required fields are present in req.body, call the next middleware
    next();
  };
}

module.exports = validateRequiredFields;
