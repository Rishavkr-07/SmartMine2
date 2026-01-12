document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('equipment-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const cancelBtn = document.getElementById('cancel-btn');
  const addEquipmentBtn = document.getElementById('add-equipment-btn');
  const equipmentForm = document.getElementById('equipment-form');
  const modalTitle = document.getElementById('modal-title');
  let currentEditId = null;

  if (addEquipmentBtn) {
    addEquipmentBtn.addEventListener('click', () => {
      currentEditId = null;
      modalTitle.textContent = 'Add Equipment';
      equipmentForm.reset();
      equipmentForm.querySelector('[name="maintenance_limit"]').value = 5000;
      openModal();
    });
  }

  window.openEditModal = function(equipment) {
    currentEditId = equipment.id;
    modalTitle.textContent = 'Edit Equipment';
    equipmentForm.code.value = equipment.code;
    equipmentForm.name.value = equipment.name;
    equipmentForm.type.value = equipment.type;
    equipmentForm.usage_hours.value = equipment.usage_hours;
    equipmentForm.maintenance_limit.value = equipment.maintenance_limit;
    openModal();
  };

  function closeModal() {
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    currentEditId = null;
  }

  function openModal() {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  if (equipmentForm) {
    equipmentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(equipmentForm);
      const data = Object.fromEntries(formData.entries());
      data.usage_hours = parseInt(data.usage_hours);
      data.maintenance_limit = parseInt(data.maintenance_limit);
      
      if (data.usage_hours < 0) {
        alert('Usage hours cannot be negative'); return;
      }
      if (data.maintenance_limit <= 0) {
        alert('Maintenance limit must be greater than 0'); return;
      }
      
      try {
        const url = currentEditId 
          ? `http://127.0.0.1:5000/api/equipment/${currentEditId}`
          : 'http://127.0.0.1:5000/api/equipment';
        const response = await fetch(url, {
          method: currentEditId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          closeModal();
          if (window.loadEquipment) window.loadEquipment();
          if (typeof showNotification === 'function') {
            showNotification(
              currentEditId ? 'Equipment updated successfully' : 'Equipment added successfully',
              'success'
            );
          } else {
            alert(currentEditId ? 'Equipment updated successfully' : 'Equipment added successfully');
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save equipment');
        }
      } catch (error) {
        console.error('Error:', error);
        alert(`Failed to save equipment: ${error.message}`);
      }
    });
  }
});