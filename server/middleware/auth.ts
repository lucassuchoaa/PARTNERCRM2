import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    role: string;
    profileImageUrl: string | null;
  };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const sessionUser = (req as any).user;
    const userId = sessionUser?.claims?.sub || sessionUser?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Invalid session: missing user ID' });
    }

    let user = await storage.getUser(userId);

    // Se o usuário não existe no banco, criar automaticamente usando dados da sessão
    if (!user) {
      console.log('🔐 [Auth] User not found in database, creating from session:', userId);
      const claims = sessionUser?.claims || {};
      try {
        user = await storage.upsertUser({
          id: userId,
          email: claims.email || `user_${userId}@temp.com`,
          firstName: claims.first_name || claims.given_name || null,
          lastName: claims.last_name || claims.family_name || null,
          profileImageUrl: claims.profile_image_url || claims.picture || null,
        });
        console.log('✅ [Auth] User created successfully');
      } catch (upsertError) {
        console.error('❌ [Auth] Failed to create user:', upsertError);
        return res.status(500).json({ error: 'Failed to create user account' });
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
