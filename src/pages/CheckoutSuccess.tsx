import { useEffect } from 'react';
import SEO from '../components/layout/SEO';

export default function CheckoutSuccess() {
  useEffect(() => {
    localStorage.removeItem('selectedPlan');
    
    const timer = setTimeout(() => {
      window.location.hash = 'login';
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <SEO
        title="Pagamento Confirmado"
        description="Seu pagamento foi processado com sucesso"
      />

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Pagamento Confirmado!
          </h1>

          <p className="text-gray-600 mb-6">
            Obrigado pela sua compra! Seu pagamento foi processado com sucesso.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              Um email de confirmação foi enviado para você com todos os detalhes da sua assinatura.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => { window.location.hash = 'login' }}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Fazer Login
            </button>

            <button
              onClick={() => { window.location.hash = '' }}
              className="w-full px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Voltar à Página Inicial
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            Redirecionando para login em 5 segundos...
          </p>
        </div>
      </div>
    </>
  );
}
