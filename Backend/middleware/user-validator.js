import { body, param } from 'express-validator';
import { hash, compare } from 'bcryptjs';
import User from "../models/user-model.js";

export const userValidationRules = {
   signup: [
      body('password')
         .trim()
         .isLength({ min: 3 }),
      body('name')
         .isAlpha()
         .trim()
         .not()
         .isEmpty(),
      body('email', 'please enter a valid email')
         .isEmail()
         .custom(async (value, {req}) => {
            const user = await User.findOne({ email: value });

            if (user) {                    
               const error = new Error('Email already exists');
               error.statusCode = 409; //* Data conflict
               throw error;
            }
         })
         .normalizeEmail(),
   ],
   login: [
      body('email')
         .custom(async (value, { req }) => {
            const user = await User.findOne({ email: value });
            
            if (!user) {
               const error = new Error('Invalid email');
               error.statusCode = 401; //* not authenticated
               throw error;
            }
         }),
   ],
   updateStatus: [
      body('status')
         .trim()
         .not()
         .isEmpty()
   ]
};