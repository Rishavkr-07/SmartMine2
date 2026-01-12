function loadDashboardSummary() {
  fetch("http://127.0.0.1:5000/api/dashboard-summary")
    .then(res => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    })
    .then(data => {
      document.getElementById("total-count").textContent = data.total;
      document.getElementById("good-count").textContent = data.good;
      document.getElementById("warning-count").textContent = data.warning;
      document.getElementById("critical-count").textContent = data.critical;
      loadRecentAlerts();
      createStatusChart(data);
    })
    .catch(err => {
      console.error("Dashboard error:", err);
      const sampleData = { total: 8, good: 2, warning: 4, critical: 2 };
      document.getElementById("total-count").textContent = sampleData.total;
      document.getElementById("good-count").textContent = sampleData.good;
      document.getElementById("warning-count").textContent = sampleData.warning;
      document.getElementById("critical-count").textContent = sampleData.critical;
      createStatusChart(sampleData);
    });
}

function loadRecentAlerts() {
  fetch("http://127.0.0.1:5000/api/alerts")
    .then(res => res.json())
    .then(alerts => {
      const container = document.getElementById("recent-alerts");
      container.innerHTML = '';
      if (alerts.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-sm text-center py-8">No active alerts 🎉</p>';
        return;
      }
      const recent = alerts.slice(0, 5);
      recent.forEach(alert => {
        const alertEl = document.createElement("div");
        alertEl.className = "flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition";
        alertEl.innerHTML = `
          <div class="w-3 h-3 rounded-full ${alert.status === 'Critical' ? 'bg-red-500' : 'bg-amber-500'}"></div>
          <div class="flex-1">
            <p class="text-sm font-medium">${alert.name} (${alert.code})</p>
            <p class="text-xs text-slate-400">${alert.status} • ${alert.usage_hours}h / ${alert.maintenance_limit}h</p>
          </div>
          <span class="text-xs px-2 py-1 rounded ${alert.status === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}">
            ${alert.status}
          </span>
        `;
        container.appendChild(alertEl);
      });
    })
    .catch(err => {
      console.error("Alerts error:", err);
      document.getElementById("recent-alerts").innerHTML = 
        '<p class="text-slate-400 text-sm text-center py-8">Cannot load alerts</p>';
    });
}

function createStatusChart(data) {
  const ctx = document.getElementById('status-chart');
  if (!ctx) return;
  if (window.statusChart) window.statusChart.destroy();
  window.statusChart = new Chart(ctx.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: ['Good', 'Warning', 'Critical'],
      datasets: [{
        data: [data.good, data.warning, data.critical],
        backgroundColor: ['#22c55e', '#facc15', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#94a3b8', padding: 20, font: { size: 12 } }
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#e2e8f0',
          bodyColor: '#cbd5e1',
          borderColor: '#334155',
          borderWidth: 1
        }
      },
      cutout: '65%'
    }
  });
}

document.addEventListener('DOMContentLoaded', loadDashboardSummary);