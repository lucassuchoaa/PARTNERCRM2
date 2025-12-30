import { getSupabaseClient } from '../_lib/supabaseClient';

export default async function handler(req, res) {
  // CORS
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (configError) {
    console.error('Supabase configuration error:', configError);
    return res.status(500).json({
      success: false,
      error: configError.message || 'Supabase não configurado.'
    });
  }

  try {
    if (req.method === 'GET') {
      // Listar uploads de parceiros (partner_reports)
      const { data, error } = await supabase
        .from('uploads')
        .select('*')
        .not('partner_id', 'is', null)
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('Supabase error fetching partner reports:', error);
        throw error;
      }

      // Transformar dados para formato frontend
      const transformedData = (data || []).map(report => ({
        id: report.id.toString(),
        partnerId: report.partner_id,
        partnerName: report.partner_name,
        fileName: report.original_name || report.file_name,
        fileType: report.file_type,
        size: report.size || 0,
        status: report.status === 'completed' ? 'available' : report.status,
        uploadDate: report.upload_date,
        referenceMonth: report.reference_month || new Date(report.upload_date).getMonth() + 1,
        referenceYear: report.reference_year || new Date(report.upload_date).getFullYear(),
        fileUrl: report.file_url,
        downloadCount: report.download_count
      }));

      return res.status(200).json(transformedData);
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    console.error('Partner reports API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
}
