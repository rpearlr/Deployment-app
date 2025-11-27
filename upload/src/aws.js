const { S3 } = require("aws-sdk");
const fs = require("fs");

const s3 = new S3({
  accessKeyId: process.env.ACCESS_ID,
  secretAccessKey: process.env.SECRET_ACCESS,
  endpoint: process.env.ENDPOINT
});

const uploadFile = async (fileName, localFilePath) => {
  const fileContent = fs.readFileSync(localFilePath);
  const response = await s3
    .upload({
      Body: fileContent,
      Bucket: "vercel",
      Key: fileName
    })
    .promise();
  console.log(response);
};

module.exports = { uploadFile };
