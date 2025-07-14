import express from "express";
import dotenv from 'dotenv';
import mongoose from "mongoose";
import multer from "multer";
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { createHandler } from "graphql-http/lib/use/express";
import graphqlSchema from './graphql/schema.js';
import graphqlResolver from './graphql/resolvers.js';
import { auth } from './middleware/auth-middleware.js';

dotenv.config();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

const __dirname = import.meta.dirname;

const fileFilter = (req, file, cb) => {
   const t = file.mimetype;
   if (t === 'image/png' || t === 'image/jpg' || t === 'image/jpeg') {
      cb(null, true);
   } else {
      cb(null, false);
   }
}

const fileStorage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, 'images');
   },
   filename: (req, file, cb) => {
      cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
   }
});

const app = express();

// app.use(express.urlencoded());   //* Useful for requests that hold data in the format of | x-www-form-urlencoded | through <form> post requests
app.use(express.json());            //* Useful for Content-Type of application/json 

//* Single => file upload (only one file) whose name field is => image
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(cors({
   //* Allows any domain to access your API
   origin: '*',

   //* Specifies which HTTP methods are allowed when accessing the resource
   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

   //* Specifies which headers can be used in the actual request
   allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(auth);

app.put('/post-image', (req, res, next) => {      
   if(!req.isAuth) {
      throw new Error('Not authenticated!');
   }
   
   if(!req.file) {
      return res.status(200).json({
         message: 'No file provided!'
      });
   }
   
   if(req.body.oldPath) {
      clearImage(req.body.oldPath);
   }
      
   return res.status(201).json({
      message: 'File stored!',
      imagePath: req.file.path.replace(/\\/g, "/"),
   });
})

app.use('/graphql', createHandler({
   schema: graphqlSchema,
   rootValue: graphqlResolver,
   formatError(err) {
      if(!err.originalError) {
         return err;
      }
      const data = err.originalError.data;
      const message = err.message || 'An error occurred';
      const status = err.originalError.code || 500;
      return {
         message,
         status,
         data
      }
   },
   context: (req) => {      
      return {
         req,
         isAuth: req.raw.isAuth,
         userId: req.raw.userId
      }
   }
}));

app.use((error, req, res, next) => {
   const status = error.statusCode || 500;
   const message = error.message;
   const data = error.data;
   res.status(status).json({
      message,
      data
   });
})

await mongoose.connect(MONGODB_URI);
app.listen(PORT);

function clearImage(filePath) {
   const __dirname = import.meta.dirname;
   filePath = path.join(__dirname, '..', filePath);
   fs.unlink(filePath, err => console.log(err));
}