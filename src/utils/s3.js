import { Upload } from '@aws-sdk/lib-storage';
import { S3Client,DeleteObjectCommand } from '@aws-sdk/client-s3';

const newS3Client = new S3Client({
    region:'ru-1',
    endpoint:'https://s3.timeweb.cloud',
    credentials:{
        accessKeyId:'PAIGCOPT59XYXCNLUUGU',
        secretAccessKey:'gKxv2FmgGZelCvpUrZwJEiUTbPBa4edQVs4r4ccy'
    }
});

export const sendFile = async(buffer,key) =>{
    try {
        const upload = new Upload({
            client: newS3Client,
            params:{
                Bucket:'0a876bfb-pet-project',
                Key:key,
                Body:buffer,
            }
        });

        const data = await upload.done();
        if(data.$metadata.httpStatusCode === 200 ){
            return data.Location;
        }
    } catch (error) {
        console.log(error);
        
    }
}
export const deleteFileFromS3 = async (key) => {
    try {
      const command = new DeleteObjectCommand({
        Bucket: '0a876bfb-pet-project',
        Key: key,
      });
  
      const response = await newS3Client.send(command);
  
      if (response.$metadata.httpStatusCode === 204) {
        console.log('File successfully deleted:', key);
        return true; 
      } else {
        console.error('Failed to delete file:', key);
        return false; 
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  };