 const express = require("express");
const router = express.Router();
const {auth} = require("../middlewares/auth");
const{
    deleteAccount,
    updateProfile,
    getUserDetails,
    //updateDisplayPicture,
    //getEnrolledCourses,
} = require("../controllers/Profile");


//routes
router.delete("/deleteProfile",auth,deleteAccount)
router.put("/updateProfile",auth,updateProfile)
router.get("/getUserDetails",auth,getUserDetails)
//router.get("/getEnrolledCourses",auth,getEnrolledCourses)
//router.put("/updateDisplayPicture",auth,updateDisplayPicture)

module.exports = router