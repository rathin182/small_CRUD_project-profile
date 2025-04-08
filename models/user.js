const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/mini-project");

mongoose.connection.on("connected", () => {
  console.log("Mongoose is connected");
});

const userSchema = new mongoose.Schema({
  username: String,
  name: String,
  age: Number,
  email: String,
  password: String,
  profilepic: {
    type: String,
    default: "default.png"
  },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
});

module.exports = mongoose.model("user", userSchema);