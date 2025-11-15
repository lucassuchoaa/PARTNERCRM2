/**
 * Serviço de integração com APIs de consulta de CNPJ
 *
 * APIs públicas disponíveis:
 * 1. ReceitaWS: https://receitaws.com.br/api/v1/cnpj/
 * 2. BrasilAPI: https://brasilapi.com.br/api/cnpj/v1/
 * 3. API CNPJ: https://api-publica.speedio.com.br/buscarcnpj?cnpj=
 */

export interface CNPJData {
  cnpj: string
  razaoSocial: string
  nomeFantasia?: string
  telefone?: string
  email?: string
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  municipio?: string
  uf?: string
  naturezaJuridica?: string
  porte?: string
  situacao?: string
  dataAbertura?: string
  capitalSocial?: string
  atividadePrincipal?: {
    code: string
    text: string
  }
  quantidadeFuncionarios?: number
}

/**
 * Formata CNPJ adicionando pontuação (00.000.000/0000-00)
 */
export const formatCNPJ = (cnpj: string): string => {
  const cleaned = cnpj.replace(/\D/g, '')

  if (cleaned.length !== 14) {
    return cnpj
  }

  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  )
}

/**
 * Remove formatação do CNPJ deixando apenas números
 */
export const cleanCNPJ = (cnpj: string): string => {
  return cnpj.replace(/\D/g, '')
}

/**
 * Valida CNPJ usando algoritmo oficial
 */
export const validateCNPJ = (cnpj: string): boolean => {
  const cleaned = cleanCNPJ(cnpj)

  if (cleaned.length !== 14) {
    return false
  }

  // Elimina CNPJs conhecidos como inválidos
  if (/^(\d)\1+$/.test(cleaned)) {
    return false
  }

  // Validação do primeiro dígito verificador
  let length = cleaned.length - 2
  let numbers = cleaned.substring(0, length)
  const digits = cleaned.substring(length)
  let sum = 0
  let pos = length - 7

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) {
      pos = 9
    }
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)

  if (result !== parseInt(digits.charAt(0))) {
    return false
  }

  // Validação do segundo dígito verificador
  length = length + 1
  numbers = cleaned.substring(0, length)
  sum = 0
  pos = length - 7

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) {
      pos = 9
    }
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)

  if (result !== parseInt(digits.charAt(1))) {
    return false
  }

  return true
}

/**
 * Busca dados da empresa pela ReceitaWS
 */
const fetchFromReceitaWS = async (cnpj: string): Promise<CNPJData> => {
  const cleaned = cleanCNPJ(cnpj)

  try {
    const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cleaned}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`ReceitaWS retornou status ${response.status}`)
    }

    // Verificar se é realmente JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('ReceitaWS não retornou JSON válido')
    }

    const data = await response.json()

    if (data.status === 'ERROR') {
      throw new Error(data.message || 'CNPJ não encontrado')
    }

    return {
      cnpj: formatCNPJ(data.cnpj),
      razaoSocial: data.nome,
      nomeFantasia: data.fantasia,
      telefone: data.telefone,
      email: data.email,
      cep: data.cep,
      logradouro: data.logradouro,
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      municipio: data.municipio,
      uf: data.uf,
      naturezaJuridica: data.natureza_juridica,
      porte: data.porte,
      situacao: data.situacao,
      dataAbertura: data.abertura,
      capitalSocial: data.capital_social,
      atividadePrincipal: data.atividade_principal && data.atividade_principal.length > 0
        ? {
            code: data.atividade_principal[0].code,
            text: data.atividade_principal[0].text
          }
        : undefined,
      quantidadeFuncionarios: data.qsa ? data.qsa.length * 10 : undefined // Estimativa baseada em quadro societário
    }
  } catch (error) {
    console.error('Erro ReceitaWS:', error)
    throw error
  }
}

/**
 * Busca dados da empresa pela BrasilAPI
 */
const fetchFromBrasilAPI = async (cnpj: string): Promise<CNPJData> => {
  const cleaned = cleanCNPJ(cnpj)

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`BrasilAPI retornou status ${response.status}`)
    }

    // Verificar se é realmente JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('BrasilAPI não retornou JSON válido')
    }

    const data = await response.json()

    return {
      cnpj: formatCNPJ(data.cnpj),
      razaoSocial: data.razao_social,
      nomeFantasia: data.nome_fantasia,
      telefone: data.ddd_telefone_1,
      email: data.email || data.correio_eletronico,
      cep: data.cep,
      logradouro: data.logradouro,
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      municipio: data.municipio,
      uf: data.uf,
      naturezaJuridica: data.natureza_juridica,
      porte: data.porte,
      situacao: data.descricao_situacao_cadastral,
      dataAbertura: data.data_inicio_atividade,
      capitalSocial: data.capital_social ? String(data.capital_social) : undefined,
      atividadePrincipal: data.cnae_fiscal
        ? {
            code: String(data.cnae_fiscal),
            text: data.cnae_fiscal_descricao
          }
        : undefined,
      quantidadeFuncionarios: data.qsa ? data.qsa.length * 10 : undefined
    }
  } catch (error) {
    console.error('Erro BrasilAPI:', error)
    throw error
  }
}

