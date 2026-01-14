const API_URL = "http://127.0.0.1:5000/api/equipment";
let allEquipment = [];

// Load equipment from API
function loadEquipment() {
  fetch(API_URL)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      allEquipment = data;
      renderEquipment(data);
    })
    .catch(error => {
      console.error("Failed to load equipment:", error);
      // Show error in UI
      const list = document.getElementById("equipment-list");
      list.innerHTML = `
        <div class="col-span-full text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
          <i class="fas fa-exclamation-triangle text-amber-400 text-4xl mb-4"></i>
          <h3 class="text-lg font-semibold mb-2">Cannot Load Equipment</h3>
          <p class="text-slate-400 mb-4">Make sure the backend server is running at http://127.0.0.1:5000</p>
          <button onclick="loadEquipment()" class="px-4 py-2 bg-amber-400 text-black rounded-lg hover:bg-amber-500 transition">
            <i class="fas fa-redo mr-2"></i> Retry
          </button>
        </div>
      `;
    });
}

// Initial load
loadEquipment();

// Auto-refresh every 30 seconds
setInterval(loadEquipment, 30000);

const list = document.getElementById("equipment-list");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

// Render equipment cards
function renderEquipment(items) {
  if (!list) return;
  
  list.innerHTML = "";

  if (items.length === 0) {
    list.innerHTML = `
      <div class="col-span-full text-center py-16">
        <div class="inline-block p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
          <i class="fas fa-truck-loading text-slate-500 text-5xl mb-4"></i>
          <h3 class="text-xl font-semibold mb-2">No Equipment Found</h3>
          <p class="text-slate-400 mb-6">Add your first piece of equipment to get started</p>
          <button id="openAddModalFromEmpty" class="bg-amber-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-amber-500 transition flex items-center gap-2 mx-auto">
            <i class="fas fa-plus"></i> Add First Equipment
          </button>
        </div>
      </div>
    `;
    
    // Add event listener to the empty state button
    document.getElementById('openAddModalFromEmpty')?.addEventListener('click', () => {
      document.getElementById('openAddModal')?.click();
    });
    return;
  }

  items.forEach(eq => {
    const percent = Math.round((eq.usage_hours / eq.maintenance_limit) * 100);
    
    // Determine status colors
    let statusColor, statusBg, progressColor;
    switch(eq.status) {
      case "Good":
        statusColor = "text-emerald-400";
        statusBg = "bg-emerald-500/10";
        progressColor = "bg-emerald-500";
        break;
      case "Warning":
        statusColor = "text-amber-400";
        statusBg = "bg-amber-500/10";
        progressColor = "bg-amber-500";
        break;
      case "Critical":
        statusColor = "text-red-400";
        statusBg = "bg-red-500/10";
        progressColor = "bg-red-500";
        break;
      default:
        statusColor = "text-slate-400";
        statusBg = "bg-slate-500/10";
        progressColor = "bg-slate-500";
    }

    // Get icon based on equipment type
    const typeIcon = getEquipmentIcon(eq.type);
    
    const card = document.createElement("div");
    card.className = "bg-slate-900 rounded-xl p-5 shadow-lg border border-white/5 hover:border-amber-400/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1";
    
    card.innerHTML = `
      <div class="flex justify-between items-start mb-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-slate-800">
            <i class="${typeIcon} text-amber-400 text-lg"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold">${eq.name}</h3>
            <p class="text-xs text-slate-400">${eq.code}</p>
          </div>
        </div>
        <span class="px-3 py-1 text-xs rounded-full ${statusBg} ${statusColor} font-medium border ${statusBg.replace('/10', '/20')}">
          ${eq.status}
        </span>
      </div>

      <div class="mb-4">
        <p class="text-sm text-slate-300 mb-1"><i class="fas fa-cogs mr-2 text-slate-500"></i>${eq.type || "N/A"}</p>
        <p class="text-sm mb-2"><i class="fas fa-clock mr-2 text-slate-500"></i><strong>Usage:</strong> ${eq.usage_hours.toLocaleString()} / ${eq.maintenance_limit.toLocaleString()} hrs</p>
        
        <!-- Progress bar with percentage -->
        <div class="mb-1 flex justify-between text-xs text-slate-400">
          <span>Health</span>
          <span>${percent}%</span>
        </div>
        <div class="w-full bg-slate-800 rounded-full h-2 mb-4">
          <div class="h-2 rounded-full ${progressColor} transition-all duration-500" style="width:${Math.min(percent, 100)}%"></div>
        </div>
      </div>

      <div class="flex gap-2">
        <button class="edit-btn flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-sm transition flex items-center justify-center gap-2">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="delete-btn flex-1 bg-red-900/30 hover:bg-red-800/50 text-red-400 py-2 rounded-lg text-sm transition flex items-center justify-center gap-2" data-id="${eq.id}" data-name="${eq.name}">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `;

    // Add event listeners for edit and delete
    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
      const id = deleteBtn.getAttribute('data-id');
      const name = deleteBtn.getAttribute('data-name');
      deleteEquipment(id, name);
    });

    list.appendChild(card);
  });
}

// Helper function to get icon based on equipment type
function getEquipmentIcon(type) {
  const iconMap = {
    'Excavator': 'fas fa-digging',
    'Haul Truck': 'fas fa-truck-moving',
    'Drill Jumbo': 'fas fa-hammer',
    'Scooptram': 'fas fa-truck-pickup',
    'Articulated Truck': 'fas fa-truck',
    'Face Drill': 'fas fa-drill',
    'Loader': 'fas fa-truck-loading',
    'Dozer': 'fas fa-tractor',
    'Dump Truck': 'fas fa-dumpster',
    'Grader': 'fas fa-road'
  };
  return iconMap[type] || 'fas fa-cog';
}

// Filter equipment based on search and status
searchInput.addEventListener("input", filterData);
statusFilter.addEventListener("change", filterData);

function filterData() {
  const query = searchInput.value.toLowerCase();
  const status = statusFilter.value;

  const filtered = allEquipment.filter(eq => {
    const matchesText = eq.name.toLowerCase().includes(query) || 
                       eq.code.toLowerCase().includes(query) ||
                       eq.type.toLowerCase().includes(query);
    const matchesStatus = status === "all" || eq.status === status;
    return matchesText && matchesStatus;
  });

  renderEquipment(filtered);
}

// Delete equipment function
function deleteEquipment(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
    return;
  }

  fetch(`${API_URL}/${id}`, {
    method: 'DELETE'
  })
  .then(res => {
    if (res.ok) {
      // Remove from local array and re-render
      allEquipment = allEquipment.filter(eq => eq.id !== parseInt(id));
      renderEquipment(allEquipment);
      showNotification(`"${name}" deleted successfully`, 'success');
    } else {
      showNotification('Failed to delete equipment', 'error');
    }
  })
  .catch(err => {
    console.error('Delete error:', err);
    showNotification('Failed to delete equipment', 'error');
  });
}

// Notification function
function showNotification(message, type = 'info') {
  // You can reuse the toast from modal or create a simple one
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${
    type === 'success' ? 'bg-emerald-900/90 text-emerald-100 border border-emerald-700' : 
    type === 'error' ? 'bg-red-900/90 text-red-100 border border-red-700' : 
    'bg-slate-800/90 text-slate-100 border border-slate-700'
  }`;
  
  const icon = type === 'success' ? 'fa-check-circle' : 
               type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
  
  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <i class="fas ${icon}"></i>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// Make functions available globally
window.loadEquipment = loadEquipment;
window.renderEquipment = renderEquipment;