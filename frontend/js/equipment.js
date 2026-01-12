const API_URL = "http://127.0.0.1:5000/api/equipment";

let allEquipment = [];

function loadEquipment() {
  fetch(API_URL)
    .then(res => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    })
    .then(data => {
      allEquipment = data;
      renderEquipment(data);
    })
    .catch(() => {
      // Fallback to local sample data when backend isn't available
      return fetch("sample-data.json").then(r => r.json()).then(d => d.equipment);
    })
    .then(data => {
      if (data) {
        allEquipment = data;
        renderEquipment(data);
      }
    })
    .catch(err => console.error("Equipment load error:", err));
}

loadEquipment();

const listEl = document.getElementById("equipment-list");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

if (searchInput) searchInput.addEventListener("input", applyFilters);
if (statusFilter) statusFilter.addEventListener("change", applyFilters);

function applyFilters() {
  const query = searchInput.value.toLowerCase();
  const status = statusFilter.value;

  const filtered = allEquipment.filter(eq => {
    const matchesText =
      eq.name.toLowerCase().includes(query) ||
      eq.code.toLowerCase().includes(query);

    const matchesStatus =
      status === "all" || eq.status === status;

    return matchesText && matchesStatus;
  });

  renderEquipment(filtered);
}

function renderEquipment(data) {
  if (!listEl) return;
  
  listEl.innerHTML = "";

  if (data.length === 0) {
    listEl.innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-slate-400">No equipment found</p>
      </div>
    `;
    return;
  }

  data.forEach(eq => {
    const percent = Math.round(
      (eq.usage_hours / eq.maintenance_limit) * 100
    );

    const statusColor =
      eq.status === "Good"
        ? "bg-green-500/10 text-green-400"
        : eq.status === "Warning"
        ? "bg-amber-500/10 text-amber-400"
        : "bg-red-500/10 text-red-400";

    const barColor =
      eq.status === "Good"
        ? "bg-green-500"
        : eq.status === "Warning"
        ? "bg-amber-400"
        : "bg-red-500";

    const card = document.createElement("div");
    card.className = "bg-slate-900 border border-white/10 rounded-xl p-5 hover:border-white/20 transition";
    card.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <div>
          <h3 class="font-semibold text-lg">${eq.name}</h3>
          <p class="text-xs text-slate-400">${eq.code}</p>
        </div>
        <span class="px-3 py-1 text-xs rounded-full ${statusColor} font-medium">
          ${eq.status}
        </span>
      </div>

      <p class="text-sm text-slate-400 mb-1">Type: <span class="text-slate-300">${eq.type}</span></p>
      <p class="text-sm mb-3">
        Usage: <span class="font-medium">${eq.usage_hours.toLocaleString()}</span> /
        ${eq.maintenance_limit.toLocaleString()}h
      </p>

      <div class="mb-2">
        <div class="flex justify-between text-xs text-slate-400 mb-1">
          <span>Usage Progress</span>
          <span>${percent}%</span>
        </div>
        <div class="w-full bg-slate-800 rounded-full h-2">
          <div class="${barColor} h-2 rounded-full transition-all duration-500"
               style="width:${Math.min(percent, 100)}%"></div>
        </div>
      </div>

      <div class="flex gap-2 mt-4">
        <button class="edit-btn flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-sm transition" data-id="${eq.id}">
          Edit
        </button>
        <button class="delete-btn flex-1 bg-red-900/30 hover:bg-red-800/50 py-2 rounded-lg text-sm text-red-400 transition" data-id="${eq.id}">
          Delete
        </button>
      </div>
    `;

    listEl.appendChild(card);
  });

  // Attach event listeners to edit and delete buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.getAttribute('data-id'));
      const equipment = allEquipment.find(eq => eq.id === id);
      if (equipment && window.openEditModal) {
        window.openEditModal(equipment);
      }
    });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.getAttribute('data-id'));
      const equipment = allEquipment.find(eq => eq.id === id);
      if (equipment) {
        deleteEquipment(id, equipment.name);
      }
    });
  });
}

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
      allEquipment = allEquipment.filter(eq => eq.id !== id);
      renderEquipment(allEquipment);
      showNotification('Equipment deleted successfully', 'success');
    } else {
      showNotification('Failed to delete equipment', 'error');
    }
  })
  .catch(err => {
    console.error('Delete error:', err);
    showNotification('Failed to delete equipment', 'error');
  });
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${
    type === 'success' ? 'bg-green-900/90 text-green-100' : 
    type === 'error' ? 'bg-red-900/90 text-red-100' : 
    'bg-slate-800/90 text-slate-100'
  }`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Make functions available globally
window.loadEquipment = loadEquipment;
window.renderEquipment = renderEquipment;