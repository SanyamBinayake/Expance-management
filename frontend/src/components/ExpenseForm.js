import React, { useState, useEffect } from "react";

const ExpenseForm = ({ onSubmit, editingExpense, setEditingExpense }) => {
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "",
    date: "",
  });

  useEffect(() => {
    if (editingExpense) {
      setForm(editingExpense);
    }
  }, [editingExpense]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    setForm({ title: "", amount: "", category: "", date: "" });
    setEditingExpense(null);
  };

  return (
    <form onSubmit={handleSubmit} className="expense-form">
      <input name="title" value={form.title} onChange={handleChange} placeholder="Title" required />
      <input name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="Amount" required />
      <input name="category" value={form.category} onChange={handleChange} placeholder="Category" required />
      <input name="date" type="date" value={form.date} onChange={handleChange} required />
      <button type="submit">{editingExpense ? "Update" : "Add"} Expense</button>
    </form>
  );
};

export default ExpenseForm;
