/**
 * Created by glenn on 18/11/15.
 */

window.MAPS_DEBUG_ENABLED = false;

const mapsDebugger = {
  time(label) {

    if (window.MAPS_DEBUG_ENABLED) {
      console.time(label);
    }
  },

  timeEnd(label) {

    if (window.MAPS_DEBUG_ENABLED) {
      console.timeEnd(label);
    }
  },
};

window.easterEgg = function easterEgg() {
  console.log('٩(̾●̮̮̃̾•̃̾)۶٩(̾●̮̮̃̾•̃̾)۶٩(̾●̮̮̃̾•̃̾)۶٩(̾●̮̮̃̾•̃̾)۶٩(̾●̮̮̃̾•̃̾)۶٩(̾●̮̮̃̾•̃̾)۶');
};

export { mapsDebugger as default, mapsDebugger };
