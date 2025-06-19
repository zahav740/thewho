import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';

export const useApiClient = () => {
  const { token, logout } = useAuth();

  const apiRequest = async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Если получили 401, значит токен недействителен
    if (response.status === 401) {
      logout();
      window.location.href = '/login';
    }

    return response;
  };

  const get = (endpoint: string) => apiRequest(endpoint);
  
  const post = (endpoint: string, data?: any) =>
    apiRequest(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });

  const put = (endpoint: string, data?: any) =>
    apiRequest(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });

  const del = (endpoint: string) =>
    apiRequest(endpoint, {
      method: 'DELETE',
    });

  const patch = (endpoint: string, data?: any) =>
    apiRequest(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });

  return {
    apiRequest,
    get,
    post,
    put,
    delete: del,
    patch,
  };
};
