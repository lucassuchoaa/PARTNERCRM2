import { useState } from 'react'

export default function Settings() {
  const [formData, setFormData] = useState({
    // Perfil
    nome: '',
    empresa: '',
    email: '',
    telefone: '',
    cargo: '',

    // Notificações
    notificacoesGerais: true,
    notificacoesEmail: true,
    notificacoesSMS: false,
    notificacoesWhatsapp: false,

    // Preferências
    idioma: 'pt-BR',
    tema: 'light',
    formatoData: 'DD/MM/YYYY',
    formatoMoeda: 'BRL',
    fusoHorario: 'America/Sao_Paulo',

    // Segurança
    doisFatores: false,
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aqui você implementaria a lógica para salvar as configurações
    console.log('Configurações salvas:', formData)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="space-y-10 divide-y divide-gray-900/10">
        {/* Perfil */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base font-semibold leading-7 text-gray-900">Perfil</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Atualize suas informações pessoais e profissionais.
            </p>
          </div>

          <form className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
            <div className="px-4 py-6 sm:p-8">
              <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                    Nome
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="nome"
                      id="nome"
                      value={formData.nome}
                      onChange={handleChange}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="company" className="block text-sm font-medium leading-6 text-gray-900">
                    Empresa
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="empresa"
                      id="empresa"
                      value={formData.empresa}
                      onChange={handleChange}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                    Email
                  </label>
                  <div className="mt-2">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="telefone" className="block text-sm font-medium leading-6 text-gray-900">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="telefone"
                    id="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="cargo" className="block text-sm font-medium leading-6 text-gray-900">
                    Cargo
                  </label>
                  <input
                    type="text"
                    name="cargo"
                    id="cargo"
                    value={formData.cargo}
                    onChange={handleChange}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
              <button type="submit" onClick={handleSubmit} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                Salvar
              </button>
            </div>
          </form>
        </div>

        {/* Notificações */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 pt-10 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base font-semibold leading-7 text-gray-900">Notificações</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Gerencie como você recebe notificações.
            </p>
          </div>

          <form className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
            <div className="px-4 py-6 sm:p-8">
              <div className="max-w-2xl space-y-6">
                <div className="relative flex gap-x-3">
                  <div className="flex h-6 items-center">
                    <input
                      id="notifications"
                      name="notifications"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      checked={formData.notificacoesGerais}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="text-sm leading-6">
                    <label htmlFor="notifications" className="font-medium text-gray-900">
                      Ativar notificações
                    </label>
                    <p className="text-gray-500">Receba atualizações sobre suas transações e clientes.</p>
                  </div>
                </div>

                <div className="relative flex gap-x-3">
                  <div className="flex h-6 items-center">
                    <input
                      id="email-notifications"
                      name="email-notifications"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      checked={formData.notificacoesEmail}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="text-sm leading-6">
                    <label htmlFor="email-notifications" className="font-medium text-gray-900">
                      Notificações por email
                    </label>
                    <p className="text-gray-500">Receba atualizações importantes por email.</p>
                  </div>
                </div>

                <div className="relative flex gap-x-3">
                  <div className="flex h-6 items-center">
                    <input
                      id="sms-notifications"
                      name="sms-notifications"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      checked={formData.notificacoesSMS}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="text-sm leading-6">
                    <label htmlFor="sms-notifications" className="font-medium text-gray-900">
                      Notificações por SMS
                    </label>
                    <p className="text-gray-500">Receba alertas importantes por SMS.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
              <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                Salvar
              </button>
            </div>
          </form>
        </div>

        {/* Preferências */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 pt-10 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base font-semibold leading-7 text-gray-900">Preferências</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Personalize sua experiência no portal.
            </p>
          </div>

          <form className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
            <div className="px-4 py-6 sm:p-8">
              <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="idioma" className="block text-sm font-medium leading-6 text-gray-900">
                    Idioma
                  </label>
                  <select
                    name="idioma"
                    id="idioma"
                    value={formData.idioma}
                    onChange={handleChange}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es">Español</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="tema" className="block text-sm font-medium leading-6 text-gray-900">
                    Tema
                  </label>
                  <select
                    name="tema"
                    id="tema"
                    value={formData.tema}
                    onChange={handleChange}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Escuro</option>
                    <option value="system">Sistema</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="formatoData" className="block text-sm font-medium leading-6 text-gray-900">
                    Formato de Data
                  </label>
                  <select
                    name="formatoData"
                    id="formatoData"
                    value={formData.formatoData}
                    onChange={handleChange}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="formatoMoeda" className="block text-sm font-medium leading-6 text-gray-900">
                    Formato de Moeda
                  </label>
                  <select
                    name="formatoMoeda"
                    id="formatoMoeda"
                    value={formData.formatoMoeda}
                    onChange={handleChange}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  >
                    <option value="BRL">Real (R$)</option>
                    <option value="USD">Dólar ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="fusoHorario" className="block text-sm font-medium leading-6 text-gray-900">
                    Fuso Horário
                  </label>
                  <select
                    name="fusoHorario"
                    id="fusoHorario"
                    value={formData.fusoHorario}
                    onChange={handleChange}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  >
                    <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                    <option value="America/New_York">Nova York (GMT-4)</option>
                    <option value="Europe/London">Londres (GMT+1)</option>
                    <option value="Asia/Tokyo">Tóquio (GMT+9)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
              <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                Salvar
              </button>
            </div>
          </form>
        </div>

        {/* Segurança */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 pt-10 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base font-semibold leading-7 text-gray-900">Segurança</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Configure as opções de segurança da sua conta.
            </p>
          </div>

          <form className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
            <div className="px-4 py-6 sm:p-8">
              <div className="max-w-2xl space-y-6">
                <div className="relative flex gap-x-3">
                  <div className="flex h-6 items-center">
                    <input
                      id="2fa"
                      name="2fa"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      checked={formData.doisFatores}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="text-sm leading-6">
                    <label htmlFor="2fa" className="font-medium text-gray-900">
                      Autenticação de dois fatores
                    </label>
                    <p className="text-gray-500">Adicione uma camada extra de segurança à sua conta.</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium leading-6 text-gray-900">
                    Senha atual
                  </label>
                  <div className="mt-2">
                    <input
                      type="password"
                      name="current-password"
                      id="current-password"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium leading-6 text-gray-900">
                    Nova senha
                  </label>
                  <div className="mt-2">
                    <input
                      type="password"
                      name="new-password"
                      id="new-password"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium leading-6 text-gray-900">
                    Confirmar nova senha
                  </label>
                  <div className="mt-2">
                    <input
                      type="password"
                      name="confirm-password"
                      id="confirm-password"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
              <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}