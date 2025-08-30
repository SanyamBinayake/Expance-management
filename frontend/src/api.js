import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000", // FastAPI backend
});

export const getExpenses = () => API.get("/expenses/");
export const addExpense = (expense) => API.post("/expenses/", expense);
export const updateExpense = (id, expense) => API.put(`/expenses/${id}`, expense);
export const deleteExpense = (id) => API.delete(`/expenses/${id}`);
export const exportCSV = () => API.get("/expenses/export/csv", { responseType: "blob" });
export const exportPDF = () => API.get("/expenses/export/pdf", { responseType: "blob" });
