import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

// Configure Cloudinary using the provided credentials
// You can also use process.env.CLOUDINARY_URL directly if set in .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ddkwqm8sb',
  api_key: process.env.CLOUDINARY_API_KEY || '768735149721218',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'rMKFKv6Pc9KEcbPEfbrNRrsF_nM'
});

export default cloudinary;
