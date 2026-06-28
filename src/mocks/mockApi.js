import mockUsersData from './mockUsers.json';

/**
 * Capa de datos simulada para probar el panel de administrador
 * sin necesidad de levantar StudiumServer.
 *
 * Se activa con la variable de entorno VITE_USE_MOCK_DATA="true" en el .env.
 * Mantiene una copia mutable en memoria para que el botón
 * "Ascender a Tutor" se refleje visualmente (sin persistir entre recargas).
 */

export const isMockEnabled = import.meta.env.VITE_USE_MOCK_DATA === 'true';

// Copia en memoria (se reinicia al recargar la página)
let mockUsers = JSON.parse(JSON.stringify(mockUsersData));

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockFetchUsers() {
  await delay();
  return JSON.parse(JSON.stringify(mockUsers));
}

export async function mockFetchUserById(id) {
  await delay();
  const user = mockUsers.find((u) => u._id === id);
  if (!user) throw new Error('Usuario no encontrado (mock)');
  return JSON.parse(JSON.stringify(user));
}

export async function mockPatchUser(id, changes) {
  await delay();
  const idx = mockUsers.findIndex((u) => u._id === id);
  if (idx === -1) throw new Error('Usuario no encontrado (mock)');
  mockUsers[idx] = { ...mockUsers[idx], ...changes };
  return JSON.parse(JSON.stringify(mockUsers[idx]));
}
