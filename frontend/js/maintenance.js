// Maintenance Management
const API_URL = "http://127.0.0.1:5000/api/maintenance";
const EQUIPMENT_API = "http://127.0.0.1:5000/api/equipment";

let allMaintenance = [];
let allEquipment = [];

// DOM Elements
let maintenanceModal, maintenanceForm, equipmentSelect, submitBtn;

// Initialize
function initMaintenance() {
  loadMaintenance();
  loadEquipmentForDropdown();
  setupModal();
}

// Load maintenance records
function loadMaintenance() {
  fetch(API_URL)
    .then(res => {
      if (!res.ok) throw new Error("Failed to load maintenance records");
      return res.json();
    })
    .then(maintenance => {
      allMaintenance = maintenance;
      renderMaintenance(maintenance);
    })
    .catch(err => {
      console.error("Maintenance error:", err);
      const container = document.getElementById("maintenance-list");
      container.innerHTML = `
        <div class="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
          <i class="fas fa-exclamation-triangle text-amber-400 text-4xl mb-4"></i>
          <h3 class="text-lg font-semibold mb-2">Cannot Load Maintenance Records</h3>
          <p class="text-slate-400 mb-4">Make sure the backend server is running at http://127.0.0.1:5000</p>
          <button onclick="loadMaintenance()" class="px-4 py-2 bg-amber-400 text-black rounded-lg hover:bg-amber-500 transition">
            <i class="fas fa-redo mr-2"></i> Retry
          </button>
        </div>
      `;
    });
}

// Load equipment for dropdown
function loadEquipmentForDropdown() {
  fetch(EQUIPMENT_API)
    .then(res => {
      if (!res.ok) throw new Error("Failed to load equipment");
      return res.json();
    })
    .then(equipment => {
      allEquipment = equipment;
      populateEquipmentDropdown(equipment);
    })
    .catch(err => {
      console.error("Equipment dropdown error:", err);
    });
}

// Populate equipment dropdown
function populateEquipmentDropdown(equipment) {
  const select = document.getElementById('equipmentSelect');
  if (!select) return;
  
  // Clear existing options except the first one
  select.innerHTML = '<option value="" disabled selected>Select equipment...</option>';
  
  equipment.forEach(eq => {
    const option = document.createElement('option');
    option.value = eq.id;
    option.textContent = `${eq.name} (${eq.code}) - ${eq.usage_hours} hours`;
    select.appendChild(option);
  });
}

// Setup modal functionality
function setupModal() {
  maintenanceModal = document.getElementById('addMaintenanceModal');
  maintenanceForm = document.getElementById('addMaintenanceForm');
  equipmentSelect = document.getElementById('equipmentSelect');
  submitBtn = document.getElementById('submitMaintenanceBtn');
  
  // Set today's date as default
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('serviceDate').value = today;
  
  // Open modal
  document.getElementById('openAddMaintenanceModal').addEventListener('click', () => {
    maintenanceModal.classList.remove('hidden');
    maintenanceModal.classList.add('flex');
    
    // Load equipment data fresh
    loadEquipmentForDropdown();
    
    // Focus on first field
    document.getElementById('equipmentSelect').focus();
  });
  
  // Close modal buttons
  document.getElementById('closeMaintenanceModal').addEventListener('click', closeModal);
  document.getElementById('cancelMaintenanceBtn').addEventListener('click', closeModal);
  
  // Close modal on background click
  maintenanceModal.addEventListener('click', (e) => {
    if (e.target === maintenanceModal) {
      closeModal();
    }
  });
  
  // Close modal with ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !maintenanceModal.classList.contains('hidden')) {
      closeModal();
    }
  });
  
  // Form submission
  maintenanceForm.addEventListener('submit', handleMaintenanceSubmit);
  
  // Update usage hours when equipment is selected
  equipmentSelect?.addEventListener('change', (e) => {
    const selectedId = parseInt(e.target.value);
    const equipment = allEquipment.find(eq => eq.id === selectedId);
    if (equipment) {
      document.getElementById('usageAtService').value = equipment.usage_hours;
    }
  });
}

// Close modal
function closeModal() {
  maintenanceModal.classList.remove('flex');
  maintenanceModal.classList.add('hidden');
  maintenanceForm.reset();
  
  // Reset to today's date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('serviceDate').value = today;
}

// Handle form submission
async function handleMaintenanceSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData(maintenanceForm);
  const data = Object.fromEntries(formData.entries());
  
  // Validate
  if (!data.equipment_id || data.equipment_id === "") {
    alert("Please select equipment");
    return;
  }
  
  // Convert numeric fields
  data.equipment_id = parseInt(data.equipment_id);
  data.usage_at_service = parseInt(data.usage_at_service) || 0;
  
  // Validate usage hours
  const selectedEquipment = allEquipment.find(eq => eq.id === data.equipment_id);
  if (selectedEquipment && data.usage_at_service < selectedEquipment.usage_hours) {
    if (!confirm(`The usage hours (${data.usage_at_service}) are less than the equipment's current hours (${selectedEquipment.usage_hours}). Continue anyway?`)) {
      return;
    }
  }
  
  try {
    // Show loading state
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Adding...';
    submitBtn.disabled = true;
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      const result = await response.json();
      
      // Show success message
      showNotification('✅ Maintenance record added successfully!', 'success');
      
      // Close modal
      closeModal();
      
      // Refresh maintenance list
      loadMaintenance();
      
      // Optional: Update equipment hours to match maintenance record
      updateEquipmentHours(data.equipment_id, data.usage_at_service);
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Server error');
    }
  } catch (error) {
    console.error('Error adding maintenance:', error);
    showNotification(`❌ Failed to add maintenance: ${error.message}`, 'error');
  } finally {
    // Reset button
    submitBtn.innerHTML = 'Add Maintenance Record';
    submitBtn.disabled = false;
  }
}

