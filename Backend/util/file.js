import path from 'path'; 
import fs from 'fs'; 

export function clearImage(filePath) {
   const __dirname = import.meta.dirname;
   filePath = path.join(__dirname, '..', filePath);
   fs.unlink(filePath, err => console.log(err));
}