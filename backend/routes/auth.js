import express from 'express';
import { validateRequest } from 'zod-express-middleware';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendOTPSchema,
  forgotPasswordSchema,
  verifyResetOTPSchema,
  resetPasswordSchema
} from '../libs/validate-schema.js';
import { registerUser, loginUser, verifyEmail, resendOTP, forgotPassword, verifyPasswordResetOTP, resetPassword, getUserInfo } from '../controllers/auth-controller.js';
import { authenticateToken } from '../libs/auth-middleware.js';

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     description: Create a new user account. Sends a 6-digit OTP to the provided email for verification. OTP expires in 5 minutes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 description: User's full name
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 minLength: 12
 *                 description: Strong password (min 12 chars, uppercase, lowercase, number, special char)
 *                 example: SecurePass123!
 *     responses:
 *       201:
 *         description: User registered successfully. An OTP has been sent to the email.
 *       400:
 *         description: Invalid input.
 *       409:
 *         description: User already exists.
 *       500:
 *         description: Internal server error.
 */
router.post('/register', validateRequest({
    body: registerSchema,
}), registerUser);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     description: Authenticate user with email and password. Sends a 6-digit OTP to the email for two-factor verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: OTP sent successfully.
 *       400:
 *         description: Invalid credentials.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error.
 */
router.post('/login', validateRequest({
    body: loginSchema,
}), loginUser);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP for registration or login
 *     tags: [Authentication]
 *     description: Verify the 6-digit OTP sent to email. For registration, completes account creation and auto-logs in. For login, returns JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                     example: 507f1f77bcf86cd799439011
 *                   otp:
 *                     type: string
 *                     pattern: ^\d{6}$
 *                     example: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully.
 *       400:
 *         description: Invalid OTP.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.post("/verify-otp", validateRequest({
    body: verifyEmailSchema, // Keeps support for { token: { userId, otp } }
}), verifyEmail);

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Resend OTP
 *     tags: [Authentication]
 *     description: Resend the OTP for ongoing verification process (registration, login, or password reset)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: OTP resent successfully.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.post('/resend-otp', validateRequest({
  body: resendOTPSchema,
}), resendOTP);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     description: Initiate password reset process. Sends a 6-digit OTP to the email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *     responses:
 *       200:
 *         description: OTP sent successfully.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.post('/forgot-password', validateRequest({
  body: forgotPasswordSchema,
}), forgotPassword);

/**
 * @swagger
 * /auth/verify-reset-otp:
 *   post:
 *     summary: Verify password reset OTP
 *     tags: [Authentication]
 *     description: Verify the OTP sent for password reset. Returns a reset token to be used in the next step.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - otp
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               otp:
 *                 type: string
 *                 pattern: ^\d{6}$
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully.
 *       400:
 *         description: Invalid OTP.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.post('/verify-reset-otp', validateRequest({
  body: verifyResetOTPSchema,
}), verifyPasswordResetOTP);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Authentication]
 *     description: Set a new password after OTP verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - resetToken
 *               - newPassword
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               resetToken:
 *                 type: string
 *                 description: Token received from verify-reset-otp endpoint
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 minLength: 12
 *                 description: New strong password
 *                 example: NewSecurePass123!
 *     responses:
 *       200:
 *         description: Password reset successfully.
 *       400:
 *         description: Invalid token or password.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.post('/reset-password', validateRequest({
  body: resetPasswordSchema,
}), resetPassword);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user info
 *     tags: [Authentication]
 *     description: Get authenticated user's profile information including workspaces
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.get('/me', authenticateToken, getUserInfo);

export default router;
