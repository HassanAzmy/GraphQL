import validator from 'validator';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { hash, compare } from 'bcryptjs';
import User from '../models/user-model.js';

export default { 
   createUser: async function ({ userInput }, req) {
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
   }
}
