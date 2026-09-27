/* Page handles and checks used by more than one module. */
import { MQ_REDUCE, MQ_FINE } from '../config.js';

export const doc = document, root = doc.documentElement;
export const header = doc.getElementById('nav'), main = doc.getElementById('main'), footer = doc.querySelector('footer');
const mqReduce = window.matchMedia(MQ_REDUCE);
export function reduce(){ return mqReduce.matches; }
export const finePtr = window.matchMedia(MQ_FINE);
export function cssVar(n){ return getComputedStyle(root).getPropertyValue(n).trim(); }
