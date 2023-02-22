const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
mongoose.set("strictQuery", false); // getting rid of warning

mongoose.connect("mongodb://127.0.0.1:27017/assignmentSubmissionSystem");

const userSchema = mongoose.Schema({
  role: String, // "student", "faculty", or "hod"
  name: String,
  email: String,
  password: String,
  classrooms: [], // list of classrooms for faculty and hod
  enrolledClasses: [], // list of classrooms for students
});

const USER = new mongoose.model("User", userSchema);

app.get("/", function (req, res) {
  res.render("homepage");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  console.log(req.body);
  const tempUser = new USER({
    name: req.body.newName,
    email: req.body.newEmail,
    password: md5(req.body.newPassword),
    role: req.body.newRole,
  });
  tempUser.save(function (err) {
    if (err) {
      res.send(err);
    } else {
      res.send(
        "<h1>Registration Successful. You can now login to your account.</h1>"
      );
    }
  });
});

app.post("/login", function (req, res) {
  console.log(req.body, md5(req.body.password));
  USER.findOne({ email: req.body.email }, function (err, foundUser) {
    if (foundUser.password === md5(req.body.password)) {
      if (foundUser.role === "student") {
        res.render("student-dashboard", {
          NAME: foundUser.name,
          ROLE: foundUser.role,
        });
      } else if (foundUser.role === "faculty") {
        res.render("faculty-dashboard", {
          NAME: foundUser.name,
          ROLE: foundUser.role,
        });
      } else if (foundUser.role === "hod") {
        res.render("hod-dashboard", {
          NAME: foundUser.name,
          ROLE: foundUser.role,
        });
      }
    } else {
      res.send(
        "Login failed. Try to login again by entering correct credentials."
      );
    }
  });
});

app.listen(3000, function () {
  console.log("Server is running on port 3000.");
});