import {body, param} from 'express-validator';
import Post from "../models/post-model.js";

export const postValidationRules = {
   create: [      
      body('title')
         .trim()
         .isLength({min: 5}),
      body('content')
         .trim()
         .isLength({min: 5})      
   ],
   update: [
      body('title')
         .trim()
         .isLength({ min: 5 }),
      body('content')
         .trim()
         .isLength({ min: 5 }),
      param('postId')
         .custom(checkOwnership)
   ],
   delete: [
      param('postId')
         .custom(checkOwnership)
   ]
};

export async function checkOwnership(value, { req }) {
   const post = await Post.findById(value);  

   if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
   }

   if (post.creator.toString() !== req.userId.toString()) {
      const error = new Error('Not authnticated');
      error.statusCode = 401; //* Data conflict
      throw error;
   }
};