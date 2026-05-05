import express from "express";
import { registerUser, loginUser } from '../../controllers/userController.js';
import { validateRegister, validateLogin, checkValidationResult } from '../../middleware/userValidators.js';
import { authLimiter } from '../../middleware/rateLimit.js'

const router = express.Router();

router.post('/register',
  authLimiter, 
  validateRegister,
  checkValidationResult,   
  registerUser    
);

router.post('/login',
  authLimiter, 
  validateLogin,      
  checkValidationResult, 
  loginUser           
);

export default router;