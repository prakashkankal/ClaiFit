import jwt from 'jsonwebtoken';
import Tailor from '../models/Tailor.js';

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await Tailor.findById(decoded.id).select('-password');
            if (!req.user) {
                // Try User model if not found in Tailor (though for posts, we expect Tailor)
                // For now, strict check for Tailor
                throw new Error('Not authorized, tailor not found');
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export { protect };
