/**
 * HubSpot Create/Update Contact API Endpoint (HubSpot Proxy)
 *
 * Securely creates or updates HubSpot contacts
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from '@hubspot/api-client';
import { withCORS } from '../_middleware/cors';
import { withErrorHandler, successResponse, errorResponse } from '../_middleware/errorHandler';
import { requireAuth } from '../_middleware/auth';
import { apiRateLimit } from '../_middleware/rateLimit';
import { validateBody, hubspotContactSchema } from '../_middleware/validation';
import { HubSpotContactRequest, HubSpotContactResponse, JWTPayload } from '../../shared/types';

const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const hubspotClient = new Client({
  accessToken: HUBSPOT_ACCESS_TOKEN || 'dummy-token-for-build'
});

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    });
  }

  if (!HUBSPOT_ACCESS_TOKEN) {
    return errorResponse('HubSpot integration not configured', 503, 'SERVICE_UNAVAILABLE');
  }

  await apiRateLimit(req, res, async () => {
    await requireAuth(async (req, res, user: JWTPayload) => {
      await validateBody(hubspotContactSchema)(req, res, async (validatedData: HubSpotContactRequest) => {
        try {
          const { email, ...otherProperties } = validatedData;

          // Try to find existing contact by email
          let existingContact = null;
          try {
            existingContact = await hubspotClient.crm.contacts.basicApi.getById(
              email,
              undefined,
              undefined,
              undefined,
              false,
              'email'
            );
          } catch (error: any) {
            if (error.code !== 404) {
              throw error;
            }
            // Contact not found, will create new
          }

          let result: HubSpotContactResponse;

          if (existingContact) {
            // Update existing contact
            const updateResponse = await hubspotClient.crm.contacts.basicApi.update(
              existingContact.id,
              {
                properties: {
                  email,
                  ...otherProperties
                }
              }
            );

            result = {
              id: updateResponse.id,
              properties: updateResponse.properties
            };
          } else {
            // Create new contact
            const createResponse = await hubspotClient.crm.contacts.basicApi.create({
              properties: {
                email,
                ...otherProperties
              }
            });

            result = {
              id: createResponse.id,
              properties: createResponse.properties
            };
          }

          res.status(200).json(successResponse(result, existingContact ? 'Contact updated successfully' : 'Contact created successfully'));
        } catch (error: any) {
          console.error('HubSpot API error:', error);
          return errorResponse(
            'Failed to create/update contact',
            500,
            'HUBSPOT_API_ERROR'
          );
        }
      });
    })(req, res);
  });
}

export default withCORS(withErrorHandler(handler));
