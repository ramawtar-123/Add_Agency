from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security = HTTPBearer()

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "team_member"  # admin or team_member

class UserLogin(BaseModel):
    username: str
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    role: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ClientCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None
    status: str = "active"  # active, inactive

class Client(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectCreate(BaseModel):
    name: str
    client_id: str
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: str = "active"  # active, completed, on_hold
    budget: Optional[float] = None
    team_members: List[str] = []

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    client_id: str
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: str = "active"
    budget: Optional[float] = None
    team_members: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InvoiceItem(BaseModel):
    description: str
    quantity: int
    rate: float
    amount: float

class InvoiceCreate(BaseModel):
    client_id: str
    project_id: Optional[str] = None
    amount: float
    status: str = "pending"  # pending, paid, overdue
    due_date: str
    items: List[InvoiceItem] = []
    notes: Optional[str] = None

class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_number: str
    client_id: str
    project_id: Optional[str] = None
    amount: float
    status: str = "pending"
    due_date: str
    items: List[InvoiceItem] = []
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper Functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# Auth Routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_input: UserCreate):
    # Check if username exists
    existing_user = await db.users.find_one({"username": user_input.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check if email exists
    existing_email = await db.users.find_one({"email": user_input.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Hash password
    hashed_password = hash_password(user_input.password)
    
    # Create user
    user = User(
        username=user_input.username,
        email=user_input.email,
        role=user_input.role
    )
    
    user_dict = user.model_dump()
    user_dict['password'] = hashed_password
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": user.username, "id": user.id})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user.model_dump())
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    # Find user
    user_doc = await db.users.find_one({"username": credentials.username})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Verify password
    if not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Create token
    access_token = create_access_token(data={"sub": user_doc['username'], "id": user_doc['id']})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user_doc['id'],
            username=user_doc['username'],
            email=user_doc['email'],
            role=user_doc['role']
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user(token_data: dict = Depends(verify_token)):
    user_doc = await db.users.find_one({"id": token_data['id']})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user_doc['id'],
        username=user_doc['username'],
        email=user_doc['email'],
        role=user_doc['role']
    )

# Client Routes
@api_router.post("/clients", response_model=Client)
async def create_client(client_input: ClientCreate, token_data: dict = Depends(verify_token)):
    client = Client(**client_input.model_dump())
    client_dict = client.model_dump()
    client_dict['created_at'] = client_dict['created_at'].isoformat()
    
    await db.clients.insert_one(client_dict)
    return client

@api_router.get("/clients", response_model=List[Client])
async def get_clients(token_data: dict = Depends(verify_token)):
    clients = await db.clients.find({}, {"_id": 0}).to_list(1000)
    
    for client in clients:
        if isinstance(client['created_at'], str):
            client['created_at'] = datetime.fromisoformat(client['created_at'])
    
    return clients

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str, token_data: dict = Depends(verify_token)):
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    if isinstance(client['created_at'], str):
        client['created_at'] = datetime.fromisoformat(client['created_at'])
    
    return client

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, client_input: ClientCreate, token_data: dict = Depends(verify_token)):
    existing = await db.clients.find_one({"id": client_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Client not found")
    
    update_data = client_input.model_dump()
    await db.clients.update_one({"id": client_id}, {"$set": update_data})
    
    updated_client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if isinstance(updated_client['created_at'], str):
        updated_client['created_at'] = datetime.fromisoformat(updated_client['created_at'])
    
    return updated_client

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, token_data: dict = Depends(verify_token)):
    result = await db.clients.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"message": "Client deleted successfully"}

# Project Routes
@api_router.post("/projects", response_model=Project)
async def create_project(project_input: ProjectCreate, token_data: dict = Depends(verify_token)):
    # Verify client exists
    client = await db.clients.find_one({"id": project_input.client_id})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    project = Project(**project_input.model_dump())
    project_dict = project.model_dump()
    project_dict['created_at'] = project_dict['created_at'].isoformat()
    
    await db.projects.insert_one(project_dict)
    return project

@api_router.get("/projects", response_model=List[Project])
async def get_projects(token_data: dict = Depends(verify_token)):
    projects = await db.projects.find({}, {"_id": 0}).to_list(1000)
    
    for project in projects:
        if isinstance(project['created_at'], str):
            project['created_at'] = datetime.fromisoformat(project['created_at'])
    
    return projects

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str, token_data: dict = Depends(verify_token)):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if isinstance(project['created_at'], str):
        project['created_at'] = datetime.fromisoformat(project['created_at'])
    
    return project

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, project_input: ProjectCreate, token_data: dict = Depends(verify_token)):
    existing = await db.projects.find_one({"id": project_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = project_input.model_dump()
    await db.projects.update_one({"id": project_id}, {"$set": update_data})
    
    updated_project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if isinstance(updated_project['created_at'], str):
        updated_project['created_at'] = datetime.fromisoformat(updated_project['created_at'])
    
    return updated_project

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, token_data: dict = Depends(verify_token)):
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}

