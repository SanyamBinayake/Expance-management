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
import ExpenseList from "./components/ExpenseList";
import "./App.css";

function App() {
  const [expenses, setExpenses] = useState([]);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewMode, setViewMode] = useState("card");

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await getExpenses();
      setExpenses(res.data);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    }
  };

  const handleAddOrUpdate = async (expense) => {
    if (editingExpense && editingExpense.id) {
      await updateExpense(editingExpense.id, expense);
    } else {
      await addExpense(expense);
    }
    fetchExpenses();
    setEditingExpense(null);
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
  };

  const handleDelete = async (id) => {
    await deleteExpense(id);
    fetchExpenses();
  };

  const handleExportCSV = async () => {
    try {
        const res = await exportCSV();
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "expenses.csv");
        document.body.appendChild(link);
        link.click();
        link.remove(); // Clean up the DOM
    } catch (error) {
        console.error("Failed to export CSV:", error);
    }
  };

  const handleExportPDF = async () => {
    try {
        const res = await exportPDF();
        const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "expenses.pdf");
        document.body.appendChild(link);
        link.click();
        link.remove(); // Clean up the DOM
    } catch (error) {
        console.error("Failed to export PDF:", error);
    }
  };

  // When "Add New Expense" is clicked, we set an empty object to edit.
  // The form will see this and not pre-fill any data.
  const handleAddNew = () => {
    setEditingExpense({ title: "", amount: "", category: "", date: "" });
  };
  

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>💰 Expense Manager</h1>
        <div className="header-actions">
          <button onClick={handleAddNew}>
            Add New Expense
          </button>
          <button onClick={handleExportCSV}>Export CSV</button>
          <button onClick={handleExportPDF}>Export PDF</button>
        </div>
      </header>

      <div className="dashboard-layout">
        <main className="main-content">
          <div className="view-controls">
            <h2>Your Expenses</h2>
            <div className="view-toggle">
              <button onClick={() => setViewMode("card")} className={viewMode === 'card' ? 'active' : ''}>Card View</button>
              <button onClick={() => setViewMode("list")} className={viewMode === 'list' ? 'active' : ''}>List View</button>
            </div>
          </div>

          {viewMode === 'card' ? (
            <div className="expenses-grid">
              {expenses.map((exp) => (
                <div className="expense-card" key={exp.id}>
                  <div className="card-header">
                    <h3>{exp.title}</h3>
                    <span className="card-amount">₹{parseFloat(exp.amount).toFixed(2)}</span>
                  </div>
                  <p className="card-category">📂 {exp.category}</p>
                  <p className="card-date">📅 {new Date(exp.date).toLocaleDateString()}</p>
                  <div className="card-actions">
                    <button className="edit-btn" onClick={() => handleEdit(exp)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(exp.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ExpenseList expenses={expenses} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        </main>

        <aside className="sidebar">
          {editingExpense && ( // Conditionally render the entire form widget
            <div className="sidebar-widget">
              <h2>{editingExpense.id ? "Edit Expense" : "Add New Expense"}</h2>
              <ExpenseForm
                onSubmit={handleAddOrUpdate}
                editingExpense={editingExpense}
                setEditingExpense={setEditingExpense}
              />
            </div>
          )}
          <div className="sidebar-widget">
            <h2>Spending Chart</h2>
            <ExpenseChart expenses={expenses} />
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;