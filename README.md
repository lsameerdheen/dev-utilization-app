# Developer Utilization & Monitoring Platform (DevTrack)

A comprehensive full-stack application for tracking developer productivity, managing projects, work items, backlogs, and integrating with Azure DevOps boards.

## 🚀 Features

### Core Features
- **User Authentication & Authorization**: Secure JWT-based authentication
- **Project Management**: Create, update, and monitor multiple projects
- **Work Item Tracking**: Full CRUD operations for tasks, features, bugs, and user stories
- **Backlog Management**: Prioritized backlog items with status tracking
- **Task Progress Logging**: Developers can log daily progress, hours worked, and completion percentage
- **Azure DevOps Integration**: Sync work items from Azure Boards using Personal Access Token
- **Real-time Dashboard**: Visual analytics with charts and metrics
- **Team Utilization Reports**: Track estimated vs. actual hours, completion rates
- **Export Functionality**: Download reports as CSV and Excel files
- **Responsive Design**: Modern, clean UI with dark theme

### Dashboard Features
- Active projects count
- Total work items overview
- In-progress tasks tracker
- Team member utilization metrics
- Work item status distribution (pie chart)
- Project completion progress (bar chart)
- Team utilization overview (bar chart)

### Reporting Capabilities
- Team utilization reports with estimated vs. actual hours
- Project status reports with completion percentages
- Export to CSV format
- Filterable date ranges

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18
- React Router for navigation
- Recharts for data visualization
- Axios for API calls
- Lucide React for icons
- Date-fns for date handling
- React Hot Toast for notifications

**Backend:**
- Python FastAPI
- PostgreSQL database
- SQLAlchemy ORM
- JWT authentication
- Azure DevOps Python SDK
- Pandas for data processing
- OpenPyXL for Excel export

**Infrastructure:**
- Docker & Docker Compose
- Nginx as reverse proxy
- PostgreSQL 15

## 📋 Prerequisites

- Docker Desktop or Docker Engine (v20.10+)
- Docker Compose (v2.0+)
- 4GB RAM minimum
- 10GB free disk space

## 🔧 Installation

### 1. Clone or Extract the Repository

```bash
cd dev-utilization-app
```

### 2. Environment Configuration (Optional)

The application comes with default configurations. For production, update:

**Backend Environment Variables** (in `docker-compose.yml`):
```yaml
environment:
  DATABASE_URL: postgresql://devuser:devpass@db:5432/devutilization
  SECRET_KEY: your-secret-key-change-in-production
```

**Frontend Environment Variables**:
The API URL is automatically configured through nginx proxy.

### 3. Build and Start the Application

```bash
# Build and start all services
docker-compose up -d --build

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5432

## 👤 Default Login Credentials

The application comes with pre-populated sample data:

**Admin User:**
- Email: `admin@example.com`
- Password: `password123`

**Developer Users:**
- Email: `john.doe@example.com` - Password: `password123`
- Email: `jane.smith@example.com` - Password: `password123`
- Email: `mike.johnson@example.com` - Password: `password123`
- Email: `sarah.williams@example.com` - Password: `password123`

## 📊 Sample Data

The database is initialized with:
- 5 users (1 admin, 3 developers, 1 lead)
- 4 active projects
- 12 work items across different projects
- 7 backlog items
- 16 task progress entries
- Complete utilization data for reporting

## 🔗 Azure DevOps Integration

### Setup Instructions

1. **Login to the application**
2. **Navigate to Settings**
3. **Configure Azure DevOps**:
   - Organization URL: `https://dev.azure.com/yourorganization`
   - Project Name: Your Azure DevOps project name
   - Personal Access Token: Generate from Azure DevOps

### Generate Azure DevOps PAT

1. Go to Azure DevOps
2. Click User Settings → Personal Access Tokens
3. Create New Token
4. Select Scopes:
   - Work Items: Read
   - Project and Team: Read
5. Copy the generated token
6. Paste in DevTrack Settings

### Sync Work Items

1. After configuration, click "Sync from Azure DevOps"
2. Work items will be imported with:
   - Title, description, status
   - Assigned user (matched by email)
   - Start/end dates
   - Estimated and completed hours
   - Work item type

## 🎯 Usage Guide

### For Developers

