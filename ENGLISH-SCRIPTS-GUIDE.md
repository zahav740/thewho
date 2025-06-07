# 🚀 PRODUCTION CRM - ENGLISH STARTUP SCRIPTS

## 📋 **Available Scripts**:

### 🟢 **START-CRM-ENGLISH.bat** - Main Startup Script
**What it does**:
- ✅ Stops processes on ports 5100 and 5101
- ✅ Checks and starts PostgreSQL service if needed
- ✅ Starts Backend server on port 5100
- ✅ Starts Frontend application on port 5101
- ✅ Automatically connects to database (password: magarel)
- ✅ Tests backend connection
- ✅ All in English language

### 🔴 **STOP-CRM-ENGLISH.bat** - Stop All Processes
**What it does**:
- ❌ Terminates all processes on ports 5100 and 5101
- ❌ Stops Node.js and npm processes
- ✅ Verifies ports are free
- 📊 Shows port status

### 🧪 **TEST-API-ENGLISH.bat** - API Testing
**What it does**:
- 🔍 Tests all backend API endpoints
- ✅ Health check, calendar, orders, machines
- 📊 Shows if API is responding correctly

## 🌐 **Application URLs**:
- **Frontend**: http://localhost:5101
- **Backend API**: http://localhost:5100/api
- **API Documentation**: http://localhost:5100/api/docs
- **Health Check**: http://localhost:5100/api/health

## 🗄️ **Database Configuration**:
- **Host**: localhost
- **Port**: 5432
- **Database**: thewho
- **Username**: postgres
- **Password**: magarel
- **Connection**: Automatic from .env file

## 🚀 **How to Use**:

### Step 1: Start the Application
```bash
START-CRM-ENGLISH.bat
```

### Step 2: Test the API (Optional)
```bash
TEST-API-ENGLISH.bat
```

### Step 3: Open Frontend
Navigate to: http://localhost:5101

### Step 4: Stop Everything (When Done)
```bash
STOP-CRM-ENGLISH.bat
```

## 🔧 **Technical Details**:

### Port Configuration:
- **Backend (NestJS)**: Port 5100
- **Frontend (React)**: Port 5101
- **Database (PostgreSQL)**: Port 5432

### Process Flow:
```
1. Kill existing processes on 5100/5101
2. Check PostgreSQL service status
3. Start backend on 5100 with database connection
4. Wait for backend initialization
5. Start frontend on 5101 with API proxy
6. Both services run in separate terminal windows
```

### Environment Variables:
- `PORT=5100` (Backend)
- `PORT=5101` (Frontend)
- `REACT_APP_API_URL=http://localhost:5100/api`
- `DB_PASSWORD=magarel`

## ⚠️ **Important Notes**:
1. **PostgreSQL must be installed** and accessible on localhost:5432
2. **Both terminal windows** will remain open for logging
3. **Close manually** when finished working
4. **Clear browser cache** if you see CORS errors
5. **Wait for backend** to fully start before using frontend

## 🎯 **Troubleshooting**:

### If ports are occupied:
```bash
STOP-CRM-ENGLISH.bat
```

### If database connection fails:
- Check PostgreSQL service is running
- Verify password: magarel
- Check database: thewho exists

### If CORS errors appear:
- Ensure both services are fully started
- Clear browser cache
- Check console logs in terminal windows

---

## ✅ **Ready to Use!**
**Run `START-CRM-ENGLISH.bat` to start the complete CRM system!** 🎉

All scripts are in English and handle:
- ✅ Port management (5100/5101)
- ✅ Database connection (magarel password)
- ✅ Service orchestration
- ✅ Error handling and status reporting
