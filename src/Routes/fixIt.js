const express = require('express');
const serviceRequestModel = require('../SchemaModels/ServiceRequests');
const {authenticateUser} = require('../Modules/hotModules');
const {isProviderExists} = require('../utils/isUserExist');
const fixItRouter = express.Router();
const {upload,pushFilesToCloudinary} = require('../utils/multiImageFile')

async function isPendingRequest(requestObj){
   try{ 
    const requestData = await serviceRequestModel.findOne(requestObj);
    if(requestData){
        return requestData._id?.toString();
    }
    return false;
    }
    catch(err){
        throw new Error(err.message);
    }
}

fixItRouter.post("/app/request/newservice/:providerID",authenticateUser,upload.fields([{ name: 'shareImages', maxCount: 3 }]),async(req,res)=>{  // post because client can add upto 3 images for their issues.
    try{
        const providerID = req.params.providerID;
        // checking if serviceProvider actually exists.
        if(!isProviderExists(providerID)){
            res.status(400).send("Invalid Data.");
        }

        // if user type is serviceProvider or anyother than client send res update Not Allowed.
        if(req.user?.type!=="client"){
            throw new Error("Action not allowed to this user.");
        }

        const serviceRequestData = {
            from_Id:req.user?._id,
            to_Id:providerID,
            status:"pending",
        }

        // check if already client requested service for the same provider and its status is pending
        if( await isPendingRequest(serviceRequestData)){
            return res.status(409).send("Conflicting request! Try updating the same request.");
        }

        if (req.files?.shareImages) {
            const fileDetails = await pushFilesToCloudinary(req, "Shared-Image-Gallery");

            // Ensure fileInfo exists and contains data before processing
            if (fileDetails && fileDetails.length > 0) {
                const public_IDs = fileDetails.map(file => file.id); // Map to extract ids from fileInfo
    
                // Ensure public_IDs array is not empty and set it to the serviceRequestData
                if (public_IDs.length > 0) {
                    serviceRequestData.public_IDs = public_IDs;
                }
            }
        }
        

        // adding document to collection.
        serviceRequestData.message = req.body.message;
        serviceRequestData.requestedServices = req.body.requestedServices;
        const addDocument = new serviceRequestModel(serviceRequestData);
        const savedDocumnent = await addDocument.save()
        const {__v,createdAt,updatedAt, ...filteredData} = savedDocumnent.toObject();
        res.status(200).send(filteredData); // Im sending data back to show in client's request history. Bcz db change reflect on next login all page loading.  

    }
    catch(err){
        res.status(400).send("Bad Request "+err.message);
    }
})


fixItRouter.patch("/app/request/cancel/:providerID",authenticateUser,async(req,res)=>{
   try{
    const providerID = req.params.providerID;

    // checking if serviceProvider actually exists.
    if(!isProviderExists(providerID)){
        res.status(400).send("Invalid Data.");
    }

    // if user type is serviceProvider or anyother than client send res update Not Allowed.
    if(req.user?.type!=="client"){
        throw new Error("Update not allowed to this user.");
    } 
    
    const serviceRequestData = {
        from_Id:req.user?._id,
        to_Id:providerID,
        status:"pending",
    }

    const Id = await isPendingRequest(serviceRequestData);
  
    if(!Id){
        return res.status(404).send("No Data Found.");
    }

    const cancelACK = await serviceRequestModel.findByIdAndUpdate(Id,{status:"cancelled"},{runValidators:true,new:true});
    //REMINDER make sure you dont send id and passwords
    res.status(200).send({message:"Request Cancelled Succeesfuuly.",data:cancelACK});
   }
   catch(err){
        res.status(500).send("Internal Server Error.");
   }
    
})



module.exports = fixItRouter;
