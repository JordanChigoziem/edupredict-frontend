const BASE_URL = 'https://edupredict-backend-production.up.railway.app/api';

function getToken() {
  return localStorage.getItem('edupredict_token');
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const login = (email, password) => request('POST', '/auth/login', { email, password });
export const getMe = () => request('GET', '/auth/me');
export const updateProfile = (data) => request('PUT', '/auth/profile', data);
export const changePassword = (data) => request('PUT', '/auth/change-password', data);
export const getStudents = (params = {}) => { const qs = new URLSearchParams(params).toString(); return request('GET', `/students${qs ? '?' + qs : ''}`); };
export const addStudent = (data) => request('POST', '/students', data);
export const updateStudent = (id, data) => request('PUT', `/students/${id}`, data);
export const deleteStudent = (id) => request('DELETE', `/students/${id}`);
export const predict = (data) => request('POST', '/predict', data);
export const getPredictions = () => request('GET', '/predictions');
export const getReports = (params = {}) => { const qs = new URLSearchParams(params).toString(); return request('GET', `/reports${qs ? '?' + qs : ''}`); };
export const createReport = (data) => request('POST', '/reports', data);
export const updateReport = (id, data) => request('PUT', `/reports/${id}`, data);
export const deleteReport = (id) => request('DELETE', `/reports/${id}`);
export const getModels = () => request('GET', '/models');
export const trainModel = (data) => request('POST', '/models', data);
export const updateModel = (id, data) => request('PUT', `/models/${id}`, data);
export const deleteModel = (id) => request('DELETE', `/models/${id}`);
export const getDatasets = () => request('GET', '/datasets');
export const addDataset = (data) => request('POST', '/datasets', data);
export const updateDataset = (id, data) => request('PUT', `/datasets/${id}`, data);
export const deleteDataset = (id) => request('DELETE', `/datasets/${id}`);
export const getAnalytics = () => request('GET', '/analytics');
export const getSettings = () => request('GET', '/settings');
export const updateSettings = (data) => request('PUT', '/settings', data);