import { COLOR_MODES } from '../src/colorVision/colorModes.js';
import { icon } from './icons.js';

export const colorVisionControl = () => `<label class="sr-only" for="uaw-color-mode">Color vision assistance</label><select id="uaw-color-mode" class="full-select" data-setting="colorVisionMode">${COLOR_MODES.map(mode => `<option value="${mode.id}">${mode.name}</option>`).join('')}</select><p class="color-current" role="status">Selected: <strong data-color-current>Normal / Default</strong></p><button class="color-reset" type="button" data-action="reset-color">${icon('reset')}Reset to Default</button>`;
