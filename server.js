require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/database");

connectDB()
// invokeGeminiAi()


app.listen(3000, () => {
    console.log("server is running on port 3000");
});