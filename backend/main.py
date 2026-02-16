from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, date
import databases
import sqlalchemy
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Float, DateTime, Date, Text, Boolean, and_ , or_ 
import os
from passlib.context import CryptContext
import jwt
from azure.devops.connection import Connection
from msrest.authentication import BasicAuthentication
import asyncio

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://devutiluser:devutilpass@localhost:5432/devutilization")
database = databases.Database(DATABASE_URL)
metadata = MetaData()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Tables
users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("email", String(255), unique=True, nullable=False),
    Column("name", String(255)),
    Column("password_hash", String(255)),
    Column("role", String(50)),
    Column("created_at", DateTime, default=datetime.utcnow),
)

user_client_map = Table(
    "user_client_id_map",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", Integer, nullable=False),
    Column("client_user_id", String(255)),
    Column("active", Boolean),   
)

projects = Table(
    "projects",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String(255), nullable=False),
    Column("description", Text),
    Column("start_date", Date),
    Column("end_date", Date),
    Column("status", String(50)),
    Column("created_at", DateTime, default=datetime.utcnow),
)

work_items = Table(
    "work_items",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("project_id", Integer),
    Column("title", String(500), nullable=False),
    Column("description", Text),
    Column("type", String(50)),
    Column("priority", String(50)),
    Column("status", String(50)),
    Column("assigned_to", String(255)),
    Column("start_date", Date),
    Column("end_date", Date),
    Column("estimated_hours", Float),
    Column("actual_hours", Float),
    Column("t_shirt_size", String(10)),
    Column("ado_id", String(100)),
    Column("created_at", DateTime, default=datetime.utcnow),
    Column("updated_at", DateTime, default=datetime.utcnow),
)

backlogs = Table(
    "backlogs",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("project_id", Integer),
    Column("title", String(500), nullable=False),
    Column("description", Text),
    Column("priority", Integer),
    Column("status", String(50)),
    Column("created_by", String(255)),
    Column("created_at", DateTime, default=datetime.utcnow),
)

task_progress = Table(
    "task_progress",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("work_item_id", Integer),
    Column("user_email", String(255)),
    Column("hours_worked", Float),
    Column("progress_percentage", Float),
    Column("notes", Text),
    Column("date", Date),
    Column("created_at", DateTime, default=datetime.utcnow),
)

azure_config = Table(
    "azure_config",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("organization_url", String(500)),
    Column("project_name", String(255)),
    Column("personal_access_token", String(500)),
    Column("is_active", Boolean, default=True),
    Column("created_at", DateTime, default=datetime.utcnow),
)

# Pydantic Models
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = "developer"

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = "active"

class WorkItemCreate(BaseModel):
    project_id: int
    title: str
    description: Optional[str] = None
    type: str = "task"
    priority: str = "medium"
    status: str = "new"
    assigned_to: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    estimated_hours: Optional[float] = None
    t_shirt_size: Optional[str] = None

class BacklogCreate(BaseModel):
    project_id: int
    title: str
    description: Optional[str] = None
    priority: int = 0
    status: str = "new"

class TaskProgressCreate(BaseModel):
    work_item_id: int
    hours_worked: float
    progress_percentage: float
    notes: Optional[str] = None
    date: date

class AzureConfigCreate(BaseModel):
    organization_url: str
    project_name: str
    personal_access_token: str

# FastAPI App
app = FastAPI(title="Developer Utilization API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:80"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

# Authentication helpers
def verify_password(plain_password, hashed_password):
    print(pwd_context.hash(plain_password))
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        print("from get_current_user : ", email)
        return email
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_role(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        role: str = payload.get("role")
        if role is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        print("from get_current_role : ", role)
        return get_current_role
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
        
async def get_client_user_id(current_user: str = Depends(get_current_user)):
    #fetching user and client mapping details starts ------
    print("current_user : ",current_user)
    print("Fetching login user details")
    query = users.select().where(users.c.email == current_user)
    db_user = await database.fetch_one(query)
    print(query) 
    email = db_user["email"]
    role = db_user["role"]
    userid  = db_user["id"]    
    print("Fetching user client mapping  details for " ,userid )
    query_user_client = user_client_map.select().where(user_client_map.c.user_id == userid)
    print(query_user_client)
    db_user_client  = await database.fetch_one(query_user_client)
    if not db_user_client:
        client_id_user_mapping = ""
    else:
        client_id_user_mapping = db_user_client["client_user_id"]
    print(client_id_user_mapping)
    print(email)
    return client_id_user_mapping
    #fetching user and client mapping details ends ------

# Routes
@app.get("/")
async def root():
    return {"message": "Developer Utilization API", "version": "1.0.0"}

@app.post("/api/auth/register")
async def register(user: UserCreate):
    query = users.select().where(users.c.email == user.email)
    existing_user = await database.fetch_one(query)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    query = users.insert().values(
        email=user.email,
        name=user.name,
        password_hash=hashed_password,
        role=user.role
    )
    await database.execute(query)
    return {"message": "User registered successfully"}

@app.post("/api/auth/login")
async def login(user: UserLogin):
    query = users.select().where(users.c.email == user.email)
    db_user = await database.fetch_one(query)
    print(query)
    print(user.password)
    print(db_user["password_hash"])
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": db_user["email"], "role": db_user["role"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": db_user["email"],
            "name": db_user["name"],
            "role": db_user["role"]
        }
    }

