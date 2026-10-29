import React, { useState, useEffect } from 'react';

// --- CONFIGURACIÓN DE GEMINI API ---
const GEMINI_API_KEY = ""; // Puedes colocar tu API Key de Gemini aquí o configurarla desde la UI

// --- HELPER PARA DETECTAR SUBDOMINIOS ---
const getSubdomain = () => {
  const hostname = window.location.hostname;

  // Para entorno local (ej: tecnostore.localhost:5173 o localhost)
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== '127') {
      return parts[0];
    }
    return null;
  }

  // Para entorno de producción (ej: tecnostore.foca.app o github.dev)
  const parts = hostname.split('.');
  if (parts.length > 2) {
    return parts[0];
  }

  return null; // Dominio principal
};

// --- BASE DE DATOS INICIAL DE EJEMPLO ---
const INITIAL_STORES = [
  {
    id: 'store-1',
    name: 'TecnoStore Argentina',
    subdomain: 'tecnostore',
    owner: 'Federico Gómez',
    description: 'Gadgets de última tecnología, auriculares inalámbricos y smartwatches.',
    logo: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&q=80&w=200',
    banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 'store-2',
    name: 'FitLife Outfitters',
    subdomain: 'fitlife',
    owner: 'Camila Rossi',
    description: 'Ropa deportiva de alto rendimiento y equipamiento de entrenamiento.',
    logo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=200',
    banner: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1200'
  }
];

const INITIAL_PRODUCTS = [
  {
    id: 'p1',
    storeId: 'store-1',
    name: 'Auriculares Pro Wireless X',
    costPrice: 45,
    price: 89,
    category: 'Audio',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600',
    description: 'Cancelación de ruido activa, 30h de batería y sonido de alta fidelidad.'
  },
  {
    id: 'p2',
    storeId: 'store-1',
    name: 'Smartwatch Sport Fit',
    costPrice: 30,
    price: 65,
    category: 'Relojes',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600',
    description: 'Sensor de ritmo cardíaco, monitoreo de sueño y GPS integrado.'
  },
  {
    id: 'p3',
    storeId: 'store-2',
    name: 'Mat de Yoga Pro Antideslizante',
    costPrice: 15,
    price: 35,
    category: 'Equipamiento',
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&q=80&w=600',
    description: 'Material eco-friendly TPE, 6mm de espesor para máximo confort.'
  }
];

