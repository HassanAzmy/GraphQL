import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
export function auth(req, res, next) {   
   try {
      const authHeader = req.get('Authorization');
      
      if (!authHeader) {
         req.isAuth = false;
         return next();
      }
      
      const token = authHeader.split(' ')[1];
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      
      if(!decodedToken) {
         req.isAuth = false;
         return next();
      }

      req.userId = decodedToken.userId;
      req.isAuth = true;
            
      next();
   } catch(err) {          
      req.isAuth = false;
      next();
   }
}