const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
    // basically Im storing ratings to which servicerequest that got completed since serviceRequestId has all data from whom to whom the service was made all that info.
    _id:{     
        type:mongoose.Schema.Types.ObjectId,
        required:[true,"Missing data."]
    },
    to_Id:{
        type:mongoose.Schema.Types.ObjectId,
        required:[true,"Missing Data."]
    },
    clientName:{
        type:String,
        maxLength:[50,"Your Name Exceeded 50 Characters."],
        minLength:[3,"Your Name is too short."],
        required:[true,"First Name is Required."],
    },
    rating:{
        type:Number,
        min:[1, "Rating must be at least 1."],
        max:[5, "Rating must be at most 5."],
        required:[true,"Missing Data."],
    },
    description:{
        type:String,
        minLength:[3,"Message too short."],
        maxLength:[250,"Message exceeded range."],
    }
},{timestamps:true})

const ratingModel = mongoose.model('ratings',RatingSchema);

module.exports = ratingModel;