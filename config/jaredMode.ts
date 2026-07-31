export interface JaredModeStore {
  id: string;
  name: string;
  address: string;
}

export const JARED_MODE_STORES: JaredModeStore[] = [
  {
    id: 'target-29th-2nd',
    name: 'Target',
    address: '29th Street & 2nd Avenue, Manhattan',
  },
  {
    id: 'lidl-512-2nd',
    name: 'Lidl',
    address: '512 2nd Avenue, Manhattan',
  },
];

export function formatJaredModeStoresForPrompt(stores: JaredModeStore[] = JARED_MODE_STORES) {
  const lines = stores.map((store) => `- ${store.name} (${store.address})`);
  return `\n\nJared mode is enabled. The user often shops at these grocery stores:\n${lines.join('\n')}\nWhen they mention store brands or packaged groceries, assume typical US supermarket portions and label nutrition when possible.`;
}
