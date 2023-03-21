const AWS = require('aws-sdk');
const express = require("express");
const router = express.Router();
const multer = require('multer');
const User = require("../models/user.models");
const Business = require("../../Buisness-module/models/business.model");


const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  }
});


router.post('/upload', upload.single('profilePicture'), async (req, res) => {
    const { buffer } = req.file;
    const { email,user,business } = req.body;
    const base64Image = buffer.toString('base64');
    let contentType;
    let extension;
  
    if (req.file.mimetype === 'image/jpeg') {
      contentType = 'image/jpeg';
      extension = 'jpg';
    } else if (req.file.mimetype === 'image/png') {
      contentType = 'image/png';
      extension = 'png';
    } else {
      return res.status(400).send('Invalid file type');
    }
  
    const params = {
      Bucket: 'gobbleapp',
      Key: `${Date.now()}.${extension}`, // use a unique key for each image
      Body: Buffer.from(base64Image, 'base64'),
      ContentEncoding: 'base64',
      ContentType: contentType
    };
  
    s3.upload(params,async (err, data) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error uploading image to S3');
      }
      const imageUrl = data.Location;

      if(user){
       await User.updateOne(
            { email: email },
            { $set: { profilePicture:imageUrl } }).then(()=>{
                return res.status(200).send({image:imageUrl,message:'updated'});
            }).catch(err=>{
                return res.status(500).send('Db not updated');
            })
      }
      if(business){
       await Business.updateOne(
            { email: email },
            { $set: { profilePicture:imageUrl } }).then(()=>{
                return res.status(200).send({image:imageUrl,message:'updated'});
            }).catch(err=>{
                return res.status(500).send('Db not updated');
            })
      
      }
  
   
    
    });
  });
  
  module.exports = router;