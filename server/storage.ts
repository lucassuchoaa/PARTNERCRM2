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

  // Upsert user (create or update)
  async upsertUser(userData: UpsertUser): Promise<User> {
    const result = await query(
      `INSERT INTO users (id, email, first_name, last_name, profile_image_url, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id) 
       DO UPDATE SET 
         email = EXCLUDED.email,
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
      ]
    );

    return result.rows[0];
  }
}

// Export singleton instance
export const storage = new DatabaseStorage();
