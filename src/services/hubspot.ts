import { Client } from '@hubspot/api-client'
import axios from 'axios'

// Interface para configuração do HubSpot
interface HubSpotConfig {
  accessToken: string
  baseUrl?: string
}

// Interface para contato do HubSpot
interface HubSpotContact {
  id: string
  properties: {
    firstname?: string
    lastname?: string
    email?: string
    phone?: string
    company?: string
    hs_lead_status?: string
    lifecyclestage?: string
    createdate?: string
    lastmodifieddate?: string
    [key: string]: any
  }
}

// Interface para empresa do HubSpot
interface HubSpotCompany {
  id: string
  properties: {
    name?: string
    domain?: string
    industry?: string
    numberofemployees?: string
    hs_lead_status?: string
    lifecyclestage?: string
    createdate?: string
    lastmodifieddate?: string
    [key: string]: any
  }
}

// Interface para deal do HubSpot
interface HubSpotDeal {
  id: string
  properties: {
    dealname?: string
    amount?: string
    dealstage?: string
    pipeline?: string
    closedate?: string
    createdate?: string
    hs_deal_stage_probability?: string
    [key: string]: any
  }
}

// Interface para resposta de busca
interface HubSpotSearchResponse<T> {
  results: T[]
  total: number
  paging?: {
    next?: {
      after: string
    }
  }
}

class HubSpotService {
  private config: HubSpotConfig
  private client: Client
  private baseUrl: string

  constructor(config: HubSpotConfig) {
    this.config = config
    this.baseUrl = config.baseUrl || 'https://api.hubapi.com'
    this.client = new Client({ accessToken: config.accessToken })
  }

