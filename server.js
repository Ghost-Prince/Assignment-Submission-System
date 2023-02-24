const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.set("strictQuery", false); // getting rid of warning

mongoose.connect("mongodb://127.0.0.1:27017/assignmentSubmissionSystem");

const userSchema = new mongoose.Schema({
    ID: Number,
    name: String,
    email: String,
    password: String,
    role: String,
    branch: String,
    semester: Number
});
const USER = new mongoose.model("User", userSchema);

const assignmentSchema = new mongoose.Schema({
    ID: Number,
    title: String,
    description: String,
    dueDate: Date,
    branch: String,
    semester: Number,
    facultyID: Number
});
const ASSIGNMENT = new mongoose.model("Assignment", assignmentSchema);

app.get("/", (req, res) => {
    res.render("homepage");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/post-assignment", (req, res) => {
    res.render("post-assignment");
});

app.post("/register", (req, res) => {
    USER.count({}, (err1, count) => {
        if (err1) {
            res.send(err1);
        }
        else {
            const tempUser = new USER({
                ID: count + 1,
                name: req.body.newName,
                email: req.body.newEmail,
                password: md5(req.body.newPassword),
                role: req.body.newRole,
                branch: req.body.newBranch,
                semester: req.body.newSemester
            });
            tempUser.save((err2) => {
                if (err2) {
                    res.send(err2);
                }
                else {
                    console.log(tempUser);
                    res.send("<h1>Registration Successfull. You can login now.</h1>");
                }
            });
        }
    });
});

app.post("/login-student", (req, res) => {
    USER.findOne({ email: req.body.email }, (err, foundUser) => {
        if (err) {
            // show a popup saying invalid email or password and redirect to login page
            res.status(500).send(err);
        }
        else if (!foundUser) {
            // show a popup saying invalid email or password and redirect to login page
            res.send("User not found");
        }
        else if (foundUser.password === md5(req.body.password)) {
            let IDs = [], titles = [], descriptions = [], dueDates = [];
            ASSIGNMENT.find({branch : foundUser.branch, semester : foundUser.semester},(err,assignments)=> {
                for(let index = 0; index < assignments.length; index++) {
                    IDs.push(assignments[index].ID);
                    titles.push(assignments[index].title);
                    descriptions.push(assignments[index].description);
                    dueDates.push(assignments[index].dueDate);
                }
                console.log(IDs, titles, descriptions, dueDates);
                console.log(foundUser);
                res.render("student-dashboard", {
                    NAME: foundUser.name,
                    ROLE: foundUser.role,
                    ID: foundUser.ID,
                    IDarray : IDs,
                    title : titles,
                    description : descriptions,
                    dueDate : dueDates
                });
            });
        }
        else {
            // show a popup saying invalid email or password and redirect to login page
            res.send("Password incorrect");
        }
    });
});

app.post("/login-faculty", (req, res) => {
    USER.findOne({ email: req.body.email }, (err, foundUser) => {
        if (err) {
            // show a popup saying invalid email or password and redirect to login page
            res.status(500).send(err);
        }
        else if (!foundUser) {
            // show a popup saying invalid email or password and redirect to login page
            res.send("User not found");
        }
        else if (foundUser.password === md5(req.body.password)) {
            let ID_f = [], title_f = [], description_f = [], dueDate_f = [];
            ASSIGNMENT.find({facultyID : foundUser.ID},(err,assignments_f)=> {
                for(let index = 0; index < assignments_f.length; index++) {
                    ID_f.push(assignments_f[index].ID);
                    title_f.push(assignments_f[index].title);
                    description_f.push(assignments_f[index].description);
                    dueDate_f.push(assignments_f[index].dueDate);
                }
                res.render("faculty-dashboard", {
                    NAME: foundUser.name,
                    ROLE: foundUser.role,
                    ID: foundUser.ID,
                    IDarray : ID_f,
                    title : title_f,
                    description : description_f,
                    dueDate : dueDate_f
                });
            });
        }
        else {
            // show a popup saying invalid email or password and redirect to login page
            res.send("Password incorrect");
        }
    });
});

app.post("/login-hod", (req, res) => {
    USER.findOne({ email: req.body.email }, (err, foundUser) => {
        if (err) {
            // show an error status
            res.status(500).send(err);
        }
        else if (!foundUser) {
            res.send("User not found");
        }
        else if (foundUser.password === md5(req.body.password)) {
            res.render("hod-dashboard", {
                NAME: foundUser.name,
                ROLE: foundUser.role,
                ID: foundUser.ID
            });
        }
        else {
            res.send("Password incorrect");
        }
    });
});

app.post("/post-assignment", (req, res) => {
    try {
        ASSIGNMENT.count({}, (err, count) => {
            const tempAssignment = new ASSIGNMENT({
                ID: count + 1,
                title: req.body.assName,
                description: req.body.assDescription,
                dueDate: req.body.assDueDate,
                branch: req.body.assBranch,
                semester: Number(req.body.assSemester),
                facultyID: Number(req.body.assfacultyID)
            });
            tempAssignment.save((err) => {
                console.log(tempAssignment);
                res.send("Assignment posted successfully.");
            });
        });
    }
    catch (err) {
        res.send(err);
    }
});

app.listen(3000, () => {
    console.log("Server is running on port 3000.");
});

/*
branch, sem, duedate > date 
*/