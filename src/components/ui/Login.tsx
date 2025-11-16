import { useState } from 'react'
import { login } from '../../services/auth'
import logo from '../../assets/somapay-logo.svg'

interface LoginProps {
  onLogin: () => void
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const user = await login({ email, password })
      localStorage.setItem('user', JSON.stringify(user))
      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    }
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Acesse sua conta
        </h2>
        <p className="text-blue-100 text-sm">
          Entre com suas credenciais de parceiro
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 bg-white bg-opacity-90 placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all sm:text-sm"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 bg-white bg-opacity-90 placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all sm:text-sm"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-500 bg-opacity-20 border border-red-400 border-opacity-30 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-100">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <button
            type="submit"
            className="flex w-full justify-center rounded-lg bg-white text-blue-600 px-4 py-3 text-sm font-semibold shadow-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-colors"
          >
            Entrar no Portal
          </button>
          
          <div className="text-center">
            <a href="#" className="text-sm text-blue-100 hover:text-white transition-colors">
              Esqueceu sua senha?
            </a>
          </div>
        </div>
      </form>
    </div>
  )
}