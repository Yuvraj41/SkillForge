const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUpload");

exports.createSubSection = async(req,res)=>{
    try {
        //fetch data from req body
        const {sectionId,title,timeDuration,description} = req.body;

        //extract file/video
        const video = req.files.videoFile;

        //validation
        if(!sectionId || !title || !timeDuration || !description|| !video){
            res.status(400).json({
                success: false,
                message:"All fields are required",
            });
        }
        
        //upload video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);

        //create a sub section
        const SubSectionDetails = await SubSection.create({
            title:title,
            timeDuration:timeDuration,
            description:description,
            videoUrl:uploadDetails.secure_url,
        });

        //update section with this sub section ObjectId
        const updatedSection = await Section.findByIdAndUpdate({_id:sectionId},
            {$push:{
                subSection:SubSectionDetails._id,
            }},
            {new:true}).populate({
                path: "subSection"
            });

        //return res
        return res.status(200).json({
            success:true,
            message:"Sub Section Created Successfully",
            updatedSection,
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"internal Server Error",
            error:error.message,
        })
    }
}

//HW: updateSubSection
exports.updateSubsection = async(req,res)=>{
    try {
        const {subSectionId,title,timeDuration,description,videoUrl} = req.body;

        if( !subSectionId || !title || !timeDuration || !description|| !videoUrl){
            res.status(400).json({
                success: false,
                message:"All fields are required",
            });
        }

        const SubSection = await SubSection.findByIdAndUpdate(subSectionId,
            {
            title,
            timeDuration,
            description,
            videoUrl,
            },
            {new:true});

        res.status(200).json({
            success:true,
            message:"Successfully Updated",
        })
        
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Failed to Update",
            error:error.message,
    })
}
}

//HW: delete SubSection
exports.deleteSubsection = async(req,res)=>{
    try {
        const {subSectionId} = req.param;

        await Section.findByIdAndDelete(subSectionId);

         // remove reference from Section
        await Section.findByIdAndUpdate(subSectionId, {
        $pull: {
        subSection: subSectionId,
       },
       });


        return res.status(200).json({
            success:true,
            message:"Successfully Deleted",
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Failed to Delete",
            error:error.message,
    })
}
}