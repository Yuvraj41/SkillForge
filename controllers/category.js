const Category = require('../models/Category');

//create tag handler function
exports.createCategory = async (req, res) => {
    try {
        //fetch data from request body
        const {name,description} = req.body;

        //validation
        if(!name || !description){
            return res.status(400).json({
                success:false,
                message:"All fields are required",
            })
        }
        //create entry in DB
        const categoryDetails = await Category.create({
            name:name,
            description:description,
        })
        console.log(categoryDetails);

        //return response
        return res.status(201).json({
            success:true,
            message:"course created successfully",
            data:categoryDetails,
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}

//get all tags handler function
exports.showAllCategories = async (req, res) => {
    try {
        //fetch all tags from DB
        const allCategory = await Category.find({},{name:true,description:true});
        res.status(200).json({
            success:true,           
            message:"All category fetched successfully",
            data:allCategory,
        })
        
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}

//catergoryPageDetails

exports.categoryPageDetails = async(req,res)=>{
    try {
        //get CategoryId
        const {categoryId} = req.body;
        //get courses for specified categoryId
        const selectedCategory = await Category.findById(categoryId)
        .populate("course")
        .exec();

        //validation
        if(!selectedCategory){
            return res.status(404).json({
                success:false,
                message:"Data not found",
            })
        }

        //get courses for different categories
        const differentCategories = await Category.find({
            _id: {$ne:categoryId},
        }).populate("courses")
        .exec();

        //HW:get top selling courses
        //return res
        return res.status(200).json({
            success:true,
            data:{
                selectedCategory,
                differentCategories,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        });


    }
}