// Optional: Update equipment usage hours after maintenance
function updateEquipmentHours(equipmentId, newHours) {
  fetch(`http://127.0.0.1:5000/api/equipment/${equipmentId}/update-hours`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ usage_hours: newHours })
  })
  .then(res => res.json())
  .then(data => {
    console.log('Equipment hours updated after maintenance:', data);
  })
  .catch(err => {
    console.warn('Could not update equipment hours:', err);
  });
}

// Render maintenance records
function renderMaintenance(records) {
  const container = document.getElementById("maintenance-list");
  if (!container) return;
  
  container.innerHTML = "";
  
  if (records.length === 0) {
    container.innerHTML = `
      <div class="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
        <i class="fas fa-tools text-slate-500 text-5xl mb-4"></i>
        <h3 class="text-xl font-semibold mb-2">No Maintenance Records</h3>
        <p class="text-slate-400 mb-6">Add your first maintenance record to get started</p>
        <button id="openAddModalFromEmpty" class="bg-amber-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-amber-500 transition flex items-center gap-2 mx-auto">
          <i class="fas fa-plus"></i> Add First Maintenance Record
        </button>
      </div>
    `;
    
    // Add event listener to empty state button
    document.getElementById('openAddModalFromEmpty')?.addEventListener('click', () => {
      document.getElementById('openAddMaintenanceModal')?.click();
    });
    return;
  }
  
  // Sort by date (newest first)
  records.sort((a, b) => new Date(b.service_date) - new Date(a.service_date));
  
  records.forEach(record => {
    const date = new Date(record.service_date);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    // Determine status based on maintenance type
    const isEmergency = record.maintenance_type === 'Emergency Repair';
    const isOverhaul = record.maintenance_type === 'Engine Overhaul';
    
    const card = document.createElement("div");
    card.className = "bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-800 hover:border-amber-400/20 transition-all duration-300 hover:shadow-xl";
    
    card.innerHTML = `
      <div class="flex justify-between items-start mb-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg ${isEmergency ? 'bg-red-400/10' : isOverhaul ? 'bg-amber-400/10' : 'bg-emerald-400/10'}">
            <i class="fas ${getMaintenanceIcon(record.maintenance_type)} ${isEmergency ? 'text-red-400' : isOverhaul ? 'text-amber-400' : 'text-emerald-400'} text-lg"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold">${record.maintenance_type}</h3>
            <p class="text-sm text-slate-400">${formattedDate}</p>
          </div>
        </div>
        <span class="px-3 py-1 text-xs rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700">
          ${record.technician}
        </span>
      </div>
      
      <div class="mb-4">
        <p class="text-sm mb-2">
          <i class="fas fa-truck-monster mr-2 text-slate-500"></i>
          <strong>Equipment:</strong> ${record.equipment_name || `ID: ${record.equipment_id}`}
        </p>
        <p class="text-sm mb-3">
          <i class="fas fa-clock mr-2 text-slate-500"></i>
          <strong>Usage at Service:</strong> ${record.usage_at_service.toLocaleString()} hours
        </p>
        <div class="bg-slate-800/50 rounded-lg p-4">
          <p class="text-sm text-slate-300">${record.description}</p>
        </div>
      </div>
      
      <div class="flex justify-between items-center text-sm text-slate-400">
        <div class="flex items-center gap-2">
          <i class="fas fa-calendar"></i>
          <span>${formattedDate}</span>
        </div>
        <div class="flex items-center gap-2">
          <i class="fas fa-user-hard-hat"></i>
          <span>${record.technician}</span>
        </div>
      </div>
    `;
    
    container.appendChild(card);
  });
}

// Helper function to get icon for maintenance type
function getMaintenanceIcon(type) {
  const iconMap = {
    'Routine Inspection': 'fa-search',
    'Preventive Maintenance': 'fa-shield-alt',
    'Corrective Maintenance': 'fa-wrench',
    'Emergency Repair': 'fa-exclamation-triangle',
    'Engine Overhaul': 'fa-cogs',
    'Hydraulic Service': 'fa-oil-can',
    'Brake Inspection': 'fa-brake-warning',
    'Electrical Repair': 'fa-bolt',
    'Lubrication Service': 'fa-oil-can',
    'Tire Replacement': 'fa-tire',
    'Default': 'fa-tools'
  };
  
  for (const [key, icon] of Object.entries(iconMap)) {
    if (type.includes(key) || type === key) {
      return icon;
    }
  }
  return iconMap['Default'];
}

// Notification function
function showNotification(message, type = 'info') {
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

// Auto-refresh every 30 seconds
function startAutoRefresh() {
  setInterval(loadMaintenance, 30000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initMaintenance();
  startAutoRefresh();
});

// Make functions available globally
window.loadMaintenance = loadMaintenance;
window.closeModal = closeModal;