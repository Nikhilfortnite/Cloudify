const cloudinary = require('cloudinary').v2;

cloudinary.config ({
    cloud_name: process.env.CLOUD_NAME , 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:true
});

const uploadImage = async (imagePath,folder,public_id) => {

    const options = {
        use_filename: true,
        unique_filename: false,
        overwrite: true,
        resource_type:"image",
        asset_folder:folder,
        transformation: [
          {
            width: 200,
            height: 200,
            crop: "fill",
            gravity: "face", 
            quality: "auto",  
            fetch_format: "auto"  // Automatically convert image to best format 
          }
        ]
      }; 
      
      if(public_id){
        options.public_id = public_id;
      }
    
      try {
        // Upload the image
        const result = await cloudinary.uploader.upload(imagePath,options);
        return result
      } catch (err) {
        throw new Error(err.message);
      }
  };

const deleteImage = async(public_id,folder)=>{
  try{
    // const publicIdWithFolder = folder ? `${folder}/${public_id}` : public_id;
    // console.log(publicIdWithFolder)
    const deleteResult  = await cloudinary.uploader.destroy(public_id,{resource_type:"image"});
    return deleteResult;
  }
  catch(err){
    throw new Error("Failed to delete Image from cloudinary. Try again.");
  }
}

module.exports = {uploadImage,deleteImage};

