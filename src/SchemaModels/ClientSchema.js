const mongoose = require('mongoose');
const validator = require('validator');

const ClientSchema = new mongoose.Schema({
    firstName:{
        type:String,
        maxLength:[20,"Your First Name Exceeded 20 Characters."],
        minLength:[3,"Your First Name is too short."],
        required:[true,"First Name is Required."],
    },
    middleName:{
        type:String,
        default:"NA",
        maxLength:[20,"Your Middle Name Exceeded 20 Characters."],
        minLength:[2,"Your Middle Name is too short."],
    },
    lastName:{
        type:String, 
        maxLength:[20,"Your Last Name Exceeded 20 Characters."],
        minLength:[2,"Your Last Name is too short."],
        required:[true,"Last Name is Required."],
    },
    gender:{
        type:String,
        required:[true,"Gender is required."],
        enum:["female","male","transgender"],
        message: "VALUE is not a valid gender",
    },
    emailAddress:{
        type:String,
        unique:true,
        required:[true,"Email Address Required."],
        validate:{
            validator(value){
                const allowedDomains = ["gmail.com", "yahoo.com", "outlook.com"];
                const domain = value.split("@")[1];
                return validator.isEmail(value) && allowedDomains.includes(domain);
            },
            message:"Not a valid Email Address.",
        }
    },

    presentAddress:{
        type:String,
        maxLength:[255,"Address exceeded the allowed Number of characters"],
        minLength:[15,"Address is too short."],
    },
    phoneNumber:{
        type:String,
        unique:true,
        required:[true,"Phone number required."],
        validate:{
            validator(value){
                return validator.isMobilePhone(value, 'en-IN',{strictMode:true});
            },
            message:"Phone Number not Valid.",
        },
    },
    isImageUploaded:{
        type:Boolean,
        default:false,
    },
    profileImage:{
        type:String,
        default:"https://thumbs.dreamstime.com/b/collection-four-default-placeholder-avatar-profile-pictures-representing-diverse-male-female-characters-vector-people-faces-335067646.jpg",
    }
},{timestamps:true})

const clientModel = mongoose.model('clients',ClientSchema);

module.exports = clientModel;

