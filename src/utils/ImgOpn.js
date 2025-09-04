const {authenticateUser,serviceProviderModel,clientModel} = require('../Modules/hotModules');
const serviceRequestModel = require('../SchemaModels/ServiceRequests');

async function validatePublicID(req){
    try{
        const public_id = req.body?.public_id;
        const folder = req.body?.folder;
        let retrievedData;
        if (folder === "Shared-Image-Gallery") {
            // Check if the request_ID is sent of serviceRequest to find.

            if(!req.body?.request_ID){
              throw new Error("Missing Data")
            }

            retrievedData = await serviceRequestModel.findById(req.body.request_ID);
          
            if (!retrievedData || !retrievedData.public_IDs) {
              throw new Error("Image does not exist.");
            }
          
            if (!retrievedData.public_IDs.includes(public_id)) {
              throw new Error("Invalid Image.");
            }
        }

        if(folder==="Service-Providers-Album"){
          retrievedData = await serviceProviderModel.findById(req.user?._id);
    
          if (!retrievedData || !retrievedData.isImageUploaded) {
            throw new Error("Image does not exist.");
          }
        
          if (!retrievedData.profileImages?.includes(public_id)) {
            throw new Error("Invalid Image.");
          }
        }

        if(folder==="Profile-Image-Gallery"){
          retrievedData = await clientModel.findById(req.user?._id);

          if(!retrievedData || !retrievedData.isImageUploaded) {
            throw new Error("Image does not exist.");
          }

          if(retrievedData.profileImage!==public_id){
            throw new Error("Invalid Image.");
          }
        }

        return retrievedData;
    }
    catch(err){
        throw new Error(err.message);
    }
}


module.exports = validatePublicID;