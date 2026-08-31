export const STANDARD_PROCESS_OPTIONS = [
  'EXT',
  'COT',
  'CUT',
  'MIX',
  'ReW'
] as const;

export const STANDARD_PROCESS_DESCRIPTIONS: Record<string, { th: string; en: string }> = {
  EXT: { th: 'Extrusion (งานรีดขึ้นรูป)', en: 'Extrusion Process' },
  COT: { th: 'Coating (งานเคลือบผิว/ฟลักซ์)', en: 'Coating Process' },
  CUT: { th: 'Cutting (งานตัด/มิติความยาว)', en: 'Cutting Process' },
  MIX: { th: 'Mixing (งานผสมสารเคลือบ)', en: 'Mixing Process' },
  ReW: { th: 'Rewinding (การม้วนคอยล์ใหม่)', en: 'Rewinding Process' }
};

export const STANDARD_MACHINE_OPTIONS = [
  'P57',
  'P58',
  'CM55A',
  'CM55B',
  'SC51',
  'SC52',
  'SC53',
  'SC54',
  'SC55',
  'SC56',
  'SC57',
  'SC58',
  'SC59'
] as const;

export type StandardProcess = typeof STANDARD_PROCESS_OPTIONS[number];
export type StandardMachine = typeof STANDARD_MACHINE_OPTIONS[number];
