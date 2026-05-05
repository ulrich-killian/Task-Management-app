import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  let token = req.headers.authorization;

  if (!token || !token.startsWith('Bearer')) {
    return res.status(401).json({ message: 'Unauthorized, missing token' });
  }

  token = token.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized, invalid token' });
  }
};