export default function App() {
  // --- ESTADOS DE LA APLICACIÓN ---
  const [activeSubdomain, setActiveSubdomain] = useState(null);
  const [currentView, setCurrentView] = useState('marketplace'); // 'marketplace', 'storefront', 'seller'
  const [stores, setStores] = useState(INITIAL_STORES);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [selectedStore, setSelectedStore] = useState(INITIAL_STORES[0]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- ESTADOS DEL ASISTENTE DE IA ---
  const [apiKey, setApiKey] = useState(GEMINI_API_KEY);
  const [aiProductCost, setAiProductCost] = useState('');
  const [aiProductCategory, setAiProductCategory] = useState('Tecnología');
  const [aiDesiredMargin, setAiDesiredMargin] = useState(40);
  const [aiPricingResult, setAiPricingResult] = useState('');
  const [aiVariantsResult, setAiVariantsResult] = useState('');
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);

  // --- DETECCION INICIAL DE SUBDOMINIO ---
  useEffect(() => {
    const subdomain = getSubdomain();
    if (subdomain) {
      setActiveSubdomain(subdomain);
      const matchedStore = stores.find(s => s.subdomain === subdomain);
      if (matchedStore) {
        setSelectedStore(matchedStore);
        setCurrentView('storefront');
      }
    }
  }, []);

  // --- FUNCIONES DEL CARRITO ---
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // --- INTEGRACIÓN CON GEMINI IA API ---
  const callGeminiAPI = async (prompt) => {
    if (!apiKey) {
      throw new Error('Por favor, ingresa tu API Key de Gemini para usar la IA.');
    }
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.candidates[0].content.parts[0].text;
  };

  // 1. Recomendador de Precio Sugerido
  const handleCalculatePriceWithAI = async () => {
    if (!aiProductCost) return alert('Por favor ingresa el costo del producto.');
    setIsLoadingPricing(true);
    setAiPricingResult('');
    try {
      const prompt = `Actúa como un experto en fijación de precios y e-commerce para retail.
Tengo un producto en la categoría "${aiProductCategory}" con un costo de fabricación/compra de $${aiProductCost} USD.
Mi margen objetivo deseado es del ${aiDesiredMargin}%.

Por favor responde brevemente con:
1. Precio de venta sugerido recomendado ($ USD).
2. Estrategia de precio psicológico (ej: terminado en .99 o .90).
3. Precio en oferta/descuento recomendado.
4. Breve justificación estratégica en 2 oraciones.`;

      const responseText = await callGeminiAPI(prompt);
      setAiPricingResult(responseText);
    } catch (err) {
      alert(`Error al consultar IA: ${err.message}`);
    } finally {
      setIsLoadingPricing(false);
    }
  };

  // 2. Recomendador de Variantes y Productos
  const handlePredictVariantsWithAI = async () => {
    setIsLoadingVariants(true);
    setAiVariantsResult('');
    try {
      const storeProducts = products.filter(p => p.storeId === selectedStore.id);
      const productListText = storeProducts.map(p => `- ${p.name} ($${p.price}) [Categoría: ${p.category}]`).join('\n');

      const prompt = `Actúa como un consultor estratégico de inventario para la tienda "${selectedStore.name}".
Actualmente la tienda vende los siguientes productos en su catálogo:
${productListText}

Con base en estos productos en la base de datos:
1. Recomienda 3 posibles variantes (colores, tamaños, accesorios o bundles) para los productos existentes.
2. Sugiere 2 nuevos productos complementarios que deberían agregar al catálogo para incrementar el ticket promedio.`;

      const responseText = await callGeminiAPI(prompt);
      setAiVariantsResult(responseText);
    } catch (err) {
      alert(`Error al consultar IA: ${err.message}`);
    } finally {
      setIsLoadingVariants(false);
    }
  };

  // --- FILTRADO DE TIENDAS Y PRODUCTOS ---
  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeStoreProducts = products.filter(p => p.storeId === selectedStore.id);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* NAVEGACIÓN PRINCIPAL */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setCurrentView('marketplace'); setActiveSubdomain(null); }}>
            <div className="bg-indigo-600 text-white p-2 rounded-xl text-xl shadow-md">🦭</div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-gray-900">FOCA<span className="text-indigo-600">.app</span></span>
              {activeSubdomain && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded-full">
                  {activeSubdomain}.foca.app
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentView('marketplace')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${currentView === 'marketplace' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              🏪 Marketplace
            </button>
            <button
              onClick={() => setCurrentView('seller')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${currentView === 'seller' ? 'bg-indigo-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              💼 Mi Tienda / Panel
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-gray-600 hover:text-indigo-600 transition"
            >
              🛒 <span className="sr-only">Carrito</span>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow">
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL SEGÚN VISTA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* VISTA 1: MARKETPLACE CENTRAL (foca.app) */}
        {currentView === 'marketplace' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
              <h1 className="text-3xl sm:text-5xl font-black mb-4">Crea tu tienda online con tu propio subdominio</h1>
              <p className="text-indigo-100 text-lg max-w-2xl mb-8">
                El ecosistema multitienda donde cada emprendedor gestiona sus productos, precios optimizados con IA y su marca única.
              </p>
              <div className="max-w-md">
                <input
                  type="text"
                  placeholder="Buscar tiendas o marcas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-white shadow-lg"
                />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Tiendas Destacadas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStores.map(store => (
                  <div key={store.id} className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col">
                    <img src={store.banner} alt={store.name} className="h-32 w-full object-cover" />
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center space-x-3 mb-3">
                          <img src={store.logo} alt={store.name} className="w-10 h-10 rounded-full object-cover border" />
                          <div>
                            <h3 className="font-bold text-gray-900">{store.name}</h3>
                            <span className="text-xs text-indigo-600 font-mono">{store.subdomain}.foca.app</span>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{store.description}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedStore(store);
                          setCurrentView('storefront');
                        }}
                        className="w-full py-2.5 px-4 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-indigo-600 transition shadow"
                      >
                        Visitar Tienda →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VISTA 2: VITRINA / STOREFRONT INDIVIDUAL DE UNA TIENDA */}
        {currentView === 'storefront' && selectedStore && (
          <div className="space-y-8">
            <div className="relative rounded-3xl overflow-hidden bg-gray-900 text-white h-64 shadow-lg">
              <img src={selectedStore.banner} alt={selectedStore.name} className="absolute inset-0 w-full h-full object-cover opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8">
                <div className="flex items-center space-x-4">
                  <img src={selectedStore.logo} alt={selectedStore.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow" />
                  <div>
                    <h1 className="text-3xl font-bold">{selectedStore.name}</h1>
                    <p className="text-gray-300 text-sm">{selectedStore.description}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Catálogo de Productos</h2>
              <button onClick={() => setCurrentView('marketplace')} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                ← Volver al Marketplace
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeStoreProducts.map(product => (
                <div key={product.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
                  <img src={product.image} alt={product.name} className="h-48 w-full object-cover" />
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">{product.category}</span>
                      <h3 className="font-bold text-gray-900 text-lg mt-1">{product.name}</h3>
                      <p className="text-gray-500 text-sm mt-2 line-clamp-2">{product.description}</p>
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-2xl font-black text-gray-900">${product.price}</span>
                      <button
                        onClick={() => addToCart(product)}
                        className="px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition shadow"
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISTA 3: PANEL DE CONTROL DEL VENDEDOR + ASISTENTE IA */}
        {currentView === 'seller' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Panel de Control del Vendedor</h1>
                <p className="text-gray-500 text-sm">Gestiona la tienda: <strong className="text-indigo-600">{selectedStore.name}</strong> ({selectedStore.subdomain}.foca.app)</p>
              </div>
              <select
                value={selectedStore.id}
                onChange={(e) => setSelectedStore(stores.find(s => s.id === e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* SECCIÓN IA GEMINI */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
              <div className="flex items-center space-x-3 border-b border-indigo-700/50 pb-4">
                <span className="text-3xl">🤖</span>
                <div>
                  <h2 className="text-xl font-bold">Asistente Inteligente FOCA IA (Gemini)</h2>
                  <p className="text-indigo-200 text-xs">Optimización de precios y predicción de catálogo para tu tienda</p>
                </div>
              </div>

              {/* API Key input */}
              <div className="bg-indigo-950/60 p-4 rounded-2xl border border-indigo-700/40">
                <label className="block text-xs font-semibold text-indigo-300 mb-1">Clave API de Gemini</label>
                <input
                  type="password"
                  placeholder="Ingresa tu GEMINI_API_KEY..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 bg-indigo-900/80 border border-indigo-600/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Herramienta 1: Calculadora de Precio Sugerido */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg text-white flex items-center space-x-2">
                      <span>🏷️</span> <span>Recomendador de Precio de Venta</span>
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-indigo-200">Costo del producto ($ USD)</label>
                        <input
                          type="number"
                          placeholder="Ej: 40"
                          value={aiProductCost}
                          onChange={(e) => setAiProductCost(e.target.value)}
                          className="w-full px-3 py-2 bg-white text-gray-900 rounded-xl text-sm mt-1 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-indigo-200">Margen deseado (%)</label>
                        <input
                          type="number"
                          value={aiDesiredMargin}
                          onChange={(e) => setAiDesiredMargin(e.target.value)}
                          className="w-full px-3 py-2 bg-white text-gray-900 rounded-xl text-sm mt-1 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleCalculatePriceWithAI}
                    disabled={isLoadingPricing}
                    className="mt-6 w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm rounded-xl transition shadow disabled:opacity-50"
                  >
                    {isLoadingPricing ? 'Procesando con IA...' : 'Calcular Precio Optimo'}
                  </button>

                  {aiPricingResult && (
                    <div className="mt-4 p-4 bg-indigo-950/80 rounded-xl text-xs leading-relaxed text-indigo-100 whitespace-pre-line border border-indigo-500/30">
                      {aiPricingResult}
                    </div>
                  )}
                </div>

                {/* Herramienta 2: Predicción de Variantes por BDD */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg text-white flex items-center space-x-2">
                      <span>📊</span> <span>Predicción de Variantes e Inventario</span>
                    </h3>
                    <p className="text-xs text-indigo-200">
                      La IA analizará los productos actuales almacenados en la base de datos de <strong>{selectedStore.name}</strong> para sugerirte expansiones estratégicas.
                    </p>
                  </div>
                  <button
                    onClick={handlePredictVariantsWithAI}
                    disabled={isLoadingVariants}
                    className="mt-6 w-full py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-bold text-sm rounded-xl transition shadow disabled:opacity-50"
                  >
                    {isLoadingVariants ? 'Analizando BDD...' : 'Analizar Inventario con IA'}
                  </button>

                  {aiVariantsResult && (
                    <div className="mt-4 p-4 bg-indigo-950/80 rounded-xl text-xs leading-relaxed text-indigo-100 whitespace-pre-line border border-purple-500/30">
                      {aiVariantsResult}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL DEL CARRITO DE COMPRAS */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col p-6 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold text-gray-900">Carrito de Compras</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-12">El carrito está vacío.</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-3">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                      <p className="text-xs text-gray-500">${item.price} x {item.quantity}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-gray-900">${item.price * item.quantity}</span>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 text-xs font-bold">Quitar</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between text-lg font-black text-gray-900">
                  <span>Total:</span>
                  <span>${cartTotal}</span>
                </div>
                <button
                  onClick={() => alert('¡Gracias por tu compra de prueba en FOCA!')}
                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg"
                >
                  Finalizar Compra
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PIE DE PÁGINA */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500">
        <p>© 2026 FOCA.app — Plataforma E-commerce Multitienda con Inteligencia Artificial.</p>
      </footer>
    </div>
  );
}