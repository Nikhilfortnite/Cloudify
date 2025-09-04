const mongoose = require('mongoose');
const validator = require('validator');
const clientModel = require('../SchemaModels/ClientSchema');
const serviceProviderModel = require('../SchemaModels/ServiceProviderSchema');
const passwordSchema = mongoose.Schema({
    _id:{
        type:mongoose.Schema.Types.ObjectId,
        required:[true,"ID is mandatory."],
        validate:{
            async validator(value){
                // have to search if the _id is present in either Client Model or ServiceProvider Model.
                const model = this.userType ==="client" ? clientModel : serviceProviderModel;
                const user = await model.findById(value);
                return user != null;
            },
            message:"User not matched.",
        }
    },
    userType:{
        type:String,
        enum:["client","serviceProvider"],
        message:"UserType not in allowed list.",
        required:[true,"user type is required."]
    },
    emailAddress:{
        type:String,
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
    password:{
        type:String,
        validate:{
            validator(value){
                const isStrongPassword =  validator.isStrongPassword(value);
                if(!isStrongPassword){
                    throw new Error("Password must include uppercase, lowercase, numbers, and special characters, and be at least 8 characters long.")
                }
            },
            message:"Insecure Password.",
            
        },
    },

},{timestamps:true})

const passwordModel = mongoose.model('passwords',passwordSchema);

module.exports = passwordModel;