  // Headers padrão para requisições
  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.config.accessToken}`,
      'Content-Type': 'application/json'
    }
  }

  // Buscar contato por email
  async getContactByEmail(email: string): Promise<HubSpotContact | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/crm/v3/objects/contacts/${email}?idProperty=email`,
        { headers: this.getHeaders() }
      )
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null // Contato não encontrado
      }
      throw new Error(`Erro ao buscar contato: ${error.message}`)
    }
  }

  // Buscar empresa por domínio
  async getCompanyByDomain(domain: string): Promise<HubSpotCompany | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/crm/v3/objects/companies/${domain}?idProperty=domain`,
        { headers: this.getHeaders() }
      )
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null // Empresa não encontrada
      }
      throw new Error(`Erro ao buscar empresa: ${error.message}`)
    }
  }

  // Buscar contatos com filtros
  async searchContacts(filters: any = {}, limit: number = 100): Promise<HubSpotSearchResponse<HubSpotContact>> {
    try {
      const searchBody = {
        filterGroups: filters.filterGroups || [],
        sorts: filters.sorts || [{ propertyName: 'createdate', direction: 'DESCENDING' }],
        properties: filters.properties || ['firstname', 'lastname', 'email', 'phone', 'company', 'hs_lead_status', 'lifecyclestage'],
        limit
      }

      const response = await this.client.crm.contacts.searchApi.doSearch(searchBody)
      return response
    } catch (error: any) {
      throw new Error(`Erro ao buscar contatos: ${error.message}`)
    }
  }

  // Buscar empresas com filtros
  async searchCompanies(filters: any = {}, limit: number = 100): Promise<HubSpotSearchResponse<HubSpotCompany>> {
    try {
      const searchBody = {
        filterGroups: filters.filterGroups || [],
        sorts: filters.sorts || [{ propertyName: 'createdate', direction: 'DESCENDING' }],
        properties: filters.properties || ['name', 'domain', 'industry', 'numberofemployees', 'hs_lead_status', 'lifecyclestage'],
        limit
      }

      const response = await axios.post(
        `${this.baseUrl}/crm/v3/objects/companies/search`,
        searchBody,
        { headers: this.getHeaders() }
      )
      return response.data
    } catch (error: any) {
      throw new Error(`Erro ao buscar empresas: ${error.message}`)
    }
  }

  // Buscar deals associados a um contato
  async getContactDeals(contactId: string): Promise<HubSpotDeal[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/crm/v4/objects/contacts/${contactId}/associations/deals`,
        { headers: this.getHeaders() }
      )
      
      if (response.data.results.length === 0) {
        return []
      }

      // Buscar detalhes dos deals
      const dealIds = response.data.results.map((assoc: any) => assoc.toObjectId)
      const dealsResponse = await axios.post(
        `${this.baseUrl}/crm/v3/objects/deals/batch/read`,
        {
          inputs: dealIds.map((id: string) => ({ id })),
          properties: ['dealname', 'amount', 'dealstage', 'pipeline', 'closedate', 'hs_deal_stage_probability']
        },
        { headers: this.getHeaders() }
      )
      
      return dealsResponse.data.results
    } catch (error: any) {
      throw new Error(`Erro ao buscar deals do contato: ${error.message}`)
    }
  }

  // Criar ou atualizar contato
  async createOrUpdateContact(contactData: any): Promise<HubSpotContact> {
    try {
      // Primeiro, tentar buscar por email
      const existingContact = await this.getContactByEmail(contactData.email)
      
      if (existingContact) {
        // Atualizar contato existente
        const response = await axios.patch(
          `${this.baseUrl}/crm/v3/objects/contacts/${existingContact.id}`,
          { properties: contactData },
          { headers: this.getHeaders() }
        )
        return response.data
      } else {
        // Criar novo contato
        const response = await axios.post(
          `${this.baseUrl}/crm/v3/objects/contacts`,
          { properties: contactData },
          { headers: this.getHeaders() }
        )
        return response.data
      }
    } catch (error: any) {
      throw new Error(`Erro ao criar/atualizar contato: ${error.message}`)
    }
  }

  // Criar ou atualizar empresa
  async createOrUpdateCompany(companyData: any): Promise<HubSpotCompany> {
    try {
      // Primeiro, tentar buscar por domínio
      const existingCompany = companyData.domain ? await this.getCompanyByDomain(companyData.domain) : null
      
      if (existingCompany) {
        // Atualizar empresa existente
        const response = await axios.patch(
          `${this.baseUrl}/crm/v3/objects/companies/${existingCompany.id}`,
          { properties: companyData },
          { headers: this.getHeaders() }
        )
        return response.data
      } else {
        // Criar nova empresa
        const response = await axios.post(
          `${this.baseUrl}/crm/v3/objects/companies`,
          { properties: companyData },
          { headers: this.getHeaders() }
        )
        return response.data
      }
    } catch (error: any) {
      throw new Error(`Erro ao criar/atualizar empresa: ${error.message}`)
    }
  }

  // Validar dados de prospect contra HubSpot
  async validateProspectData(prospectData: {
    email: string
    companyName: string
    contactName: string
    phone?: string
  }) {
    try {
      const results = {
        contact: null as HubSpotContact | null,
        company: null as HubSpotCompany | null,
        deals: [] as HubSpotDeal[],
        status: 'new' as 'new' | 'existing' | 'customer',
        validation: {
          emailExists: false,
          companyExists: false,
          hasActiveDeals: false,
          isCustomer: false
        }
      }

      // Buscar contato por email
      const contact = await this.getContactByEmail(prospectData.email)
      if (contact) {
        results.contact = contact
        results.validation.emailExists = true
        results.status = 'existing'

        // Buscar deals do contato
        const deals = await this.getContactDeals(contact.id)
        results.deals = deals
        
        if (deals.length > 0) {
          results.validation.hasActiveDeals = true
          
          // Verificar se é cliente (tem deal fechado)
          const closedWonDeals = deals.filter(deal => 
            deal.properties.dealstage?.toLowerCase().includes('closed') ||
            deal.properties.dealstage?.toLowerCase().includes('won')
          )
          
          if (closedWonDeals.length > 0) {
            results.validation.isCustomer = true
            results.status = 'customer'
          }
        }
      }

      // Buscar empresa por nome (busca aproximada)
      const companySearch = await this.searchCompanies({
        filterGroups: [{
          filters: [{
            propertyName: 'name',
            operator: 'CONTAINS_TOKEN',
            value: prospectData.companyName
          }]
        }]
      }, 10)

      if (companySearch.results.length > 0) {
        results.company = companySearch.results[0]
        results.validation.companyExists = true
      }

      return results
    } catch (error: any) {
      throw new Error(`Erro ao validar dados do prospect: ${error.message}`)
    }
  }

  // Obter estatísticas de prospects/clientes
  async getProspectStats() {
    try {
      const [contactsResponse, companiesResponse] = await Promise.all([
        this.searchContacts({
          filterGroups: [{
            filters: [{
              propertyName: 'lifecyclestage',
              operator: 'IN',
              values: ['lead', 'marketingqualifiedlead', 'salesqualifiedlead']
            }]
          }]
        }, 1000),
        this.searchCompanies({}, 1000)
      ])

      const prospects = contactsResponse.results
      const companies = companiesResponse.results

      // Calcular estatísticas
      const stats = {
        totalProspects: prospects.length,
        totalCompanies: companies.length,
        prospectsByStage: {
          lead: prospects.filter(p => p.properties.lifecyclestage === 'lead').length,
          mql: prospects.filter(p => p.properties.lifecyclestage === 'marketingqualifiedlead').length,
          sql: prospects.filter(p => p.properties.lifecyclestage === 'salesqualifiedlead').length
        },
        recentProspects: prospects.slice(0, 10), // 10 mais recentes
        conversionRate: 0 // Pode ser calculado com base em deals fechados
      }

      return stats
    } catch (error: any) {
      throw new Error(`Erro ao obter estatísticas: ${error.message}`)
    }
  }
}

export default HubSpotService
export type { HubSpotContact, HubSpotCompany, HubSpotDeal, HubSpotConfig }