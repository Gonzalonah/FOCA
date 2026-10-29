// src/utils/subdomain.js

export const getSubdomain = () => {
  const hostname = window.location.hostname;
  
  // Para desarrollo local en localhost
  if (hostname.includes('localhost')) {
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost') {
      return parts[0]; // Retorna 'tecnostore' de 'tecnostore.localhost'
    }
    return null;
  }

  // Para producción (ej: tecnostore.foca.app)
  const parts = hostname.split('.');
  if (parts.length > 2) {
    return parts[0];
  }

  return null; // Dominio principal (foca.app)
};