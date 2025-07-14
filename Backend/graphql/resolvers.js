import validator from 'validator';
import { hash } from 'bcryptjs';
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
      
      if(validator.isEmpty(password) || !validator.isLength(password, {min: 8})) {
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
         throw new Error('User already exists');
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
   }
}
