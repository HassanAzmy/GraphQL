import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
export function isAuth(req, res, next) {   
   try {
      const authHeader = req.get('Authorization');
      
      if (!authHeader) {
         const err = new Error('Not authenticated.');
         err.statusCode = 401; //* Not authenticated
         throw err;
      }

      const token = authHeader.split(' ')[1];
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      
      if(!decodedToken) {
         const err = new Error('Not authenticated.');
         err.statusCode = 401; //* Not authenticated
         throw err;
      }

      req.userId = decodedToken.userId;
      next();
   } catch(err) {          
      err.statusCode = err.statusCode || 500;
      next(err);
   }
}