const mongoose = require('mongoose');
const validator = require('validator')

const ServiceProviderSchema = new mongoose.Schema({
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
        minLength:[3,"Your Last Name is too short."],
        required:[true,"Last Name is Required."],
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

    shopName:{
        type:String,
        minLength:[5,"Shop name should be atleast 5 characters."],
        maxLength:[50,"Shop name too long."],
    },

    serviceProvided:{
        type:[String],
        minLength:[1,"Atleast one Service should be porvided"],
        enum:["laptop","mobile","waterfilter","inverter","solar","refrigerator","tv","washing machine","home cleaning","laundry","private chef"],
        validate: {
            validator: function(value) {
                return value.length === new Set(value).size;  // to check if the services are not duplicated.
            },
            message: "Services must be unique"
        },
    },

    presentAddress:{
        type:String,
        maxLength:[255,"Address exceeded the allowed Number of characters"],
        minLength:[15,"Address is too short."],
    },
    phoneNumber:{
        type:String,
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
    profileImages:{
        type:[String],
        default:["https://cdn.pixabay.com/photo/2020/04/12/10/57/store-5033746_640.png"],
        validate:{
            validator(value){
                return Array.isArray(value) && value.length <= 3; // Ensure it's an array and has max 3 items
            },
            message:"Input data not formated properly or Maximum 3 Photos Allowed."
        },
    },
    totalNumberOfReviews:{
        type:Number,
        default:0
    },
    totalRatings:{
        type:Number,
        default:0.0
    },
    avrRating:{
        type:Number,
        default:0.0
    }
},{timestamps:true})

const serviceProviderModel = mongoose.model('serviceproviders',ServiceProviderSchema);

module.exports  = serviceProviderModel;