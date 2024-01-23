const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv").config();
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// upload file
exports.uploadFile = (filePath) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

// delete file
exports.deleteFile = (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

// const AWS = require("aws-sdk");
// const fs = require("fs");
// require("dotenv").config();

// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID1,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY1,
// });

// const uploadFile = async (file) => {
//   const fileStream = fs.createReadStream(file.path);

//   // Check if file already exists in the bucket
//   const fileExists = await s3.headObject({ Bucket: process.env.AWS_STORAGE_BUCKET_NAME, Key: file.originalname }).promise()
//     .then(() => true)
//     .catch(() => false);

//   // Add a timestamp or unique identifier to the filename if it already exists
//   const fileName = fileExists ? `${Date.now()}-${file.originalname}` : file.originalname;

//   const params = {
//     Bucket: process.env.AWS_STORAGE_BUCKET_NAME,
//     Key: fileName,
//     Body: fileStream,
//   };

//   const result = await s3.upload(params).promise();

//   return result.Location;
// };

// module.exports = uploadFile;
