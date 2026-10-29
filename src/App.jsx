import React, { useState, useEffect } from 'react';

// ==========================================
// COMPONENTE PRINCIPAL (App)
// ==========================================
export default function App() {
  // --- ESTADOS GLOBALES ---
  const [role, setRole] = useState('buyer'); // 'buyer' | 'seller'
  const [view, setView] = useState('marketplace'); // 'marketplace' | 'storefront' | 'dashboard'
  const [activeStoreId, setActiveStoreId] = useState(null);
  const [selectedSellerStoreId, setSelectedSellerStoreId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modales
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCreateStoreOpen, setIsCreateStoreOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Notificación
  const [toast, setToast] = useState({ show: false, message: '', icon: 'check' });

  const showToast = (message, icon = 'check') => {
    setToast({ show: true, message, icon });
    setTimeout(() => setToast({ show: false, message: '', icon: 'check' }), 3000);
  };

  // --- BASE DE DATOS INICIAL ---
  const [stores, setStores] = useState([
    {
      id: 'store-1',
      name: 'TecnoStore Argentina',
      description: 'Gadgets de última tecnología, auriculares inalámbricos y smartwatchs.',
      owner: 'Federico Gómez',
      logo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150'
    },
    {
      id: 'store-2',
      name: 'Urban Streetwear',
      description: 'Indumentaria urbana oversize, moda sustentable y diseño independiente.',
      owner: 'Camila Ruarte',
      logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150'
    }
  ]);

  const [products, setProducts] = useState([
    {
      id: 'prod-1',
      storeId: 'store-1',
      name: 'Auriculares Inalámbricos Pro X',
      description: 'Cancelación de ruido activa, sonido envolvente y batería de 24 hs.',
      price: 49990,
      cost: 25000,
      stock: 12,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
    },
    {
      id: 'prod-2',
      storeId: 'store-1',
      name: 'Smartwatch Deportivo Series 7',
      description: 'Monitoreo de frecuencia cardíaca, GPS integrado e IP68.',
      price: 78500,
      cost: 40000,
      stock: 5,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'
    },
    {
      id: 'prod-3',
      storeId: 'store-2',
      name: 'Remera Oversize Algodón Premium',
      description: '100% algodón peinado. Estilo urbano relajado.',
      price: 19500,
      cost: 8000,
      stock: 20,
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400'
    }
  ]);

  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (stores.length > 0 && !selectedSellerStoreId) {
      setSelectedSellerStoreId(stores[0].id);
    }
  }, [stores]);

  // --- LÓGICA DEL CARRITO ---
  const addToCart = (product, store) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, store, quantity: 1 }];
    });
    showToast('Producto agregado al carrito', 'shopping-bag');
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // --- LÓGICA DE TIENDAS Y PRODUCTOS ---
  const handleCreateStore = (storeData) => {
    const newStore = { id: `store-${Date.now()}`, ...storeData };
    setStores(prev => [...prev, newStore]);
    setSelectedSellerStoreId(newStore.id);
    setIsCreateStoreOpen(false);
    showToast('¡Nueva tienda creada con éxito!', 'store');
  };

  const handleAddProduct = (prodData) => {
    const newProd = { id: `prod-${Date.now()}`, storeId: selectedSellerStoreId, ...prodData };
    setProducts(prev => [...prev, newProd]);
    setIsAddProductOpen(false);
    showToast('Producto agregado al catálogo', 'box');
  };

  const handleDeleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast('Producto eliminado', 'trash');
  };

  const handleCheckout = (customerData) => {
    if (cart.length === 0) return;
    
    // Generar un pedido agrupado por tienda
    const newOrders = [];
    const grouped = {};
    cart.forEach(item => {
      if (!grouped[item.store.id]) grouped[item.store.id] = { items: [], total: 0 };
      grouped[item.store.id].items.push({ name: item.product.name, qty: item.quantity, price: item.product.price });
      grouped[item.store.id].total += item.product.price * item.quantity;
    });

    Object.keys(grouped).forEach(sId => {
      newOrders.push({
        id: Math.floor(100000 + Math.random() * 900000),
        storeId: sId,
        customer: customerData,
        items: grouped[sId].items,
        total: grouped[sId].total,
        status: 'Pendiente de Despacho',
        date: new Date().toLocaleDateString()
      });
    });

    setOrders(prev => [...prev, ...newOrders]);
    setCart([]);
    setIsCartOpen(false);
    showToast('¡Compra realizada con éxito!', 'check-circle');
  };

  const currentStore = stores.find(s => s.id === activeStoreId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between">
      
      {/* BARRA NAVEGACIÓN */}
      <Header 
        role={role} 
        setRole={setRole} 
        view={view} 
        setView={setView} 
        cartCount={cartCount} 
        openCart={() => setIsCartOpen(true)}
        goHome={() => { setView('marketplace'); setActiveStoreId(null); }}
      />

      {/* NOTIFICACIÓN TOAST */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-3 transition">
          <span className="text-indigo-400 font-bold">✓</span>
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* VISTA 1: MARKETPLACE */}
        {view === 'marketplace' && role === 'buyer' && (
          <MarketplaceView 
            stores={stores} 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            onOpenStore={(id) => { setActiveStoreId(id); setView('storefront'); }}
            onCreateStoreClick={() => { setRole('seller'); setView('dashboard'); setIsCreateStoreOpen(true); }}
          />
        )}

        {/* VISTA 2: VITRINA DE TIENDA ESPECÍFICA (STOREFRONT) */}
        {view === 'storefront' && currentStore && (
          <StorefrontView 
            store={currentStore} 
            products={products.filter(p => p.storeId === currentStore.id)} 
            onBack={() => setView('marketplace')} 
            onAddToCart={(p) => addToCart(p, currentStore)}
          />
        )}

        {/* VISTA 3: PANEL DE VENDEDOR (DASHBOARD) */}
        {view === 'dashboard' && role === 'seller' && (
          <SellerDashboard 
            stores={stores} 
            selectedStoreId={selectedSellerStoreId} 
            setSelectedStoreId={setSelectedSellerStoreId}
            products={products.filter(p => p.storeId === selectedSellerStoreId)}
            orders={orders.filter(o => o.storeId === selectedSellerStoreId)}
            onOpenCreateStore={() => setIsCreateStoreOpen(true)}
            onOpenAddProduct={() => setIsAddProductOpen(true)}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

      </main>

      {/* MODALES */}
      <CartModal 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart} 
        total={cartTotal} 
        onRemove={removeFromCart} 
        onCheckout={handleCheckout} 
      />

      <CreateStoreModal 
        isOpen={isCreateStoreOpen} 
        onClose={() => setIsCreateStoreOpen(false)} 
        onCreate={handleCreateStore} 
      />

      <AddProductModal 
        isOpen={isAddProductOpen} 
        onClose={() => setIsAddProductOpen(false)} 
        onAdd={handleAddProduct} 
      />

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <p>© 2026 FOCA - Plataforma Multitienda E-Commerce impulsada por IA.</p>
      </footer>
    </div>
  );
}

