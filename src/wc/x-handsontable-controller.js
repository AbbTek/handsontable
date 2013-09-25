function parseDatacolumn(DATACOLUMN) {
  var obj = {};

  for (var i = 0, ilen = DATACOLUMN.attributes.length; i < ilen; i++) {
    obj[DATACOLUMN.attributes[i].name] = DATACOLUMN.attributes[i].value || true;
  }

  obj.data = obj.value;
  delete obj.value;

  obj.readOnly = obj.readonly;
  delete obj.readonly;

  obj.strict = readBool(obj.strict);

  obj.checkedTemplate = obj.checkedtemplate;
  delete obj.checkedtemplate;

  obj.uncheckedTemplate = obj.uncheckedtemplate;
  delete obj.uncheckedtemplate;

  if (obj.type === 'autocomplete' && typeof obj.source === 'string') {
    obj.source = window[obj.source];
  }

  var HANDSONTABLE = DATACOLUMN.getElementsByTagName('x-handsontable');
  if (HANDSONTABLE.length) {
    obj.handsontable = parseHandsontable(HANDSONTABLE[0]);
  }

  return obj;
}

function getModel(HANDSONTABLE) {
  if (HANDSONTABLE.templateInstance) {
    return HANDSONTABLE.templateInstance.model;
  }
  else {
    return window;
  }
}

function getModelPath(HANDSONTABLE, path) {
  var obj = getModel(HANDSONTABLE);
  var keys = path.split('.');
  var len = keys.length;
  for (var i = 0; i < len; i++) {
    if (obj[keys[i]]) {
      obj = obj[keys[i]];
    }
  }
  return obj;
}

function parseDatacolumns(HANDSONTABLE) {
  var columns = []
    , i
    , ilen;

  for (i = 0, ilen = HANDSONTABLE.childNodes.length; i < ilen; i++) {
    if (HANDSONTABLE.childNodes[i].nodeName === 'DATACOLUMN') {
      columns.push(parseDatacolumn(HANDSONTABLE.childNodes[i]));
    }
  }

  return columns;
}

function parseHandsontable(HANDSONTABLE) {
  var i;
  var columns = parseDatacolumns(HANDSONTABLE);

  for (i = 0, ilen = HANDSONTABLE.childNodes.length; i < ilen; i++) {
    if (HANDSONTABLE.childNodes[i].nodeName === 'DATACOLUMN') {
      var observer = new MutationObserver(function (mutations) {
        var settingsChanged = false;

        mutations.forEach(function (mutation) {
          if (mutation.type === 'attributes') {
            settingsChanged = true;
          }
        });

        if (settingsChanged) {
          HANDSONTABLE.updateSettings({columns: parseDatacolumns(HANDSONTABLE)});
        }
      });

      // configuration of the observer:
      var config = { attributes: true, childList: true, characterData: true };

      // pass in the target node, as well as the observer options
      observer.observe(HANDSONTABLE.childNodes[i], config);
    }
  }

  var options = {
  };

  if (columns.length) {
    options.columns = columns;
  }

  function hasTitle(column) {
    return column.title !== void 0;
  }

  if (columns.filter(hasTitle).length && options.colHeaders !== false) {
    options.colHeaders = true;
  }

  if (HANDSONTABLE.settings) {
    var settings = getModelPath(HANDSONTABLE, HANDSONTABLE.settings);
    for (i in settings) {
      if (settings.hasOwnProperty(i)) {
        options[i] = settings[i];
      }
    }
  }

  return options;
}

var publicMethods = ['updateSettings', 'loadData', 'render', 'setDataAtCell', 'setDataAtRowProp', 'getDataAtCell', 'getDataAtRowProp', 'countRows', 'countCols', 'rowOffset', 'colOffset', 'countVisibleRows', 'countVisibleCols', 'clear', 'clearUndo', 'getData', 'alter', 'getCell', 'getCellMeta', 'selectCell', 'deselectCell', 'getSelected', 'destroyEditor', 'getRowHeader', 'getColHeader', 'destroy', 'isUndoAvailable', 'isRedoAvailable', 'undo', 'redo', 'countEmptyRows', 'countEmptyCols', 'isEmptyRow', 'isEmptyCol', 'parseSettingsFromDOM', 'addHook', 'addHookOnce', 'getValue', 'getInstance', 'getSettings'];
var publicProperties = Object.keys(Handsontable.DefaultSettings.prototype);

var publish = {
};

publicMethods.forEach(function (hot_method) {
  publish[hot_method] = function () {
    return this.instance[hot_method].apply(this.instance, arguments);
  }
});

publicProperties.forEach(function (hot_prop) {
  if (!publish[hot_prop]) {
    var wc_prop = hot_prop;

    if (hot_prop === 'data') {
      wc_prop = 'datarows';
    }

    if (Handsontable.DefaultSettings.prototype[hot_prop] === void 0) {
      publish[wc_prop] = null; //Polymer does not like undefined
    }
    else if (hot_prop === 'observeChanges') {
      publish[wc_prop] = true; //on by default
    }
    else {
      publish[wc_prop] = Handsontable.DefaultSettings.prototype[hot_prop];
    }

    publish[wc_prop + 'Changed'] = function () {
      var update = {};
      if (wc_prop === 'datarows') {
        update[hot_prop] = getModelPath(this, this[wc_prop])
      }
      else if (typeof Handsontable.DefaultSettings.prototype[hot_prop] === 'boolean') {
        update[hot_prop] = readBool(this[wc_prop]);
      }
      else {
        update[hot_prop] = this[wc_prop];
      }
      this.updateSettings(update);
    }
  }
});

function readBool(val) {
  if (val === void 0 || val === "false") {
    return false;
  }
  return val;
}

Polymer('x-handsontable', {
  instance: null,
  ready: function () {
    this.shadowRoot.applyAuthorStyles = true; //only way I know to let override Shadow DOM styles (just define ".handsontable td" in page stylesheet)
    jQuery(this.$.htContainer).handsontable(parseHandsontable(this));
    this.instance = jQuery(this.$.htContainer).data('handsontable');
  },
  enteredDocument: function () {
    this.render();
  },
  publish: publish
});