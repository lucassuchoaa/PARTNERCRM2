/**
 * HubSpot Service (Secure Backend Version)
 *
 * Replaces direct HubSpot API calls with secure backend proxy
 */

import { apiClient } from './client';
import type { HubSpotContactRequest, HubSpotContactResponse, HubSpotValidateProspectRequest, HubSpotValidateProspectResponse } from '@shared/types';

/**
 * Create or update HubSpot contact via backend API (secure)
 */
export async function createOrUpdateContact(contactData: HubSpotContactRequest): Promise<HubSpotContactResponse> {
  try {
    const response = await apiClient.post<{ success: boolean; data: HubSpotContactResponse }>('/hubspot/create-contact', contactData);
    return response.data.data;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Failed to create/update contact';
    throw new Error(message);
  }
}

/**
 * Validate prospect data against HubSpot via backend API
 */
export async function validateProspectData(prospectData: HubSpotValidateProspectRequest): Promise<HubSpotValidateProspectResponse> {
  try {
    const response = await apiClient.post<{ success: boolean; data: HubSpotValidateProspectResponse }>('/hubspot/validate-prospect', prospectData);
    return response.data.data;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Failed to validate prospect';
    throw new Error(message);
  }
}

export default {
  createOrUpdateContact,
  validateProspectData
};
