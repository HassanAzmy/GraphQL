import express from "express";
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import {hash, compare} from 'bcryptjs';
import User from '../models/user-model.js';
import { validationResult } from "express-validator";

dotenv.config();

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
export async function signup(req, res, next) {
   try {
      const errors = validationResult(req);
      if(!errors.isEmpty()) {         
         const error = new Error('Invalid input');
         error.statusCode = 422;
         error.data = errors.array();
         throw error;
      }

      const { email } = req.body;
      const { password } = req.body;
      const { name } = req.body;
      const hashedPassword = await hash(password, 12);

      const user = new User({
         email, 
         name,
         password: hashedPassword
      });
      const result = await user.save();

      res.status(201).json({
         message: 'User created successfully',
         userId: result._id
      });
   } catch (err) {
      if(!err.statusCode) {
         err.statusCode = 500;
      }
      next(err);
   }
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
export async function login(req, res, next) {
   try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         const error = new Error('Invalid input');
         error.statusCode = 422;
         error.data = errors.array();
         throw error;
      }
      
      const { email } = req.body;
      const { password } = req.body;
      
      const user = await User.findOne({email: email});      

      const isMatch = await compare(password, user.password);
      if(!isMatch) {
         const error = new Error('Invalid input');
         error.statusCode = 401; //* not authenticated
         error.data = errors.array();
         throw error;
      }

      const token = jwt.sign(
         {
            email: user.email,
            userId: user._id.toString()
         }, 
         process.env.JWT_SECRET,
         {
            expiresIn: '1h'
         }
      );

      res.status(200).json({
         message: 'Login successfully',
         token,
         userId: user._id.toString()
      });
   } catch (err) {
      if (!err.statusCode) {
         err.statusCode = 500;
      }
      next(err);
   }
}