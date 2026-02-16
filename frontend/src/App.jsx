import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, FolderKanban, ListTodo, TrendingUp, 
  Calendar, Clock, Settings, LogOut, Plus, Edit, Trash2,
  Download, RefreshCw, Search, Filter, X, Save, ChevronDown
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { format } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [workItems, setWorkItems] = useState([]);
  const [backlogs, setBacklogs] = useState([]);
  const [utilizationData, setUtilizationData] = useState([]);
  const [projectStatusData, setProjectStatusData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setCurrentUser(JSON.parse(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadData();
    }
  }, []);

  const loadData = async () => {
    try {
      const [projectsRes, workItemsRes, backlogsRes, utilizationRes, projectStatusRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/projects`),
        axios.get(`${API_BASE_URL}/api/work-items`),
        axios.get(`${API_BASE_URL}/api/backlogs`),
        axios.get(`${API_BASE_URL}/api/reports/utilization`),
        axios.get(`${API_BASE_URL}/api/reports/project-status`)
      ]);
      setProjects(projectsRes.data);
      setWorkItems(workItemsRes.data);
      setBacklogs(backlogsRes.data);
      setUtilizationData(utilizationRes.data);
      setProjectStatusData(projectStatusRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
      setCurrentUser(response.data.user);
      toast.success('Login successful!');
      loadData();
    } catch (error) {
      toast.error('Invalid credentials');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    toast.success('Logged out successfully');
  };

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <Toaster position="top-right" />
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        user={currentUser}
        onLogout={handleLogout}
      />
      <main className="main-content">
        {currentView === 'dashboard' && <Dashboard data={{ utilizationData, projectStatusData, workItems, projects }} />}
        {currentView === 'projects' && <Projects projects={projects} setProjects={setProjects} />}
        {currentView === 'work-items' && <WorkItems workItems={workItems} setWorkItems={setWorkItems} projects={projects} />}
        {currentView === 'backlogs' && <Backlogs backlogs={backlogs} setBacklogs={setBacklogs} projects={projects} />}
        {currentView === 'my-tasks' && <MyTasks workItems={workItems} user={currentUser} />}
        {currentView === 'reports' && <Reports utilizationData={utilizationData} projectStatusData={projectStatusData} />}
        {currentView === 'settings' && <SettingsView onDataRefresh={loadData} />}
      </main>
    </div>
  );
};

const LoginView = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <BarChart3 size={48} />
          <h1>Developer Utilization</h1>
          <p>Track, Monitor, Deliver</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Sign In</button>
        </form>
        <div className="login-hint">
          <p>Demo credentials:</p>
          <p><strong>Email:</strong> john.doe@example.com</p>
          <p><strong>Password:</strong> password123</p>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ currentView, setCurrentView, user, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'work-items', label: 'Work Items', icon: ListTodo },
    { id: 'backlogs', label: 'Backlogs', icon: Calendar },
    { id: 'my-tasks', label: 'My Tasks', icon: Clock },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <BarChart3 size={32} />
        <h2>DevTrack</h2>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => setCurrentView(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user.name[0]}</div>
          <div className="user-details">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

const Dashboard = ({ data }) => {
  const { utilizationData, projectStatusData, workItems, projects } = data;

  const statusDistribution = workItems.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(statusDistribution).map(status => ({
    name: status,
    value: statusDistribution[status]
  }));

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

  const projectProgress = projectStatusData.map(p => ({
    name: p.name?.substring(0, 15) || 'Unnamed',
    completion: p.completed_items && p.total_work_items 
      ? Math.round((p.completed_items / p.total_work_items) * 100) 
      : 0
  }));

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Real-time overview of development activities</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#10b98115'}}>
            <FolderKanban style={{color: '#10b981'}} />
          </div>
          <div className="stat-details">
            <div className="stat-value">{projects.length}</div>
            <div className="stat-label">Active Projects</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#3b82f615'}}>
            <ListTodo style={{color: '#3b82f6'}} />
          </div>
          <div className="stat-details">
            <div className="stat-value">{workItems.length}</div>
            <div className="stat-label">Total Work Items</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#f59e0b15'}}>
            <Clock style={{color: '#f59e0b'}} />
          </div>
          <div className="stat-details">
            <div className="stat-value">
              {workItems.filter(w => w.status === 'in-progress').length}
            </div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#8b5cf615'}}>
            <Users style={{color: '#8b5cf6'}} />
          </div>
          <div className="stat-details">
            <div className="stat-value">{utilizationData.length}</div>
            <div className="stat-label">Team Members</div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Work Items Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Project Completion Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completion" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card full-width">
        <h3>Team Utilization Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={utilizationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total_estimated_hours" fill="#3b82f6" name="Estimated Hours" />
            <Bar dataKey="total_actual_hours" fill="#10b981" name="Actual Hours" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const Projects = ({ projects, setProjects }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'active'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await axios.put(`${API_BASE_URL}/api/projects/${editingProject.id}`, formData);
        toast.success('Project updated successfully');
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/projects`, formData);
        setProjects([...projects, response.data]);
        toast.success('Project created successfully');
      }
      setShowModal(false);
      resetForm();
      const res = await axios.get(`${API_BASE_URL}/api/projects`);
      setProjects(res.data);
    } catch (error) {
      toast.error('Failed to save project');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', start_date: '', end_date: '', status: 'active' });
    setEditingProject(null);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      status: project.status
    });
    setShowModal(true);
  };

  return (
    <div className="projects-view">
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p>Manage your development projects</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          New Project
        </button>
      </div>

      <div className="projects-grid">
        {projects.map(project => (
          <div key={project.id} className="project-card">
            <div className="project-header">
              <h3>{project.name}</h3>
              <span className={`status-badge ${project.status}`}>{project.status}</span>
            </div>
            <p className="project-description">{project.description}</p>
            <div className="project-dates">
              <div>
                <Calendar size={16} />
                <span>{project.start_date ? format(new Date(project.start_date), 'MMM dd, yyyy') : 'Not set'}</span>
              </div>
              <div>
                <Calendar size={16} />
                <span>{project.end_date ? format(new Date(project.end_date), 'MMM dd, yyyy') : 'Not set'}</span>
              </div>
            </div>
            <div className="project-actions">
              <button className="btn-icon" onClick={() => handleEdit(project)}>
                <Edit size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal onClose={() => { setShowModal(false); resetForm(); }}>
          <h2>{editingProject ? 'Edit Project' : 'New Project'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Project Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                <Save size={18} />
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

const WorkItems = ({ workItems, setWorkItems, projects }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    type: 'task',
    priority: 'medium',
    status: 'new',
    assigned_to: '',
    start_date: '',
    end_date: '',
    estimated_hours: '',
    t_shirt_size: 'M'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        project_id: parseInt(formData.project_id),
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null
      };

      if (editingItem) {
        await axios.put(`${API_BASE_URL}/api/work-items/${editingItem.id}`, submitData);
        toast.success('Work item updated');
      } else {
        await axios.post(`${API_BASE_URL}/api/work-items`, submitData);
        toast.success('Work item created');
      }
      setShowModal(false);
      resetForm();
      const res = await axios.get(`${API_BASE_URL}/api/work-items`);
      setWorkItems(res.data);
    } catch (error) {
      toast.error('Failed to save work item');
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: '',
      title: '',
      description: '',
      type: 'task',
      priority: 'medium',
      status: 'new',
      assigned_to: '',
      start_date: '',
      end_date: '',
      estimated_hours: '',
      t_shirt_size: 'M'
    });
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      project_id: item.project_id,
      title: item.title,
      description: item.description || '',
      type: item.type,
      priority: item.priority,
      status: item.status,
      assigned_to: item.assigned_to || '',
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      estimated_hours: item.estimated_hours || '',
      t_shirt_size: item.t_shirt_size || 'M'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this work item?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/work-items/${id}`);
        setWorkItems(workItems.filter(item => item.id !== id));
        toast.success('Work item deleted');
      } catch (error) {
        toast.error('Failed to delete work item');
      }
    }
  };

  return (
    <div className="work-items-view">
      <div className="page-header">
        <div>
          <h1>Work Items</h1>
          <p>Manage tasks and features</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          New Work Item
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Project</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Estimated</th>
              <th>Actual</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workItems.map(item => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{projects.find(p => p.id === item.project_id)?.name || 'N/A'}</td>
                <td><span className="type-badge">{item.type}</span></td>
                <td><span className={`priority-badge ${item.priority}`}>{item.priority}</span></td>
                <td><span className={`status-badge ${item.status}`}>{item.status}</span></td>
                <td>{item.assigned_to || 'Unassigned'}</td>
                <td>{item.estimated_hours ? `${item.estimated_hours}h` : '-'}</td>
                <td>{item.actual_hours ? `${item.actual_hours}h` : '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" onClick={() => handleEdit(item)}>
                      <Edit size={16} />
                    </button>
                    <button className="btn-icon danger" onClick={() => handleDelete(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal onClose={() => { setShowModal(false); resetForm(); }}>
          <h2>{editingItem ? 'Edit Work Item' : 'New Work Item'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Project</label>
              <select
                value={formData.project_id}
                onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                required
              >
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="task">Task</option>
                  <option value="feature">Feature</option>
                  <option value="bug">Bug</option>
                  <option value="story">User Story</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="new">New</option>
                  <option value="in-progress">In Progress</option>
                  <option value="testing">Testing</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <div className="form-group">
                <label>T-Shirt Size</label>
                <select
                  value={formData.t_shirt_size}
                  onChange={(e) => setFormData({...formData, t_shirt_size: e.target.value})}
                >
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Assigned To</label>
              <input
                type="email"
                value={formData.assigned_to}
                onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                placeholder="user@example.com"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Estimated Hours</label>
              <input
                type="number"
                step="0.5"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({...formData, estimated_hours: e.target.value})}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                <Save size={18} />
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

const Backlogs = ({ backlogs, setBacklogs, projects }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingBacklog, setEditingBacklog] = useState(null);
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    priority: 0,
    status: 'new'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        project_id: parseInt(formData.project_id),
        priority: parseInt(formData.priority)
      };

      if (editingBacklog) {
        await axios.put(`${API_BASE_URL}/api/backlogs/${editingBacklog.id}`, submitData);
        toast.success('Backlog updated');
      } else {
        await axios.post(`${API_BASE_URL}/api/backlogs`, submitData);
        toast.success('Backlog created');
      }
      setShowModal(false);
      resetForm();
      const res = await axios.get(`${API_BASE_URL}/api/backlogs`);
      setBacklogs(res.data);
    } catch (error) {
      toast.error('Failed to save backlog');
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: '',
      title: '',
      description: '',
      priority: 0,
      status: 'new'
    });
    setEditingBacklog(null);
  };

  const handleEdit = (backlog) => {
    setEditingBacklog(backlog);
    setFormData({
      project_id: backlog.project_id,
      title: backlog.title,
      description: backlog.description || '',
      priority: backlog.priority,
      status: backlog.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this backlog item?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/backlogs/${id}`);
        setBacklogs(backlogs.filter(b => b.id !== id));
        toast.success('Backlog deleted');
      } catch (error) {
        toast.error('Failed to delete backlog');
      }
    }
  };

  return (
    <div className="backlogs-view">
      <div className="page-header">
        <div>
          <h1>Backlogs</h1>
          <p>Manage product backlog items</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          New Backlog Item
        </button>
      </div>

      <div className="backlogs-list">
        {backlogs.sort((a, b) => a.priority - b.priority).map(backlog => (
          <div key={backlog.id} className="backlog-card">
            <div className="backlog-header">
              <div>
                <span className="priority-number">#{backlog.priority}</span>
                <h3>{backlog.title}</h3>
              </div>
              <div className="backlog-meta">
                <span className={`status-badge ${backlog.status}`}>{backlog.status}</span>
                <span className="project-tag">
                  {projects.find(p => p.id === backlog.project_id)?.name || 'N/A'}
                </span>
              </div>
            </div>
            {backlog.description && <p>{backlog.description}</p>}
            <div className="backlog-actions">
              <button className="btn-icon" onClick={() => handleEdit(backlog)}>
                <Edit size={16} />
              </button>
              <button className="btn-icon danger" onClick={() => handleDelete(backlog.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal onClose={() => { setShowModal(false); resetForm(); }}>
          <h2>{editingBacklog ? 'Edit Backlog Item' : 'New Backlog Item'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Project</label>
              <select
                value={formData.project_id}
                onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                required
              >
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Priority</label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="new">New</option>
                  <option value="approved">Approved</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                <Save size={18} />
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

const MyTasks = ({ workItems, user }) => {
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [progressData, setProgressData] = useState({
    hours_worked: '',
    progress_percentage: '',
    notes: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const myTasks = workItems.filter(item => item.assigned_to === user.email);

  const handleAddProgress = (task) => {
    setSelectedTask(task);
    setShowProgressModal(true);
  };

  const handleSubmitProgress = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/task-progress`, {
        work_item_id: selectedTask.id,
        hours_worked: parseFloat(progressData.hours_worked),
        progress_percentage: parseFloat(progressData.progress_percentage),
        notes: progressData.notes,
        date: progressData.date
      });
      toast.success('Progress logged successfully');
      setShowProgressModal(false);
      setProgressData({
        hours_worked: '',
        progress_percentage: '',
        notes: '',
        date: format(new Date(), 'yyyy-MM-dd')
      });
    } catch (error) {
      toast.error('Failed to log progress');
    }
  };

  return (
    <div className="my-tasks-view">
      <div className="page-header">
        <div>
          <h1>My Tasks</h1>
          <p>Track your progress and log hours</p>
        </div>
      </div>

      <div className="tasks-grid">
        {myTasks.map(task => (
          <div key={task.id} className="task-card">
            <div className="task-header">
              <h3>{task.title}</h3>
              <span className={`status-badge ${task.status}`}>{task.status}</span>
            </div>
            <p className="task-description">{task.description}</p>
            <div className="task-metrics">
              <div className="metric">
                <span className="label">Estimated</span>
                <span className="value">{task.estimated_hours || 0}h</span>
              </div>
              <div className="metric">
                <span className="label">Actual</span>
                <span className="value">{task.actual_hours || 0}h</span>
              </div>
              <div className="metric">
                <span className="label">Size</span>
                <span className="value">{task.t_shirt_size || 'M'}</span>
              </div>
            </div>
            <button className="btn-primary" onClick={() => handleAddProgress(task)}>
              <Plus size={18} />
              Log Progress
            </button>
          </div>
        ))}
        {myTasks.length === 0 && (
          <div className="empty-state">
            <Clock size={48} />
            <p>No tasks assigned to you yet</p>
          </div>
        )}
      </div>

      {showProgressModal && (
        <Modal onClose={() => setShowProgressModal(false)}>
          <h2>Log Progress: {selectedTask.title}</h2>
          <form onSubmit={handleSubmitProgress}>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={progressData.date}
                onChange={(e) => setProgressData({...progressData, date: e.target.value})}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Hours Worked</label>
                <input
                  type="number"
                  step="0.5"
                  value={progressData.hours_worked}
                  onChange={(e) => setProgressData({...progressData, hours_worked: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Progress %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={progressData.progress_percentage}
                  onChange={(e) => setProgressData({...progressData, progress_percentage: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={progressData.notes}
                onChange={(e) => setProgressData({...progressData, notes: e.target.value})}
                rows={4}
                placeholder="What did you accomplish today?"
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowProgressModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                <Save size={18} />
                Save Progress
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

const Reports = ({ utilizationData, projectStatusData }) => {
  const exportToCSV = (data, filename) => {
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    return `${headers}\n${rows}`;
  };

  return (
    <div className="reports-view">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>Export and analyze utilization data</p>
        </div>
        <div className="button-group">
          <button className="btn-primary" onClick={() => exportToCSV(utilizationData, 'utilization-report')}>
            <Download size={18} />
            Export Utilization (CSV)
          </button>
          <button className="btn-primary" onClick={() => exportToCSV(projectStatusData, 'project-status-report')}>
            <Download size={18} />
            Export Projects (CSV)
          </button>
        </div>
      </div>

      <div className="report-section">
        <h2>Team Utilization Report</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Total Tasks</th>
                <th>Estimated Hours</th>
                <th>Actual Hours</th>
                <th>Utilization %</th>
              </tr>
            </thead>
            <tbody>
              {utilizationData.map((user, idx) => (
                <tr key={idx}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.total_tasks || 0}</td>
                  <td>{user.total_estimated_hours || 0}</td>
                  <td>{user.total_actual_hours || 0}</td>
                  <td>
                    {user.total_estimated_hours > 0
                      ? Math.round((user.total_actual_hours / user.total_estimated_hours) * 100)
                      : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="report-section">
        <h2>Project Status Report</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Status</th>
                <th>Total Items</th>
                <th>Completed</th>
                <th>In Progress</th>
                <th>Completion %</th>
              </tr>
            </thead>
            <tbody>
              {projectStatusData.map((project) => (
                <tr key={project.id}>
                  <td>{project.name}</td>
                  <td><span className={`status-badge ${project.status}`}>{project.status}</span></td>
                  <td>{project.total_work_items || 0}</td>
                  <td>{project.completed_items || 0}</td>
                  <td>{project.in_progress_items || 0}</td>
                  <td>
                    {project.total_work_items > 0
                      ? Math.round((project.completed_items / project.total_work_items) * 100)
                      : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SettingsView = ({ onDataRefresh }) => {
  const [azureConfig, setAzureConfig] = useState({
    organization_url: '',
    project_name: '',
    personal_access_token: ''
  });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadAzureConfig();
  }, []);

  const loadAzureConfig = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/azure-config`);
      if (res.data) {
        setAzureConfig(res.data);
      }
    } catch (error) {
      console.error('Failed to load Azure config');
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/azure-config`, azureConfig);
      toast.success('Azure DevOps configuration saved');
    } catch (error) {
      toast.error('Failed to save configuration');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/sync-azure-boards`);
      toast.success(`Synced ${res.data.synced_count} work items from Azure DevOps`);
      onDataRefresh();
    } catch (error) {
      toast.error('Failed to sync with Azure DevOps');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="settings-view">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Configure Azure DevOps integration</p>
      </div>

      <div className="settings-content">
        <div className="settings-card">
          <h2>Azure DevOps Configuration</h2>
          <form onSubmit={handleSaveConfig}>
            <div className="form-group">
              <label>Organization URL</label>
              <input
                type="text"
                value={azureConfig.organization_url}
                onChange={(e) => setAzureConfig({...azureConfig, organization_url: e.target.value})}
                placeholder="https://dev.azure.com/yourorganization"
              />
            </div>
            <div className="form-group">
              <label>Project Name</label>
              <input
                type="text"
                value={azureConfig.project_name}
                onChange={(e) => setAzureConfig({...azureConfig, project_name: e.target.value})}
                placeholder="YourProjectName"
              />
            </div>
            <div className="form-group">
              <label>Personal Access Token</label>
              <input
                type="password"
                value={azureConfig.personal_access_token}
                onChange={(e) => setAzureConfig({...azureConfig, personal_access_token: e.target.value})}
                placeholder="Enter your PAT"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                <Save size={18} />
                Save Configuration
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleSync}
                disabled={syncing}
              >
                <RefreshCw size={18} className={syncing ? 'spinning' : ''} />
                {syncing ? 'Syncing...' : 'Sync from Azure DevOps'}
              </button>
            </div>
          </form>
        </div>

        <div className="settings-card">
          <h2>About</h2>
          <p>Developer Utilization & Monitoring Platform</p>
          <p>Version 1.0.0</p>
          <p>Track, monitor, and optimize your development team's productivity.</p>
        </div>
      </div>
    </div>
  );
};

const Modal = ({ children, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        {children}
      </div>
    </div>
  );
};

export default App;
