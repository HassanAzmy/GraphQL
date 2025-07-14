import validator from 'validator';
import { hash } from 'bcryptjs';
import User from '../models/user-model.js';

export default { 
   createUser: async function ({ userInput }, req) {
      const { email } = userInput;
      const { name } = userInput;
      const { password } = userInput;

      if(!validator.isEmail(email)) {
         throw new Error('Invalid email');
      }
      
      if(validator.isEmpty(password) || !validator.isLength(password, {min: 8})) {
         throw new Error('Invalid password');
      }

      const user = await User.findOne({email});
      if(user) {
         const err = new Error('User already exists');
         throw err;
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
