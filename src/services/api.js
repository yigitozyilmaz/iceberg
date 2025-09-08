import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_AIRTABLE_API_URL,
    headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
    },
});

export default api;