// ==========================================
// COMPONENTE: HEADER / NAVEGACIÓN
// ==========================================
function Header({ role, setRole, view, setView, cartCount, openCart, goHome }) {
  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={goHome}>
          <div className="bg-indigo-600 p-2 rounded-xl text-white font-extrabold text-lg flex items-center justify-center">
            🦭
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight">FOCA<span className="text-indigo-400">.app</span></span>
            <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold">E-Commerce Multitienda</span>
          </div>
        </div>

        {/* SELECTOR DE ROL */}
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-semibold">
          <button 
            onClick={() => { setRole('buyer'); if (view === 'dashboard') setView('marketplace'); }}
            className={`px-3 py-1.5 rounded-lg transition ${role === 'buyer' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            🛒 Comprador
          </button>
          <button 
            onClick={() => { setRole('seller'); setView('dashboard'); }}
            className={`px-3 py-1.5 rounded-lg transition ${role === 'seller' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            🏪 Vendedor
          </button>
        </div>

        {/* BOTÓN CARRITO */}
        <button onClick={openCart} className="relative bg-slate-800 hover:bg-slate-700 p-2.5 rounded-xl border border-slate-700 text-xs font-semibold flex items-center space-x-2 transition">
          <span>🛒</span>
          <span className="hidden sm:inline">Carrito</span>
          {cartCount > 0 && (
            <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{cartCount}</span>
          )}
        </button>
      </div>
    </header>
  );
}

// ==========================================
// COMPONENTE: MARKETPLACE
// ==========================================
function MarketplaceView({ stores, searchQuery, setSearchQuery, onOpenStore, onCreateStoreClick }) {
  const filtered = stores.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div>
      {/* HERO BANNER */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-8 md:p-12 text-white shadow-xl mb-10 relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <span className="bg-indigo-500/30 text-indigo-200 text-xs font-bold px-3 py-1 rounded-full uppercase border border-indigo-400/30">Plataforma Multitienda</span>
          <h1 className="text-3xl md:text-5xl font-black mt-3 mb-4 tracking-tight">Crea tu tienda online o explora marcas únicas</h1>
          <p className="text-indigo-100 text-sm md:text-base mb-6">El ecosistema de comercio electrónico que conecta marcas independientes con compradores en todo el país.</p>
          <div className="flex gap-3">
            <a href="#tiendas" className="bg-white text-indigo-900 font-bold px-5 py-2.5 rounded-xl text-xs hover:bg-indigo-50 transition">Ver Tiendas</a>
            <button onClick={onCreateStoreClick} className="bg-indigo-600/60 hover:bg-indigo-600 border border-indigo-400/40 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition">Crear mi Tienda Gratis</button>
          </div>
        </div>
      </div>

      {/* BUSCADOR */}
      <div id="tiendas" className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Tiendas Oficiales</h2>
          <p className="text-xs text-slate-500">Haz clic para entrar al catálogo exclusivo de cada vendedor</p>
        </div>
        <input 
          type="text" 
          placeholder="Buscar tienda o marca..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-72 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
      </div>

      {/* LISTADO DE TIENDAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(store => (
          <div key={store.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="h-24 bg-gradient-to-r from-slate-800 to-indigo-900 relative p-4 flex items-end">
                <div className="w-14 h-14 bg-white rounded-xl shadow border-2 border-white absolute -bottom-4 left-4 overflow-hidden flex items-center justify-center font-bold text-indigo-600 text-lg">
                  {store.logo ? <img src={store.logo} alt="Logo" className="w-full h-full object-cover"/> : store.name.charAt(0)}
                </div>
              </div>
              <div className="pt-6 p-5">
                <h3 className="font-bold text-slate-900 text-base">{store.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{store.description}</p>
                <span className="text-[11px] text-slate-400 mt-3 block">Dueño: <strong className="text-slate-600">{store.owner}</strong></span>
              </div>
            </div>
            <div className="p-5 pt-0">
              <button onClick={() => onOpenStore(store.id)} className="w-full bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 text-xs font-bold py-2.5 rounded-xl transition">
                Visitar Tienda →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: STOREFRONT (VITRINA DE TIENDA)
// ==========================================
function StorefrontView({ store, products, onBack, onAddToCart }) {
  return (
    <div>
      <button onClick={onBack} className="mb-6 inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm transition">
        ← Volver al Marketplace
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 shadow-sm">
        <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 overflow-hidden flex-shrink-0">
          {store.logo ? <img src={store.logo} className="w-full h-full object-cover" /> : store.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{store.name}</h1>
          <p className="text-slate-600 text-xs mt-1">{store.description}</p>
          <div className="mt-3 flex items-center space-x-3 text-[11px] text-slate-400 font-semibold">
            <span>📦 {products.length} Productos</span>
            <span>🛡️ Compra Garantizada</span>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-bold text-slate-900 mb-4">Catálogo de Productos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
            <div>
              <div className="h-44 bg-slate-100">
                <img src={product.image} className="w-full h-full object-cover" />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-900 text-xs line-clamp-1">{product.name}</h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{product.description}</p>
                <div className="mt-3 text-base font-extrabold text-indigo-600">
                  ${product.price.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="p-4 pt-0">
              <button onClick={() => onAddToCart(product)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-xl transition shadow">
                + Agregar al Carrito
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: DASHBOARD DE VENDEDOR & IA
// ==========================================
function SellerDashboard({ stores, selectedStoreId, setSelectedStoreId, products, orders, onOpenCreateStore, onOpenAddProduct, onDeleteProduct }) {
  const [tab, setTab] = useState('products'); // 'products' | 'orders' | 'ai'

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel de Administración de Vendedor</h1>
          <p className="text-xs text-slate-500">Gestiona tu tienda online y consulta al Asistente IA</p>
        </div>
        <button onClick={onOpenCreateStore} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition">
          + Crear Nueva Tienda
        </button>
      </div>

      {/* SELECTOR DE TIENDA */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-6 flex items-center space-x-3">
        <span className="text-xs font-bold text-slate-600 uppercase">Tienda Activa:</span>
        <select value={selectedStoreId || ''} onChange={(e) => setSelectedStoreId(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-1.5 font-semibold focus:outline-none">
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* PESTAÑAS */}
      <div className="flex space-x-2 border-b border-slate-200 mb-6">
        <button onClick={() => setTab('products')} className={`pb-3 px-4 border-b-2 font-bold text-xs transition ${tab === 'products' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>📦 Productos ({products.length})</button>
        <button onClick={() => setTab('orders')} className={`pb-3 px-4 border-b-2 font-bold text-xs transition ${tab === 'orders' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>📋 Pedidos Recibidos ({orders.length})</button>
        <button onClick={() => setTab('ai')} className={`pb-3 px-4 border-b-2 font-bold text-xs transition relative ${tab === 'ai' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>
          ✨ Asistente IA (Gemini)
          <span className="ml-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">NUEVO</span>
        </button>
      </div>

      {/* CONTENIDO PESTAÑAS */}
      {tab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-slate-900">Productos en Catálogo</h2>
            <button onClick={onOpenAddProduct} className="bg-indigo-600 text-white text-xs font-bold px-3 py-2 rounded-xl shadow hover:bg-indigo-700 transition">+ Nuevo Producto</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map(p => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                <div>
                  <img src={p.image} className="w-full h-32 object-cover rounded-xl mb-3" />
                  <h3 className="font-bold text-xs text-slate-900">{p.name}</h3>
                  <div className="mt-2 flex justify-between text-xs font-semibold">
                    <span className="text-indigo-600">${p.price.toLocaleString()}</span>
                    <span className="text-slate-400">Stock: {p.stock}</span>
                  </div>
                </div>
                <button onClick={() => onDeleteProduct(p.id)} className="mt-3 w-full bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold py-1.5 rounded-lg transition">Eliminar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-bold text-xs text-slate-900">Pedido #{o.id}</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Cliente: {o.customer.name} ({o.customer.email})</p>
                <div className="mt-2 flex gap-1">
                  {o.items.map((it, idx) => (
                    <span key={idx} className="bg-slate-100 text-[10px] px-2 py-0.5 rounded font-semibold text-slate-600">{it.name} (x{it.qty})</span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-indigo-600">${o.total.toLocaleString()}</span>
                <span className="block text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full mt-1 border border-amber-200">{o.status}</span>
              </div>
            </div>
          ))}
          {orders.length === 0 && <p className="text-center py-10 text-xs text-slate-400">No hay pedidos registrados en esta tienda.</p>}
        </div>
      )}

      {tab === 'ai' && <AIAssistantModule products={products} storeName={stores.find(s=>s.id === selectedStoreId)?.name} />}
    </div>
  );
}

// ==========================================
// COMPONENTE: ASISTENTE DE IA (GEMINI API)
// ==========================================
function AIAssistantModule({ products, storeName }) {
  const [mode, setMode] = useState('pricing'); // 'pricing' | 'variants'
  const [cost, setCost] = useState('');
  const [margin, setMargin] = useState(40);
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  const callGemini = async (prompt) => {
    setLoading(true);
    setAiResponse('');
    const apiKey = ""; // Runtime key
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: "Eres un consultor experto en e-commerce y precios para tiendas online." }] }
        })
      });
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo obtener la respuesta de la IA.";
      setAiResponse(text);
    } catch (err) {
      setAiResponse("Ocurrió un error de conexión con la IA de Gemini.");
    } finally {
      setLoading(false);
    }
  };

  const handlePricing = () => {
    if (!cost) return;
    const prompt = `Calcula el precio recomendado de venta para el producto "${productName || 'Producto General'}":
    - Costo de producción/compra: $${cost}
    - Margen de ganancia objetivo: ${margin}%
    
    Proporciona:
    1. Precio sugerido de venta.
    2. Precio recomendado para oferta/descuento.
    3. Consejo de precios psicológicos.`;
    callGemini(prompt);
  };

  const handleVariants = () => {
    const prompt = `Analiza este inventario de la tienda "${storeName}":
    ${JSON.stringify(products.map(p => ({ nombre: p.name, precio: p.price })))}
    
    Recomienda 3 variantes de producto (colores, talles, bundles o combinaciones) para expandir el catálogo y aumentar las ventas.`;
    callGemini(prompt);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="font-bold text-base flex items-center space-x-2">
          <span>✨</span>
          <span>IA Asesora de Comercio</span>
        </h3>
        <p className="text-xs text-slate-300">Aprovecha el poder del modelo Gemini 3 Flash para optimizar los ingresos de tu tienda.</p>
        <div className="space-y-2 pt-2">
          <button onClick={() => setMode('pricing')} className={`w-full text-left p-3 rounded-xl text-xs font-semibold border transition ${mode === 'pricing' ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-700 text-slate-300'}`}>
            🧮 Calculadora de Precios
          </button>
          <button onClick={() => setMode('variants')} className={`w-full text-left p-3 rounded-xl text-xs font-semibold border transition ${mode === 'variants' ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-700 text-slate-300'}`}>
            💡 Predicción de Variantes
          </button>
        </div>
      </div>

      <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        {mode === 'pricing' && (
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900">Optimización de Precio de Venta</h4>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Nombre Producto" value={productName} onChange={(e) => setProductName(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
              <input type="number" placeholder="Costo ($)" value={cost} onChange={(e) => setCost(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Margen Objetivo (%): {margin}%</label>
              <input type="range" min="10" max="200" value={margin} onChange={(e) => setMargin(e.target.value)} className="w-full accent-indigo-600" />
            </div>
            <button onClick={handlePricing} disabled={loading} className="w-full bg-indigo-600 text-white font-bold text-xs py-2.5 rounded-xl shadow hover:bg-indigo-700 transition">
              {loading ? 'Calculando con IA...' : 'Calcular Precio Óptimo'}
            </button>
          </div>
        )}

        {mode === 'variants' && (
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900">Recomendador de Variantes y Combos</h4>
            <p className="text-xs text-slate-500">Analiza tus {products.length} productos guardados para proponerte combinaciones con alta demanda.</p>
            <button onClick={handleVariants} disabled={loading} className="w-full bg-purple-600 text-white font-bold text-xs py-2.5 rounded-xl shadow hover:bg-purple-700 transition">
              {loading ? 'Analizando Catálogo...' : 'Generar Sugerencias de Variantes'}
            </button>
          </div>
        )}

        {aiResponse && (
          <div className="mt-4 p-4 bg-slate-50 border border-indigo-100 rounded-2xl text-xs text-slate-700 whitespace-pre-line leading-relaxed">
            <strong className="text-indigo-600 block mb-1">Respuesta de Gemini AI:</strong>
            {aiResponse}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// MODALES (CARRITO, CREAR TIENDA, NUEVO PRODUCTO)
// ==========================================
function CartModal({ isOpen, onClose, cart, total, onRemove, onCheckout }) {
  const [customer, setCustomer] = useState({ name: '', email: '', address: '' });
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end">
      <div className="bg-white max-w-md w-full h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">Carrito de Compras</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
          <div className="divide-y divide-slate-100 my-4">
            {cart.map((item, idx) => (
              <div key={idx} className="py-3 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{item.product.name}</h4>
                  <span className="text-[10px] text-indigo-600">Tienda: {item.store.name}</span>
                  <p className="text-[11px] text-slate-500">${item.product.price.toLocaleString()} x {item.quantity}</p>
                </div>
                <button onClick={() => onRemove(idx)} className="text-red-400 text-xs font-bold">Quitar</button>
              </div>
            ))}
            {cart.length === 0 && <p className="text-center py-10 text-xs text-slate-400">Tu carrito está vacío</p>}
          </div>
        </div>

        {cart.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex justify-between font-bold text-sm">
              <span>Total:</span>
              <span className="text-indigo-600">${total.toLocaleString()}</span>
            </div>
            <input type="text" placeholder="Nombre Completo" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
            <input type="email" placeholder="Email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
            <button onClick={() => onCheckout(customer)} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl text-xs shadow hover:bg-indigo-700">Comprar Ahora</button>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateStoreModal({ isOpen, onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '', owner: '', logo: '' });
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Crear Nueva Tienda</h3>
        <input type="text" placeholder="Nombre de la Tienda" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
        <textarea placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
        <input type="text" placeholder="Nombre del Dueño" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
        <div className="flex space-x-2">
          <button onClick={onClose} className="w-1/2 bg-slate-100 font-bold text-xs py-2 rounded-xl">Cancelar</button>
          <button onClick={() => onCreate(form)} className="w-1/2 bg-indigo-600 text-white font-bold text-xs py-2 rounded-xl shadow">Crear Tienda</button>
        </div>
      </div>
    </div>
  );
}

function AddProductModal({ isOpen, onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', price: '', stock: '', description: '', image: '' });
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-3">
        <h3 className="font-bold text-slate-900 text-base">Agregar Producto</h3>
        <input type="text" placeholder="Nombre Producto" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="Precio ($)" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
          <input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
        </div>
        <textarea placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
        <input type="text" placeholder="URL de la Imagen" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
        <div className="flex space-x-2 pt-2">
          <button onClick={onClose} className="w-1/2 bg-slate-100 font-bold text-xs py-2 rounded-xl">Cancelar</button>
          <button onClick={() => onAdd(form)} className="w-1/2 bg-indigo-600 text-white font-bold text-xs py-2 rounded-xl shadow">Guardar</button>
        </div>
      </div>
    </div>
  );
}