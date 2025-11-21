import { useEffect, useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import SEO from '../components/layout/SEO';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

if (!stripePublicKey) {
  console.warn('⚠️  VITE_STRIPE_PUBLIC_KEY not configured - Stripe payments will not work');
}

const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

function CheckoutForm({ plan }: { plan: any }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/#checkout-success`,
        },
      });

      if (error) {
        setErrorMessage(error.message || 'Ocorreu um erro ao processar o pagamento');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações de Pagamento</h3>
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => { window.location.hash = 'pricing' }}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={isProcessing}
        >
          Voltar
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processando...' : `Pagar R$ ${plan.basePrice.toFixed(2)}`}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Pagamento seguro processado pelo Stripe. Seus dados estão protegidos.
      </p>
    </form>
  );
}

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<any>(null);

  useEffect(() => {
    const storedPlan = localStorage.getItem('selectedPlan');
    if (!storedPlan) {
      window.location.hash = 'pricing';
      return;
    }

    try {
      const parsedPlan = JSON.parse(storedPlan);
      setPlan(parsedPlan);
    } catch (err) {
      console.error('Error parsing plan:', err);
      window.location.hash = 'pricing';
    }
  }, []);

  useEffect(() => {
    if (!plan) {
      return;
    }

    if (!stripePublicKey) {
      setError('Stripe não está configurado. Entre em contato com o suporte.');
      setIsLoading(false);
      return;
    }

    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: plan.basePrice,
            planName: plan.name,
            planId: plan.id
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Falha ao criar sessão de pagamento');
        }

        setClientSecret(data.clientSecret);
      } catch (err: any) {
        console.error('Error creating payment intent:', err);
        setError(err.message || 'Erro ao inicializar checkout');
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [plan]);

  if (!plan) {
    return null;
  }

  return (
    <>
      <SEO
        title={`Checkout - ${plan.name}`}
        description={`Finalize sua compra do plano ${plan.name}`}
      />

      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Finalizar Compra</h1>
            <p className="text-gray-600">Complete seu pagamento de forma segura</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Resumo do Pedido</h2>
            <div className="border-t border-b border-gray-200 py-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Plano selecionado:</span>
                <span className="font-semibold text-gray-900">{plan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Usuários inclusos:</span>
                <span className="font-semibold text-gray-900">{plan.includedUsers} usuários</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="font-semibold text-gray-900">Total:</span>
                <span className="font-bold text-blue-600">R$ {plan.basePrice.toFixed(2)}/mês</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">{plan.description}</p>
          </div>

          {isLoading && (
            <div className="bg-white rounded-lg shadow-lg p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Preparando checkout seguro...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <svg className="w-12 h-12 text-red-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar checkout</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={() => { window.location.hash = 'pricing' }}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Voltar aos Planos
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && clientSecret && stripePromise && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#2563eb',
                    },
                  },
                }}
              >
                <CheckoutForm plan={plan} />
              </Elements>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