/**
 * Busca dados da empresa pela API Publica Speedio
 */
const fetchFromSpeedioAPI = async (cnpj: string): Promise<CNPJData> => {
  const cleaned = cleanCNPJ(cnpj)

  try {
    const response = await fetch(`https://api-publica.speedio.com.br/buscarcnpj?cnpj=${cleaned}`, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`API Speedio retornou status ${response.status}`)
    }

    // Verificar se é realmente JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('API Speedio não retornou JSON válido')
    }

    const data = await response.json()

    if (!data || data.status === 'ERROR') {
      throw new Error('CNPJ não encontrado')
    }

    return {
      cnpj: formatCNPJ(data.CNPJ || cnpj),
      razaoSocial: data['RAZAO SOCIAL'] || data.nome,
      nomeFantasia: data['NOME FANTASIA'] || data.fantasia,
      telefone: data.TELEFONE || data.telefone,
      email: data.EMAIL || data.email,
      cep: data.CEP,
      logradouro: data.LOGRADOURO,
      numero: data.NUMERO,
      complemento: data.COMPLEMENTO,
      bairro: data.BAIRRO,
      municipio: data.MUNICIPIO,
      uf: data.UF,
      situacao: data.STATUS || data.situacao,
      dataAbertura: data['DATA ABERTURA'],
      capitalSocial: data['CAPITAL SOCIAL']
    }
  } catch (error) {
    console.error('Erro API Speedio:', error)
    throw error
  }
}

/**
 * Mapeia CNAE para segmento de negócio
 */
export const mapCNAEToSegment = (cnae?: { code: string; text: string }): string => {
  if (!cnae) return 'Outros'

  const code = cnae.code
  const text = cnae.text.toLowerCase()

  // Mapeamento baseado em CNAE
  if (code.startsWith('62') || code.startsWith('63') || text.includes('tecnologia') || text.includes('software') || text.includes('informática')) {
    return 'Tecnologia'
  }

  if (code.startsWith('47') || code.startsWith('45') || text.includes('comércio') || text.includes('varejo') || text.includes('atacado')) {
    return 'Comércio'
  }

  if (code.startsWith('10') || code.startsWith('11') || code.startsWith('12') || code.startsWith('13') ||
      code.startsWith('14') || code.startsWith('15') || text.includes('indústria') || text.includes('fabricação')) {
    return 'Indústria'
  }

  if (code.startsWith('86') || code.startsWith('87') || code.startsWith('88') || text.includes('saúde') ||
      text.includes('médic') || text.includes('hospital') || text.includes('clínica')) {
    return 'Saúde'
  }

  if (code.startsWith('85') || text.includes('educação') || text.includes('ensino') || text.includes('escola')) {
    return 'Educação'
  }

  return 'Serviços'
}

/**
 * Busca informações de CNPJ usando múltiplas APIs com fallback
 * Tenta ReceitaWS primeiro, depois BrasilAPI, e por último Speedio
 */
export const fetchCNPJData = async (cnpj: string): Promise<CNPJData> => {
  const cleaned = cleanCNPJ(cnpj)

  // Validar CNPJ antes de fazer requisição
  if (!validateCNPJ(cleaned)) {
    throw new Error('CNPJ inválido')
  }

  // Tentar ReceitaWS primeiro (mais completa e atualizada)
  try {
    return await fetchFromReceitaWS(cleaned)
  } catch (receitaError) {
    console.warn('ReceitaWS falhou, tentando BrasilAPI:', receitaError)

    // Tentar BrasilAPI como fallback
    try {
      return await fetchFromBrasilAPI(cleaned)
    } catch (brasilApiError) {
      console.warn('BrasilAPI falhou, tentando Speedio API:', brasilApiError)

      // Tentar Speedio API como último recurso
      try {
        return await fetchFromSpeedioAPI(cleaned)
      } catch (speedioError) {
        console.error('Todas as APIs falharam:', speedioError)
        throw new Error('Não foi possível consultar o CNPJ. Todas as APIs falharam. Por favor, tente novamente mais tarde.')
      }
    }
  }
}

/**
 * Estima o número de funcionários baseado no porte da empresa
 */
export const estimateEmployeesByPorte = (porte?: string): number => {
  if (!porte) return 50

  const porteNormalized = porte.toLowerCase()

  if (porteNormalized.includes('mei') || porteNormalized.includes('microempresa')) {
    return 5
  }

  if (porteNormalized.includes('pequeno')) {
    return 25
  }

  if (porteNormalized.includes('médio') || porteNormalized.includes('medio')) {
    return 100
  }

  if (porteNormalized.includes('grande')) {
    return 500
  }

  return 50 // Default
}

export default {
  fetchCNPJData,
  validateCNPJ,
  formatCNPJ,
  cleanCNPJ,
  mapCNAEToSegment,
  estimateEmployeesByPorte
}
