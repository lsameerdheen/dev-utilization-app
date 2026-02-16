# DevTrack - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Docker
Make sure Docker Desktop is installed and running on your system.
- Download: https://www.docker.com/products/docker-desktop

### Step 2: Run the Application

**Option A: Using the Management Script (Recommended)**
```bash
chmod +x manage.sh
./manage.sh install
```

**Option B: Using Docker Compose Directly**
```bash
docker-compose up -d --build
```

### Step 3: Access the Application

Open your browser and go to: **http://localhost**

**Login with:**
- Email: `admin@example.com`
- Password: `password123`

## 📊 What's Included?

✅ 5 sample users (admin, developers, lead)  
✅ 4 active projects with work items  
✅ Task progress tracking data  
✅ Utilization reports and charts  
✅ Azure DevOps integration ready  

## 🎯 Common Tasks

### View Logs
```bash
./manage.sh logs
# Or specific service
./manage.sh logs backend
```

### Stop Application
```bash
./manage.sh stop
```

### Restart Application
```bash
./manage.sh restart
```

### Backup Database
```bash
./manage.sh backup
```

### Check Status
```bash
./manage.sh status
```

## 🔧 Troubleshooting

**Port 80 already in use?**
```bash
# Edit docker-compose.yml and change:
ports:
  - "8080:80"  # Use port 8080 instead
```

**Database not connecting?**
```bash
./manage.sh logs db
./manage.sh restart db
```

**Need to start fresh?**
```bash
./manage.sh clean  # This removes all data!
./manage.sh install
```

## 📱 Key Features to Try

1. **Dashboard** - View real-time metrics and charts
2. **Projects** - Create and manage projects
3. **Work Items** - Track tasks and features
4. **My Tasks** - Log your daily progress
5. **Reports** - Export utilization data
6. **Settings** - Configure Azure DevOps sync

## 🔗 Azure DevOps Integration

1. Go to **Settings** in the app
2. Enter your Azure DevOps details:
   - Organization URL
   - Project Name
   - Personal Access Token (PAT)
3. Click **Sync from Azure DevOps**

**Generate PAT:** Azure DevOps → User Settings → Personal Access Tokens

## 📚 Full Documentation

See `README.md` for complete documentation including:
- Full API reference
- Architecture details
- Security features
- Production deployment
- Advanced configuration

## 🆘 Need Help?

- Check logs: `./manage.sh logs`
- View status: `./manage.sh status`
- Review README.md
- Check API docs: http://localhost:8000/docs

---

**Enjoy using DevTrack!** 🎉
