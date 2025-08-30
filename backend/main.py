from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import csv
import io
from fastapi.responses import StreamingResponse
from reportlab.pdfgen import canvas

from . import models, schemas, database

app = FastAPI()

# Enable CORS so frontend can communicate
origins = [
    "http://localhost:3000",  # React frontend URL
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
models.Base.metadata.create_all(bind=database.engine)

# Dependency for DB session
def get_db():
    db = database.session()
    try:
        yield db
    finally:
        db.close()

# -------------------- CRUD Operations --------------------

@app.post("/expenses/", response_model=schemas.ExpenseOut)
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    db_expense = models.Expense(**expense.dict())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.get("/expenses/", response_model=List[schemas.ExpenseOut])
def get_expenses(db: Session = Depends(get_db)):
    return db.query(models.Expense).all()

@app.put("/expenses/{expense_id}", response_model=schemas.ExpenseOut)
def update_expense(expense_id: int, expense: schemas.ExpenseUpdate, db: Session = Depends(get_db)):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    for key, value in expense.dict().items():
        setattr(db_expense, key, value)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(db_expense)
    db.commit()
    return {"message": "Expense deleted successfully"}

# -------------------- CSV Export --------------------

@app.get("/expenses/export/csv")
def export_csv(db: Session = Depends(get_db)):
    expenses = db.query(models.Expense).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Title", "Amount", "Category", "Date"])
    for exp in expenses:
        writer.writerow([exp.id, exp.title, exp.amount, exp.category, exp.date])
    output.seek(0)
    return StreamingResponse(
        output, media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=expenses.csv"}
    )

# -------------------- PDF Export --------------------

@app.get("/expenses/export/pdf")
def export_pdf(db: Session = Depends(get_db)):
    expenses = db.query(models.Expense).all()
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer)
    p.setFont("Helvetica", 12)
    p.drawString(100, 800, "Expense Report")
    y = 760
    for exp in expenses:
        line = f"{exp.id} | {exp.title} | {exp.amount} | {exp.category} | {exp.date}"
        p.drawString(80, y, line)
        y -= 20
        if y < 50:  # start a new page if space runs out
            p.showPage()
            y = 800
    p.save()
    buffer.seek(0)
    return StreamingResponse(
        buffer, media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=expenses.pdf"}
    )

