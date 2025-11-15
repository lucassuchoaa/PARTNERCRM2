/**
 * HubSpot Validate Prospect API Endpoint (HubSpot Proxy)
 *
 * Securely validates prospects against HubSpot data
 * API key is stored server-side only
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from '@hubspot/api-client';
import { withCORS } from '../_middleware/cors';
import { withErrorHandler, successResponse, errorResponse } from '../_middleware/errorHandler';
import { requireAuth } from '../_middleware/auth';
import { apiRateLimit } from '../_middleware/rateLimit';
import { validateBody, hubspotValidateProspectSchema } from '../_middleware/validation';
import { HubSpotValidateProspectRequest, HubSpotValidateProspectResponse, JWTPayload } from '../../shared/types';

const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

if (!HUBSPOT_ACCESS_TOKEN) {
  console.error('⚠️  HUBSPOT_ACCESS_TOKEN not set in environment variables');
}

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
      await validateBody(hubspotValidateProspectSchema)(req, res, async (validatedData: HubSpotValidateProspectRequest) => {
        try {
          const { email, companyName, contactName, phone } = validatedData;

          const result: HubSpotValidateProspectResponse = {
            contact: null,
            company: null,
            deals: [],
            status: 'new',
            validation: {
              emailExists: false,
              companyExists: false,
              hasActiveDeals: false,
              isCustomer: false
            }
          };

          // Search for contact by email
          try {
            const contactResponse = await hubspotClient.crm.contacts.basicApi.getById(
              email,
              ['firstname', 'lastname', 'email', 'phone', 'company', 'hs_lead_status', 'lifecyclestage'],
              undefined,
              undefined,
              false,
              'email'
            );

            if (contactResponse) {
              result.contact = contactResponse;
              result.validation.emailExists = true;
              result.status = 'existing';

              // Get associated deals
              try {
                const associationsResponse = await hubspotClient.crm.contacts.associationsApi.getAll(
                  contactResponse.id,
                  'deals'
                );

                if (associationsResponse.results.length > 0) {
                  result.validation.hasActiveDeals = true;

                  // Fetch deal details
                  const dealIds = associationsResponse.results.map(assoc => assoc.toObjectId);
                  const dealsResponse = await hubspotClient.crm.deals.batchApi.read({
                    inputs: dealIds.map(id => ({ id })),
                    properties: ['dealname', 'amount', 'dealstage', 'pipeline', 'closedate']
                  });

                  result.deals = dealsResponse.results;

                  // Check if customer (has closed-won deals)
                  const closedWonDeals = dealsResponse.results.filter(deal =>
                    deal.properties.dealstage?.toLowerCase().includes('closed') ||
                    deal.properties.dealstage?.toLowerCase().includes('won')
                  );

                  if (closedWonDeals.length > 0) {
                    result.validation.isCustomer = true;
                    result.status = 'customer';
                  }
                }
              } catch (dealsError) {
                console.error('Error fetching deals:', dealsError);
                // Continue without deals data
              }
            }
          } catch (contactError: any) {
            if (contactError.code !== 404) {
              console.error('Error fetching contact:', contactError);
            }
            // Contact not found is expected, continue
          }

          // Search for company by name
          try {
            const companySearchResponse = await hubspotClient.crm.companies.searchApi.doSearch({
              filterGroups: [{
                filters: [{
                  propertyName: 'name',
                  operator: 'CONTAINS_TOKEN',
                  value: companyName
                }]
              }],
              properties: ['name', 'domain', 'industry', 'lifecyclestage'],
              limit: 1
            });

            if (companySearchResponse.results.length > 0) {
              result.company = companySearchResponse.results[0];
              result.validation.companyExists = true;
            }
          } catch (companyError) {
            console.error('Error searching company:', companyError);
            // Continue without company data
          }

          res.status(200).json(successResponse(result, 'Prospect validated successfully'));
        } catch (error: any) {
          console.error('HubSpot API error:', error);
          return errorResponse(
            'Failed to validate prospect',
            500,
            'HUBSPOT_API_ERROR'
          );
        }
      });
    })(req, res);
  });
}

export default withCORS(withErrorHandler(handler));
