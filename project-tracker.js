// ==========================================
// PROJECT TRACKER - COMPLETE JAVASCRIPT
// ==========================================

// Global Variables
let allProjects = [];
let filteredProjects = [];
let currentView = 'timeline';
let selectedProjectId = null;

// Sample Data
const sampleProjects = [
    {
        id: 1,
        name: "Website Redesign",
        phase: "in-progress",
        startDate: "2025-01-01",
        endDate: "2025-03-31",
        progress: 65,
        description: "Complete redesign of company website with modern UI/UX",
        team: ["John Doe", "Jane Smith", "Bob Johnson"],
        childTasks: [
            { task: "Design mockups", completed: true },
            { task: "Develop frontend", completed: false },
            { task: "Testing & QA", completed: false }
        ]
    },
    {
        id: 2,
        name: "Mobile App Development",
        phase: "planning",
        startDate: "2025-02-01",
        endDate: "2025-06-30",
        progress: 15,
        description: "New mobile application for iOS and Android",
        team: ["Alice Brown", "Charlie Wilson"],
        childTasks: [
            { task: "Market research", completed: true },
            { task: "Create wireframes", completed: false },
            { task: "Build prototype", completed: false }
        ]
    },
    {
        id: 3,
        name: "CRM System Integration",
        phase: "completed",
        startDate: "2024-10-01",
        endDate: "2024-12-31",
        progress: 100,
        description: "Integration with Salesforce CRM",
        team: ["David Lee", "Emma Davis"],
        childTasks: [
            { task: "API setup", completed: true },
            { task: "Data migration", completed: true },
            { task: "User training", completed: true }
        ]
    },
    {
        id: 4,
        name: "Marketing Campaign Q1",
        phase: "in-progress",
        startDate: "2025-01-15",
        endDate: "2025-04-15",
        progress: 45,
        description: "Digital marketing campaign for Q1 2025",
        team: ["Fiona Green", "George Harris"],
        childTasks: [
            { task: "Content creation", completed: true },
            { task: "Social media ads", completed: false },
            { task: "Performance analysis", completed: false }
        ]
    },
    {
        id: 5,
        name: "Security Audit",
        phase: "planning",
        startDate: "2025-03-01",
        endDate: "2025-05-01",
        progress: 5,
        description: "Comprehensive security audit of all systems",
        team: ["Henry Jackson", "Iris Martinez"],
        childTasks: [
            { task: "Vulnerability scanning", completed: false },
            { task: "Penetration testing", completed: false },
            { task: "Report generation", completed: false }
        ]
    }
];

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadFromLocalStorage();
});

function initializeApp() {
    console.log('Initializing Project Tracker...');
    
    // Check if there's data in localStorage
    const savedData = localStorage.getItem('projectTrackerData');
    if (!savedData) {
        console.log('No saved data found. Use sample data or load from Google Sheets.');
    } else {
        console.log('Loaded data from localStorage');
    }
}

