const express = require("express");
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const multerconfig = require("./config/multerconfig");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

//index HOME
app.get("/", (req, res) => {
  res.render("index");
});

//upload-image-prof-get
app.get("/profile/upload", (req, res) => {
  res.render("profileupload");
});

//upload-prof-pic-post

app.post("/upload",isLoggedIn, multerconfig.single("profilepic"), async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  user.profilepic = req.file.filename;
  await user.save();
  res.redirect("/profile");
});

//login-get
app.get("/login", (req, res) => {
  res.render("login");
});

//profile
app.get("/profile", isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  await user.populate("posts");
  res.render("profile", { user });
});

//like
app.get("/like/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");

  if (post.likes.indexOf(req.user.userid) === -1) {
    post.likes.push(req.user.userid);
  } else {
    post.likes.splice(post.likes.indexOf(req.user.userid), 1);
  }
  await post.save();
  res.redirect("/profile");
});

//edit
app.get("/edit/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");
  res.render("edit", { post });
});

//update
app.post("/update/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOneAndUpdate(
    { _id: req.params.id },
    { content: req.body.content }
  );
  res.redirect("/profile");
});

//post-postrout
app.post("/post", isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  let post = await postModel.create({
    user: user._id,
    content: req.body.content,
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});
  
//register
app.post("/register", async (req, res) => {
  let { username, name, age, email, password } = req.body;

  let useremail = await userModel.findOne({ email });
  if (useremail) return res.status(400).json("User already registered");

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await userModel.create({
        username,
        name,
        age,
        email,
        password: hash,
      });
      jwt.sign(
        { email: user.email, userid: user._id },
        "secretkey",
        (err, token) => {
          if (err) throw err;
          res.cookie("token", token).redirect("/");
        }
      );
    });
  });
});

//login-post
app.post("/login", async (req, res) => {
  let { email, password } = req.body;

  let user = await userModel.findOne({ email });
  if (!user) return res.status(400).send("Somthing went worng");
  bcrypt.compare(password, user.password, (err, result) => {
    if (result) {
      let token = jwt.sign(
        { email: user.email, userid: user._id },
        "secretkey"
      );
      res.cookie("token", token);
      res.status(200).redirect("/profile");
    } else res.redirect("/login");
  });
});

//logout
app.get("/logout", isLoggedIn, (req, res) => {
  res.cookie("token", "").redirect("/login");
});

//middlewear
function isLoggedIn(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    // No token at all
    return res.redirect("/login");
  }

  try {
    const data = jwt.verify(token, "secretkey");
    req.user = data;
    next();
  } catch (err) {
    // Token is invalid or expired
    return res.redirect("/login");
  }
}

app.listen(3000, () => {
  console.log("Example app listening on port 3000!");
});