@app.get("/api/projects")
async def get_projects(current_user: str = Depends(get_current_user),current_role: str = Depends(get_current_role)):
    #No projects 
    no_default_project = {
                    "id": "0",
                    "name": "No Default Project",
                    "description": "No Default Project",
                    "start_date": "",
                    "end_date": "",
                    "status": "",
                    "created_at": "",                  
                }                 
    result = []
    if current_role == "admin":        
        query = projects.select()
        result = await database.fetch_all(query)
    return result    
   

@app.post("/api/projects")
async def create_project(project: ProjectCreate, current_user: str = Depends(get_current_user)):
    if current_role == "admin": 
        query = projects.insert().values(**project.dict())
        project_id = await database.execute(query)
        return {"id": project_id, **project.dict()}
    raise HTTPException(status_code=401, detail="You are not authorised to create project")

@app.get("/api/projects/{project_id}")
async def get_project(project_id: int, current_user: str = Depends(get_current_user)):
    query = projects.select().where(projects.c.id == project_id)
    result = await database.fetch_one(query)
    if not result:
        raise HTTPException(status_code=404, detail="Project not found")
    return result

@app.put("/api/projects/{project_id}")
async def update_project(project_id: int, project: ProjectCreate, current_user: str = Depends(get_current_user)):
    query = projects.update().where(projects.c.id == project_id).values(**project.dict())
    await database.execute(query)
    return {"id": project_id, **project.dict()}

@app.get("/api/work-items")
async def get_work_items(
    project_id: Optional[int] = None,
    current_user: str = Depends(get_current_user),
    client_user: str = Depends(get_client_user_id)
    
):    
    if not client_user:
        client_id_user_mapping = ""
    else:
        client_id_user_mapping = client_user
    print(client_id_user_mapping)
    
    if project_id:
        query = work_items.select().where(work_items.c.project_id == project_id).where( or_( work_items.c.assigned_to.ilike(current_user), work_items.c.assigned_to.ilike(client_id_user_mapping)))
    else:
        query = work_items.select().where( or_( work_items.c.assigned_to.ilike(current_user), work_items.c.assigned_to.ilike(client_id_user_mapping)))
    print(query)
    result = await database.fetch_all(query)
    return result

@app.post("/api/work-items")
async def create_work_item(item: WorkItemCreate, current_user: str = Depends(get_current_user)):
    query = work_items.insert().values(**item.dict(), actual_hours=0.0)
    item_id = await database.execute(query)
    return {"id": item_id, **item.dict()}

@app.put("/api/work-items/{item_id}")
async def update_work_item(item_id: int, item: WorkItemCreate, current_user: str = Depends(get_current_user)):
    query = work_items.update().where(work_items.c.id == item_id).values(**item.dict(), updated_at=datetime.utcnow())
    await database.execute(query)
    return {"id": item_id, **item.dict()}

@app.delete("/api/work-items/{item_id}")
async def delete_work_item(item_id: int, current_user: str = Depends(get_current_user)):
    query = work_items.delete().where(work_items.c.id == item_id)
    await database.execute(query)
    return {"message": "Work item deleted"}

@app.get("/api/backlogs")
async def get_backlogs(
    project_id: Optional[int] = None,
    current_user: str = Depends(get_current_user)
):
    if project_id:
        query = backlogs.select().where(backlogs.c.project_id == project_id)
    else:
        query = backlogs.select()
    result = await database.fetch_all(query)
    return result

@app.post("/api/backlogs")
async def create_backlog(backlog: BacklogCreate, current_user: str = Depends(get_current_user)):
    query = backlogs.insert().values(**backlog.dict(), created_by=current_user)
    backlog_id = await database.execute(query)
    return {"id": backlog_id, **backlog.dict()}

