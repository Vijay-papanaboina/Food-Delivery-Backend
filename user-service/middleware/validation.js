import { body } from "express-validator";

// Auth validation
export const validateSignup = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("phone")
    .optional()
    .matches(/^[+]?[0-9\\-]+$/)
    .withMessage("Please provide a valid phone number"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/
    )
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
    ),
];

export const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const validateRefreshToken = [
  body("refreshToken").notEmpty().withMessage("Refresh token is required"),
];

// Profile validation
export const validateUpdateProfile = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("phone")
    .optional()
    .matches(/^[+]?[0-9\\-]+$/)
    .withMessage("Please provide a valid phone number"),
];

// Address validation
export const validateAddress = [
  body("label")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Label must be between 1 and 100 characters"),
  body("street")
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage("Street must be between 5 and 255 characters"),
  body("city")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("City must be between 2 and 100 characters"),
  body("state")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("State must be between 2 and 100 characters"),
  body("zipCode")
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage("Zip code must be between 5 and 20 characters"),
  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean"),
];
