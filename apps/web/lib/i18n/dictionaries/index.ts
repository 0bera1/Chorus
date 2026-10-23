import { en } from './en';
import { es } from './es';
import { hi } from './hi';
import { tr, type Dictionary } from './tr';
import { zh } from './zh';
import type { Locale } from '../locales';

export type { Dictionary } from './tr';

export const dictionaries: Record<Locale, Dictionary> = { tr, en, zh, hi, es };