function setupEventListeners() {
    // Back to top button
    window.addEventListener('scroll', function() {
        const backToTop = document.getElementById('backToTop');
        if (window.scrollY > 300) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    });

    // Initialize tooltips if Bootstrap tooltips are present
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// ==========================================
// DATA MANAGEMENT
// ==========================================

function useSampleData() {
    showLoading();
    
    setTimeout(() => {
        allProjects = JSON.parse(JSON.stringify(sampleProjects));
        filteredProjects = [...allProjects];
        
        saveToLocalStorage();
        renderCurrentView();
        updateStats();
        updateFilterOptions();
        
        hideLoading();
        showToast('Sample data loaded successfully!', 'success');
    }, 500);
}

function loadFromGoogleSheets() {
    const url = document.getElementById('sheetsUrl').value.trim();
    
    if (!url) {
        showToast('Please enter a Google Sheets URL', 'warning');
        return;
    }

    if (!url.includes('docs.google.com/spreadsheets')) {
        showToast('Invalid Google Sheets URL format', 'danger');
        return;
    }

    // Cek apakah PapaParse loaded
    if (typeof Papa === 'undefined') {
        showToast('PapaParse library not loaded. Check your internet connection.', 'danger');
        console.error('PapaParse is not defined. Make sure the CDN link is correct.');
        return;
    }

    showLoading();
    console.log('🔄 Loading from URL:', url);

    Papa.parse(url, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            try {
                console.log('📊 Parse Results:', results);
                console.log('📝 Data rows:', results.data.length);
                console.log('❌ Errors:', results.errors);
                
                if (results.errors.length > 0) {
                    console.error('Parse errors:', results.errors);
                    showToast('Error parsing CSV: ' + results.errors[0].message, 'danger');
                    hideLoading();
                    return;
                }

                const data = results.data;
                
                if (data.length === 0) {
                    showToast('No data found in the sheet. Make sure row 1 has headers and row 2+ has data.', 'warning');
                    hideLoading();
                    return;
                }

                // Log first row untuk cek header
                console.log('📋 Headers:', Object.keys(data[0]));
                console.log('📄 First row:', data[0]);

                // Convert CSV data to project format
                allProjects = data.map((row, index) => {
                    const teamMembers = row['Team Members'] ? 
                        row['Team Members'].split(',').map(t => t.trim()) : [];
                    
                    const childTasksRaw = row['Child Tasks'] ? 
                        row['Child Tasks'].split(';').map(t => t.trim()) : [];
                    
                    const childTasks = childTasksRaw.map(task => ({
                        task: task,
                        completed: false
                    }));

                    return {
                        id: index + 1,
                        name: row['Project Name'] || 'Untitled Project',
                        phase: (row['Phase'] || 'planning').toLowerCase().replace(/\s+/g, '-'),
                        startDate: row['Start Date'] || new Date().toISOString().split('T')[0],
                        endDate: row['End Date'] || new Date().toISOString().split('T')[0],
                        progress: parseInt(row['Progress']) || 0,
                        description: row['Description'] || '',
                        team: teamMembers,
                        childTasks: childTasks
                    };
                });

                console.log('✅ Converted projects:', allProjects);

                filteredProjects = [...allProjects];
                
                saveToLocalStorage();
                renderCurrentView();
                updateStats();
                updateFilterOptions();
                
                hideLoading();
                showToast(`Successfully loaded ${allProjects.length} projects!`, 'success');
                
            } catch (error) {
                console.error('❌ Error processing data:', error);
                showToast('Error processing sheet data: ' + error.message, 'danger');
                hideLoading();
            }
        },
        error: function(error) {
            console.error('❌ Download error:', error);
            showToast('Failed to load data. Error: ' + error.message, 'danger');
            hideLoading();
        }
    });
} 

function saveToLocalStorage() {
    try {
        localStorage.setItem('projectTrackerData', JSON.stringify(allProjects));
        console.log('Data saved to localStorage');
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        showToast('Error saving data locally', 'danger');
    }
}

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('projectTrackerData');
        if (savedData) {
            allProjects = JSON.parse(savedData);
            filteredProjects = [...allProjects];
            
            renderCurrentView();
            updateStats();
            updateFilterOptions();
            
            console.log('Data loaded from localStorage');
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
}

function showLocalStorageInfo() {
    const hasData = localStorage.getItem('projectTrackerData');
    const message = hasData ? 
        `You have ${allProjects.length} projects saved locally. This data persists in your browser.` :
        'No local data found. Load from Google Sheets or use sample data to get started.';
    
    alert(message);
}

// ==========================================
// VIEW MANAGEMENT
// ==========================================

