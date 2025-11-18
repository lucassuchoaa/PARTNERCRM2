/**
 * Support Materials API - Versão Mock (sem Supabase)
 * Para produção com Supabase real, renomeie index.js para index-supabase.js
 * e este arquivo para index.js
 */

// Mock database in-memory
let mockMaterials = [
  {
    id: '1',
    title: 'Guia de Integração',
    category: 'guides',
    type: 'pdf',
    description: 'Guia completo de integração com a plataforma',
    downloadUrl: '/files/guia-integracao.pdf',
    viewUrl: null,
    fileSize: '2.5 MB',
    duration: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    title: 'Vídeo: Como usar o dashboard',
    category: 'tutorials',
    type: 'video',
    description: 'Tutorial em vídeo sobre as funcionalidades do dashboard',
    downloadUrl: null,
    viewUrl: 'https://youtube.com/watch?v=example',
    fileSize: null,
    duration: '15:30',
    createdAt: '2025-01-02T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z'
  }
];

export default async function handler(req, res) {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''
  ].filter(Boolean);

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      return res.status(200).json(mockMaterials);
    }

    if (req.method === 'POST') {
      const {
        title,
        category,
        type,
        description,
        downloadUrl,
        viewUrl,
        fileSize,
        duration
      } = req.body;

      if (!title || !category || !type) {
        return res.status(400).json({
          success: false,
          error: 'Título, categoria e tipo são obrigatórios'
        });
      }

      const newMaterial = {
        id: (mockMaterials.length + 1).toString(),
        title,
        category,
        type,
        description: description || null,
        downloadUrl: downloadUrl || null,
        viewUrl: viewUrl || null,
        fileSize: fileSize || null,
        duration: duration || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockMaterials.push(newMaterial);

      return res.status(201).json({
        success: true,
        data: newMaterial
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    console.error('Support materials API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
}
