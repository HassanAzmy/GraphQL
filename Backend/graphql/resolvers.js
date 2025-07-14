import User from '../models/user-model.js';
import { hash } from 'bcryptjs';

export default {
   createUser: async function ({ userInput }, req) {
      try {
         const { email } = userInput;
         const { name } = userInput;
         const { password } = userInput;
         
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
      } catch (err) {
         next(err);
      }
   }
}