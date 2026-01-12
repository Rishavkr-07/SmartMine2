export function loadSidebar(active) {
  const sidebar = document.getElementById("sidebar");
  sidebar.innerHTML = `
    <aside class="w-72 bg-slate-900 border-r border-white/5 flex flex-col justify-between p-6">
      <div>
        <div class="flex items-center gap-3 mb-8">
          <div class="bg-amber-400 text-black rounded-lg p-2">⛏️</div>
          <div>
            <h2 class="text-lg font-bold text-white">SmartMine</h2>
            <p class="text-xs text-slate-400">Maintenance System</p>
          </div>
        </div>
        <div class="flex items-center gap-3 mb-8">
          <div class="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-semibold">R</div>
          <div>
            <p class="text-sm">rishav4950@gmail.com</p>
            <p class="text-xs text-emerald-400">Maintenance Manager</p>
          </div>
        </div>
        <nav class="space-y-2">
          ${navItem("Dashboard", "dashboard.html", "📊", active === "dashboard")}
          ${navItem("Equipment", "equipment.html", "🚜", active === "equipment")}
          ${navItem("Alerts", "alerts.html", "⚠️", active === "alerts")}
          ${navItem("Maintenance", "maintenance.html", "🔧", active === "maintenance")}
        </nav>
      </div>
      <div class="space-y-4">
        <div class="bg-slate-800 rounded-lg px-4 py-3 text-sm text-emerald-400 flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-emerald-400"></div>
          <span>All Systems Online</span>
        </div>
        <div class="text-xs text-slate-500">
          <p>SmartMine v1.0.0</p>
          <p>${new Date().getFullYear()} © Mining Tech</p>
        </div>
      </div>
    </aside>
  `;
}

function navItem(label, link, icon, active) {
  return `
    <a href="${link}"
       class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active ? 
         'bg-amber-400/10 text-amber-400 border-l-4 border-amber-400' : 
         'text-slate-300 hover:bg-white/5 hover:text-white'}">
      <span class="text-lg">${icon}</span>
      ${label}
    </a>
  `;
}