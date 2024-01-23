const jwt = require("jsonwebtoken");
const dotenv = require("dotenv").config();
exports.create=(email, id)=>{
    const token = jwt.sign(
        {
          email:email ,
          userId: id,
        },
        process.env.TOKEN_SECRET,
        { expiresIn: "1h" }
    );
    return token;
};
exports.decodedToken=(tokenData)=>{
  const token = tokenData.split(' ')[1];
  let decodedToken;
  try {
      decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
      return decodedToken;
  } catch (err) {
      console.log(err)
  }
}