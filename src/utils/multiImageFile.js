const multer = require('multer');
const path = require('node:path');
const fs = require('fs/promises')
const {uploadImage} = require('./imageUploader');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/'); // Store files in public/assets folder
      },
    filename: (req, file, cb) => {
      const previousFileName = req.body.prevName;
      let uniqueSuffix;
      if(previousFileName){
        uniqueSuffix = previousFileName
      }
      else{
        uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substring(2, 9);
      }       
        const ext = path.extname(file.originalname); // Extract the file extension
        cb(null, `${uniqueSuffix}${ext}`);
      }
})

// fileType validation logic
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
    }
  };


const upload = multer({
storage: storage,
fileFilter: fileFilter, // Optional: validate file types
limits: { fileSize: 3 * 1024 * 1024 } // Optional: limit file size to 2MB
});


const pushFilesToCloudinary = async (req,folder)=>{
    try{
        let isFileUploaded = true;
        const fileDetails= [];
        
        //check if files are present 
        if(!req.files?.shareImages) return fileDetails;

          for(const file of req.files?.shareImages){
            let attempts = 2;
            let imagePath = path.join(file?.destination,file?.filename);
            let photoURL = null;
            while (attempts > 0) {
              try {
                  photoURL = await uploadImage(imagePath,folder);
                  isFileUploaded = true;
                  try {
                    await fs.unlink(imagePath); // Deleting the file from the server after all attempts
                  } catch (err) {
                      console.error('Error removing file:', err);
                  }
                  fileDetails.push({ success: true,id:photoURL.public_id,imageURL:photoURL.secure_url});
                  break;
              } 
              catch (err) {
                  attempts--;
                  if (attempts === 0){
                    if(isFileUploaded) isFileUploaded = false;  // if any files in 3 or less fails to upload then whole operation is considered as failed.
                    fileDetails.push({ success: false, error: err.message });
                    try {
                      await fs.unlink(imagePath); 
                    } catch (err) {
                        console.error('Error removing file:', err);
                    }
                  };
              }
            }
            if(!isFileUploaded) break;
        }
      
        return fileDetails;
      
       }
       catch(err){
        throw new Error("Failed to Upload Files: "+err.message);
       }
}

module.exports = {upload,pushFilesToCloudinary}