@app.put("/api/backlogs/{backlog_id}")
async def update_backlog(backlog_id: int, backlog: BacklogCreate, current_user: str = Depends(get_current_user)):
    query = backlogs.update().where(backlogs.c.id == backlog_id).values(**backlog.dict())
    await database.execute(query)
    return {"id": backlog_id, **backlog.dict()}

@app.delete("/api/backlogs/{backlog_id}")
async def delete_backlog(backlog_id: int, current_user: str = Depends(get_current_user)):
    query = backlogs.delete().where(backlogs.c.id == backlog_id)
    await database.execute(query)
    return {"message": "Backlog deleted"}

@app.post("/api/task-progress")
async def create_task_progress(progress: TaskProgressCreate, current_user: str = Depends(get_current_user)):
    query = task_progress.insert().values(**progress.dict(), user_email=current_user)
    progress_id = await database.execute(query)
    
    # Update actual hours in work item
    hours_query = """
        SELECT SUM(hours_worked) as total_hours 
        FROM task_progress 
        WHERE work_item_id = :work_item_id
    """
    total_hours = await database.fetch_val(hours_query, {"work_item_id": progress.work_item_id})
    
    update_query = work_items.update().where(
        work_items.c.id == progress.work_item_id
    ).values(actual_hours=total_hours or 0.0)
    await database.execute(update_query)
    
    return {"id": progress_id, **progress.dict()}

@app.get("/api/task-progress/{work_item_id}")
async def get_task_progress(work_item_id: int, current_user: str = Depends(get_current_user)):
    query = task_progress.select().where(task_progress.c.work_item_id == work_item_id)
    result = await database.fetch_all(query)
    return result

@app.post("/api/azure-config")
async def save_azure_config(config: AzureConfigCreate, current_user: str = Depends(get_current_user)):
    # Deactivate existing configs
    await database.execute(azure_config.update().values(is_active=False))
    
    query = azure_config.insert().values(**config.dict(), is_active=True)
    config_id = await database.execute(query)
    return {"id": config_id, "message": "Azure DevOps configuration saved"}

@app.get("/api/azure-config")
async def get_azure_config(current_user: str = Depends(get_current_user)):
    query = azure_config.select().where(azure_config.c.is_active == True)
    result = await database.fetch_one(query)
    if result:
        return {
            "id": result["id"],
            "organization_url": result["organization_url"],
            "project_name": result["project_name"],
            "personal_access_token": "***hidden***"
        }
    return None

@app.post("/api/sync-azure-boards")
async def sync_azure_boards(current_user: str = Depends(get_current_user),client_user: str = Depends(get_client_user_id)):
    # Get active config
    query = azure_config.select().where(azure_config.c.is_active == True)
    config = await database.fetch_one(query)
    
    if not config:
        raise HTTPException(status_code=400, detail="Azure DevOps not configured")
    
    try:
        if not client_user:
            client_id_user_mapping = ""
        else:
            client_id_user_mapping = client_user
        # Connect to Azure DevOps
        credentials = BasicAuthentication('', config["personal_access_token"])
        connection = Connection(base_url=config["organization_url"], creds=credentials)
        
        # Get work item tracking client
        wit_client = connection.clients.get_work_item_tracking_client()
        
        # Query for work items (customize WIQL as needed)
        wiql_query = """
            SELECT [System.Id], [System.Title], [System.State], 
                   [System.AssignedTo], [Microsoft.VSTS.Scheduling.StartDate],
                   [Microsoft.VSTS.Scheduling.FinishDate], 
                   [Microsoft.VSTS.Scheduling.OriginalEstimate],
                   [Microsoft.VSTS.Scheduling.CompletedWork]
            FROM WorkItems
            WHERE [System.TeamProject] = 'Spark' 
        """
        wiql_query +=  "  AND [System.AssignedTo] = '" + client_id_user_mapping + "'"
        wiql_query +=  "  AND ([System.WorkItemType] CONTAINS  'BACKLOG' OR  [System.WorkItemType] CONTAINS   'FEATURE' OR  [System.WorkItemType] CONTAINS  'BUG' OR   [System.WorkItemType] CONTAINS  'TASK' )"
            
        print(wiql_query)
        #AND [System.State] <> 'Closed'
        #@project
        wiql = {"query": wiql_query}
        #query_result = wit_client.query_by_wiql(wiql, project=config["project_name"])
        query_result = wit_client.query_by_wiql(wiql)
        synced_count = 0
        print(query_result.work_items)
        if query_result.work_items:
            work_item_ids = [item.id for item in query_result.work_items]
            work_items_data = wit_client.get_work_items(ids=work_item_ids, expand='All')
            
            for wi in work_items_data:
                fields = wi.fields
                
                # Check if work item already exists
                existing_query = work_items.select().where(work_items.c.ado_id == str(wi.id))
                existing = await database.fetch_one(existing_query)
                
                work_item_data = {
                    "title": fields.get("System.Title", ""),
                    "status": fields.get("System.State", "new"),
                    "assigned_to": fields.get("System.AssignedTo", {}).get("uniqueName", ""),
                    "start_date": fields.get("Microsoft.VSTS.Scheduling.StartDate"),
                    "end_date": fields.get("Microsoft.VSTS.Scheduling.FinishDate"),
                    "estimated_hours": fields.get("Microsoft.VSTS.Scheduling.OriginalEstimate", 0.0),
                    "actual_hours": fields.get("Microsoft.VSTS.Scheduling.CompletedWork", 0.0),
                    "ado_id": str(wi.id),
                    "type": fields.get("System.WorkItemType", "task"),
                }
               
                if existing:
                    print(" work item already exists")
                    # Update existing work item
                    update_query = work_items.update().where(
                        work_items.c.ado_id == str(wi.id)
                    ).values(**work_item_data, updated_at=datetime.utcnow())
                    #await database.execute(update_query)
                else:
                    print(" work item not exists")
                    # Create new work item (assign to default project)
                    # Get first project or create default
                    project_query = projects.select().where(projects.c.name== "Spark")
                    project = await database.fetch_one(project_query)
                    
                    if not project:
                        # Create default project
                        default_project = projects.insert().values(
                            name="Spark",
                            description="Auto-created for Azure DevOps sync for Spark Client",
                            status="active"
                        )
                        #project_id = await database.execute(default_project)
                    else:
                        project_id = project["id"]
                    
                    work_item_data["project_id"] = project_id
                    insert_query = work_items.insert().values(**work_item_data)
                    #await database.execute(insert_query)
                
                synced_count += 1
        
        return {
            "message": "Azure DevOps sync completed",
            "synced_count": synced_count
        }
        
    except Exception as e:
        print(str(e))
        raise HTTPException(status_code=500, detail=f"Azure DevOps sync failed: {str(e)}")