1. **Login** with your credentials
2. **View Dashboard** for overall metrics
3. **My Tasks** section shows your assigned work items
4. **Log Progress**:
   - Click "Log Progress" on any task
   - Enter hours worked
   - Update progress percentage
   - Add notes about work done
5. **Track Time** against estimated hours

### For Team Leads

1. **Projects** - Create and manage projects
2. **Work Items** - Create tasks, assign to team members
3. **Backlogs** - Prioritize and manage backlog items
4. **Reports** - View team utilization and project status
5. **Export Data** - Download CSV reports

### For Admins

1. **All above features**
2. **Settings** - Configure Azure DevOps integration
3. **User Management** - Register new team members
4. **Sync Data** - Pull updates from Azure Boards

## 📁 Project Structure

```
dev-utilization-app/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile          # Backend container config
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── App.css         # Styles
│   │   ├── index.js        # Entry point
│   │   └── index.css
│   ├── public/
│   │   └── index.html      # HTML template
│   ├── package.json        # Node dependencies
│   ├── Dockerfile          # Frontend container config
│   ├── nginx.conf          # Nginx configuration
│   └── .dockerignore
├── database/
│   └── init.sql            # Database schema & sample data
├── docker-compose.yml      # Multi-container orchestration
└── README.md              # This file
```

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project

### Work Items
- `GET /api/work-items` - List work items (filterable by project)
- `POST /api/work-items` - Create work item
- `PUT /api/work-items/{id}` - Update work item
- `DELETE /api/work-items/{id}` - Delete work item

### Backlogs
- `GET /api/backlogs` - List backlog items
- `POST /api/backlogs` - Create backlog item
- `PUT /api/backlogs/{id}` - Update backlog
- `DELETE /api/backlogs/{id}` - Delete backlog

### Task Progress
- `POST /api/task-progress` - Log task progress
- `GET /api/task-progress/{work_item_id}` - Get progress history

### Azure DevOps
- `POST /api/azure-config` - Save Azure configuration
- `GET /api/azure-config` - Get current configuration
- `POST /api/sync-azure-boards` - Sync work items from Azure

### Reports
- `GET /api/reports/utilization` - Team utilization data
- `GET /api/reports/project-status` - Project status summary

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- SQL injection protection via SQLAlchemy ORM
- CORS configuration for API access
- Environment-based secret management
- Secure PAT storage for Azure DevOps

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if database is running
docker-compose ps db

# View database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### Frontend Not Loading
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend
```

### Backend API Errors
```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Port Already in Use
```bash
# Check what's using port 80
lsof -i :80

# Or use different ports in docker-compose.yml
ports:
  - "8080:80"  # Frontend on 8080
  - "8001:8000"  # Backend on 8001
```

## 📈 Performance Optimization

- Database indexes on frequently queried columns
- Connection pooling for database
- Nginx caching for static assets
- Gzip compression enabled
- React production build optimization

## 🔄 Backup and Restore

### Backup Database
```bash
docker-compose exec db pg_dump -U devuser devutilization > backup.sql
```

### Restore Database
```bash
cat backup.sql | docker-compose exec -T db psql -U devuser devutilization
```

## 🚀 Deployment to Production

1. **Update Environment Variables**:
   - Change `SECRET_KEY` to a strong random string
   - Update database credentials
   - Set proper CORS origins

2. **Use Production Database**:
   - Point to managed PostgreSQL service
   - Enable SSL connections
   - Regular backups

3. **SSL/HTTPS**:
   - Add SSL certificates to nginx
   - Update nginx.conf for HTTPS

4. **Monitoring**:
   - Add logging service (e.g., ELK stack)
   - Set up health checks
   - Configure alerts

## 📝 Development

### Running in Development Mode

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm start
```

### Database Migrations

For schema changes, update `database/init.sql` and rebuild:
```bash
docker-compose down -v
docker-compose up -d --build
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

This project is provided as-is for educational and commercial use.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review logs: `docker-compose logs`
3. Check API documentation: http://localhost:8000/docs

## 🎉 Features Roadmap

- [ ] Email notifications
- [ ] Slack integration
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Custom report builder
- [ ] Time tracking integration
- [ ] Resource capacity planning
- [ ] Sprint planning tools

---

**Version**: 1.0.0  
**Last Updated**: 2024

Enjoy tracking your team's productivity! 🚀
