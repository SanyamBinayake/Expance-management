import React from "react";

const ExpenseList = ({ expenses, onDelete, onEdit }) => {
  return (
    <table border="1" cellPadding="10">
      <thead>
        <tr>
          <th>Title</th>
          <th>Amount</th>
          <th>Category</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {expenses.map((exp) => (
          <tr key={exp.id}>
            <td>{exp.title}</td>
            <td>{exp.amount}</td>
            <td>{exp.category}</td>
            <td>{exp.date}</td>
            <td>
              <button onClick={() => onEdit(exp)}>Edit</button>
              <button onClick={() => onDelete(exp.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ExpenseList;
