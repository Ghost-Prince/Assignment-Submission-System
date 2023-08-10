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

// <---------- Schemas and Models ---------->
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

const submissionSchema = new mongoose.Schema({
    ID: Number,
    assignmentId: Number,
    studentID: Number,
    link: String,
    score: Number,
    dateSubmitted: Date
});
const SUBMISSION = new mongoose.model("Submission", submissionSchema);

// <---------- GET routes ---------->
app.get("/", (req, res) => {
    res.render("homepage");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/post-assignment", (req, res) => {
    res.render("post-assignment");
});

app.get("/submit-assignment/:assID", (req, res) => {
    let assignmentToSubmit = Number(req.params.assID);
    console.log("Assignment ID to submit: ", assignmentToSubmit);
    ASSIGNMENT.findOne({ ID: assignmentToSubmit }, (err, foundAssignment) => {
        res.render("submit-assignment", {
            ID: foundAssignment.ID,
            title: foundAssignment.title,
            description: foundAssignment.description,
            dueDate: foundAssignment.dueDate
        });
    });
});

app.get("/view-student-submission/:student_user_ID",(req,res)=> {
    SUBMISSION.find({studentID : req.params.student_user_ID},(err,foundSubmissions)=> {
        let submission_ID = [], assignment_ID = [], solution_link = [], awarded_score = [], submission_date = [];
        for(let index = 0; index < foundSubmissions.length; index++) {
            submission_ID.push(foundSubmissions[index].ID);
            assignment_ID.push(foundSubmissions[index].assignmentId);
            solution_link.push(foundSubmissions[index].link);
            awarded_score.push(foundSubmissions[index].score);
            submission_date.push(foundSubmissions[index].dateSubmitted);
        }
        res.render("submission-list",{
            ID : req.params.student_user_ID,
            subID : submission_ID,
            assID : assignment_ID,
            solLink : solution_link,
            score : awarded_score,
            subDate : submission_date
        });
    });
});

app.get("/view-submissions/:assID",(req,res)=> {
    console.log("Showing submission for Assignment: ", req.params.assID);
    SUBMISSION.find({assignmentId : req.params.assID},(err,foundSubmissions)=>{
        let ID_s = [], students_ID_s = [], link_s = [], submittedOn_s = [], score_s = [];
        for(let index = 0; index < foundSubmissions.length; index++) {
            ID_s.push(foundSubmissions[index].ID);
            students_ID_s.push(foundSubmissions[index].studentID);
            link_s.push(foundSubmissions[index].link);
            submittedOn_s.push(foundSubmissions[index].dateSubmitted);
            score_s.push(foundSubmissions[index].score);
        }
        console.log(link_s);
        res.render("view-submissions",{
            ASS_ID : req.params.assID,
            submissionID : ID_s,
            studentID : students_ID_s,
            submissionLink : link_s,
            submissionDate : submittedOn_s,
            submissionScore : score_s
        });
    });
});

app.get("/show-posted-assignments/:facID",(req,res)=> {
    ASSIGNMENT.find({facultyID : Number(req.params.facID)},(err,assignmentsByFaculty)=> {
        let ID_a = [], branch_a = [], semester_a = [], title_a = [], description_a = [], dueDate_a = [];
        for(let index = 0; index < assignmentsByFaculty.length; index++) {
            ID_a.push(assignmentsByFaculty[index].ID);
            branch_a.push(assignmentsByFaculty[index].branch);
            semester_a.push(assignmentsByFaculty[index].semester);
            title_a.push(assignmentsByFaculty[index].title);
            description_a.push(assignmentsByFaculty[index].description);
            dueDate_a.push(assignmentsByFaculty[index].dueDate);
        }
        res.render("show-posted-assignments",{
            facID : req.params.facID,
            ID : ID_a,
            branch : branch_a,
            semester : semester_a,
            title : title_a,
            description : description_a,
            dueDate : dueDate_a
        });
    });
});

