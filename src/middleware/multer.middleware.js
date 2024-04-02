import multer from "multer";


// create a local dist storage

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "./public/temp") // ye folder ka path hai jha pr temp files save hogi or yahi se cloudinary main vo files upload honge
    }, 
    filename: function(req, file, cb) {
        const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1E9) // the method simply upload ki gye files ke piche se koi random numbers ko add krne ke liye hai
        cb(null, file.originalname + '-' + uniqueId)
    }
})

export const upload = multer({storage,})