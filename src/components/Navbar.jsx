import React from 'react';

export default function Navbar({ 
  user, 
  onOpenLogin, 
  onLogout, 
  onNavigate, 
  currentView, 
  cartCount, 
  onOpenCart,
  activeSubdomain 
}) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logotipo y Subdominio */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group" 
          onClick={() => onNavigate('marketplace')}
        >
          <div className="bg-indigo-600 text-white p-2.5 rounded-2xl text-xl shadow-md group-hover:bg-indigo-700 transition">
            🦭
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-2xl tracking-tight text-gray-900">
                FOCA<span className="text-indigo-600">.app</span>
              </span>
            </div>
            {activeSubdomain ? (
              <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                Tienda: {activeSubdomain}.foca.app
              </span>
            ) : (
              <span className="text-xs text-gray-400 font-medium">Plataforma Multitienda</span>
            )}
          </div>
        </div>

        {/* Acciones de Navegación central / derecha */}
        <div className="flex items-center space-x-4">
          
          <button
            onClick={() => onNavigate('marketplace')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              currentView === 'marketplace' 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            🏪 Marketplace
          </button>

          {/* Si el usuario es vendedor logueado, mostramos acceso a su panel */}
          {user && user.role === 'seller' && (
            <button
              onClick={() => onNavigate('seller')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                currentView === 'seller' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💼 Panel de Tienda
            </button>
          )}

          {/* Botón Carrito de Compras */}
          <button
            onClick={onOpenCart}
            className="relative p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
            title="Ver Carrito"
          >
            <span className="text-xl">🛒</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-black rounded-full h-5 w-5 flex items-center justify-center shadow-md animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

          {/* Perfil / Autenticación */}
          <div className="border-l pl-4 border-gray-200 flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-gray-900">{user.email}</p>
                  <p className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">
                    {user.role === 'seller' ? 'Vendedor' : 'Comprador'}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition"
                  title="Cerrar Sesión"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-5 py-2.5 bg-gray-900 hover:bg-indigo-600 text-white font-bold text-sm rounded-xl transition shadow-md"
              >
                Ingresar
              </button>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}