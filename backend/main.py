from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import csv
import io
from fastapi.responses import StreamingResponse

# --- New imports for the improved PDF generation ---
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.units import inch
# --- End of new imports ---

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

# -------------------- PDF Export (UPDATED) --------------------

@app.get("/expenses/export/pdf")
def export_pdf(db: Session = Depends(get_db)):
    expenses = db.query(models.Expense).all()
    buffer = io.BytesIO()

    # Use SimpleDocTemplate for a structured document
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=inch/2, leftMargin=inch/2, topMargin=inch/2, bottomMargin=inch/2)
    
    # "story" will hold all the elements of our PDF
    story = []
    styles = getSampleStyleSheet()

    # 1. Document Title
    story.append(Paragraph("Expense Report", styles['h1']))
    story.append(Spacer(1, 0.2*inch))

    # 2. Subtitle with Generation Date
    generation_date = datetime.now().strftime("%B %d, %Y")
    story.append(Paragraph(f"Generated on: {generation_date}", styles['Normal']))
    story.append(Spacer(1, 0.4*inch))

    # 3. Prepare data for the table
    table_data = [["ID", "Title", "Amount ($)", "Category", "Date"]]
    
    for exp in expenses:
        formatted_amount = f"{exp.amount:.2f}"
        formatted_date = exp.date.strftime("%Y-%m-%d")
        table_data.append([exp.id, exp.title, formatted_amount, exp.category, formatted_date])

    # 4. Create and Style the Table
    expense_table = Table(table_data)
    style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4F46E5')), # Header background
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F3F4F6')),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ])
    expense_table.setStyle(style)
    story.append(expense_table)
    story.append(Spacer(1, 0.4*inch))

    # 5. Add a Summary (Total Expenses)
    total_expenses = sum(exp.amount for exp in expenses)
    story.append(Paragraph(f"Total Expenses: ₹{total_expenses:.2f}", styles['h3']))

    # Build the PDF
    doc.build(story)
    
    buffer.seek(0)
    return StreamingResponse(
        buffer, media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=expenses.pdf"}
    )