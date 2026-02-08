document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('checklistForm');
  if (!form) return;

  // Prefer childId from dataset (set in EJS), fallback to URL
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const childId = form.dataset.childId || pathParts[pathParts.length - 1];

  const container = document.getElementById('checklist');
  const addBtn = document.getElementById('addItem');
  const saveBtn = document.getElementById('saveBtn');

  // Utility: create a checklist item DOM node
  function createItemNode(item = {}) {
    const id = item.id || `new-${Math.random().toString(36).slice(2,9)}`;
    const div = document.createElement('div');
    div.className = 'checklist-item';
    div.dataset.id = id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'item-checked';
    checkbox.checked = !!item.checked;
    checkbox.setAttribute('aria-label', 'Mark item complete');

    const text = document.createElement('input');
    text.type = 'text';
    text.className = 'item-text';
    text.value = item.text || '';
    text.placeholder = 'Checklist item';

    const detailsBtn = document.createElement('button');
    detailsBtn.type = 'button';
    detailsBtn.className = 'item-details';
    detailsBtn.textContent = 'Details';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-item';
    removeBtn.textContent = 'Remove';

    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    dragHandle.textContent = '⋮⋮';
    dragHandle.title = 'Drag to reorder';

    // details area
    const detailsArea = document.createElement('textarea');
    detailsArea.className = 'item-details-area';
    detailsArea.value = item.details || '';
    detailsArea.style.display = 'none';
    detailsArea.placeholder = 'Optional details or notes';

    detailsBtn.addEventListener('click', () => {
      detailsArea.style.display = detailsArea.style.display === 'none' ? 'block' : 'none';
      detailsArea.focus();
    });

    removeBtn.addEventListener('click', () => {
      div.remove();
    });

    div.appendChild(dragHandle);
    div.appendChild(checkbox);
    div.appendChild(text);
    div.appendChild(detailsBtn);
    div.appendChild(removeBtn);
    div.appendChild(detailsArea);

    return div;
  }

  // Initialize existing items (if server-rendered)
  Array.from(container.querySelectorAll('.checklist-item')).forEach(node => {
    const removeBtn = node.querySelector('.remove-item');
    if (removeBtn) removeBtn.addEventListener('click', () => node.remove());

    const detailsBtn = node.querySelector('.item-details');
    const detailsArea = node.querySelector('.item-details-area');
    if (detailsBtn && detailsArea) {
      detailsBtn.addEventListener('click', () => {
        detailsArea.style.display = detailsArea.style.display === 'none' ? 'block' : 'none';
        detailsArea.focus();
      });
    }
  });

  // Add new item
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const node = createItemNode({ text: '' });
      container.appendChild(node);
      node.querySelector('.item-text').focus();
      enableDragForItems(); // make new item draggable immediately
    });
  }

  // Drag-and-drop reordering
  let dragSrc = null;
  container.addEventListener('dragstart', (e) => {
    const item = e.target.closest('.checklist-item');
    if (!item) return;
    dragSrc = item;
    e.dataTransfer.effectAllowed = 'move';
  });

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    const over = e.target.closest('.checklist-item');
    if (!over || !dragSrc || over === dragSrc) return;
    const rect = over.getBoundingClientRect();
    const after = (e.clientY - rect.top) > (rect.height / 2);
    if (after) over.parentNode.insertBefore(dragSrc, over.nextSibling);
    else over.parentNode.insertBefore(dragSrc, over);
  });

  // Make items draggable
  function enableDragForItems() {
    Array.from(container.querySelectorAll('.checklist-item')).forEach(item => {
      item.setAttribute('draggable', 'true');
    });
  }
  enableDragForItems();

  // Save handler
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      const items = Array.from(container.querySelectorAll('.checklist-item')).map((el, idx) => {
        const id = el.dataset.id;
        const textEl = el.querySelector('.item-text');
        const detailsEl = el.querySelector('.item-details-area');
        const checkedEl = el.querySelector('.item-checked');
        return {
          id: id,
          text: textEl ? textEl.value.trim() : '',
          details: detailsEl ? detailsEl.value.trim() : '',
          checked: checkedEl ? !!checkedEl.checked : false,
          order: idx + 1
        };
      });

      const hasContent = items.some(i => i.text && i.text.length > 0);
      if (!hasContent) {
        alert('Please add at least one checklist item before saving.');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
        return;
      }

      try {
        const res = await fetch(`/dashboard/academics/${childId}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: items, note: 'Saved from UI' })
        });
        const json = await res.json();
        if (json.ok) {
          if (Array.isArray(json.checklist)) {
            json.checklist.forEach((serverItem, i) => {
              const local = container.children[i];
              if (local && serverItem.id) local.dataset.id = serverItem.id;
            });
          }
          alert('Checklist saved');
        } else {
          console.error('Save failed', json);
          alert('Save failed: ' + (json.error || 'unknown error'));
        }
      } catch (err) {
        console.error('Save error', err);
        alert('Save error: ' + err.message);
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
        enableDragForItems();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' &&
        e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      if (saveBtn) saveBtn.click();
    }
  });
});
