let allAlerts = [];
let currentFilter = 'all';

function loadAlerts() {
  // Show loading state
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('no-alerts').classList.add('hidden');
  
  fetch("http://127.0.0.1:5000/api/alerts")
    .then(res => {
      if (!res.ok) throw new Error("Failed to load alerts");
      return res.json();
    })
    .then(alerts => {
      allAlerts = alerts;
      updateAlertStats(alerts);
      filterAlerts(currentFilter);
    })
    .catch(err => {
      console.error("Alert error:", err);
      // Try sample data fallback
      fetch("sample-data.json")
        .then(res => res.json())
        .then(data => {
          const criticalAlerts = data.equipment.filter(eq => 
            eq.status === "Critical" || eq.status === "Warning"
          ).map(eq => ({
            equipment_id: eq.id,
            code: eq.code,
            name: eq.name,
            status: eq.status,
            usage_hours: eq.usage_hours,
            maintenance_limit: eq.maintenance_limit
          }));
          
          allAlerts = criticalAlerts;
          updateAlertStats(criticalAlerts);
          filterAlerts(currentFilter);
        })
        .catch(() => {
          // Show error state
          document.getElementById('loading').classList.add('hidden');
          document.getElementById('alert-list').innerHTML = `
            <div class="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
              <i class="fas fa-exclamation-triangle text-amber-400 text-4xl mb-4"></i>
              <h3 class="text-lg font-semibold mb-2">Cannot Load Alerts</h3>
              <p class="text-slate-400 mb-4">Make sure the backend server is running</p>
              <button onclick="loadAlerts()" class="px-4 py-2 bg-amber-400 text-black rounded-lg hover:bg-amber-500 transition">
                <i class="fas fa-redo mr-2"></i> Retry
              </button>
            </div>
          `;
        });
    })
    .finally(() => {
      document.getElementById('loading').classList.add('hidden');
    });
}

function updateAlertStats(alerts) {
  const total = alerts.length;
  const warning = alerts.filter(a => a.status === "Warning").length;
  const critical = alerts.filter(a => a.status === "Critical").length;
  
  document.getElementById('total-alerts').textContent = total;
  document.getElementById('warning-alerts').textContent = warning;
  document.getElementById('critical-alerts').textContent = critical;
}

function filterAlerts(filter) {
  currentFilter = filter;
  
  // Update filter button states
  document.getElementById('filter-all').className = filter === 'all' 
    ? 'px-4 py-2 bg-amber-400 text-black rounded-lg font-medium hover:bg-amber-500 transition'
    : 'px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition';
  
  document.getElementById('filter-warning').className = filter === 'warning' 
    ? 'px-4 py-2 bg-amber-400 text-black rounded-lg font-medium hover:bg-amber-500 transition'
    : 'px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition';
  
  document.getElementById('filter-critical').className = filter === 'critical' 
    ? 'px-4 py-2 bg-amber-400 text-black rounded-lg font-medium hover:bg-amber-500 transition'
    : 'px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition';
  
  // Filter alerts
  let filteredAlerts = allAlerts;
  if (filter === 'warning') {
    filteredAlerts = allAlerts.filter(a => a.status === "Warning");
  } else if (filter === 'critical') {
    filteredAlerts = allAlerts.filter(a => a.status === "Critical");
  }
  
  // Sort: critical first, then warning
  filteredAlerts.sort((a, b) => {
    if (a.status === "Critical" && b.status !== "Critical") return -1;
    if (a.status !== "Critical" && b.status === "Critical") return 1;
    return 0;
  });
  
  renderAlerts(filteredAlerts);
}

function renderAlerts(alerts) {
  const container = document.getElementById("alert-list");
  const noAlertsElement = document.getElementById("no-alerts");
  
  container.innerHTML = "";
  
  if (alerts.length === 0) {
    noAlertsElement.classList.remove('hidden');
    return;
  }
  
  noAlertsElement.classList.add('hidden');

  alerts.forEach(alert => {
    const isCritical = alert.status === "Critical";
    const percent = Math.round((alert.usage_hours / alert.maintenance_limit) * 100);
    
    // Get icon based on equipment type (you might need to adjust this)
    const typeIcon = getEquipmentIcon(alert.type || "Equipment");
    
    const card = document.createElement("div");
    card.className = `bg-slate-900 rounded-xl p-6 shadow-lg border ${isCritical ? 'border-red-500/30' : 'border-amber-500/30'} hover:border-${isCritical ? 'red' : 'amber'}-400/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`;
    
    card.innerHTML = `
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg ${isCritical ? 'bg-red-400/10' : 'bg-amber-400/10'}">
            <i class="${typeIcon} ${isCritical ? 'text-red-400' : 'text-amber-400'} text-lg"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold">${alert.name}</h3>
            <p class="text-sm text-slate-400">${alert.code}</p>
          </div>
        </div>
        <span class="px-3 py-1 text-xs rounded-full ${isCritical ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'} font-medium border ${isCritical ? 'border-red-500/30' : 'border-amber-500/30'}">
          ${alert.status}
        </span>
      </div>

      <div class="mb-4">
        <p class="text-sm mb-2"><i class="fas fa-clock mr-2 text-slate-500"></i><strong>Usage:</strong> ${alert.usage_hours.toLocaleString()} / ${alert.maintenance_limit.toLocaleString()} hrs</p>
        
        <!-- Progress bar -->
        <div class="mb-1 flex justify-between text-xs text-slate-400">
          <span>Health Status</span>
          <span class="font-medium">${percent}%</span>
        </div>
        <div class="w-full bg-slate-800 rounded-full h-2 mb-3">
          <div class="h-2 rounded-full ${isCritical ? 'bg-red-500' : 'bg-amber-400'} transition-all duration-500" style="width:${Math.min(percent, 100)}%"></div>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div class="text-sm ${isCritical ? 'text-red-400' : 'text-amber-400'}">
          <i class="fas ${isCritical ? 'fa-skull-crossbones' : 'fa-exclamation-triangle'} mr-2"></i>
          ${isCritical ? 'Immediate maintenance required' : 'Schedule maintenance soon'}
        </div>
        <button onclick="window.location.href='equipment-details.html?id=${alert.equipment_id}'" 
          class="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg transition">
          View Details
        </button>
      </div>
    `;
    
    container.appendChild(card);
  });
}

// Helper function to get equipment icon
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

// Add filter event listeners
document.addEventListener('DOMContentLoaded', function() {
  loadAlerts();
  
  // Setup filter buttons
  document.getElementById('filter-all').addEventListener('click', () => filterAlerts('all'));
  document.getElementById('filter-warning').addEventListener('click', () => filterAlerts('warning'));
  document.getElementById('filter-critical').addEventListener('click', () => filterAlerts('critical'));
  
  // Auto-refresh every 30 seconds
  setInterval(loadAlerts, 30000);
});