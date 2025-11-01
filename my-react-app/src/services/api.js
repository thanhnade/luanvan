import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/users/login', {
      username,
      password,
    });
    return response.data;
  },

  register: async (fullname, username, password, confirmPassword) => {
    const response = await api.post('/users', {
      fullname,
      username,
      password,
      confirmPassword,
    });
    return response.data;
  },
};

export default api;

