import { useState } from 'react';

/**
 * Manages a Set<string> with a toggle helper.
 * Used for expand/collapse UI in PositionTable and LotTable.
 */
export function useToggleSet() {
  const [set, setSet] = useState(new Set<string>());

  function toggle(key: string) {
    setSet((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  return { set, toggle, setSet };
}
