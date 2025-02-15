import { StatusCodes } from 'http-status-codes';
import { sendFile } from "../../utils/s3.js";
import { v4 } from 'uuid';
import path from 'path';

export const uploadFiles = async (req, res) => {
  const uploadedFiles = req.files;

  if (!uploadedFiles || Object.keys(uploadedFiles).length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'No files uploaded.',
    });
  }
  try {
    const fileResponses = [];
    for (const [fieldName, files] of Object.entries(uploadedFiles)) {
      for (const file of files) {
        const key = v4() + path.extname(file.originalname);
        const filePath = await sendFile(file.buffer, key);
        fileResponses.push({
          fieldName,
          filePath,
        });
      }
    }
    res.status(StatusCodes.OK).json({
      success: true,
      files: fileResponses, 
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to upload files.',
    });
  }
};




// import { v4 } from "uuid";
// import path from 'path'
// import { asyncHandler } from "../../middleware/async.handler.js";
// import { sendFile } from "../../utils/s3.js";

// export const uploadFile = asyncHandler(async (req, res) => {
//     const { image } = req.files;
  
//     const filePaths = [];
  
//     const fileGroups = [image];
//     for (const fileGroup of fileGroups) {
//       if (fileGroup) {
//         for (const file of fileGroup) {
//           const key = v4() + path.extname(file.originalname);
//           const filePath = await sendFile(file.buffer, key);
//           filePaths.push(filePath.startsWith('https://') ? filePath : "http://${filePath}");
//         }
//       }
//     }
//   console.log(image, "/file");
  
//     if (filePaths.length === 0) {
//       return res.status(400).json({
//         success: false,
//         msg: 'At least one image  file is required',
//       });
//     }
  
//     res.status(200).json({ success: true, filePaths });
//   });