# Team Routes
@api_router.get("/team", response_model=List[UserResponse])
async def get_team_members(token_data: dict = Depends(verify_token)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return [UserResponse(**user) for user in users]

# Invoice Routes
@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(invoice_input: InvoiceCreate, token_data: dict = Depends(verify_token)):
    # Verify client exists
    client = await db.clients.find_one({"id": invoice_input.client_id})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Generate invoice number
    count = await db.invoices.count_documents({})
    invoice_number = f"INV-{count + 1:05d}"
    
    invoice = Invoice(
        invoice_number=invoice_number,
        **invoice_input.model_dump()
    )
    invoice_dict = invoice.model_dump()
    invoice_dict['created_at'] = invoice_dict['created_at'].isoformat()
    
    await db.invoices.insert_one(invoice_dict)
    return invoice

@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices(token_data: dict = Depends(verify_token)):
    invoices = await db.invoices.find({}, {"_id": 0}).to_list(1000)
    
    for invoice in invoices:
        if isinstance(invoice['created_at'], str):
            invoice['created_at'] = datetime.fromisoformat(invoice['created_at'])
    
    return invoices

@api_router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str, token_data: dict = Depends(verify_token)):
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if isinstance(invoice['created_at'], str):
        invoice['created_at'] = datetime.fromisoformat(invoice['created_at'])
    
    return invoice

@api_router.put("/invoices/{invoice_id}", response_model=Invoice)
async def update_invoice(invoice_id: str, invoice_input: InvoiceCreate, token_data: dict = Depends(verify_token)):
    existing = await db.invoices.find_one({"id": invoice_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    update_data = invoice_input.model_dump()
    await db.invoices.update_one({"id": invoice_id}, {"$set": update_data})
    
    updated_invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if isinstance(updated_invoice['created_at'], str):
        updated_invoice['created_at'] = datetime.fromisoformat(updated_invoice['created_at'])
    
    return updated_invoice

@api_router.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str, token_data: dict = Depends(verify_token)):
    result = await db.invoices.delete_one({"id": invoice_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"message": "Invoice deleted successfully"}

# Dashboard Stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(token_data: dict = Depends(verify_token)):
    total_clients = await db.clients.count_documents({})
    active_projects = await db.projects.count_documents({"status": "active"})
    total_projects = await db.projects.count_documents({})
    
    # Calculate total revenue from paid invoices
    paid_invoices = await db.invoices.find({"status": "paid"}, {"_id": 0}).to_list(1000)
    total_revenue = sum(invoice['amount'] for invoice in paid_invoices)
    
    # Calculate pending invoices
    pending_invoices = await db.invoices.count_documents({"status": {"$in": ["pending", "overdue"]}})
    
    return {
        "total_clients": total_clients,
        "active_projects": active_projects,
        "total_projects": total_projects,
        "total_revenue": total_revenue,
        "pending_invoices": pending_invoices
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()