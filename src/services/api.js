import axios from "axios";

const api = axios.create({
  baseURL: "https://alesteb-back.onrender.com/api",
});

export default api;