@app.get("/api/reports/utilization")
async def get_utilization_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: str = Depends(get_current_user),
    client_user: str = Depends(get_client_user_id),
    current_role: str = Depends(get_current_role)
):
    if current_role== "admin":
        query = """
            SELECT 
                u.email,
                u.name,
                COUNT(DISTINCT wi.id) as total_tasks,
                SUM(wi.estimated_hours) as total_estimated_hours,
                SUM(wi.actual_hours) as total_actual_hours,
                AVG(tp.progress_percentage) as avg_progress
            FROM users u
            LEFT JOIN work_items wi ON (wi.assigned_to = u.email 
            LEFT JOIN task_progress tp ON tp.work_item_id = wi.id AND tp.user_email = u.email
            WHERE 1=1
        """
    else:
        query = """
            SELECT 
                u.email,
                u.name,
                COUNT(DISTINCT wi.id) as total_tasks,
                SUM(wi.estimated_hours) as total_estimated_hours,
                SUM(wi.actual_hours) as total_actual_hours,
                AVG(tp.progress_percentage) as avg_progress
            FROM users u
            LEFT JOIN work_items wi ON (wi.assigned_to ILIKE :email  OR wi.assigned_to ILIKE :clientsideid)
            LEFT JOIN task_progress tp ON tp.work_item_id = wi.id AND tp.user_email = u.email
            WHERE 1=1
        """
    
    params = {}
    params["email"] = current_user 
    params["clientsideid"] = client_user #id for assigned in AzureDevops is based on the logged in id
    

    if start_date:
        query += " AND wi.start_date >= :start_date"
        params["start_date"] = start_date
    if end_date:
        query += " AND wi.end_date <= :end_date"
        params["end_date"] = end_date
    
    query += " GROUP BY u.email, u.name"
    print(query)
    result = await database.fetch_all(query, params)
    return result

@app.get("/api/reports/project-status")
async def get_project_status_report(current_user: str = Depends(get_current_user)):
    query = """
        SELECT 
            p.id,
            p.name,
            p.status,
            COUNT(wi.id) as total_work_items,
            SUM(CASE WHEN wi.status IN ( 'completed','Committed','Done') THEN 1 ELSE 0 END) as completed_items,
            SUM(wi.estimated_hours) as total_estimated_hours,
            SUM(wi.actual_hours) as total_actual_hours
        FROM projects p
        LEFT JOIN work_items wi ON wi.project_id = p.id
        GROUP BY p.id, p.name, p.status
    """
    
    result = await database.fetch_all(query)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
