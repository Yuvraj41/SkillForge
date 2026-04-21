const User = require("../models/User");
const OTP = require("../models/Otp");
const Profile = require("../models/Profile");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();


//sendOtp controller
exports.sendOtp = async (req, res) => {

    try{
         //fetch email from req body
    const {email} = req.body;

    //check if user already exists
    const checkUserPresent = await User.findOne({email});

    //if user already exists, then return a response
    if(checkUserPresent){
        return res.status(401).json({
            success: false,
            message: "User already exists, please login",
        })
    } 
    
    //generate a 6 digit random otp
    let otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false, 
        specialChars: false, 
        lowerCaseAlphabets: false
    });

    //check unique otp or not
    const result = await OTP.findOne({otp});

    while(result){
        otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false, 
            specialChars: false, 
            lowerCaseAlphabets: false
        });
        const result = await OTP.findOne({otp});
    }

    const otpPayload = {email, otp};

    //create an entry in db for otp
    const otpBody = await OTP.create(otpPayload);
    console.log(otpBody);

    //return response successful
    res.status(200).json({
        success:true,
        message:'OTP Sent Successfully',
        otp,
    })


}catch(error){
        console.log("Error in sendOtp controller:", error);
        return res.status(500).json({
            success: false,
            message: "Error in sending OTP, please try again",
        })
    }
}

//signup controller
exports.signup = async(req,res)=>{
    try {
        //data fetch from req body
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            contactNumber,
            accountType,
            otp
        } = req.body;

        //validation of data
        if(!firstName || !lastName || !email || !password || !contactNumber || !confirmPassword || !accountType || !otp){
            return res.status(403).json({
                success: false,
                message: "All fields are required",
            })
        }
       
        //2 passsword should be same or not
        if(password !== confirmPassword){
            return res.status(400).json({
                success: false,
                message: "Password and Confirm Password do not match",
            });
        }
       
        //check if user already exists or not
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(40).json({
                success: false,
                message: "User already exists, please login",
            });
        }
       
        //find most recent otp stored for user in db
        const recentOtp = await OTP.findOne({email}).sort({createdAt:-1}).limit(1);
        console.log(recentOtp);
       
        //validate otp
        if(recentOtp.length == 0){
            return res.status(400).json({
                success: false,
                message: "OTP not found, please request for a new OTP",
            });
        }else if(otp !== recentOtp.otp){
            return res.status(400).json({
                success: false,
                message: "Invalid OTP, please try again",
            });
        }
 
        //Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        //create entry in db
        const profileDetails = await Profile.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null,
        }); 
  
        const uder = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password: hashedPassword,
            contactNumber,
            accountType,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        })

        //return response
        return res.status(200).json({
            success: true,
            message: "User registered successfully",
            User,
        });

    } catch (error) {
        console.log("Error in signup controller:", error);
        return res.status(500).json({
            success: false,
            message: "Error in registering user, please try again",
        });
    }
}


//login controller
exports.login = async (req, res) => {
    try {
        //fetch data from req body
        const {email, password} = req.body; 
        
        //validation of data
        if(!email || !password){
            return res.status(403).json({
                success: false,
                message: "All fields are required",
            })
        } 
        
        //user check exists or not
        const  user = await User.findOne({email}).populate("additionalDetails");
        if(!user){
            return res.status(401).json({
                success: false,
                message: "User not found, please sign up",
            });
        }
        
        //generate jwt token after password mtching
        if(await bcrypt.compare(password, user.password)){
            const payload = {
                email:user.email,
                id: user._id,
                accountType: user.accountType,
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET,{expiresIn:"2h"});
            user.token = token;
           
            //options for cookie
            const options = {
                expires: new Date(Date.now() + 3*24*60*60*1000), //cookie expires in 3 days
                httpOnly: true,
            }

            //create cookie and send response
            res.cookie("token",token,options).status(200).json({
                success: true,
                token,
                message: "User logged in successfully",
                user,
            });
        }else{
            return res.status(401).json({
                success: false,
                message: "Password is incorrect, please try again",
            });
        }
        
    } catch (error) {
        console.log("Error in login controller:", error);
        return res.status(500).json({
            success: false,
            message: "Error in logging in, please try again",
        });
    }};

//Change password controller
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user.id;

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match" });
        }

        const user = await User.findById(userId);
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Old password is incorrect" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.status(200).json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};