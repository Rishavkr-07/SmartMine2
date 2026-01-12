function loadMaintenance() {
  fetch("http://127.0.0.1:5000/api/maintenance")
    .then(res => {
      if (!res.ok) throw new Error("Failed to load maintenance records");
      return res.json();
    })
    .then(maintenance => renderMaintenance(maintenance))
    .catch(err => {
      console.error("Maintenance error:", err);
      const container = document.getElementById("maintenance-list");
      container.innerHTML = `
        <div class="text-center py-12">
          <p class="text-slate-400">Cannot load maintenance records</p>
          <p class="text-slate-500 text-sm mt-2">Make sure the backend server is running</p>
          <button onclick="loadMaintenance()" class="mt-4 px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition">Retry</button>
        </div>
      `;
    });
}

function renderMaintenance(records) {
  const container = document.getElementById("maintenance-list");
  container.innerHTML = "";
  if (records.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <p class="text-slate-400 text-lg">No maintenance records found</p>
        <p class="text-slate-500 text-sm mt-2">Maintenance records will appear here once added</p>
      </div>
    `;
    return;
  }

  records.sort((a, b) => new Date(b.service_date) - new Date(a.service_date));
  records.forEach(record => {
    const date = new Date(record.service_date);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });

    const card = document.createElement("div");
    card.className = "bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition";
    card.innerHTML = `
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="font-semibold text-lg text-amber-400">${record.maintenance_type}</h3>
          <p class="text-sm text-slate-400">${formattedDate}</p>
        </div>
        <span class="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-full">${record.technician}</span>
      </div>
      <div class="space-y-3">
        <div><p class="text-sm text-slate-400">Equipment</p><p class="font-medium">${record.equipment_name || `Equipment #${record.equipment_id}`}</p></div>
        <div><p class="text-sm text-slate-400">Usage at Service</p><p class="font-medium">${record.usage_at_service.toLocaleString()} hours</p></div>
        <div><p class="text-sm text-slate-400">Description</p><p class="text-slate-300 mt-1">${record.description}</p></div>
      </div>
    `;
    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', loadMaintenance);