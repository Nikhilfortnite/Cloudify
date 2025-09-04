const mongoose = require('mongoose');
const validator = require('validator');
const clientModel = require('../SchemaModels/ClientSchema');
const serviceProviderModel = require('../SchemaModels/ServiceProviderSchema');

const ServiceRequestSchema = new mongoose.Schema({
    from_Id:{
        type:mongoose.Schema.Types.ObjectId,
        required:[true,"Missing Data."],
        validate:{
            async validator(value) {
                if(value === this.to_Id){
                    return false;
                }
                const user = await clientModel.findById(value);
                return user != null;
            },
            message:"Service Request Denied.",

        },
    },
    to_Id:{
        type:mongoose.Schema.Types.ObjectId,
        required:[true,"Missing Data."],
        validate:{
            async validator(value) {
                const user = await serviceProviderModel.findById(value);
                return user != null;
            },
            message:"Service Request Denied.",

        },
    },
    requestedServices: {
        type: [String], // Specifies that this is an array of strings
        enum:["laptop","mobile","waterfilter","inverter","solar","refrigerator","tv","washing machine","home cleaning","laundry","private chef"],
        required: [true, "Select at least one service provided."], // Makes the field required
        validate: {
            validator: function (value) {
                return value.length > 0; // Ensures the array is not empty
            },
            message: "At least one service should be provided.",
        },
    },

    status:{
        type:String,
        enum:["pending","cancelled","accepted","rejected"],
        required:[true,"status cannot be null."],
        message:"Wrong Data."
    },
    message:{
        type:String,
        required:[true,"Describe the Issue."],
        minLength:[5,"Message too short."],
        maxLength:[300,"Message cant exceed 300 Characters."]
    },
    public_IDs:{
        type:[String],
        validate:{
            validator(value){
                return Array.isArray(value) && value.length <= 3; // Ensure it's an array and has max 3 items
            },
            message:"Input data not formated properly or Maximum 3 Photos Allowed."
        },
    },
    rating:{
        type:Number,
        max:[5,"Rating should be in range 1-5."],
        min:[1,"Rating should be in range 1-5."],
        validate:{
            validator(value){
                return this.status === "accepted";
            },
            message:"Rating will be allowed only after the status is accepted."
        }
    }
},{timestamps:true});
  
const serviceRequestModel = mongoose.model('servicerequests',ServiceRequestSchema);

module.exports = serviceRequestModel;