function switchView(view) {
    currentView = view;
    
    // Update active button
    document.querySelectorAll('.view-toggle .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('button').classList.add('active');
    
    // Hide all views
    document.querySelectorAll('.view-container').forEach(container => {
        container.style.display = 'none';
    });
    
    // Show selected view
    const viewMap = {
        'timeline': 'timelineView',
        'kanban': 'kanbanView',
        'gantt': 'ganttView',
        'list': 'listView'
    };
    
    document.getElementById(viewMap[view]).style.display = 'block';
    
    // Render the view
    renderCurrentView();
}

function renderCurrentView() {
    switch(currentView) {
        case 'timeline':
            renderTimeline();
            break;
        case 'kanban':
            renderKanban();
            break;
        case 'gantt':
            renderGantt();
            break;
        case 'list':
            renderList();
            break;
    }
}

// ==========================================
// TIMELINE VIEW
// ==========================================

function renderTimeline() {
    const container = document.getElementById('timelineContainer');
    
    if (filteredProjects.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-inbox fa-3x mb-3"></i>
                <p>No projects to display</p>
            </div>
        `;
        return;
    }
    
    // Sort by start date
    const sorted = [...filteredProjects].sort((a, b) => 
        new Date(a.startDate) - new Date(b.startDate)
    );
    
    let html = '';
    
    sorted.forEach((project, index) => {
        const position = index % 2 === 0 ? 'left' : 'right';
        const phaseColor = getPhaseColor(project.phase);
        
        html += `
            <div class="timeline-item ${position} fade-in-up" style="animation-delay: ${index * 0.1}s">
                <div class="timeline-dot" style="border-color: ${phaseColor}"></div>
                <div class="timeline-content" onclick="showProjectDetail(${project.id})">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="mb-0">${project.name}</h5>
                        <span class="badge" style="background-color: ${phaseColor}">
                            ${formatPhase(project.phase)}
                        </span>
                    </div>
                    <p class="text-muted small mb-2">
                        <i class="fas fa-calendar me-2"></i>
                        ${formatDate(project.startDate)} - ${formatDate(project.endDate)}
                    </p>
                    <p class="mb-3">${project.description}</p>
                    <div class="progress mb-3" style="height: 10px;">
                        <div class="progress-bar" role="progressbar" 
                             style="width: ${project.progress}%; background-color: ${phaseColor}"
                             aria-valuenow="${project.progress}" aria-valuemin="0" aria-valuemax="100">
                        </div>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="user-avatars">
                            ${renderTeamAvatars(project.team)}
                        </div>
                        <small class="text-muted">${project.progress}% Complete</small>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ==========================================
// KANBAN VIEW
// ==========================================

function renderKanban() {
    const planning = filteredProjects.filter(p => p.phase === 'planning');
    const inProgress = filteredProjects.filter(p => p.phase === 'in-progress');
    const completed = filteredProjects.filter(p => p.phase === 'completed');
    
    document.getElementById('planningCount').textContent = planning.length;
    document.getElementById('inProgressCount').textContent = inProgress.length;
    document.getElementById('completedCount').textContent = completed.length;
    
    renderKanbanColumn('planningCards', planning);
    renderKanbanColumn('inProgressCards', inProgress);
    renderKanbanColumn('completedCards', completed);
}

function renderKanbanColumn(elementId, projects) {
    const container = document.getElementById(elementId);
    
    if (projects.length === 0) {
        container.innerHTML = '<p class="text-muted text-center small">No projects</p>';
        return;
    }
    
    let html = '';
    
    projects.forEach(project => {
        const phaseColor = getPhaseColor(project.phase);
        
        html += `
            <div class="kanban-card" onclick="showProjectDetail(${project.id})">
                <h6 class="mb-2">${project.name}</h6>
                <p class="small text-muted mb-2">${truncateText(project.description, 60)}</p>
                <div class="progress mb-2" style="height: 5px;">
                    <div class="progress-bar" style="width: ${project.progress}%; background-color: ${phaseColor}"></div>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <div class="user-avatars">
                        ${renderTeamAvatars(project.team, 25)}
                    </div>
                    <small class="text-muted">${project.progress}%</small>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ==========================================
// GANTT VIEW
// ==========================================

function renderGantt() {
    const container = document.getElementById('ganttContainer');
    
    if (filteredProjects.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-chart-bar fa-3x mb-3"></i>
                <p>No projects to display</p>
            </div>
        `;
        return;
    }
    
    // Calculate date range
    let minDate = new Date(filteredProjects[0].startDate);
    let maxDate = new Date(filteredProjects[0].endDate);
    
    filteredProjects.forEach(project => {
        const start = new Date(project.startDate);
        const end = new Date(project.endDate);
        if (start < minDate) minDate = start;
        if (end > maxDate) maxDate = end;
    });
    
    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
    
    let html = '';
    
    filteredProjects.forEach(project => {
        const start = new Date(project.startDate);
        const end = new Date(project.endDate);
        const daysFromStart = Math.ceil((start - minDate) / (1000 * 60 * 60 * 24));
        const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        
        const leftPercent = (daysFromStart / totalDays) * 100;
        const widthPercent = (duration / totalDays) * 100;
        
        const phaseColor = getPhaseColor(project.phase);
        
        html += `
            <div class="gantt-row fade-in-up">
                <div class="gantt-label">
                    <strong>${project.name}</strong>
                    <small class="d-block text-muted">${formatDate(project.startDate)}</small>
                </div>
                <div class="gantt-timeline">
                    <div class="gantt-bar" 
                         style="left: ${leftPercent}%; width: ${widthPercent}%; background-color: ${phaseColor}"
                         onclick="showProjectDetail(${project.id})"
                         title="${project.name}: ${project.progress}% complete">
                        <span>${project.progress}%</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ==========================================
// LIST VIEW
// ==========================================

function renderList() {
    const tbody = document.getElementById('projectsTableBody');
    
    if (filteredProjects.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">No projects to display</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    filteredProjects.forEach(project => {
        const phaseColor = getPhaseColor(project.phase);
        
        html += `
            <tr>
                <td><strong>${project.name}</strong></td>
                <td>
                    <span class="badge" style="background-color: ${phaseColor}">
                        ${formatPhase(project.phase)}
                    </span>
                </td>
                <td>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar" role="progressbar" 
                             style="width: ${project.progress}%; background-color: ${phaseColor}"
                             aria-valuenow="${project.progress}" aria-valuemin="0" aria-valuemax="100">
                            ${project.progress}%
                        </div>
                    </div>
                </td>
                <td>${formatDate(project.startDate)}</td>
                <td>${formatDate(project.endDate)}</td>
                <td>
                    <div class="user-avatars">
                        ${renderTeamAvatars(project.team, 30)}
                    </div>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="showProjectDetail(${project.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="confirmDelete(${project.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// ==========================================
// PROJECT CRUD OPERATIONS
// ==========================================

function saveProject() {
    const name = document.getElementById('projectName').value.trim();
    const phase = document.getElementById('projectPhase').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const description = document.getElementById('projectDescription').value.trim();
    const progress = parseInt(document.getElementById('projectProgress').value);
    const teamInput = document.getElementById('projectTeam').value.trim();
    const childTasksInput = document.getElementById('childTasks').value.trim();
    
    if (!name || !startDate || !endDate) {
        showToast('Please fill in all required fields', 'warning');
        return;
    }
    
    const team = teamInput ? teamInput.split(',').map(t => t.trim()) : [];
    const childTasks = childTasksInput ? 
        childTasksInput.split('\n').map(t => ({ task: t.trim(), completed: false })).filter(t => t.task) : 
        [];
    
    const newProject = {
        id: allProjects.length > 0 ? Math.max(...allProjects.map(p => p.id)) + 1 : 1,
        name,
        phase,
        startDate,
        endDate,
        progress,
        description,
        team,
        childTasks
    };
    
    allProjects.push(newProject);
    filteredProjects = [...allProjects];
    
    saveToLocalStorage();
    renderCurrentView();
    updateStats();
    updateFilterOptions();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addProjectModal'));
    modal.hide();
    
    // Reset form
    document.getElementById('addProjectForm').reset();
    
    showToast('Project added successfully!', 'success');
}

function showProjectDetail(projectId) {
    const project = allProjects.find(p => p.id === projectId);
    if (!project) return;
    
    selectedProjectId = projectId;
    
    const phaseColor = getPhaseColor(project.phase);
    
    document.getElementById('detailProjectName').textContent = project.name;
    
    let childTasksHtml = '';
    if (project.childTasks && project.childTasks.length > 0) {
        childTasksHtml = '<h6 class="mt-4">Child Tasks:</h6><ul class="child-points">';
        project.childTasks.forEach((task, index) => {
            childTasksHtml += `
                <li class="child-point ${task.completed ? 'completed' : ''}">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                           onchange="toggleChildTask(${projectId}, ${index})">
                    <span>${task.task}</span>
                </li>
            `;
        });
        childTasksHtml += '</ul>';
    }
    
    document.getElementById('projectDetailBody').innerHTML = `
        <div class="row">
            <div class="col-md-6 mb-3">
                <strong>Phase:</strong><br>
                <span class="badge mt-1" style="background-color: ${phaseColor}">
                    ${formatPhase(project.phase)}
                </span>
            </div>
            <div class="col-md-6 mb-3">
                <strong>Progress:</strong><br>
                <div class="progress mt-1" style="height: 25px;">
                    <div class="progress-bar" role="progressbar" 
                         style="width: ${project.progress}%; background-color: ${phaseColor}"
                         aria-valuenow="${project.progress}" aria-valuemin="0" aria-valuemax="100">
                        ${project.progress}%
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-3">
                <strong>Start Date:</strong><br>
                ${formatDate(project.startDate)}
            </div>
            <div class="col-md-6 mb-3">
                <strong>End Date:</strong><br>
                ${formatDate(project.endDate)}
            </div>
            <div class="col-12 mb-3">
                <strong>Description:</strong><br>
                ${project.description || 'No description provided'}
            </div>
            <div class="col-12 mb-3">
                <strong>Team Members:</strong><br>
                <div class="mt-2">
                    ${project.team.map(member => `
                        <span class="badge bg-secondary me-2 mb-2">${member}</span>
                    `).join('')}
                </div>
            </div>
        </div>
        ${childTasksHtml}
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('projectDetailModal'));
    modal.show();
}

function toggleChildTask(projectId, taskIndex) {
    const project = allProjects.find(p => p.id === projectId);
    if (!project) return;
    
    project.childTasks[taskIndex].completed = !project.childTasks[taskIndex].completed;
    
    // Recalculate progress based on completed tasks
    const totalTasks = project.childTasks.length;
    const completedTasks = project.childTasks.filter(t => t.completed).length;
    project.progress = Math.round((completedTasks / totalTasks) * 100);
    
    saveToLocalStorage();
    showProjectDetail(projectId); // Refresh detail view
    renderCurrentView();
    updateStats();
}

function deleteProject() {
    if (!selectedProjectId) return;
    
    if (confirm('Are you sure you want to delete this project?')) {
        allProjects = allProjects.filter(p => p.id !== selectedProjectId);
        filteredProjects = [...allProjects];
        
        saveToLocalStorage();
        renderCurrentView();
        updateStats();
        updateFilterOptions();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('projectDetailModal'));
        modal.hide();
        
        showToast('Project deleted successfully', 'success');
    }
}

function confirmDelete(projectId) {
    selectedProjectId = projectId;
    deleteProject();
}

// ==========================================
// FILTER & SEARCH
// ==========================================

function filterProjects() {
    const statusFilter = document.getElementById('filterStatus').value;
    const userFilter = document.getElementById('filterUser').value;
    const searchQuery = document.getElementById('searchProject').value.toLowerCase();
    
    filteredProjects = allProjects.filter(project => {
        const matchesStatus = statusFilter === 'all' || project.phase === statusFilter;
        const matchesUser = userFilter === 'all' || project.team.includes(userFilter);
        const matchesSearch = project.name.toLowerCase().includes(searchQuery) || 
                            project.description.toLowerCase().includes(searchQuery);
        
        return matchesStatus && matchesUser && matchesSearch;
    });
    
    renderCurrentView();
}

function resetFilters() {
    document.getElementById('filterStatus').value = 'all';
    document.getElementById('filterUser').value = 'all';
    document.getElementById('searchProject').value = '';
    
    filteredProjects = [...allProjects];
    renderCurrentView();
}

function updateFilterOptions() {
    // Get unique team members
    const allMembers = new Set();
    allProjects.forEach(project => {
        project.team.forEach(member => allMembers.add(member));
    });
    
    const userFilter = document.getElementById('filterUser');
    userFilter.innerHTML = '<option value="all">All Members</option>';
    
    Array.from(allMembers).sort().forEach(member => {
        userFilter.innerHTML += `<option value="${member}">${member}</option>`;
    });
}

// ==========================================
// STATS & UPDATES
// ==========================================

function updateStats() {
    const total = allProjects.length;
    const inProgress = allProjects.filter(p => p.phase === 'in-progress').length;
    const completed = allProjects.filter(p => p.phase === 'completed').length;
    
    // Get unique team members
    const allMembers = new Set();
    allProjects.forEach(project => {
        project.team.forEach(member => allMembers.add(member));
    });
    
    document.getElementById('totalProjects').textContent = total;
    document.getElementById('inProgressProjects').textContent = inProgress;
    document.getElementById('completedProjects').textContent = completed;
    document.getElementById('totalMembers').textContent = allMembers.size;
}

// ==========================================
// EXPORT FUNCTIONS
// ==========================================

function exportToJSON() {
    const dataStr = JSON.stringify(allProjects, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'projects-' + new Date().toISOString().split('T')[0] + '.json';
    link.click();
    
    showToast('Projects exported to JSON', 'success');
}

function exportToCSV() {
    // Prepare CSV headers
    const headers = ['Project Name', 'Phase', 'Start Date', 'End Date', 'Progress', 'Description', 'Team Members', 'Child Tasks'];
    
    // Prepare CSV rows
    const rows = allProjects.map(project => {
        const team = project.team.join(', ');
        const tasks = project.childTasks.map(t => t.task).join('; ');
        
        return [
            project.name,
            project.phase,
            project.startDate,
            project.endDate,
            project.progress,
            project.description,
            team,
            tasks
        ];
    });
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    // Download
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'projects-' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();
    
    showToast('Projects exported to CSV', 'success');
}
// ==========================================
// PROJECT TRACKER - UTILITY FUNCTIONS
// ==========================================

// ==========================================
// DATE & TIME UTILITIES
// ==========================================

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatDateLong(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function formatDateForICS(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function getDaysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

function getDaysUntilDeadline(endDate) {
    const today = new Date();
    const end = new Date(endDate);
    return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
}

function isOverdue(endDate) {
    return getDaysUntilDeadline(endDate) < 0;
}

function getWeeksInMonth(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return Math.ceil((lastDay.getDate() + firstDay.getDay()) / 7);
}

function getCurrentWeek() {
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const pastDaysOfYear = (today - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function formatDuration(days) {
    if (days < 7) {
        return `${days} day${days !== 1 ? 's' : ''}`;
    } else if (days < 30) {
        const weeks = Math.floor(days / 7);
        return `${weeks} week${weeks !== 1 ? 's' : ''}`;
    } else if (days < 365) {
        const months = Math.floor(days / 30);
        return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
        const years = Math.floor(days / 365);
        return `${years} year${years !== 1 ? 's' : ''}`;
    }
}

// ==========================================
// STRING UTILITIES
// ==========================================

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function capitalizeWords(str) {
    if (!str) return '';
    return str.replace(/\b\w/g, l => l.toUpperCase());
}

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

function removeHtmlTags(str) {
    if (!str) return '';
    return str.replace(/<[^>]*>/g, '');
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function unescapeHtml(text) {
    const map = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#039;': "'"
    };
    return text.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, m => map[m]);
}

function getInitials(name) {
    if (!name) return '??';
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// ==========================================
// COLOR UTILITIES
// ==========================================

function stringToColor(str) {
    if (!str) return '6c757d';
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
        '667eea', '764ba2', 'f093fb', 'f5576c', 
        '4facfe', '00f2fe', '43e97b', '38f9d7', 
        'fa709a', 'fee140', 'f77062', 'fe5196',
        '667eea', '764ba2', '00c9ff', '92fe9d',
        'fa8bff', '2bd2ff', 'ee0979', 'ff6a00'
    ];
    
    return colors[Math.abs(hash) % colors.length];
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function getContrastColor(hexColor) {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return '#000000';
    
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
}

function lightenColor(hex, percent) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    
    const r = Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * percent / 100));
    const g = Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * percent / 100));
    const b = Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * percent / 100));
    
    return rgbToHex(r, g, b);
}

function darkenColor(hex, percent) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    
    const r = Math.max(0, Math.floor(rgb.r - rgb.r * percent / 100));
    const g = Math.max(0, Math.floor(rgb.g - rgb.g * percent / 100));
    const b = Math.max(0, Math.floor(rgb.b - rgb.b * percent / 100));
    
    return rgbToHex(r, g, b);
}

// ==========================================
// PHASE & STATUS UTILITIES
// ==========================================

function getPhaseColor(phase) {
    const colors = {
        'planning': '#ffc107',
        'in-progress': '#0dcaf0',
        'completed': '#198754',
        'on-hold': '#6c757d',
        'cancelled': '#dc3545'
    };
    return colors[phase] || '#6c757d';
}

function formatPhase(phase) {
    const phases = {
        'planning': 'Planning',
        'in-progress': 'In Progress',
        'completed': 'Completed',
        'on-hold': 'On Hold',
        'cancelled': 'Cancelled'
    };
    return phases[phase] || capitalizeFirst(phase);
}

function getPhaseIcon(phase) {
    const icons = {
        'planning': 'fa-lightbulb',
        'in-progress': 'fa-spinner',
        'completed': 'fa-check-circle',
        'on-hold': 'fa-pause-circle',
        'cancelled': 'fa-times-circle'
    };
    return icons[phase] || 'fa-circle';
}

function getNextPhase(currentPhase) {
    const sequence = ['planning', 'in-progress', 'completed'];
    const currentIndex = sequence.indexOf(currentPhase);
    return currentIndex < sequence.length - 1 ? sequence[currentIndex + 1] : currentPhase;
}

function getPreviousPhase(currentPhase) {
    const sequence = ['planning', 'in-progress', 'completed'];
    const currentIndex = sequence.indexOf(currentPhase);
    return currentIndex > 0 ? sequence[currentIndex - 1] : currentPhase;
}

// ==========================================
// PRIORITY UTILITIES
// ==========================================

function getPriorityColor(priority) {
    const colors = {
        'low': '#198754',
        'medium': '#ffc107',
        'high': '#ff6b6b',
        'critical': '#dc3545'
    };
    return colors[priority] || '#6c757d';
}

function getPriorityIcon(priority) {
    const icons = {
        'low': 'fa-arrow-down',
        'medium': 'fa-minus',
        'high': 'fa-arrow-up',
        'critical': 'fa-exclamation-triangle'
    };
    return icons[priority] || 'fa-circle';
}

// ==========================================
// PROGRESS UTILITIES
// ==========================================

function calculateProgress(completedTasks, totalTasks) {
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
}

function getProgressColor(progress) {
    if (progress >= 80) return '#198754'; // Green
    if (progress >= 50) return '#0dcaf0'; // Blue
    if (progress >= 30) return '#ffc107'; // Yellow
    return '#dc3545'; // Red
}

function getProgressLabel(progress) {
    if (progress >= 90) return 'Excellent';
    if (progress >= 70) return 'Good';
    if (progress >= 50) return 'Fair';
    if (progress >= 30) return 'Behind';
    return 'Critical';
}

function calculateProjectHealth(project) {
    const today = new Date();
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    
    if (today < start) return 'not-started';
    if (today > end) return project.progress === 100 ? 'completed' : 'overdue';
    
    const totalDuration = end - start;
    const elapsed = today - start;
    const expectedProgress = (elapsed / totalDuration) * 100;
    
    const progressDiff = project.progress - expectedProgress;
    
    if (progressDiff >= 10) return 'excellent';
    if (progressDiff >= 0) return 'on-track';
    if (progressDiff >= -10) return 'at-risk';
    return 'critical';
}

function getHealthIcon(health) {
    const icons = {
        'excellent': 'fa-star',
        'on-track': 'fa-check-circle',
        'at-risk': 'fa-exclamation-triangle',
        'critical': 'fa-times-circle',
        'overdue': 'fa-clock',
        'not-started': 'fa-hourglass-start',
        'completed': 'fa-flag-checkered'
    };
    return icons[health] || 'fa-circle';
}

function getHealthColor(health) {
    const colors = {
        'excellent': '#198754',
        'on-track': '#0dcaf0',
        'at-risk': '#ffc107',
        'critical': '#dc3545',
        'overdue': '#dc3545',
        'not-started': '#6c757d',
        'completed': '#198754'
    };
    return colors[health] || '#6c757d';
}

// ==========================================
// TEAM UTILITIES
// ==========================================

function renderTeamAvatars(team, size = 35, maxDisplay = 3) {
    if (!team || team.length === 0) {
        return '<span class="text-muted small">No team assigned</span>';
    }
    
    let html = '';
    const displayCount = Math.min(team.length, maxDisplay);
    
    for (let i = 0; i < displayCount; i++) {
        const member = team[i];
        const color = stringToColor(member);
        const title = escapeHtml(member);
        
        html += `
            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(member)}&size=${size}&background=${color}&color=fff&bold=true" 
                 alt="${title}" 
                 class="user-avatar" 
                 style="width: ${size}px; height: ${size}px"
                 title="${title}"
                 data-bs-toggle="tooltip">
        `;
    }
    
    if (team.length > maxDisplay) {
        const remaining = team.length - maxDisplay;
        const remainingNames = team.slice(maxDisplay).join('\n');
        
        html += `
            <span class="user-avatar d-flex align-items-center justify-content-center" 
                  style="width: ${size}px; height: ${size}px; background: #6c757d; color: white; font-size: 0.75rem;"
                  title="${escapeHtml(remainingNames)}"
                  data-bs-toggle="tooltip">
                +${remaining}
            </span>
        `;
    }
    
    return html;
}

function getUniqueTeamMembers(projects) {
    const members = new Set();
    projects.forEach(project => {
        if (project.team) {
            project.team.forEach(member => members.add(member));
        }
    });
    return Array.from(members).sort();
}

function getMemberProjects(projects, memberName) {
    return projects.filter(project => 
        project.team && project.team.includes(memberName)
    );
}

function getMemberWorkload(projects, memberName) {
    const memberProjects = getMemberProjects(projects, memberName);
    return {
        total: memberProjects.length,
        planning: memberProjects.filter(p => p.phase === 'planning').length,
        inProgress: memberProjects.filter(p => p.phase === 'in-progress').length,
        completed: memberProjects.filter(p => p.phase === 'completed').length
    };
}

// ==========================================
// VALIDATION UTILITIES
// ==========================================

function validateProject(project) {
    const errors = [];
    
    if (!project.name || project.name.trim() === '') {
        errors.push('Project name is required');
    }
    
    if (!project.startDate) {
        errors.push('Start date is required');
    }
    
    if (!project.endDate) {
        errors.push('End date is required');
    }
    
    if (project.startDate && project.endDate) {
        const start = new Date(project.startDate);
        const end = new Date(project.endDate);
        if (end < start) {
            errors.push('End date must be after start date');
        }
    }
    
    if (project.progress < 0 || project.progress > 100) {
        errors.push('Progress must be between 0 and 100');
    }
    
    const validPhases = ['planning', 'in-progress', 'completed', 'on-hold', 'cancelled'];
    if (!validPhases.includes(project.phase)) {
        errors.push('Invalid project phase');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

function validateUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

function validateGoogleSheetsUrl(url) {
    return url.includes('docs.google.com/spreadsheets') && 
           (url.includes('pub?output=csv') || url.includes('export?format=csv'));
}

// ==========================================
// NUMBER UTILITIES
// ==========================================

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

function formatPercentage(value, decimals = 0) {
    return `${value.toFixed(decimals)}%`;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function roundToDecimals(value, decimals) {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// ==========================================
// ARRAY UTILITIES
// ==========================================

function sortByKey(array, key, ascending = true) {
    return array.sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        
        if (aVal < bVal) return ascending ? -1 : 1;
        if (aVal > bVal) return ascending ? 1 : -1;
        return 0;
    });
}

function sortByDate(array, dateKey, ascending = true) {
    return array.sort((a, b) => {
        const aDate = new Date(a[dateKey]);
        const bDate = new Date(b[dateKey]);
        return ascending ? aDate - bDate : bDate - aDate;
    });
}

function groupBy(array, key) {
    return array.reduce((result, item) => {
        const groupKey = item[key];
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
}

function uniqueBy(array, key) {
    const seen = new Set();
    return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) {
            return false;
        }
        seen.add(value);
        return true;
    });
}

function shuffle(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

// ==========================================
// OBJECT UTILITIES
// ==========================================

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function mergeObjects(...objects) {
    return Object.assign({}, ...objects);
}

function pick(obj, keys) {
    return keys.reduce((result, key) => {
        if (obj.hasOwnProperty(key)) {
            result[key] = obj[key];
        }
        return result;
    }, {});
}

function omit(obj, keys) {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
}

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

// ==========================================
// DEBOUNCE & THROTTLE
// ==========================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ==========================================
// LOCAL STORAGE UTILITIES
// ==========================================

function setLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error('Error saving to localStorage:', e);
        return false;
    }
}

function getLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error('Error reading from localStorage:', e);
        return defaultValue;
    }
}

function removeLocalStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (e) {
        console.error('Error removing from localStorage:', e);
        return false;
    }
}

function clearLocalStorage() {
    try {
        localStorage.clear();
        return true;
    } catch (e) {
        console.error('Error clearing localStorage:', e);
        return false;
    }
}

function getLocalStorageSize() {
    let total = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length + key.length;
        }
    }
    return (total / 1024).toFixed(2) + ' KB';
}

// ==========================================
// FILE UTILITIES
// ==========================================

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function downloadJSON(data, filename) {
    const jsonStr = JSON.stringify(data, null, 2);
    downloadFile(jsonStr, filename, 'application/json');
}

function downloadCSV(data, filename) {
    downloadFile(data, filename, 'text/csv');
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e);
        reader.readAsText(file);
    });
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e);
        reader.readAsDataURL(file);
    });
}

// ==========================================
// DOM UTILITIES
// ==========================================

function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    Object.keys(attributes).forEach(key => {
        if (key === 'className') {
            element.className = attributes[key];
        } else if (key === 'innerHTML') {
            element.innerHTML = attributes[key];
        } else {
            element.setAttribute(key, attributes[key]);
        }
    });
    
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else {
            element.appendChild(child);
        }
    });
    
    return element;
}

function removeElement(element) {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}

function toggleClass(element, className) {
    element.classList.toggle(className);
}

function hasClass(element, className) {
    return element.classList.contains(className);
}

// ==========================================
// ANIMATION UTILITIES
// ==========================================

function fadeIn(element, duration = 300) {
    element.style.opacity = 0;
    element.style.display = 'block';
    
    let start = null;
    
    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        
        element.style.opacity = Math.min(progress / duration, 1);
        
        if (progress < duration) {
            requestAnimationFrame(animate);
        }
    }
    
    requestAnimationFrame(animate);
}

function fadeOut(element, duration = 300) {
    element.style.opacity = 1;
    
    let start = null;
    
    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        
        element.style.opacity = Math.max(1 - progress / duration, 0);
        
        if (progress < duration) {
            requestAnimationFrame(animate);
        } else {
            element.style.display = 'none';
        }
    }
    
    requestAnimationFrame(animate);
}

function slideDown(element, duration = 300) {
    element.style.height = '0';
    element.style.overflow = 'hidden';
    element.style.display = 'block';
    
    const height = element.scrollHeight;
    
    let start = null;
    
    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        
        element.style.height = Math.min((progress / duration) * height, height) + 'px';
        
        if (progress < duration) {
            requestAnimationFrame(animate);
        } else {
            element.style.height = 'auto';
        }
    }
    
    requestAnimationFrame(animate);
}

// ==========================================
// CONSOLE UTILITIES
// ==========================================

function logInfo(message, data = null) {
    console.log(`ℹ️ ${message}`, data || '');
}

function logSuccess(message, data = null) {
    console.log(`✅ ${message}`, data || '');
}

function logWarning(message, data = null) {
    console.warn(`⚠️ ${message}`, data || '');
}

function logError(message, error = null) {
    console.error(`❌ ${message}`, error || '');
}

function logTable(data) {
    console.table(data);
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.add('show');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show');
}


function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.position = 'fixed';
        toastContainer.style.top = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast
    const toastId = 'toast-' + Date.now();
    const bgColors = {
        'success': '#198754',
        'danger': '#dc3545',
        'warning': '#ffc107',
        'info': '#0dcaf0'
    };
    
    const icons = {
        'success': 'fa-check-circle',
        'danger': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = 'toast show';
    toast.setAttribute('role', 'alert');
    toast.style.minWidth = '300px';
    toast.style.marginBottom = '10px';
    toast.style.backgroundColor = bgColors[type] || bgColors.info;
    toast.style.color = 'white';
    toast.style.borderRadius = '10px';
    toast.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
    
    toast.innerHTML = `
        <div class="toast-body d-flex align-items-center justify-content-between p-3">
            <div>
                <i class="fas ${icons[type]} me-2"></i>
                <span>${message}</span>
            </div>
            <button type="button" class="btn-close btn-close-white" onclick="document.getElementById('${toastId}').remove()"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (document.getElementById(toastId)) {
            document.getElementById(toastId).remove();
        }
    }, 3000);
}

// ==========================================
// EXPORT FOR USE
// ==========================================

console.log('✅ Utility functions loaded successfully!');

// End of project-tracker-utils.js