const express = require('express');
const path = require('node:path');
const fs = require('fs/promises')
const {authenticateUser,serviceProviderModel,clientModel} = require('../Modules/hotModules');
const serviceRequestModel = require('../SchemaModels/ServiceRequests');
const {uploadImage,deleteImage} = require('../utils/imageUploader');
const {upload,pushFilesToCloudinary} = require('../utils/multiImageFile'); 
const validatePublicID = require('../utils/ImgOpn');
const ImageRouter  = express.Router();


async function singleImageMiddleware(req, res, next) {
  try{
    if (req.user?.type !== "client") {
      return res.status(403).json({ message: "This user not allowed to upload files." });
    }
    // check if user has the image already if so ask them to update it.
    const checkDocument = await clientModel.findById(req.user?._id);
    if(checkDocument?.isImageUploaded){
      return res.status(400).send("User already has profile image, try updating or delete and upload new one.")
    }
    next();
  }
  catch(err){
    next(err.message);
  }
}


async function MultiImageMiddleware(req, res, next) {
  try{
    if (req.user?.type !== "serviceProvider") {
      return res.status(403).json({ message: "This user not allowed to upload files." });
    }

    const checkDocument = await serviceProviderModel.findById(req.user?._id);
    if(checkDocument?.isImageUploaded){
      return res.status(400).send("User already has profile image, try updating or delete and upload new one.")
    }
    
    next();
  }
  catch(err){
    next(err.message);
  }
}


// this route only for client Profile Image upload.
ImageRouter.post("/app/account/upload/singleImage",authenticateUser,singleImageMiddleware,upload.single('profileImage'),async (req,res)=>{
  try {
    let attempts = 3;
    let isFileUploaded = false;
    let ERROR_MESSAGE;
    let photoURL;
    const imagePath = path.join(req.file?.destination, req.file?.filename);
    
    // Upload Images with retry mechanism
    while (attempts > 0) {
        try {
            photoURL = await uploadImage(imagePath, "Profile-Image-Gallery");
            isFileUploaded = true;
            break;
        } catch (err) {
            attempts--;
            if (attempts === 0) ERROR_MESSAGE = err.message;
        }
    }

    // Remove the uploaded file after all attempts (successful or failed)
    try {
        await fs.unlink(imagePath); // Deleting the file from the server after all attempts
    } catch (err) {
        console.error('Error removing file:', err); // Catching errors related to file removal
    }

    // Check if file upload was successful
    if (isFileUploaded) {
        // Store the public_id in the database here
        const updateDocument = await clientModel.findByIdAndUpdate(req.user._id,{isImageUploaded:true,profileImage:photoURL.public_id},{runValidators:true,new:true});
        const {_id,createdAt,updatedAt,__v, ...cleanedData} = updateDocument.toObject();
        return res.status(200).send({message:"File Uploaded Successfully.",profileData:cleanedData});
    }

    // If upload fails after 3 attempts
    res.status(500).send("Upload Failed after 3 attempts: " + ERROR_MESSAGE);
  } catch (err) {
      res.status(400).send(`File upload Failed: ${err.message}`);
  }

})

// this route only for ServiceProvider Profile Image upload.
ImageRouter.post("/app/upload/SP/images",authenticateUser,MultiImageMiddleware,upload.fields([{ name: 'shareImages', maxCount: 3 }]),async(req,res)=>{
 try{
  const fileDetails = await pushFilesToCloudinary(req,"Service-Providers-Album");

  if (fileDetails && fileDetails.length > 0) {
    // Map to extract ids from fileInfo
    const public_IDs = fileDetails.map(file => {
      if(!file.success) throw new Error("Repeated many times. Try again.");
      return file.id;
    }); 

    // Ensure public_IDs array is not empty and set it to the serviceRequestData
    if (public_IDs.length > 0) {
      const updateDocument = await serviceProviderModel.findByIdAndUpdate(req.user._id,{isImageUploaded:true,profileImages:public_IDs},{runValidators:true,new:true});
      const {_id,createdAt,updatedAt,__v, ...cleanedData} = updateDocument.toObject();
      return res.status(200).send({message:"File Uploaded Successfully.",profileData:cleanedData});
    }
  }

  res.status(500).send("Missing files or Internal Server Error! Try Again.");
 }
 catch(err){
  res.status(500).send("Failed to Upload Files: "+err.message);
 }

})

