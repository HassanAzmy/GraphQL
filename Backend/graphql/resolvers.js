import validator from 'validator';
import jwt from 'jsonwebtoken';
import { hash, compare } from 'bcryptjs';
import User from '../models/user-model.js';
import Post from '../models/post-model.js';

export default { 
   createUser: async function ({ userInput }) {
      const { email } = userInput;
      const { name } = userInput;
      const { password } = userInput;
      
      const errors = [];
      if(!validator.isEmail(email)) {
         errors.push({message: 'Invalid email'});
      }
      
      if(validator.isEmpty(password) || !validator.isLength(password, {min: 3})) {
         errors.push({ message: 'Invalid password'});
      }

      if(errors.length > 0) {
         const error = new Error('Invalid input.');
         error.data = errors;
         error.code = 422;
         throw error;
      }

      const user = await User.findOne({email});
      if(user) {
         const error = new Error('Email already exist');
         error.code = 409;
         throw error;
      }

      const hashedPassword = await hash(password, 12);
      const newUser = new User({
         email,
         name,
         password: hashedPassword
      });
      
      const createdUser = await newUser.save();
      return {
         ...createdUser._doc,
         _id: createdUser._id.toString()
      }
   },

   login: async function({email, password}) {
      const user = await User.findOne({email});
      if(!user) {
         const error = new Error('User not found');
         error.code = 401;
         throw error;
      }

      const isMatch = await compare(password, user.password);
      if(!isMatch) {
         const error = new Error('Incorrect password');
         error.code = 401;
         throw error;
      }

      const token = jwt.sign(
         {
            userId: user._id.toString(),
            email: user.email
         },
         process.env.JWT_SECRET,
         {
            expiresIn: '1h'
         }
      );
      
      return {
         token,
         userId: user._id.toString()
      }
   },

   createPost: async function ({ postInput }, context) {   
      const { userId } = context;
      const { isAuth } = context;       

      if(!isAuth) {
         const err = new Error('Not Authenticated');
         err.status = 401;
         throw err;
      }

      const { title } = postInput;
      const { content } = postInput;
      const { imageUrl } = postInput;

      const errors = [];
      if(validator.isEmpty(title) || !validator.isLength(title, {min: 3})) {
         errors.push({message: 'Invalid title'});
      }

      if(validator.isEmpty(content) || !validator.isLength(content, { min: 5 })) {
         errors.push({ message: 'Invalid title' });
      }
      
      if (errors.length > 0) {
         const error = new Error('Invalid input.');
         error.data = errors;
         error.code = 422;
         throw error;
      }
      
      const user = await User.findById(userId);
      if(!user) {
         const error = new Error('Invalid user.');
         error.code = 401;
         throw error;
      }

      const post = new Post({
         title,
         content,
         imageUrl,
         creator: user
      });
      const createdPost = await post.save();
      
      user.posts.push(createdPost);
      await user.save();
      
      return {
         ...createdPost._doc,
         creator: user,
         _id: createdPost._id.toString(),
         createdAt: createdPost.createdAt.toISOString(),
         updatedAt: createdPost.updatedAt.toISOString(),
      }
   },

   showPosts: async function(args, context) {
      const { isAuth } = context;

      if (!isAuth) {
         const err = new Error('Not Authenticated');
         err.status = 401;
         throw err;
      }
      
      const totalPosts = await Post.find().countDocuments();
      const posts = await Post.find()
         .sort({createdAt: -1})
         .populate('creator');
      
      return {
         posts: posts.map(p => {
            return {
               ...p._doc,
               _id: p._id.toString(),
               createdAt: p.createdAt.toISOString(),
               updatedAt: p.updatedAt.toISOString(),
            }
         }),
         totalPosts
      }
   }
}
