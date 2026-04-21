const Course = require('../models/Course');
const Category = require("../models/Category")
const User = require('../models/User');
const { uploadImageToCloudinary } = require('../utils/imageUpload');

//create course handler function
exports.createCourse = async(req,res)=>{
    try {
        //fetch data from request body
        const {courseName,courseDescription,whatYouWillLearn,price,tag,category,instructions,status} = req.body;

        //get thumbnail
        const thumbnail = req.files.thumbnailImage;

        //validation
        if(!courseName || !courseDescription || !whatYouWillLearn || !price || !tag || !thumbnail || !category){
            return res.status(400).json({
                success:false,
                message:"All fields are required",
            });
        }

        //check for instructor
        const userId = req.user.id;
        const instructorDetails = await User.findById(userId);
        console.log("Instructor Details", instructorDetails);
        
        //TODO: verify that userID and instructorDetails._id are same or different?
        
        if(!instructorDetails){
            return res.status(403).json({
                success:false,
                message:"Instructor details not found",
            });
        }

        //check for tag validity
        const categoryDetails = await Category.findById(tag);
        if(!categoryDetails){
            return res.status(400).json({
                success:false,
                message:"Tag not found",
            });
        }

        //upload thumbnail image to cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail,process.env.FOLDER_NAME);

        //create an entry in new course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn: whatYouWillLearn,
            price,
            tag:tagDetails._id,
            thumbnailImage:thumbnailImage.secure_url,
            category: categoryDetails._id,
            instructions,
            status: status || "Draft",
        })

        //add the new course to the user schema of Instructor
        await User.findByIdAndUpdate(
            {_id: instructorDetails._id},
            {
                $push:{
                    courses: newCourse._id,
                }
                
            },{new:true},
        )
        
        //update the tag schema 
        await  Category.findByIdAndUpdate(
            {_id: categoryDetails._id},
            {
                $push:{
                    courses: newCourse._id,
                }
            },{new:true},
        )

        //return response        
        return res.status(201).json({
            success:true,
            message:"Course created successfully",
            data:newCourse,
        })
    } catch (error)  
     {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Failed to create course",
            error:error.message,
        })
    }
}

//getall courses handler function
exports.showAllCourses = async(req,res)=>{
    try {
        const allCourses = await Course.find({},{courseName:true,
            price:true,
            thumbnailImage:true,
            instructor:true,
            raitingAndReviews:true,
            studentsEnrolled:true,
            tag:true,
        }).populate("instructor").exec();

        return res.status(200).json({
            success:true,
            message:"All courses fetched successfully",
            data:allCourses,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Failed to fetch courses",
            error:error.message,
        })
    }
}

//getCourseDetails
exports.getCourseDetails = async(req,res)=>{
    try {
        //get id
        const {courseId} = req.body;

        //find course details
        const courseDetails = await Course.findById(
            {_id:courseId}
            .populate({
            path:instructor,
            populate:{
                path:"additonalDetails",
            }
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
            path:"courseContent",
            populate:{
                path:"subSection",
            }
        })
        )
        .exec();

        //validation
        if(!courseDetails){
            return res.status(400).json({
                success:false,
                message:`could not find the course with ${courseId}`,
            })
        }

        //return res
        return res.status(200).json({
            success:true,
            message:"Course Details fetched successfully",
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.messsage,
        })
    }
}