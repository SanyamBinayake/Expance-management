import React, { useEffect, useState } from "react";
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  exportCSV,
  exportPDF,
} from "./api";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseChart from "./components/ExpenseChart";
import "./App.css"; // new CSS file

function App() {
  const [expenses, setExpenses] = useState([]);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    const res = await getExpenses();
    setExpenses(res.data);
  };

  const handleAddOrUpdate = async (expense) => {
    if (editingExpense) {
      await updateExpense(editingExpense.id, expense);
    } else {
      await addExpense(expense);
    }
    fetchExpenses();
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    await deleteExpense(id);
    fetchExpenses();
  };

  const handleExportCSV = async () => {
    const res = await exportCSV();
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "expenses.csv");
    document.body.appendChild(link);
    link.click();
  };

  const handleExportPDF = async () => {
    const res = await exportPDF();
    const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "expenses.pdf");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="app-container">
      <header>
        <h1>💰 Expense Manager</h1>
        <div className="header-buttons">
          <button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Close Form" : "Add Expense"}
          </button>
          <button onClick={handleExportCSV}>Export CSV</button>
          <button onClick={handleExportPDF}>Export PDF</button>
        </div>
      </header>

      {showForm && (
        <ExpenseForm
          onSubmit={handleAddOrUpdate}
          editingExpense={editingExpense}
          setEditingExpense={setEditingExpense}
        />
      )}

      <div className="expenses-grid">
        {expenses.map((exp) => (
          <div className="expense-card" key={exp.id}>
            <h3>{exp.title}</h3>
            <p>💵 {exp.amount}</p>
            <p>📂 {exp.category}</p>
            <p>📅 {exp.date}</p>
            <div className="card-actions">
              <button onClick={() => { setEditingExpense(exp); setShowForm(true); }}>Edit</button>
              <button onClick={() => handleDelete(exp.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <h2>Expense Chart</h2>
      <ExpenseChart expenses={expenses} />
    </div>
  );
}

export default App;
