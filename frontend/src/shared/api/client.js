import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";

const client = axios.create({
  baseURL,
  withCredentials: true,
});

client.interceptors.response.use( 
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {

    }
    return Promise.reject(err);
  }
);

export default client;