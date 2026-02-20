// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Your Express API URL
});

// export const fetchData = async () => {
//   const response = await api.get('/data');
//   return response.data;
// };