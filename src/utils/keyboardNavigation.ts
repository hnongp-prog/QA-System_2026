import { useEffect } from 'react';

/**
 * Checks if an element is an interactive input or select that should advance on Enter.
 */
function isFocusableInput(el: Element | null): el is HTMLInputElement | HTMLSelectElement {
  if (!el || !(el instanceof HTMLElement)) return false;

  // Disabled or readonly fields should not be navigated to/from
  if ((el as HTMLInputElement).disabled || (el as HTMLInputElement).readOnly) return false;

  const tag = el.tagName.toLowerCase();

  if (tag === 'input') {
    const inputType = ((el as HTMLInputElement).type || 'text').toLowerCase();
    // Exclude button types, submit, reset, file, image, hidden
    if (['hidden', 'button', 'submit', 'reset', 'file', 'image'].includes(inputType)) {
      return false;
    }
    // Check if explicitly opted out
    if (el.dataset.noEnterAdvance === 'true') {
      return false;
    }
    return isElementVisible(el);
  }

  if (tag === 'select') {
    if (el.dataset.noEnterAdvance === 'true') {
      return false;
    }
    return isElementVisible(el);
  }

  // Textareas are intentionally omitted to allow natural multi-line editing with Enter.
  return false;
}

/**
 * Robust visibility check for DOM elements.
 */
function isElementVisible(el: HTMLElement): boolean {
  if (el.getAttribute('aria-hidden') === 'true') return false;
  if (el.tabIndex < 0 && el.getAttribute('tabindex') === '-1') return false;

  // If offsetParent is null, it's typically hidden unless position is fixed
  if (el.offsetParent === null) {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (style.position !== 'fixed') return false;
  }

  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/**
 * Global Enter key handler that advances focus to the next field across all sub-apps.
 * Supports Shift+Enter to move to the previous field.
 */
export function handleGlobalEnterKey(e: KeyboardEvent) {
  // Only handle Enter (both Standard Enter and Numpad Enter)
  if (e.key !== 'Enter') return;

  // Do not intercept if user is composing text in IME (e.g. Thai, Japanese, Chinese)
  if (e.isComposing) return;

  // Do not intercept if modifier keys like Ctrl, Alt, Meta are pressed (allows system shortcuts)
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  const currentEl = e.target as HTMLElement | null;
  if (!currentEl || !isFocusableInput(currentEl)) return;

  // If inside an open modal or dialog, confine navigation within that modal container
  const modalContainer = currentEl.closest<HTMLElement>(
    '[role="dialog"], [data-modal="true"], .modal-container, .fixed.inset-0'
  );
  const container: HTMLElement = modalContainer || document.body;

  // Select all candidate input & select fields in this container
  const candidates = Array.from(
    container.querySelectorAll<HTMLElement>(
      'input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="file"]):not([disabled]):not([readonly]), select:not([disabled]):not([readonly])'
    )
  );

  // Filter only truly visible elements
  const focusableFields = candidates.filter(isElementVisible);

  const currentIndex = focusableFields.indexOf(currentEl);
  if (currentIndex === -1) return;

  const isShift = e.shiftKey;
  const targetIndex = isShift ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex >= 0 && targetIndex < focusableFields.length) {
    e.preventDefault();
    e.stopPropagation();

    const targetEl = focusableFields[targetIndex];
    targetEl.focus();

    // Auto-select text inside input for quick overwriting / inspection
    if (targetEl instanceof HTMLInputElement && typeof targetEl.select === 'function') {
      try {
        const type = (targetEl.type || 'text').toLowerCase();
        if (!['date', 'time', 'datetime-local', 'month', 'week', 'color', 'checkbox', 'radio'].includes(type)) {
          targetEl.select();
        }
      } catch {
        // Safe fallback
      }
    }

    try {
      targetEl.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    } catch {
      // Safe fallback
    }
    return;
  }

  // If at the last field in the current table/container and pressing Enter (not Shift)
  if (!isShift && targetIndex >= focusableFields.length) {
    // Check if there is an "Add Row" button within the closest table, card, or section
    const tableSection = currentEl.closest<HTMLElement>('table, .overflow-x-auto, [data-entry-table="true"]');
    if (tableSection) {
      const parentContainer = tableSection.closest<HTMLElement>(
        '.rounded-2xl, .rounded-3xl, .rounded-xl, section, [data-section], form'
      ) || tableSection.parentElement;

      let addRowBtn: HTMLButtonElement | null = parentContainer?.querySelector<HTMLButtonElement>(
        'button[data-add-row="true"], button[data-action="add-row"]'
      ) || null;

      if (!addRowBtn && parentContainer) {
        const buttons = Array.from(parentContainer.querySelectorAll<HTMLButtonElement>('button'));
        addRowBtn = buttons.find(b => {
          if (b.disabled || b.offsetParent === null) return false;
          const text = (b.textContent || '').trim().toLowerCase();
          return (
            text.includes('+ เพิ่มรายการ') ||
            text.includes('+ เพิ่มแถว') ||
            text.includes('เพิ่มแถวตรวจ') ||
            text.includes('add row') ||
            text.includes('+ 1 แถว') ||
            text.includes('+1 แถว')
          );
        }) || null;
      }

      if (addRowBtn && !addRowBtn.disabled) {
        e.preventDefault();
        e.stopPropagation();
        addRowBtn.click();
        setTimeout(() => {
          const updatedCandidates = Array.from(
            container.querySelectorAll<HTMLElement>(
              'input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="file"]):not([disabled]):not([readonly]), select:not([disabled]):not([readonly])'
            )
          ).filter(isElementVisible);
          if (updatedCandidates[currentIndex + 1]) {
            const nextEl = updatedCandidates[currentIndex + 1];
            nextEl.focus();
            if (nextEl instanceof HTMLInputElement && typeof nextEl.select === 'function') {
              try {
                nextEl.select();
              } catch {
                // Ignore
              }
            }
          }
        }, 70);
      }
    }
  }
}

/**
 * React hook to attach the global Enter-to-next-field listener.
 * Mount this once at the root App component to make Enter navigation work in all sub-apps.
 */
export function useGlobalEnterToNextField() {
  useEffect(() => {
    // Use capture: true so that Enter navigation takes precedence over default behavior
    window.addEventListener('keydown', handleGlobalEnterKey, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalEnterKey, true);
    };
  }, []);
}
