// require("dotenv").config();

// const app = require("./src/app");
// const connectDB = require("./src/config/database");

// connectDB()
// // invokeGeminiAi()


// app.listen(3000, () => {
//     console.log("server is running on port 3000");
// });

require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/database");

connectDB();

// Only listen locally, not on Vercel
if (process.env.NODE_ENV !== "production") {
  app.listen(3000, () => {
    console.log("server is running on port 3000");
  });
}

module.exports = app;
