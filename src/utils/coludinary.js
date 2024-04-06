import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET_KEY 
});

const uploadCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return "File Path is Not Valid"
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })
        console.log('File Upload Successfully', response.url);
        console.log('THis is a Cloudnary response : ', response);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)  // remove the localy saved temp file 
        return null
    }
}

export {uploadCloudinary}