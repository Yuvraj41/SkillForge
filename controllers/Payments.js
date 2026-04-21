const { instance } = require("../config/razorpay.js");
const Course = require("../models/Course.js");
const User = require("../models/User.js");
const mailSender = require("../utils/mailSender.js");
const { courseEnrollmentEmail } = require("../mail/templates/courseEnrollmentEmail.js");
const mongoose = require("mongoose");
const crypto = require("crypto");

// Capture payment and initiate Razorpay order
exports.capturePayment = async (req, res) => {
    const { course_id } = req.body;
    const userId = req.user.id;

    if (!course_id) {
        return res.status(400).json({ success: false, message: "Please provide a valid Course ID" });
    }

    let course;
    try {
        course = await Course.findById(course_id);
        if (!course) {
            return res.status(404).json({ success: false, message: "Could not find the course" });
        }

        const uid = new mongoose.Types.ObjectId(userId);
        if (course.studentsEnrolled.includes(uid)) {
            return res.status(400).json({ success: false, message: "Student already enrolled in this course" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }

    const options = {
        amount: course.price * 100,
        currency: "INR",
        receipt: Math.random(Date.now()).toString(),
        notes: {
            courseId: course_id,
            userId,
        },
    };

    try {
        const paymentResponse = await instance.orders.create(options);
        console.log(paymentResponse);

        return res.status(200).json({
            success: true,
            courseName: course.courseName,
            courseDescription: course.courseDescription,
            thumbnail: course.thumbnail,
            orderId: paymentResponse.id,
            currency: paymentResponse.currency,
            amount: paymentResponse.amount,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Could not initiate order" });
    }
};

// Verify Razorpay webhook signature
exports.verifySignature = async (req, res) => {
    const webhookSecret = "12345678";
    const signature = req.headers["x-razorpay-signature"];

    const shasum = crypto.createHmac("sha256", webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (signature !== digest) {
        return res.status(400).json({ success: false, message: "Invalid request" });
    }

    console.log("Payment is Authorised");
    const { courseId, userId } = req.body.payload.payment.entity.notes;

    try {
        const enrolledCourse = await Course.findByIdAndUpdate(
            courseId,
            { $push: { studentsEnrolled: userId } },
            { new: true }
        );

        if (!enrolledCourse) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        const enrolledStudent = await User.findByIdAndUpdate(
            userId,
            { $push: { courses: courseId } },
            { new: true }
        );

        const emailResponse = await mailSender(
            enrolledStudent.email,
            "Congratulations from SkillForge",
            courseEnrollmentEmail(enrolledCourse.courseName, enrolledStudent.firstName)
        );
        console.log(emailResponse);

        return res.status(200).json({ success: true, message: "Signature verified and course added" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};