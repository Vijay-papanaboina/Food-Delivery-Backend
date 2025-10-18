import jwt from "jsonwebtoken";

export const jwtConfig = {
  secret:
    process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production",
  expiresIn: process.env.JWT_EXPIRY || "1h",
  refreshSecret:
    process.env.REFRESH_TOKEN_SECRET ||
    "your-super-secret-refresh-key-change-in-production",
  refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d",
};

export const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });

  const refreshToken = jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
  });

  return { accessToken, refreshToken };
};

export const verifyToken = (token, isRefresh = false) => {
  const secret = isRefresh ? jwtConfig.refreshSecret : jwtConfig.secret;
  return jwt.verify(token, secret);
};
