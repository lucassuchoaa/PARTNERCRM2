import { query } from './db';
import type { User, UpsertUser } from '../shared/schema';

// Interface for storage operations
export interface IStorage {
  // User operations (OBRIGATÓRIAS para Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // Get user by ID
  async getUser(id: string): Promise<User | undefined> {
    const result = await query(
      `SELECT 
        id, email, first_name as "firstName", last_name as "lastName", 
        profile_image_url as "profileImageUrl", name, password, role, status,
        manager_id as "managerId", remuneration_table_ids as "remunerationTableIds",
        last_login as "lastLogin", permissions, created_at as "createdAt",
        updated_at as "updatedAt"
      FROM users 
      WHERE id = $1`,
      [id]
    );
    
    return result.rows[0];
  }

  // Upsert user (create or update) - handles existing emails gracefully
  async upsertUser(userData: UpsertUser): Promise<User> {
    // First, check if a user with this email already exists with a different ID
    const existingByEmail = await query(
      `SELECT id, role, status FROM users WHERE email = $1 AND id != $2`,
      [userData.email, userData.id]
    );

    if (existingByEmail.rows.length > 0) {
      // Update the existing user's ID to the new Replit ID (migrate to Replit Auth)
      const existingUser = existingByEmail.rows[0];
      console.log(`🔐 [Storage] Migrating user ${userData.email} from ID ${existingUser.id} to ${userData.id}`);
      
      const result = await query(
        `UPDATE users SET 
           id = $1,
           first_name = COALESCE($3, first_name),
           last_name = COALESCE($4, last_name),
           profile_image_url = COALESCE($5, profile_image_url),
           updated_at = NOW()
         WHERE email = $2
         RETURNING 
           id, email, first_name as "firstName", last_name as "lastName",
           profile_image_url as "profileImageUrl", name, role, status,
           manager_id as "managerId", created_at as "createdAt", 
           updated_at as "updatedAt"`,
        [
          userData.id,
          userData.email,
          userData.firstName,
          userData.lastName,
          userData.profileImageUrl,
        ]
      );
      return result.rows[0];
    }

    // Normal upsert by ID
    const result = await query(
      `INSERT INTO users (id, email, first_name, last_name, profile_image_url, role, status, updated_at)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'partner'), COALESCE($7, 'active'), NOW())
       ON CONFLICT (id) 
       DO UPDATE SET 
         email = COALESCE(EXCLUDED.email, users.email),
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         profile_image_url = EXCLUDED.profile_image_url,
         updated_at = NOW()
       RETURNING 
         id, email, first_name as "firstName", last_name as "lastName",
         profile_image_url as "profileImageUrl", name, role, status,
         manager_id as "managerId", created_at as "createdAt", 
         updated_at as "updatedAt"`,
      [
        userData.id,
        userData.email,
        userData.firstName,
        userData.lastName,
        userData.profileImageUrl,
        userData.role || 'partner',
        userData.status || 'active',
      ]
    );

    return result.rows[0];
  }
}

// Export singleton instance
export const storage = new DatabaseStorage();
