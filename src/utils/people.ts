export interface PersonNameData {
  displayName?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
}

export function resolveDisplayName(data: PersonNameData): string {
  if (data.displayName) return data.displayName;
  return [data.title, data.firstName, data.lastName].filter(Boolean).join(' ');
}

export function getInitial(data: PersonNameData): string {
  if (data.firstName) return data.firstName.charAt(0).toUpperCase();
  return resolveDisplayName(data).charAt(0).toUpperCase();
}
