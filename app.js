// THIS CODE IS NOT IN USE

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
    ID: Number,
    role: String, // "student", "faculty", or "hod"
    name: String,
    email: String,
    password: String,
    classrooms: [], // list of classrooms for faculty and hod
    enrolledClasses: [] // list of classrooms for students
});
const USER = new mongoose.model("User",userSchema);

const classSchema = mongoose.Schema({
    ID: Number,
    name: String,
    description: String,
    facultyId: Number, // ID of the faculty who created the classroom
    students: [], // list of student IDs enrolled in the classroom
    assignments: [] // list of assignment IDs posted in the classroom
});
const CLASS = new mongoose.model("Class",classSchema);

app.get("/", function (req, res) {
  res.render("homepage");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/create-classroom",function(req,res) {
    res.render("create-classroom");
});

app.post("/register",function(req,res) {
    USER.countDocuments({},function(err,count) {
        if(err) {
            res.send(err);
        }
        else {
            const tempUser = new USER({
                ID : count + 1,
                name : req.body.newName,
                email : req.body.newEmail,
                password : md5(req.body.newPassword),
                role : req.body.newRole
            });
            tempUser.save(function(err) {
                if(err) {
                    res.send(err);
                }
                else {
                    res.send("<h1>Registration Successful. You can now login to your account.</h1>");
                }
            });
        }
    });
});

var loggedInUser = "";

app.post("/login",function(req,res) {
    console.log(req.body,md5(req.body.password));
    USER.findOne({email : req.body.email},function(err,foundUser) {
        if(foundUser.password === md5(req.body.password)) {
            loggedInUser = req.body.email;
            if(foundUser.role === "student") {
                res.render("student-dashboard",{
                    NAME : foundUser.name,
                    ROLE : foundUser.role
                });
            }
            else if(foundUser.role === "faculty") {
                res.render("faculty-dashboard",{
                    NAME : foundUser.name
                });
            }
            else if(foundUser.role === "hod") {
                res.render("hod-dashboard",{
                    NAME : foundUser.name,
                    ROLE : foundUser.role
                });
            }
        }
        else {
            res.send("Login failed. Try to login again by entering correct credentials.");
        }
    });
});

app.post("/create-classroom",function(req,res) {
    CLASS.countDocuments(function(err,count) {
        if(err) {
            res.send(err);
        }
        else {
            USER.findOne({email : req.body.classFacultyEmail},function(err,foundUser) {
                if(err) {
                    res.send(err); 
                }
                else {
                    const tempClass = new CLASS({
                        ID : count + 1,
                        name : req.body.className,
                        description : req.body.classDescription,
                        facultyId : Number(foundUser.ID)
                    });
                    tempClass.save(function(err) {
                        if(err) {
                            res.send(err);
                        }
                        else {
                            USER.updateOne(
                                {email : req.body.classFacultyEmail},
                                {
                                    $push : {classrooms : tempClass.ID}
                                },
                                function(err) {
                                    if(err) {
                                        res.send(err);
                                    }
                                    else {
                                        res.send("Classroom created successfully.");
                                    }
                                }
                            );
                        }
                    });
                }
            });
        }
    });
});

app.post("/create-classroom",function(req,res) {
    CLASS.countDocuments(function(err,count) {
        if(err) {
            res.send(err);
        }
        else {
            USER.findOne({email : req.body.classFacultyEmail},function(err,foundUser) {
                if(err) {
                    res.send(err); 
                }
                else {
                    const tempClass = new CLASS({
                        ID : count + 1,
                        name : req.body.className,
                        description : req.body.classDescription,
                        facultyId : Number(foundUser.ID)
                    });
                    tempClass.save(function(err) {
                        if(err) {
                            res.send(err);
                        }
                        else {
                            USER.updateOne(
                                {email : req.body.classFacultyEmail},
                                {
                                    $push : {classrooms : tempClass.ID}
                                },
                                function(err) {
                                    if(err) {
                                        res.send(err);
                                    }
                                    else {
                                        res.send("Classroom created successfully.");
                                    }
                                }
                            );
                        }
                    });
                }
            });
        }
    });
});

app.listen(3000, function () {
  console.log("Server is running on port 3000.");
});