import express from "express";
import { registerUser, loginUser } from '../../controllers/userController.js';
import { validateRegister, validateLogin, checkValidationResult } from '../../middleware/userValidators.js';
import { authLimiter } from '../../middleware/rateLimit.js';

const router = express.Router();

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUser'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       429:
 *         description: Too many requests (Rate limit)
 */
router.post('/register',
  authLimiter,
  validateRegister,
  checkValidationResult,
  registerUser
);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Login user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginUser'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Invalid credentials or validation error
 *       429:
 *         description: Too many requests
 */
router.post('/login',
  authLimiter,
  validateLogin,
  checkValidationResult,
  loginUser
);

export default router;