import React, { useState } from 'react';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer'); // 'buyer' o 'seller'
  const [storeName, setStoreName] = useState(''); // Si es vendedor

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert('Por favor completa todos los campos.');
      return;
    }

    // Simulamos la creación o validación del usuario
    const userData = {
      email,
      role,
      storeName: role === 'seller' ? storeName || 'Mi Nueva Tienda' : null,
      subdomain: role === 'seller' ? (storeName ? storeName.toLowerCase().replace(/\s+/g, '') : 'mitienda') : null
    };

    onLoginSuccess(userData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 relative overflow-hidden">
        
        {/* Botón Cerrar */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-2xl font-bold"
        >
          ×
        </button>

        <div className="text-center mb-8">
          <div className="inline-block bg-indigo-600 text-white p-3 rounded-2xl text-2xl shadow-md mb-3">🦭</div>
          <h2 className="text-2xl font-black text-gray-900">
            {isRegistering ? 'Crea tu cuenta en FOCA' : 'Iniciar Sesión en FOCA'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {isRegistering ? 'Empieza a vender o comprar en el ecosistema' : 'Ingresa a tu panel de control'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isRegistering && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Tipo de Cuenta</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`py-2.5 text-sm font-semibold rounded-xl border transition ${role === 'buyer' ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'border-gray-200 text-gray-600'}`}
                >
                  🛒 Comprador
                </button>
                <button
                  type="button"
                  onClick={() => setRole('seller')}
                  className={`py-2.5 text-sm font-semibold rounded-xl border transition ${role === 'seller' ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'border-gray-200 text-gray-600'}`}
                >
                  🏪 Vendedor / Tienda
                </button>
              </div>
            </div>
          )}

          {isRegistering && role === 'seller' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Nombre de tu Tienda</label>
              <input
                type="text"
                placeholder="Ej: TecnoPlus Argentina"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Correo Electrónico</label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/30"
          >
            {isRegistering ? 'Crear Cuenta' : 'Entrar a FOCA'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            {isRegistering ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate gratis aquí'}
          </button>
        </div>

      </div>
    </div>
  );
}