// <---------- POST routes ---------->
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
        else if (foundUser.password === md5(req.body.password) && foundUser.role === "student") {
            let IDs = [], titles = [], descriptions = [], dueDates = [];
            ASSIGNMENT.find({ branch: foundUser.branch, semester: foundUser.semester }, (err, assignments) => {
                for (let index = 0; index < assignments.length; index++) {
                    IDs.push(assignments[index].ID);
                    titles.push(assignments[index].title);
                    descriptions.push(assignments[index].description);
                    dueDates.push(assignments[index].dueDate);
                }
                res.render("student-dashboard", {
                    NAME: foundUser.name,
                    ROLE: foundUser.role,
                    ID: foundUser.ID,
                    IDarray: IDs,
                    title: titles,
                    description: descriptions,
                    dueDate: dueDates
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
        else if (foundUser.password === md5(req.body.password) && foundUser.role === "faculty") {
            let ID_f = [], title_f = [], description_f = [], dueDate_f = [], branch_f = [], semester_f = [];
            ASSIGNMENT.find({ facultyID: foundUser.ID }, (err, assignments_f) => {
                for (let index = 0; index < assignments_f.length; index++) {
                    ID_f.push(assignments_f[index].ID);
                    title_f.push(assignments_f[index].title);
                    description_f.push(assignments_f[index].description);
                    dueDate_f.push(assignments_f[index].dueDate);
                    branch_f.push(assignments_f[index].branch);
                    semester_f.push(assignments_f[index].semester);
                }
                res.render("faculty-dashboard", {
                    NAME: foundUser.name,
                    ROLE: foundUser.role,
                    ID: foundUser.ID,
                    IDarray: ID_f,
                    title: title_f,
                    description: description_f,
                    dueDate: dueDate_f,
                    branch : branch_f,
                    semester : semester_f
                });
            });
        }
        else {
            // show a popup saying invalid email or password and redirect to login page
            res.send("Email or Password incorrect");
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
        else if (foundUser.password === md5(req.body.password) && foundUser.role === "hod") {
            USER.find({role : "faculty"},(err,foundFaculty)=> {
                let ID_f = [], name_f = [];
                for(let index = 0; index < foundFaculty.length; index++) {
                    ID_f.push(foundFaculty[index].ID);
                    name_f.push(foundFaculty[index].name);
                }
                res.render("hod-dashboard", {
                    NAME: foundUser.name,
                    ROLE: foundUser.role,
                    ID: foundUser.ID,
                    ID2 : ID_f,
                    name : name_f
                });
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

app.post("/submit-assignment/:assID", (req, res) => {
    console.log(req.body);
    SUBMISSION.count({}, (err, count) => {
        if (err) {
            res.send(err);
        }
        else {
            const tempSubmission = new SUBMISSION({
                ID: count + 1,
                assignmentId: Number(req.body.assID),
                studentID: Number(req.body.assStudentID),
                link: req.body.assLink,
                score: -1,
                dateSubmitted: new Date()
            });
            tempSubmission.save((err) => {
                if (err) {
                    res.send(err);
                }
                else {
                    console.log(tempSubmission);
                    res.send("Assignment submitted successfully.")
                }
            });
        }
    });
});

app.post("/set-score/:subID",(req,res)=> {
    if (req.body.submissionScore === "" || req.body.submissionScore === null || req.body.submissionScore === undefined || isNaN(req.body.submissionScore)) {
        // open a popup saying invalid score
        res.send("Invalid score.");
    }
    else if (Number(req.body.submissionScore) < 0 || Number(req.body.submissionScore) > 100) {
        // open a popup saying invalid score
        res.send("Invalid score.");
    }
    SUBMISSION.updateOne({ID : req.params.subID},{score : Number(req.body.submissionScore)},(err)=> {
        if(err) {
            res.send("Something went wrong.");
        }
        else {
            res.send("Score awarded successfully.");
        }
    });
});

app.listen(3000, () => {
    console.log("Server is running on port 3000.");
});

/*
branch, sem, duedate > date 
*/