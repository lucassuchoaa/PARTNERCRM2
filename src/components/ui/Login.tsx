export default function Login() {
  const handleLogin = () => {
    // Redirect to Replit Auth login page
    window.location.href = '/api/login';
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Acesse sua conta
        </h2>
        <p className="text-blue-100 text-sm">
          Faça login com sua conta Replit
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleLogin}
          className="flex w-full justify-center items-center gap-3 rounded-lg bg-white text-blue-600 px-4 py-3 text-sm font-semibold shadow-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
          </svg>
          Entrar com Replit
        </button>
        
        <p className="text-center text-xs text-blue-100">
          Login seguro via Google, GitHub, X (Twitter), Apple ou Email
        </p>
      </div>
    </div>
  )
}