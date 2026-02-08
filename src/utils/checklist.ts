import { v4 as uuidv4 } from 'uuid';

export function calculateAgeFromDOB(dob: string | Date): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function createEditableFromTemplate(template: any[]) {
  return template.map((it: any, idx: number) => ({
    id: it.id ?? `item-${idx + 1}-${uuidv4().slice(0,6)}`,
    text: it.text,
    category: it.category ?? 'General',
    details: it.details ?? '',
    checked: it.checked ?? false,
    order: it.order ?? idx + 1
  }));
}
