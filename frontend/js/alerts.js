function loadAlerts() {
  fetch("http://127.0.0.1:5000/api/alerts")
    .then(res => {
      if (!res.ok) throw new Error("Failed to load alerts");
      return res.json();
    })
    .then(alerts => renderAlerts(alerts))
    .catch(err => {
      console.error("Alert error:", err);
      fetch("sample-data.json")
        .then(res => res.json())
        .then(data => {
          const criticalAlerts = data.equipment.filter(eq => 
            eq.status === "Critical" || eq.status === "Warning"
          );
          renderAlerts(criticalAlerts);
        })
        .catch(() => {
          document.getElementById("alert-list").innerHTML = 
            '<p class="text-slate-400 text-center py-8">Cannot load alerts. Please start the backend server.</p>';
        });
    });
}

function renderAlerts(alerts) {
  const container = document.getElementById("alert-list");
  container.innerHTML = "";
  if (alerts.length === 0) {
    container.innerHTML =
      '<div class="text-center py-12"><p class="text-slate-400 text-lg">No active alerts 🎉</p><p class="text-slate-500 text-sm mt-2">All equipment is operating normally</p></div>';
    return;
  }

  alerts.sort((a, b) => {
    if (a.status === "Critical" && b.status !== "Critical") return -1;
    if (a.status !== "Critical" && b.status === "Critical") return 1;
    return 0;
  });

  alerts.forEach(alert => {
    const isCritical = alert.status === "Critical";
    const colorClass = isCritical ? "border-red-500 text-red-400" : "border-amber-400 text-amber-400";
    const bgClass = isCritical ? "bg-red-900/10" : "bg-amber-900/10";
    const percent = Math.round((alert.usage_hours / alert.maintenance_limit) * 100);
    
    const card = document.createElement("div");
    card.className = `bg-slate-900 border-l-4 ${colorClass} p-5 rounded-r-xl ${bgClass} hover:bg-slate-800/50 transition`;
    card.innerHTML = `
      <div class="flex items-start justify-between mb-2">
        <div>
          <h3 class="font-semibold text-lg mb-1">${alert.name} <span class="text-slate-400 text-sm font-normal">(${alert.code})</span></h3>
          <p class="text-sm mb-1">Status: <strong class="${isCritical ? 'text-red-400' : 'text-amber-400'}">${alert.status}</strong></p>
        </div>
        <span class="px-3 py-1 text-xs rounded-full ${isCritical ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'} font-medium">
          ${alert.status}
        </span>
      </div>
      <div class="mb-3">
        <div class="flex justify-between text-sm mb-1">
          <span class="text-slate-400">Usage Progress</span>
          <span class="font-medium">${percent}%</span>
        </div>
        <div class="w-full bg-slate-800 rounded-full h-2">
          <div class="${isCritical ? 'bg-red-500' : 'bg-amber-400'} h-2 rounded-full" style="width: ${Math.min(percent, 100)}%"></div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div><p class="text-slate-400">Current Usage</p><p class="font-medium">${alert.usage_hours.toLocaleString()} hours</p></div>
        <div><p class="text-slate-400">Maintenance Limit</p><p class="font-medium">${alert.maintenance_limit.toLocaleString()} hours</p></div>
      </div>
      <div class="mt-4 text-sm text-slate-400">
        <i>${isCritical ? '⚠️ Immediate maintenance required' : '⚠️ Schedule maintenance soon'}</i>
      </div>
    `;
    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', loadAlerts);