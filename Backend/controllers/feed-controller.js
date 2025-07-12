import express from "express";
import fs from 'fs';
import path from 'path';
import Post from "../models/post-model.js";
import User from "../models/user-model.js";
import { validationResult } from "express-validator";
import { socket } from '../socket.js';

const NUMBER_OF_POSTS = 2;

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
export async function getPosts(req, res, next) {
   try {
      const page = req.query.page || 1;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         const error = new Error('Rendering a post failed');
         error.statusCode = 422;
         throw error;
      }

      const totalPosts = await Post.find().countDocuments();

      const posts = await Post.find()
         .populate('creator')
         .sort({ createdAt: -1 })
         .skip((page - 1) * NUMBER_OF_POSTS)
         .limit(NUMBER_OF_POSTS);
                  
      res.status(200).json({
         message: 'Fetched posts successfully',
         posts: posts,
         totalItems: totalPosts
      });
   } catch (err) {
      if (!err.statusCode) {
         err.statusCode = 500;
      }
      next(err);
   }
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
export async function getPost(req, res, next) {
   try {
      const errors = validationResult(req);
      if(!errors.isEmpty()) {
         const error = new Error('Rendering a post failed');
         error.statusCode = 422; //* the data is incorrect or fails validation
         throw error;
      }

      const {postId} = req.params;
      const post = await Post.findById(postId).populate('creator');

      if(!post) {
         const error = new Error('Post is not found');
         error.statusCode = 404; //* Server cannot find req resource
         throw error;
      }

      res.status(200).json({     //* Successful req
         post: post
      });
   } catch (err) {
      if(!err.statusCode) {
         err.statusCode = 500;   //* Internal unexpected server error
      }
      next(err);
   }
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
export async function createPost(req, res, next) {
   try {
      const { title } = req.body;
      const { content } = req.body;
      const { userId } = req;
      const image = req.file;

      const errors = validationResult(req);
      if(!errors.isEmpty() || !image) {
         let message = 'Invalid data for creating post';
         if(!image) {
            message = 'Invalid image format';
         }
         const error = new Error(message);
         error.statusCode = 422;
         throw error;
      }
      
      const imageUrl = image.path.replace(/\\/g, "/");
      const post = new Post({
         title: title,
         content: content,
         imageUrl: imageUrl,
         creator: userId
         //* The createdAt is done by mongoose through timestamps:true
      });

      await post.save();
      const user = await User.findById(userId);
      user.posts.push(post);  //* mongoose will extract the _id
      await user.save();
      
      //* sending a real-time event to all connected clients.
      //* posts => the event name that clients must be listening for
      //* {} => the data you're sending with that event.
      socket.getIO().emit('posts', {
         action: 'create',
         post: {
            //* ._doc => Gives you just the raw JSON-like object (the actual database fields)
            //* without all the Mongoose overhead such as extra methods.
            ...post._doc, 
            creator: {
               _id: userId,
               name: user.name
            }
         }
      });

      res.status(201).json({  //* Successful req and a new resource was created
         message: 'Post Created Successfully',
         post,
         creator: {
            _id: user._id,
            name: user.name
         }
      });
   } catch(err) {
      if(!err.statusCode) {
         err.statusCode = 500 //* server-side error
      }
      next(err);
   }
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
export async function updatePost(req, res, next) {
   try {
      const { postId } = req.params;
      const { title } = req.body;
      const { content } = req.body;
      const image = req.file;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         const error = new Error('Invalid data for creating post');
         error.statusCode = 422;
         throw error;
      }
      
      const post = await Post.findById(postId).populate('creator');      
            
      if(image) {
         clearImage(post.imageUrl);
         const imageUrl = image.path.replace(/\\/g, "/");
         post.imageUrl = imageUrl;
      }
      
      post.title = title;
      post.content = content;
      await post.save();
      
      socket.getIO().emit('posts', {
         action: 'update',
         post
      });

      res.status(201).json({  //* Successful req and a new resource was created
         message: 'Post Updated Successfully',
         post: post
      });
   } catch (err) {
      if (!err.statusCode) {
         err.statusCode = 500 //* server-side error
      }
      next(err);
   }
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
export async function deletePost(req, res, next) {
   try {
      const { postId } = req.params;      
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         const error = new Error('Invalid data for creating post');
         error.statusCode = 422;
         throw error;
      }

      const post = await Post.findById(postId);
      const user = await User.findById(req.userId);

      // user.posts = user.posts.filter(p => p.toString() !== postId.toString());
      user.posts.pull(postId);
      await user.save();

      clearImage(post.imageUrl);
      const result = await Post.findByIdAndDelete(postId);        
      
      socket.getIO().emit('posts', {
         action: 'delete',
         post: postId
      })

      res.status(200).json({  //* Successful req and a new resource was created
         message: 'Post deleted Successfully',
         post: result
      });
   } catch (err) {      
      if (!err.statusCode) {
         err.statusCode = 500 //* server-side error
      }
      next(err);
   }
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
export async function clearImage(filePath) {
   try {
      const __dirname = import.meta.dirname;
      filePath = path.join(__dirname, '..', filePath);
      fs.unlink(filePath, err => console.log(err));
   } catch (err) {
      
   }
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
export async function getStatus(req, res, next) {
   try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         const error = new Error('Rendering a post failed');
         error.statusCode = 422; //* the data is incorrect or fails validation
         throw error;
      }

      const { userId } = req;
      const user = await User.findById(userId);

      res.status(200).json({
         status: user.status
      });
   } catch (err) {      
      err.statusCode = err.statusCode || 500;      
      next(err);
   }
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
export async function updateStatus(req, res, next) {
   try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         const error = new Error('Rendering a post failed');
         error.statusCode = 422; //* the data is incorrect or fails validation
         throw error;
      }

      const { userId } = req;
      const { status } = req.body;

      const user = await User.findById(userId);
      user.status = status;
      await user.save();

      res.status(200).json({
         message: 'Status updated successfully'
      });
   } catch (err) {
      err.statusCode = err.statusCode || 500;
      next(err);
   }
}