// if i need to add a single photo in serviceRequest or service provider i want to append the new public_id to the array if its length is 3 then ask them to update

ImageRouter.post("/app/upload/generic/image",authenticateUser,upload.single("newAddon"),async(req,res)=>{
 
  if(!req.file){
    return res.status(400).send("Missing file. Please upload a image file.")
  }
  const imagePath = path.join(req.file?.destination, req.file?.filename);
  try{

    if(!req.body?.folder) throw new Error("Please mention the folder");

    if(req.user.type==="client" && !req.body?.request_ID){  // request_ID is to find the document in sericeRequestsModel
      throw new Error("Missing Data");
    }

    const folder = req.body.folder
    const folderToBe = req.user?.type === "client" ? "Shared-Image-Gallery" : "Service-Providers-Album" ;
    if(folderToBe!==folder) throw new Error("Wrong folder. Please re-check the entered folder.");

    const model = req.user?.type ==="client" ? serviceRequestModel : serviceProviderModel;
    const field = req.user?.type ==="client" ? "public_IDs" : "profileImages" ;
    const document_id = req.user?.type ==="client" ? req.body.request_ID : req.user._id;

    const imageArray = await model.findById(document_id);
    
    if(!imageArray) throw new Error("Unable to find the data.")
    if(req.user.type==="serviceProvider" && !imageArray.isImageUploaded) throw new Error("Fresh upload not allowed.");
    
    if(imageArray[field].length >= 3) throw new Error("Image slots are filled. Try updating image or delete any one of them");

    const photoURL = await uploadImage(imagePath, folderToBe);

    const updateDocument = await model.findByIdAndUpdate(
      document_id,
      { $push: { [field]: photoURL.public_id } }, // Use bracket notation for dynamic field
      { new: true, runValidators: true }
    );

    const {createdAt,updatedAt,__v, ...cleanedData} = updateDocument.toObject();
    res.send({message:"Image added Successfully.",result:cleanedData});
    
  }
  catch(err){
    res.status(400).send({ error: err.message });
  }
  finally {
    // Ensure file is deleted after the request processing
    try {
      await fs.unlink(imagePath);
    } catch (err) {
      console.error('Error removing file:', err.message); 
    }
  }
})

ImageRouter.put("/app/update/image/upload", authenticateUser, upload.single("updateImage"), async (req, res) => {
  if (!req.file) {
    return res.status(404).send("File not found.");
  }

  const imagePath = path.join(req.file?.destination, req.file?.filename);

  try {
    // Set the folder based on user type
    let folderToBe = req.user?.type === "client" ? "Profile-Image-Gallery" : "Service-Providers-Album";
    if (req.body?.request_ID) folderToBe = "Shared-Image-Gallery";

    // Validate the folder and other fields
    if (!req.body?.folder) throw new Error("Folder is missing.");
    if (folderToBe !== req.body?.folder) throw new Error("Wrong folder. Please re-check the entered folder.");
    if (!req.body?.public_id) throw new Error("Please include file name.");

    await validatePublicID(req);

    // Update image data
    const updateImageData = await uploadImage(imagePath, req.body.folder, req.body.public_id);

    res.status(200).send({ message: "Hurray! Image Updated Successfully." });

  } catch (err) {
    res.status(400).send("Failed to Update Image: " + err.message);
  } finally {
    // Ensure file is deleted after the request processing
    try {
      await fs.unlink(imagePath); // Remove the file from the server
    } catch (err) {
      console.error('Error removing file:', err.message); // Log any issues removing the file
    }
  }
});



