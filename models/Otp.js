const mongoose = require('mongoose');
const mailsender = require('../utils/mailSender');

const otpSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
    },
    otp:{
        type: String,
        required:true,
    },
    createdAt:{
        type:Date,
        default: Date.now,
        expires: 5*60, // OTP expires after 5 minutes   
    }
});

//A FUCNTION TO SEND EMAILS

async function sendVerificationEmail(email, otp) {
    try{
        const mailResponse = await mailsender(email,"Verification Email from StudyNotion",`Your OTP for email verification is ${otp}. It will expire in 5 minutes.`);
        console.log("Email sent successfully:", mailResponse);

    }catch(error){
        console.log("Error occured while sending email:", error);
        throw error;
    }
}

otpSchema.pre("save", async function(next){
    await sendVerificationEmail(this.email, this.otp);
})


module.exports = mongoose.model("Otp", otpSchema);
