// Equipment Modal Management
class EquipmentModal {
  constructor() {
    this.modal = document.getElementById('addEquipmentModal');
    this.form = document.getElementById('addEquipmentForm');
    this.healthStatusDisplay = document.getElementById('healthStatusDisplay');
    this.healthStatusIndicator = document.getElementById('healthStatusIndicator');
    this.usageInput = document.getElementById('usageHours');
    this.limitInput = document.getElementById('maintenanceLimit');
    this.toast = document.getElementById('toast');
    
    this.initEventListeners();
  }

  initEventListeners() {
    // Open modal
    document.getElementById('openAddModal').addEventListener('click', () => {
      this.openModal();
    });

    // Close modal buttons
    document.getElementById('closeModal').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('cancelBtn').addEventListener('click', () => {
      this.closeModal();
    });

    // Close modal on background click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    // Real-time health status calculation
    this.usageInput.addEventListener('input', () => this.updateHealthStatus());
    this.limitInput.addEventListener('input', () => this.updateHealthStatus());

    // Form submission
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitForm();
    });
  }

  openModal() {
    this.modal.classList.remove('hidden');
    this.modal.classList.add('flex');
    this.form.reset();
    this.updateHealthStatus();
    
    // Set today's date as default for last maintenance
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('lastMaintenanceDate').value = today;
    
    // Focus on first input
    document.getElementById('equipmentName').focus();
  }

  closeModal() {
    this.modal.classList.remove('flex');
    this.modal.classList.add('hidden');
  }

  updateHealthStatus() {
    const usage = parseInt(this.usageInput.value) || 0;
    const limit = parseInt(this.limitInput.value) || 5000;
    
    if (limit === 0) return;
    
    const percentage = Math.min(Math.round((usage / limit) * 100), 100);
    
    let status, color, bgColor;
    
    if (percentage >= 100) {
      status = "Critical";
      color = "text-red-400";
      bgColor = "bg-red-500";
    } else if (percentage >= 75) {
      status = "Warning";
      color = "text-amber-400";
      bgColor = "bg-amber-500";
    } else {
      status = "Good";
      color = "text-emerald-400";
      bgColor = "bg-emerald-500";
    }
    
    this.healthStatusDisplay.textContent = status;
    this.healthStatusDisplay.className = `bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 font-medium ${color}`;
    this.healthStatusIndicator.className = `h-full rounded-lg ${bgColor} flex items-center justify-center`;
    this.healthStatusIndicator.innerHTML = `<span class="text-black font-bold">${percentage}%</span>`;
  }

  async submitForm() {
    const formData = new FormData(this.form);
    const data = Object.fromEntries(formData.entries());
    
    // Convert numeric fields
    data.usage_hours = parseInt(data.usage_hours) || 0;
    data.maintenance_limit = parseInt(data.maintenance_limit) || 5000;
    
    // Validate
    if (!data.name || !data.code || !data.type) {
      this.showToast('Please fill all required fields', 'error');
      return;
    }
    
    if (data.usage_hours < 0) {
      this.showToast('Usage hours cannot be negative', 'error');
      return;
    }
    
    if (data.maintenance_limit <= 0) {
      this.showToast('Maintenance limit must be greater than 0', 'error');
      return;
    }
    
    try {
      // Show loading state
      const submitBtn = this.form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
      submitBtn.disabled = true;
      
      const response = await fetch('http://127.0.0.1:5000/api/equipment', {
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
        this.showToast(
          'Equipment added successfully!',
          'success',
          `${data.name} has been added to the fleet.`
        );
        
        // Close modal
        this.closeModal();
        
        // Refresh equipment list
        if (window.loadEquipment) {
          window.loadEquipment();
        }
        
        // If there's a last maintenance date, add a maintenance record
        const lastMaintenanceDate = document.getElementById('lastMaintenanceDate').value;
        if (lastMaintenanceDate && data.usage_hours > 0) {
          await this.addMaintenanceRecord(result.id, lastMaintenanceDate, data.usage_hours);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }
    } catch (error) {
      console.error('Error adding equipment:', error);
      this.showToast(
        `Failed to add equipment: ${error.message}`,
        'error'
      );
    } finally {
      // Reset button state
      const submitBtn = this.form.querySelector('button[type="submit"]');
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }

  async addMaintenanceRecord(equipmentId, date, usage) {
    try {
      const maintenanceData = {
        equipment_id: equipmentId,
        service_date: date,
        maintenance_type: 'Initial Service',
        technician: 'System',
        description: 'Initial equipment setup and inspection',
        usage_at_service: usage
      };
      
      await fetch('http://127.0.0.1:5000/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(maintenanceData)
      });
      
      console.log('Maintenance record added for new equipment');
    } catch (error) {
      console.warn('Could not add maintenance record:', error);
    }
  }

  showToast(message, type = 'info', submessage = '') {
    // Configure toast based on type
    let bgColor, icon;
    switch(type) {
      case 'success':
        bgColor = 'bg-emerald-900/90 border-emerald-700 text-emerald-100';
        icon = 'fa-check-circle';
        break;
      case 'error':
        bgColor = 'bg-red-900/90 border-red-700 text-red-100';
        icon = 'fa-exclamation-circle';
        break;
      default:
        bgColor = 'bg-slate-800/90 border-slate-700 text-slate-100';
        icon = 'fa-info-circle';
    }
    
    // Update toast content
    this.toast.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 border ${bgColor} flex items-center gap-3`;
    document.getElementById('toastIcon').className = `fas ${icon} text-xl`;
    document.getElementById('toastMessage').textContent = message;
    document.getElementById('toastSubmessage').textContent = submessage;
    
    // Show toast
    this.toast.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.toast.classList.add('hidden');
    }, 5000);
  }
}

// Initialize modal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new EquipmentModal();
});