ImageRouter.delete("/app/delete/image/uploaded",authenticateUser,async(req,res)=>{
  try{
    const public_id = req.body?.public_id;
    const folder = req.body?.folder;

    // check if the request has associated data.
    if(!public_id || !folder){
      throw new Error("Missing Data.")
    }

    let folderToBe = req.user?.type === "client" ? "Profile-Image-Gallery" : "Service-Providers-Album";
    if (req.body?.request_ID) folderToBe = "Shared-Image-Gallery";
    if (folderToBe !== folder) throw new Error("Wrong folder. Please re-check the entered folder.");
    
    // based on the Image purpose like client Profile , serviceProvider images , service request images logic changes.
    if (folder === "Shared-Image-Gallery") {
      // Check if the serviceRequest exists and has a valid public_IDs array
      const retrievedData = await validatePublicID(req);

      // only after confirmation of image validating delete from cloudinary.
      const deleteFromCloudinary = await deleteImage(public_id,folder);
      if(deleteFromCloudinary.result!=="ok"){
        return res.status(404).send("Failed to delete Image: "+deleteFromCloudinary.result);
      }

      const updatedPublic_IDS = retrievedData.public_IDs.filter(id => id!==public_id);

      if(updatedPublic_IDS.length===0){
        const updatedData = await serviceRequestModel.findByIdAndUpdate(req.body.request_ID,{$unset:{public_IDs:""}},{new:true});
        const {from_Id,to_Id, ...filteredData} = updatedData.toObject();
        return res.send({message:"Image deleted Successfully",data:filteredData})
      }

      const updatedData = await serviceRequestModel.findByIdAndUpdate(req.body.request_ID,{public_IDs:updatedPublic_IDS},{new:true});
      const {from_Id,to_Id,__v,createdAt,updatedAt, ...filteredData} = updatedData.toObject();
      return res.send({message:"Image deleted Successfully",data:filteredData})
    }

    if(folder==="Service-Providers-Album"){
      const retrievedData = await validatePublicID(req);
      const deleteFromCloudinary = await deleteImage(public_id,folder)
      if(deleteFromCloudinary.result!=="ok"){
        return res.status(404).send("Failed to delete Image: "+deleteFromCloudinary.result);
      }

      const updatedPublic_IDS = retrievedData.profileImages?.filter(id => id!==public_id);
      
      if(updatedPublic_IDS.length===0){
        const defaultImage = ["https://cdn.pixabay.com/photo/2020/04/12/10/57/store-5033746_640.png"];
        const updatedData = await serviceProviderModel.findByIdAndUpdate(req.user?._id,{isImageUploaded:false,profileImages:defaultImage},{new:true});
        const {_id,...filteredData} = updatedData.toObject();
        return res.send({message:"Image deleted Successfully",data:filteredData});
      }

      const updatedData = await serviceProviderModel.findByIdAndUpdate(req.user?._id,{profileImages:updatedPublic_IDS},{new:true});
      const {_id,__v,createdAt,updatedAt,...filteredData} = updatedData.toObject();
      return res.send({message:"Image deleted Successfully",data:filteredData});
    }

    await validatePublicID(req);
    const deleteFromCloudinary = await deleteImage(public_id,folder);
    if(deleteFromCloudinary.result!=="ok"){
      return res.status(404).send("Failed to delete Image: "+deleteFromCloudinary.result);
    }

    const updatedData = await clientModel.findByIdAndUpdate(req.user?._id,{isImageUploaded:false,profileImage:"https://cdn.pixabay.com/photo/2020/04/12/10/57/store-5033746_640.png"},{new:true});
    const {_id,__v,createdAt,updatedAt, ...filteredData} = updatedData.toObject();
    return res.send({message:"Image deleted Successfully",data:filteredData});
  }
  catch(err){
    res.status(400).send("Image Deletion Failed: "+err.message);
  }
})


module.exports = ImageRouter;