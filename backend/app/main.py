from datetime import datetime, timezone
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from prometheus_fastapi_instrumentator import Instrumentator

from .config import settings
from .db import Base, engine, get_db
from .models import InventoryItem
from .schemas import (
    InventoryStatsOut,
    ItemCreate,
    ItemOut,
    ItemUpdate,
    RestockRequest,
)

app = FastAPI(title=settings.app_name, version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {
        "service": settings.app_name,
        "version": "1.0.0",
        "docs": "/docs",
        "description": "Smart Warehouse & Inventory Tracking API",
    }

@app.get("/health")
def health():
    return {"status": "UP"}

@app.get("/ready")
def ready(db: Session = Depends(get_db)):
    db.execute(select(func.count(InventoryItem.id)))
    return {"status": "READY"}

@app.get("/api/inventory", response_model=list[ItemOut])
def list_inventory(
    category: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
):
    stmt = select(InventoryItem).order_by(InventoryItem.id.desc())
    if category and category != "ALL":
        stmt = stmt.where(InventoryItem.category == category)
    if status_filter and status_filter != "ALL":
        stmt = stmt.where(InventoryItem.status == status_filter)
    return list(db.scalars(stmt))

@app.get("/api/inventory/stats", response_model=InventoryStatsOut)
def inventory_stats(db: Session = Depends(get_db)):
    items = list(db.scalars(select(InventoryItem)))
    total_items = len(items)
    in_stock = sum(1 for i in items if i.status == "IN_STOCK")
    low_stock = sum(1 for i in items if i.status == "LOW_STOCK")
    out_of_stock = sum(1 for i in items if i.status == "OUT_OF_STOCK")
    total_valuation = round(sum(i.quantity * i.unit_price for i in items), 2)

    return InventoryStatsOut(
        total_items=total_items,
        in_stock=in_stock,
        low_stock=low_stock,
        out_of_stock=out_of_stock,
        total_valuation=total_valuation,
    )

@app.get("/api/inventory/{item_id}", response_model=ItemOut)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@app.post("/api/inventory", response_model=ItemOut, status_code=status.HTTP_201_CREATED)
def create_item(payload: ItemCreate, db: Session = Depends(get_db)):
    existing = db.scalar(select(InventoryItem).where(InventoryItem.sku == payload.sku))
    if existing:
        raise HTTPException(status_code=400, detail=f"SKU '{payload.sku}' already exists")

    item = InventoryItem(**payload.model_dump())
    item.status = item.calculate_status()
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@app.put("/api/inventory/{item_id}", response_model=ItemOut)
def update_item(item_id: int, payload: ItemUpdate, db: Session = Depends(get_db)):
    item = db.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)

    item.status = item.calculate_status()
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return item

@app.post("/api/inventory/{item_id}/restock", response_model=ItemOut)
def restock_item(item_id: int, payload: RestockRequest, db: Session = Depends(get_db)):
    item = db.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.quantity += payload.amount
    item.status = item.calculate_status()
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return item

@app.delete("/api/inventory/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
