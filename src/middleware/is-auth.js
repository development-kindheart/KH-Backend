const jwt = require('jsonwebtoken');
const dotenv = require("dotenv").config();
module.exports = (req, res, next) => {
      const authHeader = req.get('Authorization');
      if (!authHeader) {
          return res.status(401).json({ error:"not authenticated" });
      }
      const token = authHeader.split(' ')[1];
      let decodedToken;
      try {
          decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
      } catch (err) {
          return res.status(401).json({ msg:"not authenticated",error: err });
      }
      if (!decodedToken ) {
          return res.status(401).json({ error:"not authenticated" });
      }
      next();
      
  };