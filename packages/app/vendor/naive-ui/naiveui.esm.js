// ../node_modules/@css-render/plugin-bem/esm/index.js
function plugin(options) {
  let _bPrefix = ".";
  let _ePrefix = "__";
  let _mPrefix = "--";
  let c4;
  if (options) {
    let t = options.blockPrefix;
    if (t) {
      _bPrefix = t;
    }
    t = options.elementPrefix;
    if (t) {
      _ePrefix = t;
    }
    t = options.modifierPrefix;
    if (t) {
      _mPrefix = t;
    }
  }
  const _plugin = {
    install(instance) {
      c4 = instance.c;
      const ctx2 = instance.context;
      ctx2.bem = {};
      ctx2.bem.b = null;
      ctx2.bem.els = null;
    }
  };
  function b(arg) {
    let memorizedB;
    let memorizedE;
    return {
      before(ctx2) {
        memorizedB = ctx2.bem.b;
        memorizedE = ctx2.bem.els;
        ctx2.bem.els = null;
      },
      after(ctx2) {
        ctx2.bem.b = memorizedB;
        ctx2.bem.els = memorizedE;
      },
      $({ context, props }) {
        arg = typeof arg === "string" ? arg : arg({ context, props });
        context.bem.b = arg;
        return `${(props === null || props === void 0 ? void 0 : props.bPrefix) || _bPrefix}${context.bem.b}`;
      }
    };
  }
  function e(arg) {
    let memorizedE;
    return {
      before(ctx2) {
        memorizedE = ctx2.bem.els;
      },
      after(ctx2) {
        ctx2.bem.els = memorizedE;
      },
      $({ context, props }) {
        arg = typeof arg === "string" ? arg : arg({ context, props });
        context.bem.els = arg.split(",").map((v) => v.trim());
        return context.bem.els.map((el) => `${(props === null || props === void 0 ? void 0 : props.bPrefix) || _bPrefix}${context.bem.b}${_ePrefix}${el}`).join(", ");
      }
    };
  }
  function m(arg) {
    return {
      $({ context, props }) {
        arg = typeof arg === "string" ? arg : arg({ context, props });
        const modifiers = arg.split(",").map((v) => v.trim());
        function elementToSelector(el) {
          return modifiers.map((modifier) => `&${(props === null || props === void 0 ? void 0 : props.bPrefix) || _bPrefix}${context.bem.b}${el !== void 0 ? `${_ePrefix}${el}` : ""}${_mPrefix}${modifier}`).join(", ");
        }
        const els = context.bem.els;
        if (els !== null) {
          if (els.length >= 2) {
            throw Error(`[css-render/plugin-bem]: m(${arg}) is invalid, using modifier inside multiple elements is not allowed`);
          }
          return elementToSelector(els[0]);
        } else {
          return elementToSelector();
        }
      }
    };
  }
  function notM(arg) {
    return {
      $({ context, props }) {
        arg = typeof arg === "string" ? arg : arg({ context, props });
        const els = context.bem.els;
        if (els !== null && els.length >= 2) {
          throw Error(`[css-render/plugin-bem]: notM(${arg}) is invalid, using modifier inside multiple elements is not allowed`);
        }
        return `&:not(${(props === null || props === void 0 ? void 0 : props.bPrefix) || _bPrefix}${context.bem.b}${els !== null && els.length > 0 ? `${_ePrefix}${els[0]}` : ""}${_mPrefix}${arg})`;
      }
    };
  }
  const cB2 = (...args) => c4(b(args[0]), args[1], args[2]);
  const cE2 = (...args) => c4(e(args[0]), args[1], args[2]);
  const cM2 = (...args) => c4(m(args[0]), args[1], args[2]);
  const cNotM2 = (...args) => c4(notM(args[0]), args[1], args[2]);
  Object.assign(_plugin, {
    cB: cB2,
    cE: cE2,
    cM: cM2,
    cNotM: cNotM2
  });
  return _plugin;
}

// ../node_modules/css-render/esm/parse.js
function ampCount(selector) {
  let cnt = 0;
  for (let i = 0; i < selector.length; ++i) {
    if (selector[i] === "&")
      ++cnt;
  }
  return cnt;
}
var separatorRegex = /\s*,(?![^(]*\))\s*/g;
var extraSpaceRegex = /\s+/g;
function resolveSelectorWithAmp(amp, selector) {
  const nextAmp = [];
  selector.split(separatorRegex).forEach((partialSelector) => {
    let round = ampCount(partialSelector);
    if (!round) {
      amp.forEach((partialAmp) => {
        nextAmp.push(
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          (partialAmp && partialAmp + " ") + partialSelector
        );
      });
      return;
    } else if (round === 1) {
      amp.forEach((partialAmp) => {
        nextAmp.push(partialSelector.replace("&", partialAmp));
      });
      return;
    }
    let partialNextAmp = [
      partialSelector
    ];
    while (round--) {
      const nextPartialNextAmp = [];
      partialNextAmp.forEach((selectorItr) => {
        amp.forEach((partialAmp) => {
          nextPartialNextAmp.push(selectorItr.replace("&", partialAmp));
        });
      });
      partialNextAmp = nextPartialNextAmp;
    }
    partialNextAmp.forEach((part) => nextAmp.push(part));
  });
  return nextAmp;
}
function resolveSelector(amp, selector) {
  const nextAmp = [];
  selector.split(separatorRegex).forEach((partialSelector) => {
    amp.forEach((partialAmp) => {
      nextAmp.push((partialAmp && partialAmp + " ") + partialSelector);
    });
  });
  return nextAmp;
}
function parseSelectorPath(selectorPaths) {
  let amp = [""];
  selectorPaths.forEach((selector) => {
    selector = selector && selector.trim();
    if (
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      !selector
    ) {
      return;
    }
    if (selector.includes("&")) {
      amp = resolveSelectorWithAmp(amp, selector);
    } else {
      amp = resolveSelector(amp, selector);
    }
  });
  return amp.join(", ").replace(extraSpaceRegex, " ");
}

// ../node_modules/css-render/esm/utils.js
function removeElement(el) {
  if (!el)
    return;
  const parentElement = el.parentElement;
  if (parentElement)
    parentElement.removeChild(el);
}
function queryElement(id, parent) {
  return (parent !== null && parent !== void 0 ? parent : document.head).querySelector(`style[cssr-id="${id}"]`);
}
function createElement(id) {
  const el = document.createElement("style");
  el.setAttribute("cssr-id", id);
  return el;
}
function isMediaOrSupports(selector) {
  if (!selector)
    return false;
  return /^\s*@(s|m)/.test(selector);
}

// ../node_modules/css-render/esm/render.js
var kebabRegex = /[A-Z]/g;
function kebabCase(pattern) {
  return pattern.replace(kebabRegex, (match2) => "-" + match2.toLowerCase());
}
function unwrapProperty(prop, indent = "  ") {
  if (typeof prop === "object" && prop !== null) {
    return " {\n" + Object.entries(prop).map((v) => {
      return indent + `  ${kebabCase(v[0])}: ${v[1]};`;
    }).join("\n") + "\n" + indent + "}";
  }
  return `: ${prop};`;
}
function unwrapProperties(props, instance, params) {
  if (typeof props === "function") {
    return props({
      context: instance.context,
      props: params
    });
  }
  return props;
}
function createStyle(selector, props, instance, params) {
  if (!props)
    return "";
  const unwrappedProps = unwrapProperties(props, instance, params);
  if (!unwrappedProps)
    return "";
  if (typeof unwrappedProps === "string") {
    return `${selector} {
${unwrappedProps}
}`;
  }
  const propertyNames = Object.keys(unwrappedProps);
  if (propertyNames.length === 0) {
    if (instance.config.keepEmptyBlock)
      return selector + " {\n}";
    return "";
  }
  const statements = selector ? [
    selector + " {"
  ] : [];
  propertyNames.forEach((propertyName) => {
    const property = unwrappedProps[propertyName];
    if (propertyName === "raw") {
      statements.push("\n" + property + "\n");
      return;
    }
    propertyName = kebabCase(propertyName);
    if (property !== null && property !== void 0) {
      statements.push(`  ${propertyName}${unwrapProperty(property)}`);
    }
  });
  if (selector) {
    statements.push("}");
  }
  return statements.join("\n");
}
function loopCNodeListWithCallback(children, options, callback) {
  if (!children)
    return;
  children.forEach((child) => {
    if (Array.isArray(child)) {
      loopCNodeListWithCallback(child, options, callback);
    } else if (typeof child === "function") {
      const grandChildren = child(options);
      if (Array.isArray(grandChildren)) {
        loopCNodeListWithCallback(grandChildren, options, callback);
      } else if (grandChildren) {
        callback(grandChildren);
      }
    } else if (child) {
      callback(child);
    }
  });
}
function traverseCNode(node, selectorPaths, styles2, instance, params) {
  const $ = node.$;
  let blockSelector = "";
  if (!$ || typeof $ === "string") {
    if (isMediaOrSupports($)) {
      blockSelector = $;
    } else {
      selectorPaths.push($);
    }
  } else if (typeof $ === "function") {
    const selector2 = $({
      context: instance.context,
      props: params
    });
    if (isMediaOrSupports(selector2)) {
      blockSelector = selector2;
    } else {
      selectorPaths.push(selector2);
    }
  } else {
    if ($.before)
      $.before(instance.context);
    if (!$.$ || typeof $.$ === "string") {
      if (isMediaOrSupports($.$)) {
        blockSelector = $.$;
      } else {
        selectorPaths.push($.$);
      }
    } else if ($.$) {
      const selector2 = $.$({
        context: instance.context,
        props: params
      });
      if (isMediaOrSupports(selector2)) {
        blockSelector = selector2;
      } else {
        selectorPaths.push(selector2);
      }
    }
  }
  const selector = parseSelectorPath(selectorPaths);
  const style2 = createStyle(selector, node.props, instance, params);
  if (blockSelector) {
    styles2.push(`${blockSelector} {`);
  } else if (style2.length) {
    styles2.push(style2);
  }
  if (node.children) {
    loopCNodeListWithCallback(node.children, {
      context: instance.context,
      props: params
    }, (childNode) => {
      if (typeof childNode === "string") {
        const style3 = createStyle(selector, { raw: childNode }, instance, params);
        styles2.push(style3);
      } else {
        traverseCNode(childNode, selectorPaths, styles2, instance, params);
      }
    });
  }
  selectorPaths.pop();
  if (blockSelector) {
    styles2.push("}");
  }
  if ($ && $.after)
    $.after(instance.context);
}
function render(node, instance, props) {
  const styles2 = [];
  traverseCNode(node, [], styles2, instance, props);
  return styles2.join("\n\n");
}

// ../node_modules/@emotion/hash/dist/hash.browser.esm.js
function murmur2(str) {
  var h40 = 0;
  var k, i = 0, len2 = str.length;
  for (; len2 >= 4; ++i, len2 -= 4) {
    k = str.charCodeAt(i) & 255 | (str.charCodeAt(++i) & 255) << 8 | (str.charCodeAt(++i) & 255) << 16 | (str.charCodeAt(++i) & 255) << 24;
    k = /* Math.imul(k, m): */
    (k & 65535) * 1540483477 + ((k >>> 16) * 59797 << 16);
    k ^= /* k >>> r: */
    k >>> 24;
    h40 = /* Math.imul(k, m): */
    (k & 65535) * 1540483477 + ((k >>> 16) * 59797 << 16) ^ /* Math.imul(h, m): */
    (h40 & 65535) * 1540483477 + ((h40 >>> 16) * 59797 << 16);
  }
  switch (len2) {
    case 3:
      h40 ^= (str.charCodeAt(i + 2) & 255) << 16;
    case 2:
      h40 ^= (str.charCodeAt(i + 1) & 255) << 8;
    case 1:
      h40 ^= str.charCodeAt(i) & 255;
      h40 = /* Math.imul(h, m): */
      (h40 & 65535) * 1540483477 + ((h40 >>> 16) * 59797 << 16);
  }
  h40 ^= h40 >>> 13;
  h40 = /* Math.imul(h, m): */
  (h40 & 65535) * 1540483477 + ((h40 >>> 16) * 59797 << 16);
  return ((h40 ^ h40 >>> 15) >>> 0).toString(36);
}
var hash_browser_esm_default = murmur2;

// ../node_modules/css-render/esm/mount.js
if (typeof window !== "undefined") {
  window.__cssrContext = {};
}
function unmount(instance, node, id, parent) {
  const { els } = node;
  if (id === void 0) {
    els.forEach(removeElement);
    node.els = [];
  } else {
    const target = queryElement(id, parent);
    if (target && els.includes(target)) {
      removeElement(target);
      node.els = els.filter((el) => el !== target);
    }
  }
}
function addElementToList(els, target) {
  els.push(target);
}
function mount(instance, node, id, props, head, force, anchorMetaName, parent, ssrAdapter2) {
  let style2;
  if (id === void 0) {
    style2 = node.render(props);
    id = hash_browser_esm_default(style2);
  }
  if (ssrAdapter2) {
    ssrAdapter2.adapter(id, style2 !== null && style2 !== void 0 ? style2 : node.render(props));
    return;
  }
  if (parent === void 0) {
    parent = document.head;
  }
  const queriedTarget = queryElement(id, parent);
  if (queriedTarget !== null && !force) {
    return queriedTarget;
  }
  const target = queriedTarget !== null && queriedTarget !== void 0 ? queriedTarget : createElement(id);
  if (style2 === void 0)
    style2 = node.render(props);
  target.textContent = style2;
  if (queriedTarget !== null)
    return queriedTarget;
  if (anchorMetaName) {
    const anchorMetaEl = parent.querySelector(`meta[name="${anchorMetaName}"]`);
    if (anchorMetaEl) {
      parent.insertBefore(target, anchorMetaEl);
      addElementToList(node.els, target);
      return target;
    }
  }
  if (head) {
    parent.insertBefore(target, parent.querySelector("style, link"));
  } else {
    parent.appendChild(target);
  }
  addElementToList(node.els, target);
  return target;
}

// ../node_modules/css-render/esm/c.js
function wrappedRender(props) {
  return render(this, this.instance, props);
}
function wrappedMount(options = {}) {
  const { id, ssr, props, head = false, force = false, anchorMetaName, parent } = options;
  const targetElement = mount(this.instance, this, id, props, head, force, anchorMetaName, parent, ssr);
  return targetElement;
}
function wrappedUnmount(options = {}) {
  const { id, parent } = options;
  unmount(this.instance, this, id, parent);
}
var createCNode = function(instance, $, props, children) {
  return {
    instance,
    $,
    props,
    children,
    els: [],
    render: wrappedRender,
    mount: wrappedMount,
    unmount: wrappedUnmount
  };
};
var c = function(instance, $, props, children) {
  if (Array.isArray($)) {
    return createCNode(instance, { $: null }, null, $);
  } else if (Array.isArray(props)) {
    return createCNode(instance, $, null, props);
  } else if (Array.isArray(children)) {
    return createCNode(instance, $, props, children);
  } else {
    return createCNode(instance, $, props, null);
  }
};

// ../node_modules/css-render/esm/CssRender.js
function CssRender(config = {}) {
  const cssr2 = {
    c: (...args) => c(cssr2, ...args),
    use: (plugin3, ...args) => plugin3.install(cssr2, ...args),
    find: queryElement,
    context: {},
    config
  };
  return cssr2;
}

// ../node_modules/css-render/esm/exists.js
function exists(id, ssr) {
  if (id === void 0)
    return false;
  if (ssr) {
    const { context: { ids } } = ssr;
    return ids.has(id);
  }
  return queryElement(id) !== null;
}

// ../node_modules/naive-ui/es/_utils/cssr/index.mjs
var namespace = "n";
var prefix = `.${namespace}-`;
var elementPrefix = "__";
var modifierPrefix = "--";
var cssr = CssRender();
var plugin2 = plugin({
  blockPrefix: prefix,
  elementPrefix,
  modifierPrefix
});
cssr.use(plugin2);
var {
  c: c2,
  find
} = cssr;
var {
  cB,
  cE,
  cM,
  cNotM
} = plugin2;
function createKey(prefix3, suffix2) {
  return prefix3 + (suffix2 === "default" ? "" : suffix2.replace(/^[a-z]/, (startChar) => startChar.toUpperCase()));
}

// ../node_modules/seemly/es/animation/next-frame-once.js
var onceCbs = [];
var paramsMap = /* @__PURE__ */ new WeakMap();
function flushOnceCallbacks() {
  onceCbs.forEach((cb) => cb(...paramsMap.get(cb)));
  onceCbs = [];
}
function beforeNextFrameOnce(cb, ...params) {
  paramsMap.set(cb, params);
  if (onceCbs.includes(cb))
    return;
  onceCbs.push(cb) === 1 && requestAnimationFrame(flushOnceCallbacks);
}

// ../node_modules/seemly/es/dom/happens-in.js
function happensIn(e, dataSetPropName) {
  let { target } = e;
  while (target) {
    if (target.dataset) {
      if (target.dataset[dataSetPropName] !== void 0)
        return true;
    }
    target = target.parentElement;
  }
  return false;
}

// ../node_modules/seemly/es/dom/get-precise-event-target.js
function getPreciseEventTarget(event) {
  return event.composedPath()[0] || null;
}

// ../node_modules/seemly/es/css/index.js
function depx(value) {
  if (typeof value === "string") {
    if (value.endsWith("px")) {
      return Number(value.slice(0, value.length - 2));
    }
    return Number(value);
  }
  return value;
}
function pxfy(value) {
  if (value === void 0 || value === null)
    return void 0;
  if (typeof value === "number")
    return `${value}px`;
  if (value.endsWith("px"))
    return value;
  return `${value}px`;
}
function getMargin(value, position) {
  const parts = value.trim().split(/\s+/g);
  const margin = {
    top: parts[0]
  };
  switch (parts.length) {
    case 1:
      margin.right = parts[0];
      margin.bottom = parts[0];
      margin.left = parts[0];
      break;
    case 2:
      margin.right = parts[1];
      margin.left = parts[1];
      margin.bottom = parts[0];
      break;
    case 3:
      margin.right = parts[1];
      margin.bottom = parts[2];
      margin.left = parts[1];
      break;
    case 4:
      margin.right = parts[1];
      margin.bottom = parts[2];
      margin.left = parts[3];
      break;
    default:
      throw new Error("[seemly/getMargin]:" + value + " is not a valid value.");
  }
  if (position === void 0)
    return margin;
  return margin[position];
}

// ../node_modules/seemly/es/color/colors.js
var colors_default = {
  aliceblue: "#F0F8FF",
  antiquewhite: "#FAEBD7",
  aqua: "#0FF",
  aquamarine: "#7FFFD4",
  azure: "#F0FFFF",
  beige: "#F5F5DC",
  bisque: "#FFE4C4",
  black: "#000",
  blanchedalmond: "#FFEBCD",
  blue: "#00F",
  blueviolet: "#8A2BE2",
  brown: "#A52A2A",
  burlywood: "#DEB887",
  cadetblue: "#5F9EA0",
  chartreuse: "#7FFF00",
  chocolate: "#D2691E",
  coral: "#FF7F50",
  cornflowerblue: "#6495ED",
  cornsilk: "#FFF8DC",
  crimson: "#DC143C",
  cyan: "#0FF",
  darkblue: "#00008B",
  darkcyan: "#008B8B",
  darkgoldenrod: "#B8860B",
  darkgray: "#A9A9A9",
  darkgrey: "#A9A9A9",
  darkgreen: "#006400",
  darkkhaki: "#BDB76B",
  darkmagenta: "#8B008B",
  darkolivegreen: "#556B2F",
  darkorange: "#FF8C00",
  darkorchid: "#9932CC",
  darkred: "#8B0000",
  darksalmon: "#E9967A",
  darkseagreen: "#8FBC8F",
  darkslateblue: "#483D8B",
  darkslategray: "#2F4F4F",
  darkslategrey: "#2F4F4F",
  darkturquoise: "#00CED1",
  darkviolet: "#9400D3",
  deeppink: "#FF1493",
  deepskyblue: "#00BFFF",
  dimgray: "#696969",
  dimgrey: "#696969",
  dodgerblue: "#1E90FF",
  firebrick: "#B22222",
  floralwhite: "#FFFAF0",
  forestgreen: "#228B22",
  fuchsia: "#F0F",
  gainsboro: "#DCDCDC",
  ghostwhite: "#F8F8FF",
  gold: "#FFD700",
  goldenrod: "#DAA520",
  gray: "#808080",
  grey: "#808080",
  green: "#008000",
  greenyellow: "#ADFF2F",
  honeydew: "#F0FFF0",
  hotpink: "#FF69B4",
  indianred: "#CD5C5C",
  indigo: "#4B0082",
  ivory: "#FFFFF0",
  khaki: "#F0E68C",
  lavender: "#E6E6FA",
  lavenderblush: "#FFF0F5",
  lawngreen: "#7CFC00",
  lemonchiffon: "#FFFACD",
  lightblue: "#ADD8E6",
  lightcoral: "#F08080",
  lightcyan: "#E0FFFF",
  lightgoldenrodyellow: "#FAFAD2",
  lightgray: "#D3D3D3",
  lightgrey: "#D3D3D3",
  lightgreen: "#90EE90",
  lightpink: "#FFB6C1",
  lightsalmon: "#FFA07A",
  lightseagreen: "#20B2AA",
  lightskyblue: "#87CEFA",
  lightslategray: "#778899",
  lightslategrey: "#778899",
  lightsteelblue: "#B0C4DE",
  lightyellow: "#FFFFE0",
  lime: "#0F0",
  limegreen: "#32CD32",
  linen: "#FAF0E6",
  magenta: "#F0F",
  maroon: "#800000",
  mediumaquamarine: "#66CDAA",
  mediumblue: "#0000CD",
  mediumorchid: "#BA55D3",
  mediumpurple: "#9370DB",
  mediumseagreen: "#3CB371",
  mediumslateblue: "#7B68EE",
  mediumspringgreen: "#00FA9A",
  mediumturquoise: "#48D1CC",
  mediumvioletred: "#C71585",
  midnightblue: "#191970",
  mintcream: "#F5FFFA",
  mistyrose: "#FFE4E1",
  moccasin: "#FFE4B5",
  navajowhite: "#FFDEAD",
  navy: "#000080",
  oldlace: "#FDF5E6",
  olive: "#808000",
  olivedrab: "#6B8E23",
  orange: "#FFA500",
  orangered: "#FF4500",
  orchid: "#DA70D6",
  palegoldenrod: "#EEE8AA",
  palegreen: "#98FB98",
  paleturquoise: "#AFEEEE",
  palevioletred: "#DB7093",
  papayawhip: "#FFEFD5",
  peachpuff: "#FFDAB9",
  peru: "#CD853F",
  pink: "#FFC0CB",
  plum: "#DDA0DD",
  powderblue: "#B0E0E6",
  purple: "#800080",
  rebeccapurple: "#663399",
  red: "#F00",
  rosybrown: "#BC8F8F",
  royalblue: "#4169E1",
  saddlebrown: "#8B4513",
  salmon: "#FA8072",
  sandybrown: "#F4A460",
  seagreen: "#2E8B57",
  seashell: "#FFF5EE",
  sienna: "#A0522D",
  silver: "#C0C0C0",
  skyblue: "#87CEEB",
  slateblue: "#6A5ACD",
  slategray: "#708090",
  slategrey: "#708090",
  snow: "#FFFAFA",
  springgreen: "#00FF7F",
  steelblue: "#4682B4",
  tan: "#D2B48C",
  teal: "#008080",
  thistle: "#D8BFD8",
  tomato: "#FF6347",
  turquoise: "#40E0D0",
  violet: "#EE82EE",
  wheat: "#F5DEB3",
  white: "#FFF",
  whitesmoke: "#F5F5F5",
  yellow: "#FF0",
  yellowgreen: "#9ACD32",
  transparent: "#0000"
};

// ../node_modules/seemly/es/color/convert.js
function hsv2rgb(h40, s, v) {
  s /= 100;
  v /= 100;
  let f = (n, k = (n + h40 / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [f(5) * 255, f(3) * 255, f(1) * 255];
}
function hsl2rgb(h40, s, l) {
  s /= 100;
  l /= 100;
  let a = s * Math.min(l, 1 - l);
  let f = (n, k = (n + h40 / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

// ../node_modules/seemly/es/color/index.js
var prefix2 = "^\\s*";
var suffix = "\\s*$";
var percent = "\\s*((\\.\\d+)|(\\d+(\\.\\d*)?))%\\s*";
var float = "\\s*((\\.\\d+)|(\\d+(\\.\\d*)?))\\s*";
var hex = "([0-9A-Fa-f])";
var dhex = "([0-9A-Fa-f]{2})";
var hslRegex = new RegExp(`${prefix2}hsl\\s*\\(${float},${percent},${percent}\\)${suffix}`);
var hsvRegex = new RegExp(`${prefix2}hsv\\s*\\(${float},${percent},${percent}\\)${suffix}`);
var hslaRegex = new RegExp(`${prefix2}hsla\\s*\\(${float},${percent},${percent},${float}\\)${suffix}`);
var hsvaRegex = new RegExp(`${prefix2}hsva\\s*\\(${float},${percent},${percent},${float}\\)${suffix}`);
var rgbRegex = new RegExp(`${prefix2}rgb\\s*\\(${float},${float},${float}\\)${suffix}`);
var rgbaRegex = new RegExp(`${prefix2}rgba\\s*\\(${float},${float},${float},${float}\\)${suffix}`);
var sHexRegex = new RegExp(`${prefix2}#${hex}${hex}${hex}${suffix}`);
var hexRegex = new RegExp(`${prefix2}#${dhex}${dhex}${dhex}${suffix}`);
var sHexaRegex = new RegExp(`${prefix2}#${hex}${hex}${hex}${hex}${suffix}`);
var hexaRegex = new RegExp(`${prefix2}#${dhex}${dhex}${dhex}${dhex}${suffix}`);
function parseHex(value) {
  return parseInt(value, 16);
}
function hsla(color) {
  try {
    let i;
    if (i = hslaRegex.exec(color)) {
      return [
        roundDeg(i[1]),
        roundPercent(i[5]),
        roundPercent(i[9]),
        roundAlpha(i[13])
      ];
    } else if (i = hslRegex.exec(color)) {
      return [roundDeg(i[1]), roundPercent(i[5]), roundPercent(i[9]), 1];
    }
    throw new Error(`[seemly/hsla]: Invalid color value ${color}.`);
  } catch (e) {
    throw e;
  }
}
function hsva(color) {
  try {
    let i;
    if (i = hsvaRegex.exec(color)) {
      return [
        roundDeg(i[1]),
        roundPercent(i[5]),
        roundPercent(i[9]),
        roundAlpha(i[13])
      ];
    } else if (i = hsvRegex.exec(color)) {
      return [roundDeg(i[1]), roundPercent(i[5]), roundPercent(i[9]), 1];
    }
    throw new Error(`[seemly/hsva]: Invalid color value ${color}.`);
  } catch (e) {
    throw e;
  }
}
function rgba(color) {
  try {
    let i;
    if (i = hexRegex.exec(color)) {
      return [parseHex(i[1]), parseHex(i[2]), parseHex(i[3]), 1];
    } else if (i = rgbRegex.exec(color)) {
      return [roundChannel(i[1]), roundChannel(i[5]), roundChannel(i[9]), 1];
    } else if (i = rgbaRegex.exec(color)) {
      return [
        roundChannel(i[1]),
        roundChannel(i[5]),
        roundChannel(i[9]),
        roundAlpha(i[13])
      ];
    } else if (i = sHexRegex.exec(color)) {
      return [
        parseHex(i[1] + i[1]),
        parseHex(i[2] + i[2]),
        parseHex(i[3] + i[3]),
        1
      ];
    } else if (i = hexaRegex.exec(color)) {
      return [
        parseHex(i[1]),
        parseHex(i[2]),
        parseHex(i[3]),
        roundAlpha(parseHex(i[4]) / 255)
      ];
    } else if (i = sHexaRegex.exec(color)) {
      return [
        parseHex(i[1] + i[1]),
        parseHex(i[2] + i[2]),
        parseHex(i[3] + i[3]),
        roundAlpha(parseHex(i[4] + i[4]) / 255)
      ];
    } else if (color in colors_default) {
      return rgba(colors_default[color]);
    } else if (hslRegex.test(color) || hslaRegex.test(color)) {
      const [h40, s, l, a] = hsla(color);
      return [...hsl2rgb(h40, s, l), a];
    } else if (hsvRegex.test(color) || hsvaRegex.test(color)) {
      const [h40, s, v, a] = hsva(color);
      return [...hsv2rgb(h40, s, v), a];
    }
    throw new Error(`[seemly/rgba]: Invalid color value ${color}.`);
  } catch (e) {
    throw e;
  }
}
function normalizeAlpha(alphaValue) {
  return alphaValue > 1 ? 1 : alphaValue < 0 ? 0 : alphaValue;
}
function stringifyRgba(r, g, b, a) {
  return `rgba(${roundChannel(r)}, ${roundChannel(g)}, ${roundChannel(b)}, ${normalizeAlpha(a)})`;
}
function compositeChannel(v1, a1, v2, a2, a) {
  return roundChannel((v1 * a1 * (1 - a2) + v2 * a2) / a);
}
function composite(background, overlay2) {
  if (!Array.isArray(background))
    background = rgba(background);
  if (!Array.isArray(overlay2))
    overlay2 = rgba(overlay2);
  const a1 = background[3];
  const a2 = overlay2[3];
  const alpha = roundAlpha(a1 + a2 - a1 * a2);
  return stringifyRgba(compositeChannel(background[0], a1, overlay2[0], a2, alpha), compositeChannel(background[1], a1, overlay2[1], a2, alpha), compositeChannel(background[2], a1, overlay2[2], a2, alpha), alpha);
}
function changeColor(base2, options) {
  const [r, g, b, a = 1] = Array.isArray(base2) ? base2 : rgba(base2);
  if (typeof options.alpha === "number") {
    return stringifyRgba(r, g, b, options.alpha);
  }
  return stringifyRgba(r, g, b, a);
}
function scaleColor(base2, options) {
  const [r, g, b, a = 1] = Array.isArray(base2) ? base2 : rgba(base2);
  const { lightness = 1, alpha = 1 } = options;
  return toRgbaString([r * lightness, g * lightness, b * lightness, a * alpha]);
}
function roundAlpha(value) {
  const v = Math.round(Number(value) * 100) / 100;
  if (v > 1)
    return 1;
  if (v < 0)
    return 0;
  return v;
}
function roundDeg(value) {
  const v = Math.round(Number(value));
  if (v >= 360)
    return 0;
  if (v < 0)
    return 0;
  return v;
}
function roundChannel(value) {
  const v = Math.round(Number(value));
  if (v > 255)
    return 255;
  if (v < 0)
    return 0;
  return v;
}
function roundPercent(value) {
  const v = Math.round(Number(value));
  if (v > 100)
    return 100;
  if (v < 0)
    return 0;
  return v;
}
function toRgbaString(base2) {
  const [r, g, b] = base2;
  if (3 in base2) {
    return `rgba(${roundChannel(r)}, ${roundChannel(g)}, ${roundChannel(b)}, ${roundAlpha(base2[3])})`;
  }
  return `rgba(${roundChannel(r)}, ${roundChannel(g)}, ${roundChannel(b)}, 1)`;
}

// ../node_modules/naive-ui/es/_mixins/use-config.mjs
import { computed as computed6, inject as inject7, shallowRef } from "vue";

// ../node_modules/evtd/es/utils.js
function getEventTarget(e) {
  const path = e.composedPath();
  return path[0];
}

// ../node_modules/evtd/es/traps.js
var traps = {
  mousemoveoutside: /* @__PURE__ */ new WeakMap(),
  clickoutside: /* @__PURE__ */ new WeakMap()
};
function createTrapHandler(name, el, originalHandler) {
  if (name === "mousemoveoutside") {
    const moveHandler = (e) => {
      if (el.contains(getEventTarget(e)))
        return;
      originalHandler(e);
    };
    return {
      mousemove: moveHandler,
      touchstart: moveHandler
    };
  } else if (name === "clickoutside") {
    let mouseDownOutside = false;
    const downHandler = (e) => {
      mouseDownOutside = !el.contains(getEventTarget(e));
    };
    const upHanlder = (e) => {
      if (!mouseDownOutside)
        return;
      if (el.contains(getEventTarget(e)))
        return;
      originalHandler(e);
    };
    return {
      mousedown: downHandler,
      mouseup: upHanlder,
      touchstart: downHandler,
      touchend: upHanlder
    };
  }
  console.error(
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    `[evtd/create-trap-handler]: name \`${name}\` is invalid. This could be a bug of evtd.`
  );
  return {};
}
function ensureTrapHandlers(name, el, handler) {
  const handlers = traps[name];
  let elHandlers = handlers.get(el);
  if (elHandlers === void 0) {
    handlers.set(el, elHandlers = /* @__PURE__ */ new WeakMap());
  }
  let trapHandler = elHandlers.get(handler);
  if (trapHandler === void 0) {
    elHandlers.set(handler, trapHandler = createTrapHandler(name, el, handler));
  }
  return trapHandler;
}
function trapOn(name, el, handler, options) {
  if (name === "mousemoveoutside" || name === "clickoutside") {
    const trapHandlers = ensureTrapHandlers(name, el, handler);
    Object.keys(trapHandlers).forEach((key) => {
      on(key, document, trapHandlers[key], options);
    });
    return true;
  }
  return false;
}
function trapOff(name, el, handler, options) {
  if (name === "mousemoveoutside" || name === "clickoutside") {
    const trapHandlers = ensureTrapHandlers(name, el, handler);
    Object.keys(trapHandlers).forEach((key) => {
      off(key, document, trapHandlers[key], options);
    });
    return true;
  }
  return false;
}

// ../node_modules/evtd/es/delegate.js
function createDelegate() {
  if (typeof window === "undefined") {
    return {
      on: () => {
      },
      off: () => {
      }
    };
  }
  const propagationStopped = /* @__PURE__ */ new WeakMap();
  const immediatePropagationStopped = /* @__PURE__ */ new WeakMap();
  function trackPropagation() {
    propagationStopped.set(this, true);
  }
  function trackImmediate() {
    propagationStopped.set(this, true);
    immediatePropagationStopped.set(this, true);
  }
  function spy(event, propName, fn) {
    const source = event[propName];
    event[propName] = function() {
      fn.apply(event, arguments);
      return source.apply(event, arguments);
    };
    return event;
  }
  function unspy(event, propName) {
    event[propName] = Event.prototype[propName];
  }
  const currentTargets = /* @__PURE__ */ new WeakMap();
  const currentTargetDescriptor = Object.getOwnPropertyDescriptor(Event.prototype, "currentTarget");
  function getCurrentTarget() {
    var _a;
    return (_a = currentTargets.get(this)) !== null && _a !== void 0 ? _a : null;
  }
  function defineCurrentTarget(event, getter) {
    if (currentTargetDescriptor === void 0)
      return;
    Object.defineProperty(event, "currentTarget", {
      configurable: true,
      enumerable: true,
      get: getter !== null && getter !== void 0 ? getter : currentTargetDescriptor.get
    });
  }
  const phaseToTypeToElToHandlers = {
    bubble: {},
    capture: {}
  };
  const typeToWindowEventHandlers = {};
  function createUnifiedHandler() {
    const delegeteHandler = function(e) {
      const { type, eventPhase, bubbles } = e;
      const target = getEventTarget(e);
      if (eventPhase === 2)
        return;
      const phase = eventPhase === 1 ? "capture" : "bubble";
      let cursor = target;
      const path = [];
      while (true) {
        if (cursor === null)
          cursor = window;
        path.push(cursor);
        if (cursor === window) {
          break;
        }
        cursor = cursor.parentNode || null;
      }
      const captureElToHandlers = phaseToTypeToElToHandlers.capture[type];
      const bubbleElToHandlers = phaseToTypeToElToHandlers.bubble[type];
      spy(e, "stopPropagation", trackPropagation);
      spy(e, "stopImmediatePropagation", trackImmediate);
      defineCurrentTarget(e, getCurrentTarget);
      if (phase === "capture") {
        if (captureElToHandlers === void 0)
          return;
        for (let i = path.length - 1; i >= 0; --i) {
          if (propagationStopped.has(e))
            break;
          const target2 = path[i];
          const handlers = captureElToHandlers.get(target2);
          if (handlers !== void 0) {
            currentTargets.set(e, target2);
            for (const handler of handlers) {
              if (immediatePropagationStopped.has(e))
                break;
              handler(e);
            }
          }
          if (i === 0 && !bubbles && bubbleElToHandlers !== void 0) {
            const bubbleHandlers = bubbleElToHandlers.get(target2);
            if (bubbleHandlers !== void 0) {
              for (const handler of bubbleHandlers) {
                if (immediatePropagationStopped.has(e))
                  break;
                handler(e);
              }
            }
          }
        }
      } else if (phase === "bubble") {
        if (bubbleElToHandlers === void 0)
          return;
        for (let i = 0; i < path.length; ++i) {
          if (propagationStopped.has(e))
            break;
          const target2 = path[i];
          const handlers = bubbleElToHandlers.get(target2);
          if (handlers !== void 0) {
            currentTargets.set(e, target2);
            for (const handler of handlers) {
              if (immediatePropagationStopped.has(e))
                break;
              handler(e);
            }
          }
        }
      }
      unspy(e, "stopPropagation");
      unspy(e, "stopImmediatePropagation");
      defineCurrentTarget(e);
    };
    delegeteHandler.displayName = "evtdUnifiedHandler";
    return delegeteHandler;
  }
  function createUnifiedWindowEventHandler() {
    const delegateHandler = function(e) {
      const { type, eventPhase } = e;
      if (eventPhase !== 2)
        return;
      const handlers = typeToWindowEventHandlers[type];
      if (handlers === void 0)
        return;
      handlers.forEach((handler) => handler(e));
    };
    delegateHandler.displayName = "evtdUnifiedWindowEventHandler";
    return delegateHandler;
  }
  const unifiedHandler = createUnifiedHandler();
  const unfiendWindowEventHandler = createUnifiedWindowEventHandler();
  function ensureElToHandlers(phase, type) {
    const phaseHandlers = phaseToTypeToElToHandlers[phase];
    if (phaseHandlers[type] === void 0) {
      phaseHandlers[type] = /* @__PURE__ */ new Map();
      window.addEventListener(type, unifiedHandler, phase === "capture");
    }
    return phaseHandlers[type];
  }
  function ensureWindowEventHandlers(type) {
    const windowEventHandlers = typeToWindowEventHandlers[type];
    if (windowEventHandlers === void 0) {
      typeToWindowEventHandlers[type] = /* @__PURE__ */ new Set();
      window.addEventListener(type, unfiendWindowEventHandler);
    }
    return typeToWindowEventHandlers[type];
  }
  function ensureHandlers(elToHandlers, el) {
    let elHandlers = elToHandlers.get(el);
    if (elHandlers === void 0) {
      elToHandlers.set(el, elHandlers = /* @__PURE__ */ new Set());
    }
    return elHandlers;
  }
  function handlerExist(el, phase, type, handler) {
    const elToHandlers = phaseToTypeToElToHandlers[phase][type];
    if (elToHandlers !== void 0) {
      const handlers = elToHandlers.get(el);
      if (handlers !== void 0) {
        if (handlers.has(handler))
          return true;
      }
    }
    return false;
  }
  function windowEventHandlerExist(type, handler) {
    const handlers = typeToWindowEventHandlers[type];
    if (handlers !== void 0) {
      if (handlers.has(handler)) {
        return true;
      }
    }
    return false;
  }
  function on2(type, el, handler, options) {
    let mergedHandler;
    if (typeof options === "object" && options.once === true) {
      mergedHandler = (e) => {
        off2(type, el, mergedHandler, options);
        handler(e);
      };
    } else {
      mergedHandler = handler;
    }
    const trapped = trapOn(type, el, mergedHandler, options);
    if (trapped)
      return;
    const phase = options === true || typeof options === "object" && options.capture === true ? "capture" : "bubble";
    const elToHandlers = ensureElToHandlers(phase, type);
    const handlers = ensureHandlers(elToHandlers, el);
    if (!handlers.has(mergedHandler))
      handlers.add(mergedHandler);
    if (el === window) {
      const windowEventHandlers = ensureWindowEventHandlers(type);
      if (!windowEventHandlers.has(mergedHandler)) {
        windowEventHandlers.add(mergedHandler);
      }
    }
  }
  function off2(type, el, handler, options) {
    const trapped = trapOff(type, el, handler, options);
    if (trapped)
      return;
    const capture = options === true || typeof options === "object" && options.capture === true;
    const phase = capture ? "capture" : "bubble";
    const elToHandlers = ensureElToHandlers(phase, type);
    const handlers = ensureHandlers(elToHandlers, el);
    if (el === window) {
      const mirrorPhase = capture ? "bubble" : "capture";
      if (!handlerExist(el, mirrorPhase, type, handler) && windowEventHandlerExist(type, handler)) {
        const windowEventHandlers = typeToWindowEventHandlers[type];
        windowEventHandlers.delete(handler);
        if (windowEventHandlers.size === 0) {
          window.removeEventListener(type, unfiendWindowEventHandler);
          typeToWindowEventHandlers[type] = void 0;
        }
      }
    }
    if (handlers.has(handler))
      handlers.delete(handler);
    if (handlers.size === 0) {
      elToHandlers.delete(el);
    }
    if (elToHandlers.size === 0) {
      window.removeEventListener(type, unifiedHandler, phase === "capture");
      phaseToTypeToElToHandlers[phase][type] = void 0;
    }
  }
  return {
    on: on2,
    off: off2
  };
}
var { on, off } = createDelegate();

// ../node_modules/vooks/es/use-false-until-truthy.js
import { ref, readonly, watch } from "vue";
function useFalseUntilTruthy(originalRef) {
  const currentRef = ref(!!originalRef.value);
  if (currentRef.value)
    return readonly(currentRef);
  const stop = watch(originalRef, (value) => {
    if (value) {
      currentRef.value = true;
      stop();
    }
  });
  return readonly(currentRef);
}

// ../node_modules/vooks/es/use-memo.js
import { computed, ref as ref2, watch as watch2 } from "vue";
function useMemo(getterOrOptions) {
  const computedValueRef = computed(getterOrOptions);
  const valueRef = ref2(computedValueRef.value);
  watch2(computedValueRef, (value) => {
    valueRef.value = value;
  });
  if (typeof getterOrOptions === "function") {
    return valueRef;
  } else {
    return {
      __v_isRef: true,
      get value() {
        return valueRef.value;
      },
      set value(v) {
        getterOrOptions.set(v);
      }
    };
  }
}
var use_memo_default = useMemo;

// ../node_modules/vooks/es/on-fonts-ready.js
import { onMounted, onBeforeUnmount } from "vue";

// ../node_modules/vooks/es/utils.js
import { getCurrentInstance } from "vue";
function hasInstance() {
  return getCurrentInstance() !== null;
}
var isBrowser = typeof window !== "undefined";

// ../node_modules/vooks/es/on-fonts-ready.js
var fontsReady;
var isFontReady;
var init = () => {
  var _a, _b;
  fontsReady = isBrowser ? (_b = (_a = document) === null || _a === void 0 ? void 0 : _a.fonts) === null || _b === void 0 ? void 0 : _b.ready : void 0;
  isFontReady = false;
  if (fontsReady !== void 0) {
    void fontsReady.then(() => {
      isFontReady = true;
    });
  } else {
    isFontReady = true;
  }
};
init();
function onFontsReady(cb) {
  if (isFontReady)
    return;
  let deactivated = false;
  onMounted(() => {
    if (!isFontReady) {
      fontsReady === null || fontsReady === void 0 ? void 0 : fontsReady.then(() => {
        if (deactivated)
          return;
        cb();
      });
    }
  });
  onBeforeUnmount(() => {
    deactivated = true;
  });
}

// ../node_modules/vooks/es/use-merged-state.js
import { watch as watch3, computed as computed2 } from "vue";
function useMergedState(controlledStateRef, uncontrolledStateRef) {
  watch3(controlledStateRef, (value) => {
    if (value !== void 0) {
      uncontrolledStateRef.value = value;
    }
  });
  return computed2(() => {
    if (controlledStateRef.value === void 0) {
      return uncontrolledStateRef.value;
    }
    return controlledStateRef.value;
  });
}

// ../node_modules/vooks/es/life-cycle/use-is-mounted.js
import { ref as ref3, onMounted as onMounted2, readonly as readonly2 } from "vue";
function isMounted() {
  const isMounted2 = ref3(false);
  onMounted2(() => {
    isMounted2.value = true;
  });
  return readonly2(isMounted2);
}

// ../node_modules/vooks/es/use-is-ios.js
var isIos = (typeof window === "undefined" ? false : /iPad|iPhone|iPod/.test(navigator.platform) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) && // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
!window.MSStream;
function useIsIos() {
  return isIos;
}

// ../node_modules/vooks/es/use-keyboard.js
import { onBeforeMount, onBeforeUnmount as onBeforeUnmount2, reactive, readonly as readonly3, watch as watch4 } from "vue";
function useKeyboard(options = {}, enabledRef) {
  const state = reactive({
    ctrl: false,
    command: false,
    win: false,
    shift: false,
    tab: false
  });
  const { keydown, keyup } = options;
  const keydownHandler = (e) => {
    switch (e.key) {
      case "Control":
        state.ctrl = true;
        break;
      case "Meta":
        state.command = true;
        state.win = true;
        break;
      case "Shift":
        state.shift = true;
        break;
      case "Tab":
        state.tab = true;
        break;
    }
    if (keydown !== void 0) {
      Object.keys(keydown).forEach((key) => {
        if (key !== e.key)
          return;
        const handler = keydown[key];
        if (typeof handler === "function") {
          handler(e);
        } else {
          const { stop = false, prevent = false } = handler;
          if (stop)
            e.stopPropagation();
          if (prevent)
            e.preventDefault();
          handler.handler(e);
        }
      });
    }
  };
  const keyupHandler = (e) => {
    switch (e.key) {
      case "Control":
        state.ctrl = false;
        break;
      case "Meta":
        state.command = false;
        state.win = false;
        break;
      case "Shift":
        state.shift = false;
        break;
      case "Tab":
        state.tab = false;
        break;
    }
    if (keyup !== void 0) {
      Object.keys(keyup).forEach((key) => {
        if (key !== e.key)
          return;
        const handler = keyup[key];
        if (typeof handler === "function") {
          handler(e);
        } else {
          const { stop = false, prevent = false } = handler;
          if (stop)
            e.stopPropagation();
          if (prevent)
            e.preventDefault();
          handler.handler(e);
        }
      });
    }
  };
  const setup = () => {
    if (enabledRef === void 0 || enabledRef.value) {
      on("keydown", document, keydownHandler);
      on("keyup", document, keyupHandler);
    }
    if (enabledRef !== void 0) {
      watch4(enabledRef, (value) => {
        if (value) {
          on("keydown", document, keydownHandler);
          on("keyup", document, keyupHandler);
        } else {
          off("keydown", document, keydownHandler);
          off("keyup", document, keyupHandler);
        }
      });
    }
  };
  if (hasInstance()) {
    onBeforeMount(setup);
    onBeforeUnmount2(() => {
      if (enabledRef === void 0 || enabledRef.value) {
        off("keydown", document, keydownHandler);
        off("keyup", document, keyupHandler);
      }
    });
  } else {
    setup();
  }
  return readonly3(state);
}

// ../node_modules/naive-ui/es/_utils/composable/use-adjusted-to.mjs
import { inject, onBeforeUnmount as onBeforeUnmount3, onMounted as onMounted3, ref as ref4 } from "vue";

// ../node_modules/naive-ui/es/_utils/vue/create-injection-key.mjs
function createInjectionKey(key) {
  return key;
}

// ../node_modules/naive-ui/es/_internal/select-menu/src/interface.mjs
var internalSelectionMenuInjectionKey = createInjectionKey("n-internal-select-menu");
var internalSelectionMenuBodyInjectionKey = createInjectionKey("n-internal-select-menu-body");

// ../node_modules/naive-ui/es/drawer/src/interface.mjs
var drawerBodyInjectionKey = createInjectionKey("n-drawer-body");
var drawerInjectionKey = createInjectionKey("n-drawer");

// ../node_modules/naive-ui/es/modal/src/interface.mjs
var modalBodyInjectionKey = createInjectionKey("n-modal-body");
var modalProviderInjectionKey = createInjectionKey("n-modal-provider");
var modalInjectionKey = createInjectionKey("n-modal");

// ../node_modules/naive-ui/es/popover/src/interface.mjs
var popoverBodyInjectionKey = createInjectionKey("n-popover-body");

// ../node_modules/naive-ui/es/_utils/composable/use-adjusted-to.mjs
var teleportDisabled = "__disabled__";
function useAdjustedTo(props) {
  const modal = inject(modalBodyInjectionKey, null);
  const drawer = inject(drawerBodyInjectionKey, null);
  const popover = inject(popoverBodyInjectionKey, null);
  const selectMenu = inject(internalSelectionMenuBodyInjectionKey, null);
  const fullscreenElementRef = ref4();
  if (typeof document !== "undefined") {
    fullscreenElementRef.value = document.fullscreenElement;
    const handleFullscreenChange = () => {
      fullscreenElementRef.value = document.fullscreenElement;
    };
    onMounted3(() => {
      on("fullscreenchange", document, handleFullscreenChange);
    });
    onBeforeUnmount3(() => {
      off("fullscreenchange", document, handleFullscreenChange);
    });
  }
  return use_memo_default(() => {
    var _a;
    const {
      to
    } = props;
    if (to !== void 0) {
      if (to === false) return teleportDisabled;
      if (to === true) return fullscreenElementRef.value || "body";
      return to;
    }
    if (modal === null || modal === void 0 ? void 0 : modal.value) {
      return (_a = modal.value.$el) !== null && _a !== void 0 ? _a : modal.value;
    }
    if (drawer === null || drawer === void 0 ? void 0 : drawer.value) return drawer.value;
    if (popover === null || popover === void 0 ? void 0 : popover.value) return popover.value;
    if (selectMenu === null || selectMenu === void 0 ? void 0 : selectMenu.value) return selectMenu.value;
    return to !== null && to !== void 0 ? to : fullscreenElementRef.value || "body";
  });
}
useAdjustedTo.tdkey = teleportDisabled;
useAdjustedTo.propTo = {
  type: [String, Object, Boolean],
  default: void 0
};

// ../node_modules/naive-ui/es/_utils/env/is-browser.mjs
var isBrowser2 = typeof document !== "undefined" && typeof window !== "undefined";

// ../node_modules/naive-ui/es/_utils/composable/use-reactivated.mjs
import { onActivated, onDeactivated } from "vue";
function useReactivated(callback) {
  const isDeactivatedRef = {
    isDeactivated: false
  };
  let activateStateInitialized = false;
  onActivated(() => {
    isDeactivatedRef.isDeactivated = false;
    if (!activateStateInitialized) {
      activateStateInitialized = true;
      return;
    }
    callback();
  });
  onDeactivated(() => {
    isDeactivatedRef.isDeactivated = true;
    if (!activateStateInitialized) {
      activateStateInitialized = true;
    }
  });
  return isDeactivatedRef;
}

// ../node_modules/vueuc/es/binder/src/Binder.js
import { defineComponent, provide, ref as ref5, inject as inject2, getCurrentInstance as getCurrentInstance2, onBeforeUnmount as onBeforeUnmount4 } from "vue";

// ../node_modules/vueuc/es/shared/v-node.js
import { Fragment, createTextVNode, Comment } from "vue";
function getSlot(scope, slots, slotName = "default") {
  const slot = slots[slotName];
  if (slot === void 0) {
    throw new Error(`[vueuc/${scope}]: slot[${slotName}] is empty.`);
  }
  return slot();
}
function flatten(vNodes, filterCommentNode = true, result = []) {
  vNodes.forEach((vNode) => {
    if (vNode === null)
      return;
    if (typeof vNode !== "object") {
      if (typeof vNode === "string" || typeof vNode === "number") {
        result.push(createTextVNode(String(vNode)));
      }
      return;
    }
    if (Array.isArray(vNode)) {
      flatten(vNode, filterCommentNode, result);
      return;
    }
    if (vNode.type === Fragment) {
      if (vNode.children === null)
        return;
      if (Array.isArray(vNode.children)) {
        flatten(vNode.children, filterCommentNode, result);
      }
    } else if (vNode.type !== Comment) {
      result.push(vNode);
    }
  });
  return result;
}
function getFirstVNode(scope, slots, slotName = "default") {
  const slot = slots[slotName];
  if (slot === void 0) {
    throw new Error(`[vueuc/${scope}]: slot[${slotName}] is empty.`);
  }
  const content = flatten(slot());
  if (content.length === 1) {
    return content[0];
  } else {
    throw new Error(`[vueuc/${scope}]: slot[${slotName}] should have exactly one child.`);
  }
}

// ../node_modules/vueuc/es/binder/src/utils.js
var viewMeasurer = null;
function ensureViewBoundingRect() {
  if (viewMeasurer === null) {
    viewMeasurer = document.getElementById("v-binder-view-measurer");
    if (viewMeasurer === null) {
      viewMeasurer = document.createElement("div");
      viewMeasurer.id = "v-binder-view-measurer";
      const { style: style2 } = viewMeasurer;
      style2.position = "fixed";
      style2.left = "0";
      style2.right = "0";
      style2.top = "0";
      style2.bottom = "0";
      style2.pointerEvents = "none";
      style2.visibility = "hidden";
      document.body.appendChild(viewMeasurer);
    }
  }
  return viewMeasurer.getBoundingClientRect();
}
function getPointRect(x, y) {
  const viewRect = ensureViewBoundingRect();
  return {
    top: y,
    left: x,
    height: 0,
    width: 0,
    right: viewRect.width - x,
    bottom: viewRect.height - y
  };
}
function getRect(el) {
  const elRect = el.getBoundingClientRect();
  const viewRect = ensureViewBoundingRect();
  return {
    left: elRect.left - viewRect.left,
    top: elRect.top - viewRect.top,
    bottom: viewRect.height + viewRect.top - elRect.bottom,
    right: viewRect.width + viewRect.left - elRect.right,
    width: elRect.width,
    height: elRect.height
  };
}
function getParentNode(node) {
  if (node.nodeType === 9) {
    return null;
  }
  return node.parentNode;
}
function getScrollParent(node) {
  if (node === null)
    return null;
  const parentNode = getParentNode(node);
  if (parentNode === null) {
    return null;
  }
  if (parentNode.nodeType === 9) {
    return document;
  }
  if (parentNode.nodeType === 1) {
    const { overflow, overflowX, overflowY } = getComputedStyle(parentNode);
    if (/(auto|scroll|overlay)/.test(overflow + overflowY + overflowX)) {
      return parentNode;
    }
  }
  return getScrollParent(parentNode);
}

// ../node_modules/vueuc/es/binder/src/Binder.js
var Binder = defineComponent({
  name: "Binder",
  props: {
    syncTargetWithParent: Boolean,
    syncTarget: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    var _a;
    provide("VBinder", (_a = getCurrentInstance2()) === null || _a === void 0 ? void 0 : _a.proxy);
    const VBinder = inject2("VBinder", null);
    const targetRef = ref5(null);
    const setTargetRef = (el) => {
      targetRef.value = el;
      if (VBinder && props.syncTargetWithParent) {
        VBinder.setTargetRef(el);
      }
    };
    let scrollableNodes = [];
    const ensureScrollListener = () => {
      let cursor = targetRef.value;
      while (true) {
        cursor = getScrollParent(cursor);
        if (cursor === null)
          break;
        scrollableNodes.push(cursor);
      }
      for (const el of scrollableNodes) {
        on("scroll", el, onScroll, true);
      }
    };
    const removeScrollListeners = () => {
      for (const el of scrollableNodes) {
        off("scroll", el, onScroll, true);
      }
      scrollableNodes = [];
    };
    const followerScrollListeners = /* @__PURE__ */ new Set();
    const addScrollListener = (listener) => {
      if (followerScrollListeners.size === 0) {
        ensureScrollListener();
      }
      if (!followerScrollListeners.has(listener)) {
        followerScrollListeners.add(listener);
      }
    };
    const removeScrollListener = (listener) => {
      if (followerScrollListeners.has(listener)) {
        followerScrollListeners.delete(listener);
      }
      if (followerScrollListeners.size === 0) {
        removeScrollListeners();
      }
    };
    const onScroll = () => {
      beforeNextFrameOnce(onScrollRaf);
    };
    const onScrollRaf = () => {
      followerScrollListeners.forEach((listener) => listener());
    };
    const followerResizeListeners = /* @__PURE__ */ new Set();
    const addResizeListener = (listener) => {
      if (followerResizeListeners.size === 0) {
        on("resize", window, onResize);
      }
      if (!followerResizeListeners.has(listener)) {
        followerResizeListeners.add(listener);
      }
    };
    const removeResizeListener = (listener) => {
      if (followerResizeListeners.has(listener)) {
        followerResizeListeners.delete(listener);
      }
      if (followerResizeListeners.size === 0) {
        off("resize", window, onResize);
      }
    };
    const onResize = () => {
      followerResizeListeners.forEach((listener) => listener());
    };
    onBeforeUnmount4(() => {
      off("resize", window, onResize);
      removeScrollListeners();
    });
    return {
      targetRef,
      setTargetRef,
      addScrollListener,
      removeScrollListener,
      addResizeListener,
      removeResizeListener
    };
  },
  render() {
    return getSlot("binder", this.$slots);
  }
});
var Binder_default = Binder;

// ../node_modules/vueuc/es/binder/src/Target.js
import { defineComponent as defineComponent2, inject as inject3, withDirectives } from "vue";
var Target_default = defineComponent2({
  name: "Target",
  setup() {
    const { setTargetRef, syncTarget } = inject3("VBinder");
    const setTargetDirective = {
      mounted: setTargetRef,
      updated: setTargetRef
    };
    return {
      syncTarget,
      setTargetDirective
    };
  },
  render() {
    const { syncTarget, setTargetDirective } = this;
    if (syncTarget) {
      return withDirectives(getFirstVNode("follower", this.$slots), [
        [setTargetDirective]
      ]);
    }
    return getFirstVNode("follower", this.$slots);
  }
});

// ../node_modules/vueuc/es/binder/src/Follower.js
import { h as h2, defineComponent as defineComponent4, inject as inject5, nextTick, watch as watch5, toRef as toRef2, ref as ref6, onMounted as onMounted4, onBeforeUnmount as onBeforeUnmount5, withDirectives as withDirectives2 } from "vue";

// ../node_modules/vdirs/es/clickoutside.js
var ctxKey = "@@coContext";
var clickoutside = {
  mounted(el, { value, modifiers }) {
    el[ctxKey] = {
      handler: void 0
    };
    if (typeof value === "function") {
      el[ctxKey].handler = value;
      on("clickoutside", el, value, {
        capture: modifiers.capture
      });
    }
  },
  updated(el, { value, modifiers }) {
    const ctx2 = el[ctxKey];
    if (typeof value === "function") {
      if (ctx2.handler) {
        if (ctx2.handler !== value) {
          off("clickoutside", el, ctx2.handler, {
            capture: modifiers.capture
          });
          ctx2.handler = value;
          on("clickoutside", el, value, {
            capture: modifiers.capture
          });
        }
      } else {
        el[ctxKey].handler = value;
        on("clickoutside", el, value, {
          capture: modifiers.capture
        });
      }
    } else {
      if (ctx2.handler) {
        off("clickoutside", el, ctx2.handler, {
          capture: modifiers.capture
        });
        ctx2.handler = void 0;
      }
    }
  },
  unmounted(el, { modifiers }) {
    const { handler } = el[ctxKey];
    if (handler) {
      off("clickoutside", el, handler, {
        capture: modifiers.capture
      });
    }
    el[ctxKey].handler = void 0;
  }
};
var clickoutside_default = clickoutside;

// ../node_modules/vdirs/es/utils.js
function warn(location, message2) {
  console.error(`[vdirs/${location}]: ${message2}`);
}

// ../node_modules/vdirs/es/zindexable/z-index-manager.js
var ZIndexManager = class {
  constructor() {
    this.elementZIndex = /* @__PURE__ */ new Map();
    this.nextZIndex = 2e3;
  }
  get elementCount() {
    return this.elementZIndex.size;
  }
  ensureZIndex(el, zIndex) {
    const { elementZIndex } = this;
    if (zIndex !== void 0) {
      el.style.zIndex = `${zIndex}`;
      elementZIndex.delete(el);
      return;
    }
    const { nextZIndex } = this;
    if (elementZIndex.has(el)) {
      const currentZIndex = elementZIndex.get(el);
      if (currentZIndex + 1 === this.nextZIndex)
        return;
    }
    el.style.zIndex = `${nextZIndex}`;
    elementZIndex.set(el, nextZIndex);
    this.nextZIndex = nextZIndex + 1;
    this.squashState();
  }
  unregister(el, zIndex) {
    const { elementZIndex } = this;
    if (elementZIndex.has(el)) {
      elementZIndex.delete(el);
    } else if (zIndex === void 0) {
      warn("z-index-manager/unregister-element", "Element not found when unregistering.");
    }
    this.squashState();
  }
  squashState() {
    const { elementCount } = this;
    if (!elementCount) {
      this.nextZIndex = 2e3;
    }
    if (this.nextZIndex - elementCount > 2500)
      this.rearrange();
  }
  rearrange() {
    const elementZIndexPair = Array.from(this.elementZIndex.entries());
    elementZIndexPair.sort((pair1, pair2) => {
      return pair1[1] - pair2[1];
    });
    this.nextZIndex = 2e3;
    elementZIndexPair.forEach((pair) => {
      const el = pair[0];
      const zIndex = this.nextZIndex++;
      if (`${zIndex}` !== el.style.zIndex)
        el.style.zIndex = `${zIndex}`;
    });
  }
};
var z_index_manager_default = new ZIndexManager();

// ../node_modules/vdirs/es/zindexable/index.js
var ctx = "@@ziContext";
var zindexable = {
  mounted(el, bindings) {
    const { value = {} } = bindings;
    const { zIndex, enabled } = value;
    el[ctx] = {
      enabled: !!enabled,
      initialized: false
    };
    if (enabled) {
      z_index_manager_default.ensureZIndex(el, zIndex);
      el[ctx].initialized = true;
    }
  },
  updated(el, bindings) {
    const { value = {} } = bindings;
    const { zIndex, enabled } = value;
    const cachedEnabled = el[ctx].enabled;
    if (enabled && !cachedEnabled) {
      z_index_manager_default.ensureZIndex(el, zIndex);
      el[ctx].initialized = true;
    }
    el[ctx].enabled = !!enabled;
  },
  unmounted(el, bindings) {
    if (!el[ctx].initialized)
      return;
    const { value = {} } = bindings;
    const { zIndex } = value;
    z_index_manager_default.unregister(el, zIndex);
  }
};
var zindexable_default = zindexable;

// ../node_modules/@css-render/vue3-ssr/esm/index.js
import { inject as inject4 } from "vue";
var ssrContextKey = "@css-render/vue3-ssr";
function createStyleString(id, style2) {
  return `<style cssr-id="${id}">
${style2}
</style>`;
}
function ssrAdapter(id, style2, ssrContext) {
  const { styles: styles2, ids } = ssrContext;
  if (ids.has(id))
    return;
  if (styles2 !== null) {
    ids.add(id);
    styles2.push(createStyleString(id, style2));
  }
}
var isBrowser3 = typeof document !== "undefined";
function useSsrAdapter() {
  if (isBrowser3)
    return void 0;
  const context = inject4(ssrContextKey, null);
  if (context === null)
    return void 0;
  return {
    adapter: (id, style2) => ssrAdapter(id, style2, context),
    context
  };
}

// ../node_modules/vueuc/es/shared/warn.js
function warn2(location, message2) {
  console.error(`[vueuc/${location}]: ${message2}`);
}

// ../node_modules/vueuc/es/shared/cssr.js
var { c: c3 } = CssRender();
var cssrAnchorMetaName = "vueuc-style";

// ../node_modules/vueuc/es/shared/finweck-tree.js
function lowBit(n) {
  return n & -n;
}
var FinweckTree = class {
  /**
   * @param l length of the array
   * @param min min value of the array
   */
  constructor(l, min) {
    this.l = l;
    this.min = min;
    const ft = new Array(l + 1);
    for (let i = 0; i < l + 1; ++i) {
      ft[i] = 0;
    }
    this.ft = ft;
  }
  /**
   * Add arr[i] by n, start from 0
   * @param i the index of the element to be added
   * @param n the value to be added
   */
  add(i, n) {
    if (n === 0)
      return;
    const { l, ft } = this;
    i += 1;
    while (i <= l) {
      ft[i] += n;
      i += lowBit(i);
    }
  }
  /**
   * Get the value of index i
   * @param i index
   * @returns value of the index
   */
  get(i) {
    return this.sum(i + 1) - this.sum(i);
  }
  /**
   * Get the sum of first i elements
   * @param i count of head elements to be added
   * @returns the sum of first i elements
   */
  sum(i) {
    if (i === void 0)
      i = this.l;
    if (i <= 0)
      return 0;
    const { ft, min, l } = this;
    if (i > l)
      throw new Error("[FinweckTree.sum]: `i` is larger than length.");
    let ret = i * min;
    while (i > 0) {
      ret += ft[i];
      i -= lowBit(i);
    }
    return ret;
  }
  /**
   * Get the largest count of head elements whose sum are <= threshold
   * @param threshold
   * @returns the largest count of head elements whose sum are <= threshold
   */
  getBound(threshold) {
    let l = 0;
    let r = this.l;
    while (r > l) {
      const m = Math.floor((l + r) / 2);
      const sumM = this.sum(m);
      if (sumM > threshold) {
        r = m;
        continue;
      } else if (sumM < threshold) {
        if (l === m) {
          if (this.sum(l + 1) <= threshold)
            return l + 1;
          return m;
        }
        l = m;
      } else {
        return m;
      }
    }
    return l;
  }
};

// ../node_modules/vueuc/es/lazy-teleport/src/index.js
import { Teleport, h, toRef, computed as computed3, defineComponent as defineComponent3 } from "vue";
var src_default = defineComponent3({
  name: "LazyTeleport",
  props: {
    to: {
      type: [String, Object],
      default: void 0
    },
    disabled: Boolean,
    show: {
      type: Boolean,
      required: true
    }
  },
  setup(props) {
    return {
      showTeleport: useFalseUntilTruthy(toRef(props, "show")),
      mergedTo: computed3(() => {
        const { to } = props;
        return to !== null && to !== void 0 ? to : "body";
      })
    };
  },
  render() {
    return this.showTeleport ? this.disabled ? getSlot("lazy-teleport", this.$slots) : h(Teleport, {
      disabled: this.disabled,
      to: this.mergedTo
    }, getSlot("lazy-teleport", this.$slots)) : null;
  }
});

// ../node_modules/vueuc/es/binder/src/get-placement-style.js
var oppositionPositions = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left"
};
var oppositeAligns = {
  start: "end",
  center: "center",
  end: "start"
};
var propToCompare = {
  top: "height",
  bottom: "height",
  left: "width",
  right: "width"
};
var transformOrigins = {
  "bottom-start": "top left",
  bottom: "top center",
  "bottom-end": "top right",
  "top-start": "bottom left",
  top: "bottom center",
  "top-end": "bottom right",
  "right-start": "top left",
  right: "center left",
  "right-end": "bottom left",
  "left-start": "top right",
  left: "center right",
  "left-end": "bottom right"
};
var overlapTransformOrigin = {
  "bottom-start": "bottom left",
  bottom: "bottom center",
  "bottom-end": "bottom right",
  "top-start": "top left",
  top: "top center",
  "top-end": "top right",
  "right-start": "top right",
  right: "center right",
  "right-end": "bottom right",
  "left-start": "top left",
  left: "center left",
  "left-end": "bottom left"
};
var oppositeAlignCssPositionProps = {
  "bottom-start": "right",
  "bottom-end": "left",
  "top-start": "right",
  "top-end": "left",
  "right-start": "bottom",
  "right-end": "top",
  "left-start": "bottom",
  "left-end": "top"
};
var keepOffsetDirection = {
  top: true,
  bottom: false,
  left: true,
  right: false
  // left--
};
var cssPositionToOppositeAlign = {
  top: "end",
  bottom: "start",
  left: "end",
  right: "start"
};
function getPlacementAndOffsetOfFollower(placement, targetRect, followerRect, shift, flip, overlap) {
  if (!flip || overlap) {
    return { placement, top: 0, left: 0 };
  }
  const [position, align] = placement.split("-");
  let properAlign = align !== null && align !== void 0 ? align : "center";
  let properOffset = {
    top: 0,
    left: 0
  };
  const deriveOffset = (oppositeAlignCssSizeProp, alignCssPositionProp, offsetVertically2) => {
    let left = 0;
    let top = 0;
    const diff = followerRect[oppositeAlignCssSizeProp] - targetRect[alignCssPositionProp] - targetRect[oppositeAlignCssSizeProp];
    if (diff > 0 && shift) {
      if (offsetVertically2) {
        top = keepOffsetDirection[alignCssPositionProp] ? diff : -diff;
      } else {
        left = keepOffsetDirection[alignCssPositionProp] ? diff : -diff;
      }
    }
    return {
      left,
      top
    };
  };
  const offsetVertically = position === "left" || position === "right";
  if (properAlign !== "center") {
    const oppositeAlignCssPositionProp = oppositeAlignCssPositionProps[placement];
    const currentAlignCssPositionProp = oppositionPositions[oppositeAlignCssPositionProp];
    const oppositeAlignCssSizeProp = propToCompare[oppositeAlignCssPositionProp];
    if (followerRect[oppositeAlignCssSizeProp] > targetRect[oppositeAlignCssSizeProp]) {
      if (
        // current space is not enough
        // ----------[ target ]---------|
        // -------[     follower        ]
        targetRect[oppositeAlignCssPositionProp] + targetRect[oppositeAlignCssSizeProp] < followerRect[oppositeAlignCssSizeProp]
      ) {
        const followerOverTargetSize = (followerRect[oppositeAlignCssSizeProp] - targetRect[oppositeAlignCssSizeProp]) / 2;
        if (targetRect[oppositeAlignCssPositionProp] < followerOverTargetSize || targetRect[currentAlignCssPositionProp] < followerOverTargetSize) {
          if (targetRect[oppositeAlignCssPositionProp] < targetRect[currentAlignCssPositionProp]) {
            properAlign = oppositeAligns[align];
            properOffset = deriveOffset(oppositeAlignCssSizeProp, currentAlignCssPositionProp, offsetVertically);
          } else {
            properOffset = deriveOffset(oppositeAlignCssSizeProp, oppositeAlignCssPositionProp, offsetVertically);
          }
        } else {
          properAlign = "center";
        }
      }
    } else if (followerRect[oppositeAlignCssSizeProp] < targetRect[oppositeAlignCssSizeProp]) {
      if (targetRect[currentAlignCssPositionProp] < 0 && // opposite align has larger space
      // ------------[   target   ]
      // ----------------[follower]
      targetRect[oppositeAlignCssPositionProp] > targetRect[currentAlignCssPositionProp]) {
        properAlign = oppositeAligns[align];
      }
    }
  } else {
    const possibleAlternativeAlignCssPositionProp1 = position === "bottom" || position === "top" ? "left" : "top";
    const possibleAlternativeAlignCssPositionProp2 = oppositionPositions[possibleAlternativeAlignCssPositionProp1];
    const alternativeAlignCssSizeProp = propToCompare[possibleAlternativeAlignCssPositionProp1];
    const followerOverTargetSize = (followerRect[alternativeAlignCssSizeProp] - targetRect[alternativeAlignCssSizeProp]) / 2;
    if (
      // center is not enough
      // ----------- [ target ]--|
      // -------[     follower     ]
      targetRect[possibleAlternativeAlignCssPositionProp1] < followerOverTargetSize || targetRect[possibleAlternativeAlignCssPositionProp2] < followerOverTargetSize
    ) {
      if (targetRect[possibleAlternativeAlignCssPositionProp1] > targetRect[possibleAlternativeAlignCssPositionProp2]) {
        properAlign = cssPositionToOppositeAlign[possibleAlternativeAlignCssPositionProp1];
        properOffset = deriveOffset(alternativeAlignCssSizeProp, possibleAlternativeAlignCssPositionProp1, offsetVertically);
      } else {
        properAlign = cssPositionToOppositeAlign[possibleAlternativeAlignCssPositionProp2];
        properOffset = deriveOffset(alternativeAlignCssSizeProp, possibleAlternativeAlignCssPositionProp2, offsetVertically);
      }
    }
  }
  let properPosition = position;
  if (
    // space is not enough
    targetRect[position] < followerRect[propToCompare[position]] && // opposite position's space is larger
    targetRect[position] < targetRect[oppositionPositions[position]]
  ) {
    properPosition = oppositionPositions[position];
  }
  return {
    placement: properAlign !== "center" ? `${properPosition}-${properAlign}` : properPosition,
    left: properOffset.left,
    top: properOffset.top
  };
}
function getProperTransformOrigin(placement, overlap) {
  if (overlap)
    return overlapTransformOrigin[placement];
  return transformOrigins[placement];
}
function getOffset(placement, offsetRect, targetRect, offsetTopToStandardPlacement, offsetLeftToStandardPlacement, overlap) {
  if (overlap) {
    switch (placement) {
      case "bottom-start":
        return {
          top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left)}px`,
          transform: "translateY(-100%)"
        };
      case "bottom-end":
        return {
          top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width)}px`,
          transform: "translateX(-100%) translateY(-100%)"
        };
      case "top-start":
        return {
          top: `${Math.round(targetRect.top - offsetRect.top)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left)}px`,
          transform: ""
        };
      case "top-end":
        return {
          top: `${Math.round(targetRect.top - offsetRect.top)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width)}px`,
          transform: "translateX(-100%)"
        };
      case "right-start":
        return {
          top: `${Math.round(targetRect.top - offsetRect.top)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width)}px`,
          transform: "translateX(-100%)"
        };
      case "right-end":
        return {
          top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width)}px`,
          transform: "translateX(-100%) translateY(-100%)"
        };
      case "left-start":
        return {
          top: `${Math.round(targetRect.top - offsetRect.top)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left)}px`,
          transform: ""
        };
      case "left-end":
        return {
          top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left)}px`,
          transform: "translateY(-100%)"
        };
      case "top":
        return {
          top: `${Math.round(targetRect.top - offsetRect.top)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width / 2)}px`,
          transform: "translateX(-50%)"
        };
      case "right":
        return {
          top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height / 2)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width)}px`,
          transform: "translateX(-100%) translateY(-50%)"
        };
      case "left":
        return {
          top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height / 2)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left)}px`,
          transform: "translateY(-50%)"
        };
      case "bottom":
      default:
        return {
          top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width / 2)}px`,
          transform: "translateX(-50%) translateY(-100%)"
        };
    }
  }
  switch (placement) {
    case "bottom-start":
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + offsetLeftToStandardPlacement)}px`,
        transform: ""
      };
    case "bottom-end":
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width + offsetLeftToStandardPlacement)}px`,
        transform: "translateX(-100%)"
      };
    case "top-start":
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + offsetLeftToStandardPlacement)}px`,
        transform: "translateY(-100%)"
      };
    case "top-end":
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width + offsetLeftToStandardPlacement)}px`,
        transform: "translateX(-100%) translateY(-100%)"
      };
    case "right-start":
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width + offsetLeftToStandardPlacement)}px`,
        transform: ""
      };
    case "right-end":
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width + offsetLeftToStandardPlacement)}px`,
        transform: "translateY(-100%)"
      };
    case "left-start":
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + offsetLeftToStandardPlacement)}px`,
        transform: "translateX(-100%)"
      };
    case "left-end":
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + offsetLeftToStandardPlacement)}px`,
        transform: "translateX(-100%) translateY(-100%)"
      };
    case "top":
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width / 2 + offsetLeftToStandardPlacement)}px`,
        transform: "translateY(-100%) translateX(-50%)"
      };
    case "right":
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height / 2 + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width + offsetLeftToStandardPlacement)}px`,
        transform: "translateY(-50%)"
      };
    case "left":
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height / 2 + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + offsetLeftToStandardPlacement)}px`,
        transform: "translateY(-50%) translateX(-100%)"
      };
    case "bottom":
    default:
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width / 2 + offsetLeftToStandardPlacement)}px`,
        transform: "translateX(-50%)"
      };
  }
}

// ../node_modules/vueuc/es/binder/src/Follower.js
var style = c3([
  c3(".v-binder-follower-container", {
    position: "absolute",
    left: "0",
    right: "0",
    top: "0",
    height: "0",
    pointerEvents: "none",
    zIndex: "auto"
  }),
  c3(".v-binder-follower-content", {
    position: "absolute",
    zIndex: "auto"
  }, [
    c3("> *", {
      pointerEvents: "all"
    })
  ])
]);
var Follower_default = defineComponent4({
  name: "Follower",
  inheritAttrs: false,
  props: {
    show: Boolean,
    enabled: {
      type: Boolean,
      default: void 0
    },
    placement: {
      type: String,
      default: "bottom"
    },
    syncTrigger: {
      type: Array,
      default: ["resize", "scroll"]
    },
    to: [String, Object],
    flip: {
      type: Boolean,
      default: true
    },
    internalShift: Boolean,
    x: Number,
    y: Number,
    width: String,
    minWidth: String,
    containerClass: String,
    teleportDisabled: Boolean,
    zindexable: {
      type: Boolean,
      default: true
    },
    zIndex: Number,
    overlap: Boolean
  },
  setup(props) {
    const VBinder = inject5("VBinder");
    const mergedEnabledRef = use_memo_default(() => {
      return props.enabled !== void 0 ? props.enabled : props.show;
    });
    const followerRef = ref6(null);
    const offsetContainerRef = ref6(null);
    const ensureListeners = () => {
      const { syncTrigger } = props;
      if (syncTrigger.includes("scroll")) {
        VBinder.addScrollListener(syncPosition);
      }
      if (syncTrigger.includes("resize")) {
        VBinder.addResizeListener(syncPosition);
      }
    };
    const removeListeners = () => {
      VBinder.removeScrollListener(syncPosition);
      VBinder.removeResizeListener(syncPosition);
    };
    onMounted4(() => {
      if (mergedEnabledRef.value) {
        syncPosition();
        ensureListeners();
      }
    });
    const ssrAdapter2 = useSsrAdapter();
    style.mount({
      id: "vueuc/binder",
      head: true,
      anchorMetaName: cssrAnchorMetaName,
      ssr: ssrAdapter2
    });
    onBeforeUnmount5(() => {
      removeListeners();
    });
    onFontsReady(() => {
      if (mergedEnabledRef.value) {
        syncPosition();
      }
    });
    const syncPosition = () => {
      if (!mergedEnabledRef.value) {
        return;
      }
      const follower = followerRef.value;
      if (follower === null)
        return;
      const target = VBinder.targetRef;
      const { x, y, overlap } = props;
      const targetRect = x !== void 0 && y !== void 0 ? getPointRect(x, y) : getRect(target);
      follower.style.setProperty("--v-target-width", `${Math.round(targetRect.width)}px`);
      follower.style.setProperty("--v-target-height", `${Math.round(targetRect.height)}px`);
      const { width, minWidth, placement, internalShift, flip } = props;
      follower.setAttribute("v-placement", placement);
      if (overlap) {
        follower.setAttribute("v-overlap", "");
      } else {
        follower.removeAttribute("v-overlap");
      }
      const { style: style2 } = follower;
      if (width === "target") {
        style2.width = `${targetRect.width}px`;
      } else if (width !== void 0) {
        style2.width = width;
      } else {
        style2.width = "";
      }
      if (minWidth === "target") {
        style2.minWidth = `${targetRect.width}px`;
      } else if (minWidth !== void 0) {
        style2.minWidth = minWidth;
      } else {
        style2.minWidth = "";
      }
      const followerRect = getRect(follower);
      const offsetContainerRect = getRect(offsetContainerRef.value);
      const { left: offsetLeftToStandardPlacement, top: offsetTopToStandardPlacement, placement: properPlacement } = getPlacementAndOffsetOfFollower(placement, targetRect, followerRect, internalShift, flip, overlap);
      const properTransformOrigin = getProperTransformOrigin(properPlacement, overlap);
      const { left, top, transform } = getOffset(properPlacement, offsetContainerRect, targetRect, offsetTopToStandardPlacement, offsetLeftToStandardPlacement, overlap);
      follower.setAttribute("v-placement", properPlacement);
      follower.style.setProperty("--v-offset-left", `${Math.round(offsetLeftToStandardPlacement)}px`);
      follower.style.setProperty("--v-offset-top", `${Math.round(offsetTopToStandardPlacement)}px`);
      follower.style.transform = `translateX(${left}) translateY(${top}) ${transform}`;
      follower.style.setProperty("--v-transform-origin", properTransformOrigin);
      follower.style.transformOrigin = properTransformOrigin;
    };
    watch5(mergedEnabledRef, (value) => {
      if (value) {
        ensureListeners();
        syncOnNextTick();
      } else {
        removeListeners();
      }
    });
    const syncOnNextTick = () => {
      nextTick().then(syncPosition).catch((e) => console.error(e));
    };
    [
      "placement",
      "x",
      "y",
      "internalShift",
      "flip",
      "width",
      "overlap",
      "minWidth"
    ].forEach((prop) => {
      watch5(toRef2(props, prop), syncPosition);
    });
    ["teleportDisabled"].forEach((prop) => {
      watch5(toRef2(props, prop), syncOnNextTick);
    });
    watch5(toRef2(props, "syncTrigger"), (value) => {
      if (!value.includes("resize")) {
        VBinder.removeResizeListener(syncPosition);
      } else {
        VBinder.addResizeListener(syncPosition);
      }
      if (!value.includes("scroll")) {
        VBinder.removeScrollListener(syncPosition);
      } else {
        VBinder.addScrollListener(syncPosition);
      }
    });
    const isMountedRef = isMounted();
    const mergedToRef = use_memo_default(() => {
      const { to } = props;
      if (to !== void 0)
        return to;
      if (isMountedRef.value) {
        return void 0;
      }
      return void 0;
    });
    return {
      VBinder,
      mergedEnabled: mergedEnabledRef,
      offsetContainerRef,
      followerRef,
      mergedTo: mergedToRef,
      syncPosition
    };
  },
  render() {
    return h2(src_default, {
      show: this.show,
      to: this.mergedTo,
      disabled: this.teleportDisabled
    }, {
      default: () => {
        var _a, _b;
        const vNode = h2("div", {
          class: ["v-binder-follower-container", this.containerClass],
          ref: "offsetContainerRef"
        }, [
          h2("div", {
            class: "v-binder-follower-content",
            ref: "followerRef"
          }, (_b = (_a = this.$slots).default) === null || _b === void 0 ? void 0 : _b.call(_a))
        ]);
        if (this.zindexable) {
          return withDirectives2(vNode, [
            [
              zindexable_default,
              {
                enabled: this.mergedEnabled,
                zIndex: this.zIndex
              }
            ]
          ]);
        }
        return vNode;
      }
    });
  }
});

// ../node_modules/vueuc/es/virtual-list/src/VirtualList.js
import { mergeProps, computed as computed5, defineComponent as defineComponent7, ref as ref8, onMounted as onMounted6, h as h3, onActivated as onActivated2, onDeactivated as onDeactivated2, toRef as toRef3 } from "vue";

// ../node_modules/vueuc/es/resize-observer/src/VResizeObserver.js
import { defineComponent as defineComponent5, renderSlot, getCurrentInstance as getCurrentInstance3, onMounted as onMounted5, onBeforeUnmount as onBeforeUnmount6 } from "vue";

// ../node_modules/@juggle/resize-observer/lib/utils/resizeObservers.js
var resizeObservers = [];

// ../node_modules/@juggle/resize-observer/lib/algorithms/hasActiveObservations.js
var hasActiveObservations = function() {
  return resizeObservers.some(function(ro) {
    return ro.activeTargets.length > 0;
  });
};

// ../node_modules/@juggle/resize-observer/lib/algorithms/hasSkippedObservations.js
var hasSkippedObservations = function() {
  return resizeObservers.some(function(ro) {
    return ro.skippedTargets.length > 0;
  });
};

// ../node_modules/@juggle/resize-observer/lib/algorithms/deliverResizeLoopError.js
var msg = "ResizeObserver loop completed with undelivered notifications.";
var deliverResizeLoopError = function() {
  var event;
  if (typeof ErrorEvent === "function") {
    event = new ErrorEvent("error", {
      message: msg
    });
  } else {
    event = document.createEvent("Event");
    event.initEvent("error", false, false);
    event.message = msg;
  }
  window.dispatchEvent(event);
};

// ../node_modules/@juggle/resize-observer/lib/ResizeObserverBoxOptions.js
var ResizeObserverBoxOptions;
(function(ResizeObserverBoxOptions2) {
  ResizeObserverBoxOptions2["BORDER_BOX"] = "border-box";
  ResizeObserverBoxOptions2["CONTENT_BOX"] = "content-box";
  ResizeObserverBoxOptions2["DEVICE_PIXEL_CONTENT_BOX"] = "device-pixel-content-box";
})(ResizeObserverBoxOptions || (ResizeObserverBoxOptions = {}));

// ../node_modules/@juggle/resize-observer/lib/utils/freeze.js
var freeze = function(obj) {
  return Object.freeze(obj);
};

// ../node_modules/@juggle/resize-observer/lib/ResizeObserverSize.js
var ResizeObserverSize = /* @__PURE__ */ function() {
  function ResizeObserverSize2(inlineSize, blockSize) {
    this.inlineSize = inlineSize;
    this.blockSize = blockSize;
    freeze(this);
  }
  return ResizeObserverSize2;
}();

// ../node_modules/@juggle/resize-observer/lib/DOMRectReadOnly.js
var DOMRectReadOnly = function() {
  function DOMRectReadOnly2(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.top = this.y;
    this.left = this.x;
    this.bottom = this.top + this.height;
    this.right = this.left + this.width;
    return freeze(this);
  }
  DOMRectReadOnly2.prototype.toJSON = function() {
    var _a = this, x = _a.x, y = _a.y, top = _a.top, right = _a.right, bottom = _a.bottom, left = _a.left, width = _a.width, height = _a.height;
    return { x, y, top, right, bottom, left, width, height };
  };
  DOMRectReadOnly2.fromRect = function(rectangle) {
    return new DOMRectReadOnly2(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
  };
  return DOMRectReadOnly2;
}();

// ../node_modules/@juggle/resize-observer/lib/utils/element.js
var isSVG = function(target) {
  return target instanceof SVGElement && "getBBox" in target;
};
var isHidden = function(target) {
  if (isSVG(target)) {
    var _a = target.getBBox(), width = _a.width, height = _a.height;
    return !width && !height;
  }
  var _b = target, offsetWidth = _b.offsetWidth, offsetHeight = _b.offsetHeight;
  return !(offsetWidth || offsetHeight || target.getClientRects().length);
};
var isElement = function(obj) {
  var _a;
  if (obj instanceof Element) {
    return true;
  }
  var scope = (_a = obj === null || obj === void 0 ? void 0 : obj.ownerDocument) === null || _a === void 0 ? void 0 : _a.defaultView;
  return !!(scope && obj instanceof scope.Element);
};
var isReplacedElement = function(target) {
  switch (target.tagName) {
    case "INPUT":
      if (target.type !== "image") {
        break;
      }
    case "VIDEO":
    case "AUDIO":
    case "EMBED":
    case "OBJECT":
    case "CANVAS":
    case "IFRAME":
    case "IMG":
      return true;
  }
  return false;
};

// ../node_modules/@juggle/resize-observer/lib/utils/global.js
var global2 = typeof window !== "undefined" ? window : {};

// ../node_modules/@juggle/resize-observer/lib/algorithms/calculateBoxSize.js
var cache = /* @__PURE__ */ new WeakMap();
var scrollRegexp = /auto|scroll/;
var verticalRegexp = /^tb|vertical/;
var IE = /msie|trident/i.test(global2.navigator && global2.navigator.userAgent);
var parseDimension = function(pixel) {
  return parseFloat(pixel || "0");
};
var size = function(inlineSize, blockSize, switchSizes) {
  if (inlineSize === void 0) {
    inlineSize = 0;
  }
  if (blockSize === void 0) {
    blockSize = 0;
  }
  if (switchSizes === void 0) {
    switchSizes = false;
  }
  return new ResizeObserverSize((switchSizes ? blockSize : inlineSize) || 0, (switchSizes ? inlineSize : blockSize) || 0);
};
var zeroBoxes = freeze({
  devicePixelContentBoxSize: size(),
  borderBoxSize: size(),
  contentBoxSize: size(),
  contentRect: new DOMRectReadOnly(0, 0, 0, 0)
});
var calculateBoxSizes = function(target, forceRecalculation) {
  if (forceRecalculation === void 0) {
    forceRecalculation = false;
  }
  if (cache.has(target) && !forceRecalculation) {
    return cache.get(target);
  }
  if (isHidden(target)) {
    cache.set(target, zeroBoxes);
    return zeroBoxes;
  }
  var cs = getComputedStyle(target);
  var svg = isSVG(target) && target.ownerSVGElement && target.getBBox();
  var removePadding = !IE && cs.boxSizing === "border-box";
  var switchSizes = verticalRegexp.test(cs.writingMode || "");
  var canScrollVertically = !svg && scrollRegexp.test(cs.overflowY || "");
  var canScrollHorizontally = !svg && scrollRegexp.test(cs.overflowX || "");
  var paddingTop = svg ? 0 : parseDimension(cs.paddingTop);
  var paddingRight = svg ? 0 : parseDimension(cs.paddingRight);
  var paddingBottom = svg ? 0 : parseDimension(cs.paddingBottom);
  var paddingLeft = svg ? 0 : parseDimension(cs.paddingLeft);
  var borderTop = svg ? 0 : parseDimension(cs.borderTopWidth);
  var borderRight = svg ? 0 : parseDimension(cs.borderRightWidth);
  var borderBottom = svg ? 0 : parseDimension(cs.borderBottomWidth);
  var borderLeft = svg ? 0 : parseDimension(cs.borderLeftWidth);
  var horizontalPadding = paddingLeft + paddingRight;
  var verticalPadding = paddingTop + paddingBottom;
  var horizontalBorderArea = borderLeft + borderRight;
  var verticalBorderArea = borderTop + borderBottom;
  var horizontalScrollbarThickness = !canScrollHorizontally ? 0 : target.offsetHeight - verticalBorderArea - target.clientHeight;
  var verticalScrollbarThickness = !canScrollVertically ? 0 : target.offsetWidth - horizontalBorderArea - target.clientWidth;
  var widthReduction = removePadding ? horizontalPadding + horizontalBorderArea : 0;
  var heightReduction = removePadding ? verticalPadding + verticalBorderArea : 0;
  var contentWidth = svg ? svg.width : parseDimension(cs.width) - widthReduction - verticalScrollbarThickness;
  var contentHeight = svg ? svg.height : parseDimension(cs.height) - heightReduction - horizontalScrollbarThickness;
  var borderBoxWidth = contentWidth + horizontalPadding + verticalScrollbarThickness + horizontalBorderArea;
  var borderBoxHeight = contentHeight + verticalPadding + horizontalScrollbarThickness + verticalBorderArea;
  var boxes = freeze({
    devicePixelContentBoxSize: size(Math.round(contentWidth * devicePixelRatio), Math.round(contentHeight * devicePixelRatio), switchSizes),
    borderBoxSize: size(borderBoxWidth, borderBoxHeight, switchSizes),
    contentBoxSize: size(contentWidth, contentHeight, switchSizes),
    contentRect: new DOMRectReadOnly(paddingLeft, paddingTop, contentWidth, contentHeight)
  });
  cache.set(target, boxes);
  return boxes;
};
var calculateBoxSize = function(target, observedBox, forceRecalculation) {
  var _a = calculateBoxSizes(target, forceRecalculation), borderBoxSize = _a.borderBoxSize, contentBoxSize = _a.contentBoxSize, devicePixelContentBoxSize = _a.devicePixelContentBoxSize;
  switch (observedBox) {
    case ResizeObserverBoxOptions.DEVICE_PIXEL_CONTENT_BOX:
      return devicePixelContentBoxSize;
    case ResizeObserverBoxOptions.BORDER_BOX:
      return borderBoxSize;
    default:
      return contentBoxSize;
  }
};

// ../node_modules/@juggle/resize-observer/lib/ResizeObserverEntry.js
var ResizeObserverEntry = /* @__PURE__ */ function() {
  function ResizeObserverEntry2(target) {
    var boxes = calculateBoxSizes(target);
    this.target = target;
    this.contentRect = boxes.contentRect;
    this.borderBoxSize = freeze([boxes.borderBoxSize]);
    this.contentBoxSize = freeze([boxes.contentBoxSize]);
    this.devicePixelContentBoxSize = freeze([boxes.devicePixelContentBoxSize]);
  }
  return ResizeObserverEntry2;
}();

// ../node_modules/@juggle/resize-observer/lib/algorithms/calculateDepthForNode.js
var calculateDepthForNode = function(node) {
  if (isHidden(node)) {
    return Infinity;
  }
  var depth = 0;
  var parent = node.parentNode;
  while (parent) {
    depth += 1;
    parent = parent.parentNode;
  }
  return depth;
};

// ../node_modules/@juggle/resize-observer/lib/algorithms/broadcastActiveObservations.js
var broadcastActiveObservations = function() {
  var shallowestDepth = Infinity;
  var callbacks2 = [];
  resizeObservers.forEach(function processObserver(ro) {
    if (ro.activeTargets.length === 0) {
      return;
    }
    var entries = [];
    ro.activeTargets.forEach(function processTarget(ot) {
      var entry = new ResizeObserverEntry(ot.target);
      var targetDepth = calculateDepthForNode(ot.target);
      entries.push(entry);
      ot.lastReportedSize = calculateBoxSize(ot.target, ot.observedBox);
      if (targetDepth < shallowestDepth) {
        shallowestDepth = targetDepth;
      }
    });
    callbacks2.push(function resizeObserverCallback() {
      ro.callback.call(ro.observer, entries, ro.observer);
    });
    ro.activeTargets.splice(0, ro.activeTargets.length);
  });
  for (var _i = 0, callbacks_1 = callbacks2; _i < callbacks_1.length; _i++) {
    var callback = callbacks_1[_i];
    callback();
  }
  return shallowestDepth;
};

// ../node_modules/@juggle/resize-observer/lib/algorithms/gatherActiveObservationsAtDepth.js
var gatherActiveObservationsAtDepth = function(depth) {
  resizeObservers.forEach(function processObserver(ro) {
    ro.activeTargets.splice(0, ro.activeTargets.length);
    ro.skippedTargets.splice(0, ro.skippedTargets.length);
    ro.observationTargets.forEach(function processTarget(ot) {
      if (ot.isActive()) {
        if (calculateDepthForNode(ot.target) > depth) {
          ro.activeTargets.push(ot);
        } else {
          ro.skippedTargets.push(ot);
        }
      }
    });
  });
};

// ../node_modules/@juggle/resize-observer/lib/utils/process.js
var process2 = function() {
  var depth = 0;
  gatherActiveObservationsAtDepth(depth);
  while (hasActiveObservations()) {
    depth = broadcastActiveObservations();
    gatherActiveObservationsAtDepth(depth);
  }
  if (hasSkippedObservations()) {
    deliverResizeLoopError();
  }
  return depth > 0;
};

// ../node_modules/@juggle/resize-observer/lib/utils/queueMicroTask.js
var trigger;
var callbacks = [];
var notify = function() {
  return callbacks.splice(0).forEach(function(cb) {
    return cb();
  });
};
var queueMicroTask = function(callback) {
  if (!trigger) {
    var toggle_1 = 0;
    var el_1 = document.createTextNode("");
    var config = { characterData: true };
    new MutationObserver(function() {
      return notify();
    }).observe(el_1, config);
    trigger = function() {
      el_1.textContent = "".concat(toggle_1 ? toggle_1-- : toggle_1++);
    };
  }
  callbacks.push(callback);
  trigger();
};

// ../node_modules/@juggle/resize-observer/lib/utils/queueResizeObserver.js
var queueResizeObserver = function(cb) {
  queueMicroTask(function ResizeObserver2() {
    requestAnimationFrame(cb);
  });
};

// ../node_modules/@juggle/resize-observer/lib/utils/scheduler.js
var watching = 0;
var isWatching = function() {
  return !!watching;
};
var CATCH_PERIOD = 250;
var observerConfig = { attributes: true, characterData: true, childList: true, subtree: true };
var events = [
  "resize",
  "load",
  "transitionend",
  "animationend",
  "animationstart",
  "animationiteration",
  "keyup",
  "keydown",
  "mouseup",
  "mousedown",
  "mouseover",
  "mouseout",
  "blur",
  "focus"
];
var time = function(timeout) {
  if (timeout === void 0) {
    timeout = 0;
  }
  return Date.now() + timeout;
};
var scheduled = false;
var Scheduler = function() {
  function Scheduler2() {
    var _this = this;
    this.stopped = true;
    this.listener = function() {
      return _this.schedule();
    };
  }
  Scheduler2.prototype.run = function(timeout) {
    var _this = this;
    if (timeout === void 0) {
      timeout = CATCH_PERIOD;
    }
    if (scheduled) {
      return;
    }
    scheduled = true;
    var until = time(timeout);
    queueResizeObserver(function() {
      var elementsHaveResized = false;
      try {
        elementsHaveResized = process2();
      } finally {
        scheduled = false;
        timeout = until - time();
        if (!isWatching()) {
          return;
        }
        if (elementsHaveResized) {
          _this.run(1e3);
        } else if (timeout > 0) {
          _this.run(timeout);
        } else {
          _this.start();
        }
      }
    });
  };
  Scheduler2.prototype.schedule = function() {
    this.stop();
    this.run();
  };
  Scheduler2.prototype.observe = function() {
    var _this = this;
    var cb = function() {
      return _this.observer && _this.observer.observe(document.body, observerConfig);
    };
    document.body ? cb() : global2.addEventListener("DOMContentLoaded", cb);
  };
  Scheduler2.prototype.start = function() {
    var _this = this;
    if (this.stopped) {
      this.stopped = false;
      this.observer = new MutationObserver(this.listener);
      this.observe();
      events.forEach(function(name) {
        return global2.addEventListener(name, _this.listener, true);
      });
    }
  };
  Scheduler2.prototype.stop = function() {
    var _this = this;
    if (!this.stopped) {
      this.observer && this.observer.disconnect();
      events.forEach(function(name) {
        return global2.removeEventListener(name, _this.listener, true);
      });
      this.stopped = true;
    }
  };
  return Scheduler2;
}();
var scheduler = new Scheduler();
var updateCount = function(n) {
  !watching && n > 0 && scheduler.start();
  watching += n;
  !watching && scheduler.stop();
};

// ../node_modules/@juggle/resize-observer/lib/ResizeObservation.js
var skipNotifyOnElement = function(target) {
  return !isSVG(target) && !isReplacedElement(target) && getComputedStyle(target).display === "inline";
};
var ResizeObservation = function() {
  function ResizeObservation2(target, observedBox) {
    this.target = target;
    this.observedBox = observedBox || ResizeObserverBoxOptions.CONTENT_BOX;
    this.lastReportedSize = {
      inlineSize: 0,
      blockSize: 0
    };
  }
  ResizeObservation2.prototype.isActive = function() {
    var size2 = calculateBoxSize(this.target, this.observedBox, true);
    if (skipNotifyOnElement(this.target)) {
      this.lastReportedSize = size2;
    }
    if (this.lastReportedSize.inlineSize !== size2.inlineSize || this.lastReportedSize.blockSize !== size2.blockSize) {
      return true;
    }
    return false;
  };
  return ResizeObservation2;
}();

// ../node_modules/@juggle/resize-observer/lib/ResizeObserverDetail.js
var ResizeObserverDetail = /* @__PURE__ */ function() {
  function ResizeObserverDetail2(resizeObserver, callback) {
    this.activeTargets = [];
    this.skippedTargets = [];
    this.observationTargets = [];
    this.observer = resizeObserver;
    this.callback = callback;
  }
  return ResizeObserverDetail2;
}();

// ../node_modules/@juggle/resize-observer/lib/ResizeObserverController.js
var observerMap = /* @__PURE__ */ new WeakMap();
var getObservationIndex = function(observationTargets, target) {
  for (var i = 0; i < observationTargets.length; i += 1) {
    if (observationTargets[i].target === target) {
      return i;
    }
  }
  return -1;
};
var ResizeObserverController = function() {
  function ResizeObserverController2() {
  }
  ResizeObserverController2.connect = function(resizeObserver, callback) {
    var detail = new ResizeObserverDetail(resizeObserver, callback);
    observerMap.set(resizeObserver, detail);
  };
  ResizeObserverController2.observe = function(resizeObserver, target, options) {
    var detail = observerMap.get(resizeObserver);
    var firstObservation = detail.observationTargets.length === 0;
    if (getObservationIndex(detail.observationTargets, target) < 0) {
      firstObservation && resizeObservers.push(detail);
      detail.observationTargets.push(new ResizeObservation(target, options && options.box));
      updateCount(1);
      scheduler.schedule();
    }
  };
  ResizeObserverController2.unobserve = function(resizeObserver, target) {
    var detail = observerMap.get(resizeObserver);
    var index = getObservationIndex(detail.observationTargets, target);
    var lastObservation = detail.observationTargets.length === 1;
    if (index >= 0) {
      lastObservation && resizeObservers.splice(resizeObservers.indexOf(detail), 1);
      detail.observationTargets.splice(index, 1);
      updateCount(-1);
    }
  };
  ResizeObserverController2.disconnect = function(resizeObserver) {
    var _this = this;
    var detail = observerMap.get(resizeObserver);
    detail.observationTargets.slice().forEach(function(ot) {
      return _this.unobserve(resizeObserver, ot.target);
    });
    detail.activeTargets.splice(0, detail.activeTargets.length);
  };
  return ResizeObserverController2;
}();

// ../node_modules/@juggle/resize-observer/lib/ResizeObserver.js
var ResizeObserver = function() {
  function ResizeObserver2(callback) {
    if (arguments.length === 0) {
      throw new TypeError("Failed to construct 'ResizeObserver': 1 argument required, but only 0 present.");
    }
    if (typeof callback !== "function") {
      throw new TypeError("Failed to construct 'ResizeObserver': The callback provided as parameter 1 is not a function.");
    }
    ResizeObserverController.connect(this, callback);
  }
  ResizeObserver2.prototype.observe = function(target, options) {
    if (arguments.length === 0) {
      throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': 1 argument required, but only 0 present.");
    }
    if (!isElement(target)) {
      throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': parameter 1 is not of type 'Element");
    }
    ResizeObserverController.observe(this, target, options);
  };
  ResizeObserver2.prototype.unobserve = function(target) {
    if (arguments.length === 0) {
      throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': 1 argument required, but only 0 present.");
    }
    if (!isElement(target)) {
      throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': parameter 1 is not of type 'Element");
    }
    ResizeObserverController.unobserve(this, target);
  };
  ResizeObserver2.prototype.disconnect = function() {
    ResizeObserverController.disconnect(this);
  };
  ResizeObserver2.toString = function() {
    return "function ResizeObserver () { [polyfill code] }";
  };
  return ResizeObserver2;
}();

// ../node_modules/vueuc/es/resize-observer/src/delegate.js
var ResizeObserverDelegate = class {
  constructor() {
    this.handleResize = this.handleResize.bind(this);
    this.observer = new (typeof window !== "undefined" && window.ResizeObserver || ResizeObserver)(this.handleResize);
    this.elHandlersMap = /* @__PURE__ */ new Map();
  }
  handleResize(entries) {
    for (const entry of entries) {
      const handler = this.elHandlersMap.get(entry.target);
      if (handler !== void 0) {
        handler(entry);
      }
    }
  }
  registerHandler(el, handler) {
    this.elHandlersMap.set(el, handler);
    this.observer.observe(el);
  }
  unregisterHandler(el) {
    if (!this.elHandlersMap.has(el)) {
      return;
    }
    this.elHandlersMap.delete(el);
    this.observer.unobserve(el);
  }
};
var delegate_default = new ResizeObserverDelegate();

// ../node_modules/vueuc/es/resize-observer/src/VResizeObserver.js
var VResizeObserver_default = defineComponent5({
  name: "ResizeObserver",
  props: {
    onResize: Function
  },
  setup(props) {
    let registered = false;
    const proxy = getCurrentInstance3().proxy;
    function handleResize(entry) {
      const { onResize } = props;
      if (onResize !== void 0)
        onResize(entry);
    }
    onMounted5(() => {
      const el = proxy.$el;
      if (el === void 0) {
        warn2("resize-observer", "$el does not exist.");
        return;
      }
      if (el.nextElementSibling !== el.nextSibling) {
        if (el.nodeType === 3 && el.nodeValue !== "") {
          warn2("resize-observer", "$el can not be observed (it may be a text node).");
          return;
        }
      }
      if (el.nextElementSibling !== null) {
        delegate_default.registerHandler(el.nextElementSibling, handleResize);
        registered = true;
      }
    });
    onBeforeUnmount6(() => {
      if (registered) {
        delegate_default.unregisterHandler(proxy.$el.nextElementSibling);
      }
    });
  },
  render() {
    return renderSlot(this.$slots, "default");
  }
});

// ../node_modules/vueuc/es/virtual-list/src/config.js
var maybeTouch;
function ensureMaybeTouch() {
  if (typeof document === "undefined")
    return false;
  if (maybeTouch === void 0) {
    if ("matchMedia" in window) {
      maybeTouch = window.matchMedia("(pointer:coarse)").matches;
    } else {
      maybeTouch = false;
    }
  }
  return maybeTouch;
}
var wheelScale;
function ensureWheelScale() {
  if (typeof document === "undefined")
    return 1;
  if (wheelScale === void 0) {
    wheelScale = "chrome" in window ? window.devicePixelRatio : 1;
  }
  return wheelScale;
}

// ../node_modules/vueuc/es/virtual-list/src/xScroll.js
import { computed as computed4, provide as provide2, ref as ref7 } from "vue";

// ../node_modules/vueuc/es/virtual-list/src/context.js
var xScrollInjextionKey = "VVirtualListXScroll";

// ../node_modules/vueuc/es/virtual-list/src/xScroll.js
function setupXScroll({ columnsRef, renderColRef, renderItemWithColsRef }) {
  const listWidthRef = ref7(0);
  const scrollLeftRef = ref7(0);
  const xFinweckTreeRef = computed4(() => {
    const columns = columnsRef.value;
    if (columns.length === 0) {
      return null;
    }
    const ft = new FinweckTree(columns.length, 0);
    columns.forEach((column, index) => {
      ft.add(index, column.width);
    });
    return ft;
  });
  const startIndexRef = use_memo_default(() => {
    const xFinweckTree = xFinweckTreeRef.value;
    if (xFinweckTree !== null) {
      return Math.max(xFinweckTree.getBound(scrollLeftRef.value) - 1, 0);
    } else {
      return 0;
    }
  });
  const getLeft = (index) => {
    const xFinweckTree = xFinweckTreeRef.value;
    if (xFinweckTree !== null) {
      return xFinweckTree.sum(index);
    } else {
      return 0;
    }
  };
  const endIndexRef = use_memo_default(() => {
    const xFinweckTree = xFinweckTreeRef.value;
    if (xFinweckTree !== null) {
      return Math.min(xFinweckTree.getBound(scrollLeftRef.value + listWidthRef.value) + 1, columnsRef.value.length - 1);
    } else {
      return 0;
    }
  });
  provide2(xScrollInjextionKey, {
    startIndexRef,
    endIndexRef,
    columnsRef,
    renderColRef,
    renderItemWithColsRef,
    getLeft
  });
  return {
    listWidthRef,
    scrollLeftRef
  };
}

// ../node_modules/vueuc/es/virtual-list/src/VirtualListRow.js
import { defineComponent as defineComponent6, inject as inject6 } from "vue";
var VirtualListRow = defineComponent6({
  name: "VirtualListRow",
  props: {
    index: { type: Number, required: true },
    item: {
      type: Object,
      required: true
    }
  },
  setup() {
    const { startIndexRef, endIndexRef, columnsRef, getLeft, renderColRef, renderItemWithColsRef } = (
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      inject6(xScrollInjextionKey)
    );
    return {
      startIndex: startIndexRef,
      endIndex: endIndexRef,
      columns: columnsRef,
      renderCol: renderColRef,
      renderItemWithCols: renderItemWithColsRef,
      getLeft
    };
  },
  render() {
    const { startIndex, endIndex, columns, renderCol, renderItemWithCols, getLeft, item } = this;
    if (renderItemWithCols != null) {
      return renderItemWithCols({
        itemIndex: this.index,
        startColIndex: startIndex,
        endColIndex: endIndex,
        allColumns: columns,
        item,
        getLeft
      });
    }
    if (renderCol != null) {
      const items = [];
      for (let i = startIndex; i <= endIndex; ++i) {
        const column = columns[i];
        items.push(renderCol({ column, left: getLeft(i), item }));
      }
      return items;
    }
    return null;
  }
});

// ../node_modules/vueuc/es/virtual-list/src/VirtualList.js
var styles = c3(".v-vl", {
  maxHeight: "inherit",
  height: "100%",
  overflow: "auto",
  minWidth: "1px"
  // a zero width container won't be scrollable
}, [
  c3("&:not(.v-vl--show-scrollbar)", {
    scrollbarWidth: "none"
  }, [
    c3("&::-webkit-scrollbar, &::-webkit-scrollbar-track-piece, &::-webkit-scrollbar-thumb", {
      width: 0,
      height: 0,
      display: "none"
    })
  ])
]);
var VirtualList_default = defineComponent7({
  name: "VirtualList",
  inheritAttrs: false,
  props: {
    showScrollbar: {
      type: Boolean,
      default: true
    },
    columns: {
      type: Array,
      default: () => []
    },
    renderCol: Function,
    renderItemWithCols: Function,
    items: {
      type: Array,
      default: () => []
    },
    // it is suppose to be the min height
    itemSize: {
      type: Number,
      required: true
    },
    itemResizable: Boolean,
    itemsStyle: [String, Object],
    visibleItemsTag: {
      type: [String, Object],
      default: "div"
    },
    visibleItemsProps: Object,
    ignoreItemResize: Boolean,
    onScroll: Function,
    onWheel: Function,
    onResize: Function,
    defaultScrollKey: [Number, String],
    defaultScrollIndex: Number,
    keyField: {
      type: String,
      default: "key"
    },
    // Whether it is a good API?
    // ResizeObserver + footer & header is not enough.
    // Too complex for simple case
    paddingTop: {
      type: [Number, String],
      default: 0
    },
    paddingBottom: {
      type: [Number, String],
      default: 0
    }
  },
  setup(props) {
    const ssrAdapter2 = useSsrAdapter();
    styles.mount({
      id: "vueuc/virtual-list",
      head: true,
      anchorMetaName: cssrAnchorMetaName,
      ssr: ssrAdapter2
    });
    onMounted6(() => {
      const { defaultScrollIndex, defaultScrollKey } = props;
      if (defaultScrollIndex !== void 0 && defaultScrollIndex !== null) {
        scrollTo({ index: defaultScrollIndex });
      } else if (defaultScrollKey !== void 0 && defaultScrollKey !== null) {
        scrollTo({ key: defaultScrollKey });
      }
    });
    let isDeactivated = false;
    let activateStateInitialized = false;
    onActivated2(() => {
      isDeactivated = false;
      if (!activateStateInitialized) {
        activateStateInitialized = true;
        return;
      }
      scrollTo({ top: scrollTopRef.value, left: scrollLeftRef.value });
    });
    onDeactivated2(() => {
      isDeactivated = true;
      if (!activateStateInitialized) {
        activateStateInitialized = true;
      }
    });
    const totalWidthRef = use_memo_default(() => {
      if (props.renderCol == null && props.renderItemWithCols == null) {
        return void 0;
      }
      if (props.columns.length === 0)
        return void 0;
      let width = 0;
      props.columns.forEach((column) => {
        width += column.width;
      });
      return width;
    });
    const keyIndexMapRef = computed5(() => {
      const map = /* @__PURE__ */ new Map();
      const { keyField } = props;
      props.items.forEach((item, index) => {
        map.set(item[keyField], index);
      });
      return map;
    });
    const { scrollLeftRef, listWidthRef } = setupXScroll({
      columnsRef: toRef3(props, "columns"),
      renderColRef: toRef3(props, "renderCol"),
      renderItemWithColsRef: toRef3(props, "renderItemWithCols")
    });
    const listElRef = ref8(null);
    const listHeightRef = ref8(void 0);
    const keyToHeightOffset = /* @__PURE__ */ new Map();
    const finweckTreeRef = computed5(() => {
      const { items, itemSize, keyField } = props;
      const ft = new FinweckTree(items.length, itemSize);
      items.forEach((item, index) => {
        const key = item[keyField];
        const heightOffset = keyToHeightOffset.get(key);
        if (heightOffset !== void 0) {
          ft.add(index, heightOffset);
        }
      });
      return ft;
    });
    const finweckTreeUpdateTrigger = ref8(0);
    const scrollTopRef = ref8(0);
    const startIndexRef = use_memo_default(() => {
      return Math.max(finweckTreeRef.value.getBound(scrollTopRef.value - depx(props.paddingTop)) - 1, 0);
    });
    const viewportItemsRef = computed5(() => {
      const { value: listHeight } = listHeightRef;
      if (listHeight === void 0)
        return [];
      const { items, itemSize } = props;
      const startIndex = startIndexRef.value;
      const endIndex = Math.min(startIndex + Math.ceil(listHeight / itemSize + 1), items.length - 1);
      const viewportItems = [];
      for (let i = startIndex; i <= endIndex; ++i) {
        viewportItems.push(items[i]);
      }
      return viewportItems;
    });
    const scrollTo = (options, y) => {
      if (typeof options === "number") {
        scrollToPosition(options, y, "auto");
        return;
      }
      const { left, top, index, key, position, behavior, debounce = true } = options;
      if (left !== void 0 || top !== void 0) {
        scrollToPosition(left, top, behavior);
      } else if (index !== void 0) {
        scrollToIndex(index, behavior, debounce);
      } else if (key !== void 0) {
        const toIndex = keyIndexMapRef.value.get(key);
        if (toIndex !== void 0)
          scrollToIndex(toIndex, behavior, debounce);
      } else if (position === "bottom") {
        scrollToPosition(0, Number.MAX_SAFE_INTEGER, behavior);
      } else if (position === "top") {
        scrollToPosition(0, 0, behavior);
      }
    };
    let anchorIndex;
    let anchorTimerId = null;
    function scrollToIndex(index, behavior, debounce) {
      const { value: ft } = finweckTreeRef;
      const targetTop = ft.sum(index) + depx(props.paddingTop);
      if (!debounce) {
        listElRef.value.scrollTo({
          left: 0,
          top: targetTop,
          behavior
        });
      } else {
        anchorIndex = index;
        if (anchorTimerId !== null) {
          window.clearTimeout(anchorTimerId);
        }
        anchorTimerId = window.setTimeout(() => {
          anchorIndex = void 0;
          anchorTimerId = null;
        }, 16);
        const { scrollTop, offsetHeight } = listElRef.value;
        if (targetTop > scrollTop) {
          const itemSize = ft.get(index);
          if (targetTop + itemSize <= scrollTop + offsetHeight) {
          } else {
            listElRef.value.scrollTo({
              left: 0,
              top: targetTop + itemSize - offsetHeight,
              behavior
            });
          }
        } else {
          listElRef.value.scrollTo({
            left: 0,
            top: targetTop,
            behavior
          });
        }
      }
    }
    function scrollToPosition(left, top, behavior) {
      listElRef.value.scrollTo({
        left,
        top,
        behavior
      });
    }
    function handleItemResize(key, entry) {
      var _a, _b, _c;
      if (isDeactivated)
        return;
      if (props.ignoreItemResize)
        return;
      if (isHideByVShow(entry.target))
        return;
      const { value: ft } = finweckTreeRef;
      const index = keyIndexMapRef.value.get(key);
      const previousHeight = ft.get(index);
      const height = (_c = (_b = (_a = entry.borderBoxSize) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.blockSize) !== null && _c !== void 0 ? _c : entry.contentRect.height;
      if (height === previousHeight)
        return;
      const offset = height - props.itemSize;
      if (offset === 0) {
        keyToHeightOffset.delete(key);
      } else {
        keyToHeightOffset.set(key, height - props.itemSize);
      }
      const delta = height - previousHeight;
      if (delta === 0)
        return;
      ft.add(index, delta);
      const listEl = listElRef.value;
      if (listEl != null) {
        if (anchorIndex === void 0) {
          const previousHeightSum = ft.sum(index);
          if (listEl.scrollTop > previousHeightSum) {
            listEl.scrollBy(0, delta);
          }
        } else {
          if (index < anchorIndex) {
            listEl.scrollBy(0, delta);
          } else if (index === anchorIndex) {
            const previousHeightSum = ft.sum(index);
            if (height + previousHeightSum > // Note, listEl shouldn't have border, nor offsetHeight won't be
            // correct
            listEl.scrollTop + listEl.offsetHeight) {
              listEl.scrollBy(0, delta);
            }
          }
        }
        syncViewport();
      }
      finweckTreeUpdateTrigger.value++;
    }
    const mayUseWheel = !ensureMaybeTouch();
    let wheelCatched = false;
    function handleListScroll(e) {
      var _a;
      (_a = props.onScroll) === null || _a === void 0 ? void 0 : _a.call(props, e);
      if (!mayUseWheel || !wheelCatched) {
        syncViewport();
      }
    }
    function handleListWheel(e) {
      var _a;
      (_a = props.onWheel) === null || _a === void 0 ? void 0 : _a.call(props, e);
      if (mayUseWheel) {
        const listEl = listElRef.value;
        if (listEl != null) {
          if (e.deltaX === 0) {
            if (listEl.scrollTop === 0 && e.deltaY <= 0) {
              return;
            }
            if (listEl.scrollTop + listEl.offsetHeight >= listEl.scrollHeight && e.deltaY >= 0) {
              return;
            }
          }
          e.preventDefault();
          listEl.scrollTop += e.deltaY / ensureWheelScale();
          listEl.scrollLeft += e.deltaX / ensureWheelScale();
          syncViewport();
          wheelCatched = true;
          beforeNextFrameOnce(() => {
            wheelCatched = false;
          });
        }
      }
    }
    function handleListResize(entry) {
      if (isDeactivated)
        return;
      if (isHideByVShow(entry.target))
        return;
      if (props.renderCol == null && props.renderItemWithCols == null) {
        if (entry.contentRect.height === listHeightRef.value)
          return;
      } else {
        if (entry.contentRect.height === listHeightRef.value && entry.contentRect.width === listWidthRef.value) {
          return;
        }
      }
      listHeightRef.value = entry.contentRect.height;
      listWidthRef.value = entry.contentRect.width;
      const { onResize } = props;
      if (onResize !== void 0)
        onResize(entry);
    }
    function syncViewport() {
      const { value: listEl } = listElRef;
      if (listEl == null)
        return;
      scrollTopRef.value = listEl.scrollTop;
      scrollLeftRef.value = listEl.scrollLeft;
    }
    function isHideByVShow(el) {
      let cursor = el;
      while (cursor !== null) {
        if (cursor.style.display === "none")
          return true;
        cursor = cursor.parentElement;
      }
      return false;
    }
    return {
      listHeight: listHeightRef,
      listStyle: {
        overflow: "auto"
      },
      keyToIndex: keyIndexMapRef,
      itemsStyle: computed5(() => {
        const { itemResizable } = props;
        const height = pxfy(finweckTreeRef.value.sum());
        finweckTreeUpdateTrigger.value;
        return [
          props.itemsStyle,
          {
            boxSizing: "content-box",
            width: pxfy(totalWidthRef.value),
            height: itemResizable ? "" : height,
            minHeight: itemResizable ? height : "",
            paddingTop: pxfy(props.paddingTop),
            paddingBottom: pxfy(props.paddingBottom)
          }
        ];
      }),
      visibleItemsStyle: computed5(() => {
        finweckTreeUpdateTrigger.value;
        return {
          transform: `translateY(${pxfy(finweckTreeRef.value.sum(startIndexRef.value))})`
        };
      }),
      viewportItems: viewportItemsRef,
      listElRef,
      itemsElRef: ref8(null),
      scrollTo,
      handleListResize,
      handleListScroll,
      handleListWheel,
      handleItemResize
    };
  },
  render() {
    const { itemResizable, keyField, keyToIndex, visibleItemsTag } = this;
    return h3(VResizeObserver_default, {
      onResize: this.handleListResize
    }, {
      default: () => {
        var _a, _b;
        return h3("div", mergeProps(this.$attrs, {
          class: ["v-vl", this.showScrollbar && "v-vl--show-scrollbar"],
          onScroll: this.handleListScroll,
          onWheel: this.handleListWheel,
          ref: "listElRef"
        }), [
          this.items.length !== 0 ? h3("div", {
            ref: "itemsElRef",
            class: "v-vl-items",
            style: this.itemsStyle
          }, [
            h3(visibleItemsTag, Object.assign({
              class: "v-vl-visible-items",
              style: this.visibleItemsStyle
            }, this.visibleItemsProps), {
              default: () => {
                const { renderCol, renderItemWithCols } = this;
                return this.viewportItems.map((item) => {
                  const key = item[keyField];
                  const index = keyToIndex.get(key);
                  const renderedCols = renderCol != null ? h3(VirtualListRow, {
                    index,
                    item
                  }) : void 0;
                  const renderedItemWithCols = renderItemWithCols != null ? h3(VirtualListRow, {
                    index,
                    item
                  }) : void 0;
                  const itemVNode = this.$slots.default({
                    item,
                    renderedCols,
                    renderedItemWithCols,
                    index
                  })[0];
                  if (itemResizable) {
                    return h3(VResizeObserver_default, {
                      key,
                      onResize: (entry) => this.handleItemResize(key, entry)
                    }, {
                      default: () => itemVNode
                    });
                  }
                  itemVNode.key = key;
                  return itemVNode;
                });
              }
            })
          ]) : (_b = (_a = this.$slots).empty) === null || _b === void 0 ? void 0 : _b.call(_a)
        ]);
      }
    });
  }
});

// ../node_modules/naive-ui/es/_utils/css/color-to-class.mjs
function color2Class(color) {
  return color.replace(/#|\(|\)|,|\s|\./g, "_");
}

// ../node_modules/naive-ui/es/_utils/css/rtl-inset.mjs
function rtlInset(inset) {
  const {
    left,
    right,
    top,
    bottom
  } = getMargin(inset);
  return `${top} ${left} ${bottom} ${right}`;
}

// ../node_modules/naive-ui/es/_utils/event/index.mjs
var eventSet = /* @__PURE__ */ new WeakSet();
function markEventEffectPerformed(event) {
  eventSet.add(event);
}

// ../node_modules/naive-ui/es/_utils/naive/warn.mjs
var warnedMessages = /* @__PURE__ */ new Set();
function warnOnce(location, message2) {
  const mergedMessage = `[naive/${location}]: ${message2}`;
  if (warnedMessages.has(mergedMessage)) return;
  warnedMessages.add(mergedMessage);
  console.error(mergedMessage);
}
function warn3(location, message2) {
  console.error(`[naive/${location}]: ${message2}`);
}
function throwError(location, message2) {
  throw new Error(`[naive/${location}]: ${message2}`);
}

// ../node_modules/naive-ui/es/_utils/vue/call.mjs
function call(funcs, ...args) {
  if (Array.isArray(funcs)) {
    funcs.forEach((func) => call(func, ...args));
  } else {
    return funcs(...args);
  }
}

// ../node_modules/naive-ui/es/_utils/vue/resolve-slot.mjs
import { Comment as Comment2, Fragment as Fragment2, isVNode } from "vue";
function ensureValidVNode(vnodes) {
  return vnodes.some((child) => {
    if (!isVNode(child)) {
      return true;
    }
    if (child.type === Comment2) {
      return false;
    }
    if (child.type === Fragment2 && !ensureValidVNode(child.children)) {
      return false;
    }
    return true;
  }) ? vnodes : null;
}
function resolveSlot(slot, fallback) {
  return slot && ensureValidVNode(slot()) || fallback();
}
function resolveSlotWithTypedProps(slot, props, fallback) {
  return slot && ensureValidVNode(slot(props)) || fallback(props);
}
function resolveWrappedSlot(slot, wrapper) {
  const children = slot && ensureValidVNode(slot());
  return wrapper(children || null);
}
function isSlotEmpty(slot) {
  return !(slot && ensureValidVNode(slot()));
}

// ../node_modules/naive-ui/es/_utils/vue/wrapper.mjs
import { defineComponent as defineComponent8 } from "vue";
var Wrapper = defineComponent8({
  render() {
    var _a, _b;
    return (_b = (_a = this.$slots).default) === null || _b === void 0 ? void 0 : _b.call(_a);
  }
});

// ../node_modules/naive-ui/es/config-provider/src/context.mjs
var configProviderInjectionKey = createInjectionKey("n-config-provider");

// ../node_modules/naive-ui/es/_mixins/use-config.mjs
var defaultClsPrefix = "n";
function useConfig(props = {}, options = {
  defaultBordered: true
}) {
  const NConfigProvider = inject7(configProviderInjectionKey, null);
  return {
    // NConfigProvider,
    inlineThemeDisabled: NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.inlineThemeDisabled,
    mergedRtlRef: NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedRtlRef,
    mergedComponentPropsRef: NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedComponentPropsRef,
    mergedBreakpointsRef: NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedBreakpointsRef,
    mergedBorderedRef: computed6(() => {
      var _a, _b;
      const {
        bordered
      } = props;
      if (bordered !== void 0) return bordered;
      return (_b = (_a = NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedBorderedRef.value) !== null && _a !== void 0 ? _a : options.defaultBordered) !== null && _b !== void 0 ? _b : true;
    }),
    mergedClsPrefixRef: NConfigProvider ? NConfigProvider.mergedClsPrefixRef : shallowRef(defaultClsPrefix),
    namespaceRef: computed6(() => NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedNamespaceRef.value)
  };
}

// ../node_modules/naive-ui/es/_mixins/use-css-vars-class.mjs
import { inject as inject8, ref as ref9, watchEffect } from "vue";
function useThemeClass(componentName, hashRef, cssVarsRef, props) {
  if (!cssVarsRef) throwError("useThemeClass", "cssVarsRef is not passed");
  const NConfigProvider = inject8(configProviderInjectionKey, null);
  const mergedThemeHashRef = NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedThemeHashRef;
  const styleMountTarget = NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.styleMountTarget;
  const themeClassRef = ref9("");
  const ssrAdapter2 = useSsrAdapter();
  let renderCallback;
  const hashClassPrefix = `__${componentName}`;
  const mountStyle = () => {
    let finalThemeHash = hashClassPrefix;
    const hashValue = hashRef ? hashRef.value : void 0;
    const themeHash = mergedThemeHashRef === null || mergedThemeHashRef === void 0 ? void 0 : mergedThemeHashRef.value;
    if (themeHash) finalThemeHash += `-${themeHash}`;
    if (hashValue) finalThemeHash += `-${hashValue}`;
    const {
      themeOverrides,
      builtinThemeOverrides
    } = props;
    if (themeOverrides) {
      finalThemeHash += `-${hash_browser_esm_default(JSON.stringify(themeOverrides))}`;
    }
    if (builtinThemeOverrides) {
      finalThemeHash += `-${hash_browser_esm_default(JSON.stringify(builtinThemeOverrides))}`;
    }
    themeClassRef.value = finalThemeHash;
    renderCallback = () => {
      const cssVars = cssVarsRef.value;
      let style2 = "";
      for (const key in cssVars) {
        style2 += `${key}: ${cssVars[key]};`;
      }
      c2(`.${finalThemeHash}`, style2).mount({
        id: finalThemeHash,
        ssr: ssrAdapter2,
        parent: styleMountTarget
      });
      renderCallback = void 0;
    };
  };
  watchEffect(() => {
    mountStyle();
  });
  return {
    themeClass: themeClassRef,
    onRender: () => {
      renderCallback === null || renderCallback === void 0 ? void 0 : renderCallback();
    }
  };
}

// ../node_modules/naive-ui/es/_mixins/use-form-item.mjs
import { computed as computed7, inject as inject9, onBeforeUnmount as onBeforeUnmount7, provide as provide3 } from "vue";
var formItemInjectionKey = createInjectionKey("n-form-item");
function useFormItem(props, {
  defaultSize = "medium",
  mergedSize,
  mergedDisabled
} = {}) {
  const NFormItem = inject9(formItemInjectionKey, null);
  provide3(formItemInjectionKey, null);
  const mergedSizeRef = computed7(mergedSize ? () => mergedSize(NFormItem) : () => {
    const {
      size: size2
    } = props;
    if (size2) return size2;
    if (NFormItem) {
      const {
        mergedSize: mergedSize2
      } = NFormItem;
      if (mergedSize2.value !== void 0) {
        return mergedSize2.value;
      }
    }
    return defaultSize;
  });
  const mergedDisabledRef = computed7(mergedDisabled ? () => mergedDisabled(NFormItem) : () => {
    const {
      disabled
    } = props;
    if (disabled !== void 0) {
      return disabled;
    }
    if (NFormItem) {
      return NFormItem.disabled.value;
    }
    return false;
  });
  const mergedStatusRef = computed7(() => {
    const {
      status
    } = props;
    if (status) return status;
    return NFormItem === null || NFormItem === void 0 ? void 0 : NFormItem.mergedValidationStatus.value;
  });
  onBeforeUnmount7(() => {
    if (NFormItem) {
      NFormItem.restoreValidation();
    }
  });
  return {
    mergedSizeRef,
    mergedDisabledRef,
    mergedStatusRef,
    nTriggerFormBlur() {
      if (NFormItem) {
        NFormItem.handleContentBlur();
      }
    },
    nTriggerFormChange() {
      if (NFormItem) {
        NFormItem.handleContentChange();
      }
    },
    nTriggerFormFocus() {
      if (NFormItem) {
        NFormItem.handleContentFocus();
      }
    },
    nTriggerFormInput() {
      if (NFormItem) {
        NFormItem.handleContentInput();
      }
    }
  };
}

// ../node_modules/naive-ui/es/_mixins/use-locale.mjs
import { computed as computed8, inject as inject10 } from "vue";

// ../node_modules/naive-ui/es/locales/common/enUS.mjs
var enUS = {
  name: "en-US",
  global: {
    undo: "Undo",
    redo: "Redo",
    confirm: "Confirm",
    clear: "Clear"
  },
  Popconfirm: {
    positiveText: "Confirm",
    negativeText: "Cancel"
  },
  Cascader: {
    placeholder: "Please Select",
    loading: "Loading",
    loadingRequiredMessage: (label) => `Please load all ${label}'s descendants before checking it.`
  },
  Time: {
    dateFormat: "yyyy-MM-dd",
    dateTimeFormat: "yyyy-MM-dd HH:mm:ss"
  },
  DatePicker: {
    yearFormat: "yyyy",
    monthFormat: "MMM",
    dayFormat: "eeeeee",
    yearTypeFormat: "yyyy",
    monthTypeFormat: "yyyy-MM",
    dateFormat: "yyyy-MM-dd",
    dateTimeFormat: "yyyy-MM-dd HH:mm:ss",
    quarterFormat: "yyyy-qqq",
    weekFormat: "YYYY-w",
    clear: "Clear",
    now: "Now",
    confirm: "Confirm",
    selectTime: "Select Time",
    selectDate: "Select Date",
    datePlaceholder: "Select Date",
    datetimePlaceholder: "Select Date and Time",
    monthPlaceholder: "Select Month",
    yearPlaceholder: "Select Year",
    quarterPlaceholder: "Select Quarter",
    weekPlaceholder: "Select Week",
    startDatePlaceholder: "Start Date",
    endDatePlaceholder: "End Date",
    startDatetimePlaceholder: "Start Date and Time",
    endDatetimePlaceholder: "End Date and Time",
    startMonthPlaceholder: "Start Month",
    endMonthPlaceholder: "End Month",
    monthBeforeYear: true,
    firstDayOfWeek: 6,
    today: "Today"
  },
  DataTable: {
    checkTableAll: "Select all in the table",
    uncheckTableAll: "Unselect all in the table",
    confirm: "Confirm",
    clear: "Clear"
  },
  LegacyTransfer: {
    sourceTitle: "Source",
    targetTitle: "Target"
  },
  Transfer: {
    selectAll: "Select all",
    unselectAll: "Unselect all",
    clearAll: "Clear",
    total: (num) => `Total ${num} items`,
    selected: (num) => `${num} items selected`
  },
  Empty: {
    description: "No Data"
  },
  Select: {
    placeholder: "Please Select"
  },
  TimePicker: {
    placeholder: "Select Time",
    positiveText: "OK",
    negativeText: "Cancel",
    now: "Now",
    clear: "Clear"
  },
  Pagination: {
    goto: "Goto",
    selectionSuffix: "page"
  },
  DynamicTags: {
    add: "Add"
  },
  Log: {
    loading: "Loading"
  },
  Input: {
    placeholder: "Please Input"
  },
  InputNumber: {
    placeholder: "Please Input"
  },
  DynamicInput: {
    create: "Create"
  },
  ThemeEditor: {
    title: "Theme Editor",
    clearAllVars: "Clear All Variables",
    clearSearch: "Clear Search",
    filterCompName: "Filter Component Name",
    filterVarName: "Filter Variable Name",
    import: "Import",
    export: "Export",
    restore: "Reset to Default"
  },
  Image: {
    tipPrevious: "Previous picture (\u2190)",
    tipNext: "Next picture (\u2192)",
    tipCounterclockwise: "Counterclockwise",
    tipClockwise: "Clockwise",
    tipZoomOut: "Zoom out",
    tipZoomIn: "Zoom in",
    tipDownload: "Download",
    tipClose: "Close (Esc)",
    // TODO: translation
    tipOriginalSize: "Zoom to original size"
  }
};
var enUS_default = enUS;

// ../node_modules/date-fns/locale/_lib/buildFormatLongFn.mjs
function buildFormatLongFn(args) {
  return (options = {}) => {
    const width = options.width ? String(options.width) : args.defaultWidth;
    const format3 = args.formats[width] || args.formats[args.defaultWidth];
    return format3;
  };
}

// ../node_modules/date-fns/locale/_lib/buildLocalizeFn.mjs
function buildLocalizeFn(args) {
  return (value, options) => {
    const context = options?.context ? String(options.context) : "standalone";
    let valuesArray;
    if (context === "formatting" && args.formattingValues) {
      const defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
      const width = options?.width ? String(options.width) : defaultWidth;
      valuesArray = args.formattingValues[width] || args.formattingValues[defaultWidth];
    } else {
      const defaultWidth = args.defaultWidth;
      const width = options?.width ? String(options.width) : args.defaultWidth;
      valuesArray = args.values[width] || args.values[defaultWidth];
    }
    const index = args.argumentCallback ? args.argumentCallback(value) : value;
    return valuesArray[index];
  };
}

// ../node_modules/date-fns/locale/_lib/buildMatchFn.mjs
function buildMatchFn(args) {
  return (string, options = {}) => {
    const width = options.width;
    const matchPattern = width && args.matchPatterns[width] || args.matchPatterns[args.defaultMatchWidth];
    const matchResult = string.match(matchPattern);
    if (!matchResult) {
      return null;
    }
    const matchedString = matchResult[0];
    const parsePatterns = width && args.parsePatterns[width] || args.parsePatterns[args.defaultParseWidth];
    const key = Array.isArray(parsePatterns) ? findIndex(parsePatterns, (pattern) => pattern.test(matchedString)) : (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- I challange you to fix the type
      findKey(parsePatterns, (pattern) => pattern.test(matchedString))
    );
    let value;
    value = args.valueCallback ? args.valueCallback(key) : key;
    value = options.valueCallback ? (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- I challange you to fix the type
      options.valueCallback(value)
    ) : value;
    const rest = string.slice(matchedString.length);
    return { value, rest };
  };
}
function findKey(object, predicate) {
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key) && predicate(object[key])) {
      return key;
    }
  }
  return void 0;
}
function findIndex(array, predicate) {
  for (let key = 0; key < array.length; key++) {
    if (predicate(array[key])) {
      return key;
    }
  }
  return void 0;
}

// ../node_modules/date-fns/locale/_lib/buildMatchPatternFn.mjs
function buildMatchPatternFn(args) {
  return (string, options = {}) => {
    const matchResult = string.match(args.matchPattern);
    if (!matchResult) return null;
    const matchedString = matchResult[0];
    const parseResult = string.match(args.parsePattern);
    if (!parseResult) return null;
    let value = args.valueCallback ? args.valueCallback(parseResult[0]) : parseResult[0];
    value = options.valueCallback ? options.valueCallback(value) : value;
    const rest = string.slice(matchedString.length);
    return { value, rest };
  };
}

// ../node_modules/date-fns/toDate.mjs
function toDate(argument) {
  const argStr = Object.prototype.toString.call(argument);
  if (argument instanceof Date || typeof argument === "object" && argStr === "[object Date]") {
    return new argument.constructor(+argument);
  } else if (typeof argument === "number" || argStr === "[object Number]" || typeof argument === "string" || argStr === "[object String]") {
    return new Date(argument);
  } else {
    return /* @__PURE__ */ new Date(NaN);
  }
}

// ../node_modules/date-fns/_lib/defaultOptions.mjs
var defaultOptions = {};
function getDefaultOptions() {
  return defaultOptions;
}

// ../node_modules/date-fns/startOfWeek.mjs
function startOfWeek(date, options) {
  const defaultOptions2 = getDefaultOptions();
  const weekStartsOn = options?.weekStartsOn ?? options?.locale?.options?.weekStartsOn ?? defaultOptions2.weekStartsOn ?? defaultOptions2.locale?.options?.weekStartsOn ?? 0;
  const _date = toDate(date);
  const day = _date.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  _date.setDate(_date.getDate() - diff);
  _date.setHours(0, 0, 0, 0);
  return _date;
}

// ../node_modules/date-fns/isSameWeek.mjs
function isSameWeek(dateLeft, dateRight, options) {
  const dateLeftStartOfWeek = startOfWeek(dateLeft, options);
  const dateRightStartOfWeek = startOfWeek(dateRight, options);
  return +dateLeftStartOfWeek === +dateRightStartOfWeek;
}

// ../node_modules/date-fns/locale/en-US/_lib/formatDistance.mjs
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "less than a second",
    other: "less than {{count}} seconds"
  },
  xSeconds: {
    one: "1 second",
    other: "{{count}} seconds"
  },
  halfAMinute: "half a minute",
  lessThanXMinutes: {
    one: "less than a minute",
    other: "less than {{count}} minutes"
  },
  xMinutes: {
    one: "1 minute",
    other: "{{count}} minutes"
  },
  aboutXHours: {
    one: "about 1 hour",
    other: "about {{count}} hours"
  },
  xHours: {
    one: "1 hour",
    other: "{{count}} hours"
  },
  xDays: {
    one: "1 day",
    other: "{{count}} days"
  },
  aboutXWeeks: {
    one: "about 1 week",
    other: "about {{count}} weeks"
  },
  xWeeks: {
    one: "1 week",
    other: "{{count}} weeks"
  },
  aboutXMonths: {
    one: "about 1 month",
    other: "about {{count}} months"
  },
  xMonths: {
    one: "1 month",
    other: "{{count}} months"
  },
  aboutXYears: {
    one: "about 1 year",
    other: "about {{count}} years"
  },
  xYears: {
    one: "1 year",
    other: "{{count}} years"
  },
  overXYears: {
    one: "over 1 year",
    other: "over {{count}} years"
  },
  almostXYears: {
    one: "almost 1 year",
    other: "almost {{count}} years"
  }
};
var formatDistance = (token, count, options) => {
  let result;
  const tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") {
    result = tokenValue;
  } else if (count === 1) {
    result = tokenValue.one;
  } else {
    result = tokenValue.other.replace("{{count}}", count.toString());
  }
  if (options?.addSuffix) {
    if (options.comparison && options.comparison > 0) {
      return "in " + result;
    } else {
      return result + " ago";
    }
  }
  return result;
};

// ../node_modules/date-fns/locale/en-US/_lib/formatRelative.mjs
var formatRelativeLocale = {
  lastWeek: "'last' eeee 'at' p",
  yesterday: "'yesterday at' p",
  today: "'today at' p",
  tomorrow: "'tomorrow at' p",
  nextWeek: "eeee 'at' p",
  other: "P"
};
var formatRelative = (token, _date, _baseDate, _options) => formatRelativeLocale[token];

// ../node_modules/date-fns/locale/en-US/_lib/localize.mjs
var eraValues = {
  narrow: ["B", "A"],
  abbreviated: ["BC", "AD"],
  wide: ["Before Christ", "Anno Domini"]
};
var quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"]
};
var monthValues = {
  narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
  abbreviated: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ],
  wide: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ]
};
var dayValues = {
  narrow: ["S", "M", "T", "W", "T", "F", "S"],
  short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  wide: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ]
};
var dayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  }
};
var ordinalNumber = (dirtyNumber, _options) => {
  const number = Number(dirtyNumber);
  const rem100 = number % 100;
  if (rem100 > 20 || rem100 < 10) {
    switch (rem100 % 10) {
      case 1:
        return number + "st";
      case 2:
        return number + "nd";
      case 3:
        return number + "rd";
    }
  }
  return number + "th";
};
var localize = {
  ordinalNumber,
  era: buildLocalizeFn({
    values: eraValues,
    defaultWidth: "wide"
  }),
  quarter: buildLocalizeFn({
    values: quarterValues,
    defaultWidth: "wide",
    argumentCallback: (quarter) => quarter - 1
  }),
  month: buildLocalizeFn({
    values: monthValues,
    defaultWidth: "wide"
  }),
  day: buildLocalizeFn({
    values: dayValues,
    defaultWidth: "wide"
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues,
    defaultWidth: "wide",
    formattingValues: formattingDayPeriodValues,
    defaultFormattingWidth: "wide"
  })
};

// ../node_modules/date-fns/locale/en-US/_lib/match.mjs
var matchOrdinalNumberPattern = /^(\d+)(th|st|nd|rd)?/i;
var parseOrdinalNumberPattern = /\d+/i;
var matchEraPatterns = {
  narrow: /^(b|a)/i,
  abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
  wide: /^(before christ|before common era|anno domini|common era)/i
};
var parseEraPatterns = {
  any: [/^b/i, /^(a|c)/i]
};
var matchQuarterPatterns = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](th|st|nd|rd)? quarter/i
};
var parseQuarterPatterns = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
};
var parseMonthPatterns = {
  narrow: [
    /^j/i,
    /^f/i,
    /^m/i,
    /^a/i,
    /^m/i,
    /^j/i,
    /^j/i,
    /^a/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ],
  any: [
    /^ja/i,
    /^f/i,
    /^mar/i,
    /^ap/i,
    /^may/i,
    /^jun/i,
    /^jul/i,
    /^au/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ]
};
var matchDayPatterns = {
  narrow: /^[smtwf]/i,
  short: /^(su|mo|tu|we|th|fr|sa)/i,
  abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
  wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
};
var parseDayPatterns = {
  narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
  any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
};
var matchDayPeriodPatterns = {
  narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
  any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
};
var parseDayPeriodPatterns = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mi/i,
    noon: /^no/i,
    morning: /morning/i,
    afternoon: /afternoon/i,
    evening: /evening/i,
    night: /night/i
  }
};
var match = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern,
    parsePattern: parseOrdinalNumberPattern,
    valueCallback: (value) => parseInt(value, 10)
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseEraPatterns,
    defaultParseWidth: "any"
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseQuarterPatterns,
    defaultParseWidth: "any",
    valueCallback: (index) => index + 1
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseMonthPatterns,
    defaultParseWidth: "any"
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseDayPatterns,
    defaultParseWidth: "any"
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns,
    defaultMatchWidth: "any",
    parsePatterns: parseDayPeriodPatterns,
    defaultParseWidth: "any"
  })
};

// ../node_modules/date-fns/locale/en-US/_lib/formatLong.mjs
var dateFormats = {
  full: "EEEE, MMMM do, y",
  long: "MMMM do, y",
  medium: "MMM d, y",
  short: "MM/dd/yyyy"
};
var timeFormats = {
  full: "h:mm:ss a zzzz",
  long: "h:mm:ss a z",
  medium: "h:mm:ss a",
  short: "h:mm a"
};
var dateTimeFormats = {
  full: "{{date}} 'at' {{time}}",
  long: "{{date}} 'at' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}"
};
var formatLong = {
  date: buildFormatLongFn({
    formats: dateFormats,
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: timeFormats,
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats,
    defaultWidth: "full"
  })
};

// ../node_modules/date-fns/locale/en-US.mjs
var enUS2 = {
  code: "en-US",
  formatDistance,
  formatLong,
  formatRelative,
  localize,
  match,
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 1
  }
};

// ../node_modules/naive-ui/es/locales/date/enUS.mjs
var dateEnUs = {
  name: "en-US",
  locale: enUS2
};
var enUS_default2 = dateEnUs;

// ../node_modules/lodash-es/_freeGlobal.js
var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
var freeGlobal_default = freeGlobal;

// ../node_modules/lodash-es/_root.js
var freeSelf = typeof self == "object" && self && self.Object === Object && self;
var root = freeGlobal_default || freeSelf || Function("return this")();
var root_default = root;

// ../node_modules/lodash-es/_Symbol.js
var Symbol = root_default.Symbol;
var Symbol_default = Symbol;

// ../node_modules/lodash-es/_getRawTag.js
var objectProto = Object.prototype;
var hasOwnProperty = objectProto.hasOwnProperty;
var nativeObjectToString = objectProto.toString;
var symToStringTag = Symbol_default ? Symbol_default.toStringTag : void 0;
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
  try {
    value[symToStringTag] = void 0;
    var unmasked = true;
  } catch (e) {
  }
  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}
var getRawTag_default = getRawTag;

// ../node_modules/lodash-es/_objectToString.js
var objectProto2 = Object.prototype;
var nativeObjectToString2 = objectProto2.toString;
function objectToString(value) {
  return nativeObjectToString2.call(value);
}
var objectToString_default = objectToString;

// ../node_modules/lodash-es/_baseGetTag.js
var nullTag = "[object Null]";
var undefinedTag = "[object Undefined]";
var symToStringTag2 = Symbol_default ? Symbol_default.toStringTag : void 0;
function baseGetTag(value) {
  if (value == null) {
    return value === void 0 ? undefinedTag : nullTag;
  }
  return symToStringTag2 && symToStringTag2 in Object(value) ? getRawTag_default(value) : objectToString_default(value);
}
var baseGetTag_default = baseGetTag;

// ../node_modules/lodash-es/isObjectLike.js
function isObjectLike(value) {
  return value != null && typeof value == "object";
}
var isObjectLike_default = isObjectLike;

// ../node_modules/lodash-es/isSymbol.js
var symbolTag = "[object Symbol]";
function isSymbol(value) {
  return typeof value == "symbol" || isObjectLike_default(value) && baseGetTag_default(value) == symbolTag;
}
var isSymbol_default = isSymbol;

// ../node_modules/lodash-es/_arrayMap.js
function arrayMap(array, iteratee) {
  var index = -1, length = array == null ? 0 : array.length, result = Array(length);
  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}
var arrayMap_default = arrayMap;

// ../node_modules/lodash-es/isArray.js
var isArray = Array.isArray;
var isArray_default = isArray;

// ../node_modules/lodash-es/_baseToString.js
var INFINITY = 1 / 0;
var symbolProto = Symbol_default ? Symbol_default.prototype : void 0;
var symbolToString = symbolProto ? symbolProto.toString : void 0;
function baseToString(value) {
  if (typeof value == "string") {
    return value;
  }
  if (isArray_default(value)) {
    return arrayMap_default(value, baseToString) + "";
  }
  if (isSymbol_default(value)) {
    return symbolToString ? symbolToString.call(value) : "";
  }
  var result = value + "";
  return result == "0" && 1 / value == -INFINITY ? "-0" : result;
}
var baseToString_default = baseToString;

// ../node_modules/lodash-es/isObject.js
function isObject(value) {
  var type = typeof value;
  return value != null && (type == "object" || type == "function");
}
var isObject_default = isObject;

// ../node_modules/lodash-es/identity.js
function identity(value) {
  return value;
}
var identity_default = identity;

// ../node_modules/lodash-es/isFunction.js
var asyncTag = "[object AsyncFunction]";
var funcTag = "[object Function]";
var genTag = "[object GeneratorFunction]";
var proxyTag = "[object Proxy]";
function isFunction(value) {
  if (!isObject_default(value)) {
    return false;
  }
  var tag = baseGetTag_default(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}
var isFunction_default = isFunction;

// ../node_modules/lodash-es/_coreJsData.js
var coreJsData = root_default["__core-js_shared__"];
var coreJsData_default = coreJsData;

// ../node_modules/lodash-es/_isMasked.js
var maskSrcKey = function() {
  var uid = /[^.]+$/.exec(coreJsData_default && coreJsData_default.keys && coreJsData_default.keys.IE_PROTO || "");
  return uid ? "Symbol(src)_1." + uid : "";
}();
function isMasked(func) {
  return !!maskSrcKey && maskSrcKey in func;
}
var isMasked_default = isMasked;

// ../node_modules/lodash-es/_toSource.js
var funcProto = Function.prototype;
var funcToString = funcProto.toString;
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {
    }
    try {
      return func + "";
    } catch (e) {
    }
  }
  return "";
}
var toSource_default = toSource;

// ../node_modules/lodash-es/_baseIsNative.js
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
var reIsHostCtor = /^\[object .+?Constructor\]$/;
var funcProto2 = Function.prototype;
var objectProto3 = Object.prototype;
var funcToString2 = funcProto2.toString;
var hasOwnProperty2 = objectProto3.hasOwnProperty;
var reIsNative = RegExp(
  "^" + funcToString2.call(hasOwnProperty2).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
);
function baseIsNative(value) {
  if (!isObject_default(value) || isMasked_default(value)) {
    return false;
  }
  var pattern = isFunction_default(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource_default(value));
}
var baseIsNative_default = baseIsNative;

// ../node_modules/lodash-es/_getValue.js
function getValue(object, key) {
  return object == null ? void 0 : object[key];
}
var getValue_default = getValue;

// ../node_modules/lodash-es/_getNative.js
function getNative(object, key) {
  var value = getValue_default(object, key);
  return baseIsNative_default(value) ? value : void 0;
}
var getNative_default = getNative;

// ../node_modules/lodash-es/_baseCreate.js
var objectCreate = Object.create;
var baseCreate = /* @__PURE__ */ function() {
  function object() {
  }
  return function(proto) {
    if (!isObject_default(proto)) {
      return {};
    }
    if (objectCreate) {
      return objectCreate(proto);
    }
    object.prototype = proto;
    var result = new object();
    object.prototype = void 0;
    return result;
  };
}();
var baseCreate_default = baseCreate;

// ../node_modules/lodash-es/_apply.js
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0:
      return func.call(thisArg);
    case 1:
      return func.call(thisArg, args[0]);
    case 2:
      return func.call(thisArg, args[0], args[1]);
    case 3:
      return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}
var apply_default = apply;

// ../node_modules/lodash-es/_copyArray.js
function copyArray(source, array) {
  var index = -1, length = source.length;
  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}
var copyArray_default = copyArray;

// ../node_modules/lodash-es/_shortOut.js
var HOT_COUNT = 800;
var HOT_SPAN = 16;
var nativeNow = Date.now;
function shortOut(func) {
  var count = 0, lastCalled = 0;
  return function() {
    var stamp = nativeNow(), remaining = HOT_SPAN - (stamp - lastCalled);
    lastCalled = stamp;
    if (remaining > 0) {
      if (++count >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count = 0;
    }
    return func.apply(void 0, arguments);
  };
}
var shortOut_default = shortOut;

// ../node_modules/lodash-es/constant.js
function constant(value) {
  return function() {
    return value;
  };
}
var constant_default = constant;

// ../node_modules/lodash-es/_defineProperty.js
var defineProperty = function() {
  try {
    var func = getNative_default(Object, "defineProperty");
    func({}, "", {});
    return func;
  } catch (e) {
  }
}();
var defineProperty_default = defineProperty;

// ../node_modules/lodash-es/_baseSetToString.js
var baseSetToString = !defineProperty_default ? identity_default : function(func, string) {
  return defineProperty_default(func, "toString", {
    "configurable": true,
    "enumerable": false,
    "value": constant_default(string),
    "writable": true
  });
};
var baseSetToString_default = baseSetToString;

// ../node_modules/lodash-es/_setToString.js
var setToString = shortOut_default(baseSetToString_default);
var setToString_default = setToString;

// ../node_modules/lodash-es/_isIndex.js
var MAX_SAFE_INTEGER = 9007199254740991;
var reIsUint = /^(?:0|[1-9]\d*)$/;
function isIndex(value, length) {
  var type = typeof value;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return !!length && (type == "number" || type != "symbol" && reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
}
var isIndex_default = isIndex;

// ../node_modules/lodash-es/_baseAssignValue.js
function baseAssignValue(object, key, value) {
  if (key == "__proto__" && defineProperty_default) {
    defineProperty_default(object, key, {
      "configurable": true,
      "enumerable": true,
      "value": value,
      "writable": true
    });
  } else {
    object[key] = value;
  }
}
var baseAssignValue_default = baseAssignValue;

// ../node_modules/lodash-es/eq.js
function eq(value, other) {
  return value === other || value !== value && other !== other;
}
var eq_default = eq;

// ../node_modules/lodash-es/_assignValue.js
var objectProto4 = Object.prototype;
var hasOwnProperty3 = objectProto4.hasOwnProperty;
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty3.call(object, key) && eq_default(objValue, value)) || value === void 0 && !(key in object)) {
    baseAssignValue_default(object, key, value);
  }
}
var assignValue_default = assignValue;

// ../node_modules/lodash-es/_copyObject.js
function copyObject(source, props, object, customizer) {
  var isNew = !object;
  object || (object = {});
  var index = -1, length = props.length;
  while (++index < length) {
    var key = props[index];
    var newValue = customizer ? customizer(object[key], source[key], key, object, source) : void 0;
    if (newValue === void 0) {
      newValue = source[key];
    }
    if (isNew) {
      baseAssignValue_default(object, key, newValue);
    } else {
      assignValue_default(object, key, newValue);
    }
  }
  return object;
}
var copyObject_default = copyObject;

// ../node_modules/lodash-es/_overRest.js
var nativeMax = Math.max;
function overRest(func, start, transform) {
  start = nativeMax(start === void 0 ? func.length - 1 : start, 0);
  return function() {
    var args = arguments, index = -1, length = nativeMax(args.length - start, 0), array = Array(length);
    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = transform(array);
    return apply_default(func, this, otherArgs);
  };
}
var overRest_default = overRest;

// ../node_modules/lodash-es/_baseRest.js
function baseRest(func, start) {
  return setToString_default(overRest_default(func, start, identity_default), func + "");
}
var baseRest_default = baseRest;

// ../node_modules/lodash-es/isLength.js
var MAX_SAFE_INTEGER2 = 9007199254740991;
function isLength(value) {
  return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER2;
}
var isLength_default = isLength;

// ../node_modules/lodash-es/isArrayLike.js
function isArrayLike(value) {
  return value != null && isLength_default(value.length) && !isFunction_default(value);
}
var isArrayLike_default = isArrayLike;

// ../node_modules/lodash-es/_isIterateeCall.js
function isIterateeCall(value, index, object) {
  if (!isObject_default(object)) {
    return false;
  }
  var type = typeof index;
  if (type == "number" ? isArrayLike_default(object) && isIndex_default(index, object.length) : type == "string" && index in object) {
    return eq_default(object[index], value);
  }
  return false;
}
var isIterateeCall_default = isIterateeCall;

// ../node_modules/lodash-es/_createAssigner.js
function createAssigner(assigner) {
  return baseRest_default(function(object, sources) {
    var index = -1, length = sources.length, customizer = length > 1 ? sources[length - 1] : void 0, guard = length > 2 ? sources[2] : void 0;
    customizer = assigner.length > 3 && typeof customizer == "function" ? (length--, customizer) : void 0;
    if (guard && isIterateeCall_default(sources[0], sources[1], guard)) {
      customizer = length < 3 ? void 0 : customizer;
      length = 1;
    }
    object = Object(object);
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, index, customizer);
      }
    }
    return object;
  });
}
var createAssigner_default = createAssigner;

// ../node_modules/lodash-es/_isPrototype.js
var objectProto5 = Object.prototype;
function isPrototype(value) {
  var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto5;
  return value === proto;
}
var isPrototype_default = isPrototype;

// ../node_modules/lodash-es/_baseTimes.js
function baseTimes(n, iteratee) {
  var index = -1, result = Array(n);
  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}
var baseTimes_default = baseTimes;

// ../node_modules/lodash-es/_baseIsArguments.js
var argsTag = "[object Arguments]";
function baseIsArguments(value) {
  return isObjectLike_default(value) && baseGetTag_default(value) == argsTag;
}
var baseIsArguments_default = baseIsArguments;

// ../node_modules/lodash-es/isArguments.js
var objectProto6 = Object.prototype;
var hasOwnProperty4 = objectProto6.hasOwnProperty;
var propertyIsEnumerable = objectProto6.propertyIsEnumerable;
var isArguments = baseIsArguments_default(/* @__PURE__ */ function() {
  return arguments;
}()) ? baseIsArguments_default : function(value) {
  return isObjectLike_default(value) && hasOwnProperty4.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
};
var isArguments_default = isArguments;

// ../node_modules/lodash-es/stubFalse.js
function stubFalse() {
  return false;
}
var stubFalse_default = stubFalse;

// ../node_modules/lodash-es/isBuffer.js
var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
var moduleExports = freeModule && freeModule.exports === freeExports;
var Buffer = moduleExports ? root_default.Buffer : void 0;
var nativeIsBuffer = Buffer ? Buffer.isBuffer : void 0;
var isBuffer = nativeIsBuffer || stubFalse_default;
var isBuffer_default = isBuffer;

// ../node_modules/lodash-es/_baseIsTypedArray.js
var argsTag2 = "[object Arguments]";
var arrayTag = "[object Array]";
var boolTag = "[object Boolean]";
var dateTag = "[object Date]";
var errorTag = "[object Error]";
var funcTag2 = "[object Function]";
var mapTag = "[object Map]";
var numberTag = "[object Number]";
var objectTag = "[object Object]";
var regexpTag = "[object RegExp]";
var setTag = "[object Set]";
var stringTag = "[object String]";
var weakMapTag = "[object WeakMap]";
var arrayBufferTag = "[object ArrayBuffer]";
var dataViewTag = "[object DataView]";
var float32Tag = "[object Float32Array]";
var float64Tag = "[object Float64Array]";
var int8Tag = "[object Int8Array]";
var int16Tag = "[object Int16Array]";
var int32Tag = "[object Int32Array]";
var uint8Tag = "[object Uint8Array]";
var uint8ClampedTag = "[object Uint8ClampedArray]";
var uint16Tag = "[object Uint16Array]";
var uint32Tag = "[object Uint32Array]";
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag2] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag2] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
function baseIsTypedArray(value) {
  return isObjectLike_default(value) && isLength_default(value.length) && !!typedArrayTags[baseGetTag_default(value)];
}
var baseIsTypedArray_default = baseIsTypedArray;

// ../node_modules/lodash-es/_baseUnary.js
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}
var baseUnary_default = baseUnary;

// ../node_modules/lodash-es/_nodeUtil.js
var freeExports2 = typeof exports == "object" && exports && !exports.nodeType && exports;
var freeModule2 = freeExports2 && typeof module == "object" && module && !module.nodeType && module;
var moduleExports2 = freeModule2 && freeModule2.exports === freeExports2;
var freeProcess = moduleExports2 && freeGlobal_default.process;
var nodeUtil = function() {
  try {
    var types = freeModule2 && freeModule2.require && freeModule2.require("util").types;
    if (types) {
      return types;
    }
    return freeProcess && freeProcess.binding && freeProcess.binding("util");
  } catch (e) {
  }
}();
var nodeUtil_default = nodeUtil;

// ../node_modules/lodash-es/isTypedArray.js
var nodeIsTypedArray = nodeUtil_default && nodeUtil_default.isTypedArray;
var isTypedArray = nodeIsTypedArray ? baseUnary_default(nodeIsTypedArray) : baseIsTypedArray_default;
var isTypedArray_default = isTypedArray;

// ../node_modules/lodash-es/_arrayLikeKeys.js
var objectProto7 = Object.prototype;
var hasOwnProperty5 = objectProto7.hasOwnProperty;
function arrayLikeKeys(value, inherited) {
  var isArr = isArray_default(value), isArg = !isArr && isArguments_default(value), isBuff = !isArr && !isArg && isBuffer_default(value), isType = !isArr && !isArg && !isBuff && isTypedArray_default(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes_default(value.length, String) : [], length = result.length;
  for (var key in value) {
    if ((inherited || hasOwnProperty5.call(value, key)) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
    (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
    isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
    isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
    isIndex_default(key, length)))) {
      result.push(key);
    }
  }
  return result;
}
var arrayLikeKeys_default = arrayLikeKeys;

// ../node_modules/lodash-es/_overArg.js
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}
var overArg_default = overArg;

// ../node_modules/lodash-es/_nativeKeysIn.js
function nativeKeysIn(object) {
  var result = [];
  if (object != null) {
    for (var key in Object(object)) {
      result.push(key);
    }
  }
  return result;
}
var nativeKeysIn_default = nativeKeysIn;

// ../node_modules/lodash-es/_baseKeysIn.js
var objectProto8 = Object.prototype;
var hasOwnProperty6 = objectProto8.hasOwnProperty;
function baseKeysIn(object) {
  if (!isObject_default(object)) {
    return nativeKeysIn_default(object);
  }
  var isProto = isPrototype_default(object), result = [];
  for (var key in object) {
    if (!(key == "constructor" && (isProto || !hasOwnProperty6.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}
var baseKeysIn_default = baseKeysIn;

// ../node_modules/lodash-es/keysIn.js
function keysIn(object) {
  return isArrayLike_default(object) ? arrayLikeKeys_default(object, true) : baseKeysIn_default(object);
}
var keysIn_default = keysIn;

// ../node_modules/lodash-es/_nativeCreate.js
var nativeCreate = getNative_default(Object, "create");
var nativeCreate_default = nativeCreate;

// ../node_modules/lodash-es/_hashClear.js
function hashClear() {
  this.__data__ = nativeCreate_default ? nativeCreate_default(null) : {};
  this.size = 0;
}
var hashClear_default = hashClear;

// ../node_modules/lodash-es/_hashDelete.js
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}
var hashDelete_default = hashDelete;

// ../node_modules/lodash-es/_hashGet.js
var HASH_UNDEFINED = "__lodash_hash_undefined__";
var objectProto9 = Object.prototype;
var hasOwnProperty7 = objectProto9.hasOwnProperty;
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate_default) {
    var result = data[key];
    return result === HASH_UNDEFINED ? void 0 : result;
  }
  return hasOwnProperty7.call(data, key) ? data[key] : void 0;
}
var hashGet_default = hashGet;

// ../node_modules/lodash-es/_hashHas.js
var objectProto10 = Object.prototype;
var hasOwnProperty8 = objectProto10.hasOwnProperty;
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate_default ? data[key] !== void 0 : hasOwnProperty8.call(data, key);
}
var hashHas_default = hashHas;

// ../node_modules/lodash-es/_hashSet.js
var HASH_UNDEFINED2 = "__lodash_hash_undefined__";
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = nativeCreate_default && value === void 0 ? HASH_UNDEFINED2 : value;
  return this;
}
var hashSet_default = hashSet;

// ../node_modules/lodash-es/_Hash.js
function Hash(entries) {
  var index = -1, length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}
Hash.prototype.clear = hashClear_default;
Hash.prototype["delete"] = hashDelete_default;
Hash.prototype.get = hashGet_default;
Hash.prototype.has = hashHas_default;
Hash.prototype.set = hashSet_default;
var Hash_default = Hash;

// ../node_modules/lodash-es/_listCacheClear.js
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}
var listCacheClear_default = listCacheClear;

// ../node_modules/lodash-es/_assocIndexOf.js
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq_default(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}
var assocIndexOf_default = assocIndexOf;

// ../node_modules/lodash-es/_listCacheDelete.js
var arrayProto = Array.prototype;
var splice = arrayProto.splice;
function listCacheDelete(key) {
  var data = this.__data__, index = assocIndexOf_default(data, key);
  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}
var listCacheDelete_default = listCacheDelete;

// ../node_modules/lodash-es/_listCacheGet.js
function listCacheGet(key) {
  var data = this.__data__, index = assocIndexOf_default(data, key);
  return index < 0 ? void 0 : data[index][1];
}
var listCacheGet_default = listCacheGet;

// ../node_modules/lodash-es/_listCacheHas.js
function listCacheHas(key) {
  return assocIndexOf_default(this.__data__, key) > -1;
}
var listCacheHas_default = listCacheHas;

// ../node_modules/lodash-es/_listCacheSet.js
function listCacheSet(key, value) {
  var data = this.__data__, index = assocIndexOf_default(data, key);
  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}
var listCacheSet_default = listCacheSet;

// ../node_modules/lodash-es/_ListCache.js
function ListCache(entries) {
  var index = -1, length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}
ListCache.prototype.clear = listCacheClear_default;
ListCache.prototype["delete"] = listCacheDelete_default;
ListCache.prototype.get = listCacheGet_default;
ListCache.prototype.has = listCacheHas_default;
ListCache.prototype.set = listCacheSet_default;
var ListCache_default = ListCache;

// ../node_modules/lodash-es/_Map.js
var Map2 = getNative_default(root_default, "Map");
var Map_default = Map2;

// ../node_modules/lodash-es/_mapCacheClear.js
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    "hash": new Hash_default(),
    "map": new (Map_default || ListCache_default)(),
    "string": new Hash_default()
  };
}
var mapCacheClear_default = mapCacheClear;

// ../node_modules/lodash-es/_isKeyable.js
function isKeyable(value) {
  var type = typeof value;
  return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
}
var isKeyable_default = isKeyable;

// ../node_modules/lodash-es/_getMapData.js
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable_default(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
}
var getMapData_default = getMapData;

// ../node_modules/lodash-es/_mapCacheDelete.js
function mapCacheDelete(key) {
  var result = getMapData_default(this, key)["delete"](key);
  this.size -= result ? 1 : 0;
  return result;
}
var mapCacheDelete_default = mapCacheDelete;

// ../node_modules/lodash-es/_mapCacheGet.js
function mapCacheGet(key) {
  return getMapData_default(this, key).get(key);
}
var mapCacheGet_default = mapCacheGet;

// ../node_modules/lodash-es/_mapCacheHas.js
function mapCacheHas(key) {
  return getMapData_default(this, key).has(key);
}
var mapCacheHas_default = mapCacheHas;

// ../node_modules/lodash-es/_mapCacheSet.js
function mapCacheSet(key, value) {
  var data = getMapData_default(this, key), size2 = data.size;
  data.set(key, value);
  this.size += data.size == size2 ? 0 : 1;
  return this;
}
var mapCacheSet_default = mapCacheSet;

// ../node_modules/lodash-es/_MapCache.js
function MapCache(entries) {
  var index = -1, length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}
MapCache.prototype.clear = mapCacheClear_default;
MapCache.prototype["delete"] = mapCacheDelete_default;
MapCache.prototype.get = mapCacheGet_default;
MapCache.prototype.has = mapCacheHas_default;
MapCache.prototype.set = mapCacheSet_default;
var MapCache_default = MapCache;

// ../node_modules/lodash-es/toString.js
function toString(value) {
  return value == null ? "" : baseToString_default(value);
}
var toString_default = toString;

// ../node_modules/lodash-es/_getPrototype.js
var getPrototype = overArg_default(Object.getPrototypeOf, Object);
var getPrototype_default = getPrototype;

// ../node_modules/lodash-es/isPlainObject.js
var objectTag2 = "[object Object]";
var funcProto3 = Function.prototype;
var objectProto11 = Object.prototype;
var funcToString3 = funcProto3.toString;
var hasOwnProperty9 = objectProto11.hasOwnProperty;
var objectCtorString = funcToString3.call(Object);
function isPlainObject(value) {
  if (!isObjectLike_default(value) || baseGetTag_default(value) != objectTag2) {
    return false;
  }
  var proto = getPrototype_default(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty9.call(proto, "constructor") && proto.constructor;
  return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString3.call(Ctor) == objectCtorString;
}
var isPlainObject_default = isPlainObject;

// ../node_modules/lodash-es/_baseSlice.js
function baseSlice(array, start, end) {
  var index = -1, length = array.length;
  if (start < 0) {
    start = -start > length ? 0 : length + start;
  }
  end = end > length ? length : end;
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : end - start >>> 0;
  start >>>= 0;
  var result = Array(length);
  while (++index < length) {
    result[index] = array[index + start];
  }
  return result;
}
var baseSlice_default = baseSlice;

// ../node_modules/lodash-es/_castSlice.js
function castSlice(array, start, end) {
  var length = array.length;
  end = end === void 0 ? length : end;
  return !start && end >= length ? array : baseSlice_default(array, start, end);
}
var castSlice_default = castSlice;

// ../node_modules/lodash-es/_hasUnicode.js
var rsAstralRange = "\\ud800-\\udfff";
var rsComboMarksRange = "\\u0300-\\u036f";
var reComboHalfMarksRange = "\\ufe20-\\ufe2f";
var rsComboSymbolsRange = "\\u20d0-\\u20ff";
var rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange;
var rsVarRange = "\\ufe0e\\ufe0f";
var rsZWJ = "\\u200d";
var reHasUnicode = RegExp("[" + rsZWJ + rsAstralRange + rsComboRange + rsVarRange + "]");
function hasUnicode(string) {
  return reHasUnicode.test(string);
}
var hasUnicode_default = hasUnicode;

// ../node_modules/lodash-es/_asciiToArray.js
function asciiToArray(string) {
  return string.split("");
}
var asciiToArray_default = asciiToArray;

// ../node_modules/lodash-es/_unicodeToArray.js
var rsAstralRange2 = "\\ud800-\\udfff";
var rsComboMarksRange2 = "\\u0300-\\u036f";
var reComboHalfMarksRange2 = "\\ufe20-\\ufe2f";
var rsComboSymbolsRange2 = "\\u20d0-\\u20ff";
var rsComboRange2 = rsComboMarksRange2 + reComboHalfMarksRange2 + rsComboSymbolsRange2;
var rsVarRange2 = "\\ufe0e\\ufe0f";
var rsAstral = "[" + rsAstralRange2 + "]";
var rsCombo = "[" + rsComboRange2 + "]";
var rsFitz = "\\ud83c[\\udffb-\\udfff]";
var rsModifier = "(?:" + rsCombo + "|" + rsFitz + ")";
var rsNonAstral = "[^" + rsAstralRange2 + "]";
var rsRegional = "(?:\\ud83c[\\udde6-\\uddff]){2}";
var rsSurrPair = "[\\ud800-\\udbff][\\udc00-\\udfff]";
var rsZWJ2 = "\\u200d";
var reOptMod = rsModifier + "?";
var rsOptVar = "[" + rsVarRange2 + "]?";
var rsOptJoin = "(?:" + rsZWJ2 + "(?:" + [rsNonAstral, rsRegional, rsSurrPair].join("|") + ")" + rsOptVar + reOptMod + ")*";
var rsSeq = rsOptVar + reOptMod + rsOptJoin;
var rsSymbol = "(?:" + [rsNonAstral + rsCombo + "?", rsCombo, rsRegional, rsSurrPair, rsAstral].join("|") + ")";
var reUnicode = RegExp(rsFitz + "(?=" + rsFitz + ")|" + rsSymbol + rsSeq, "g");
function unicodeToArray(string) {
  return string.match(reUnicode) || [];
}
var unicodeToArray_default = unicodeToArray;

// ../node_modules/lodash-es/_stringToArray.js
function stringToArray(string) {
  return hasUnicode_default(string) ? unicodeToArray_default(string) : asciiToArray_default(string);
}
var stringToArray_default = stringToArray;

// ../node_modules/lodash-es/_createCaseFirst.js
function createCaseFirst(methodName) {
  return function(string) {
    string = toString_default(string);
    var strSymbols = hasUnicode_default(string) ? stringToArray_default(string) : void 0;
    var chr = strSymbols ? strSymbols[0] : string.charAt(0);
    var trailing = strSymbols ? castSlice_default(strSymbols, 1).join("") : string.slice(1);
    return chr[methodName]() + trailing;
  };
}
var createCaseFirst_default = createCaseFirst;

// ../node_modules/lodash-es/upperFirst.js
var upperFirst = createCaseFirst_default("toUpperCase");
var upperFirst_default = upperFirst;

// ../node_modules/lodash-es/_stackClear.js
function stackClear() {
  this.__data__ = new ListCache_default();
  this.size = 0;
}
var stackClear_default = stackClear;

// ../node_modules/lodash-es/_stackDelete.js
function stackDelete(key) {
  var data = this.__data__, result = data["delete"](key);
  this.size = data.size;
  return result;
}
var stackDelete_default = stackDelete;

// ../node_modules/lodash-es/_stackGet.js
function stackGet(key) {
  return this.__data__.get(key);
}
var stackGet_default = stackGet;

// ../node_modules/lodash-es/_stackHas.js
function stackHas(key) {
  return this.__data__.has(key);
}
var stackHas_default = stackHas;

// ../node_modules/lodash-es/_stackSet.js
var LARGE_ARRAY_SIZE = 200;
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache_default) {
    var pairs = data.__data__;
    if (!Map_default || pairs.length < LARGE_ARRAY_SIZE - 1) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache_default(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}
var stackSet_default = stackSet;

// ../node_modules/lodash-es/_Stack.js
function Stack(entries) {
  var data = this.__data__ = new ListCache_default(entries);
  this.size = data.size;
}
Stack.prototype.clear = stackClear_default;
Stack.prototype["delete"] = stackDelete_default;
Stack.prototype.get = stackGet_default;
Stack.prototype.has = stackHas_default;
Stack.prototype.set = stackSet_default;
var Stack_default = Stack;

// ../node_modules/lodash-es/_cloneBuffer.js
var freeExports3 = typeof exports == "object" && exports && !exports.nodeType && exports;
var freeModule3 = freeExports3 && typeof module == "object" && module && !module.nodeType && module;
var moduleExports3 = freeModule3 && freeModule3.exports === freeExports3;
var Buffer2 = moduleExports3 ? root_default.Buffer : void 0;
var allocUnsafe = Buffer2 ? Buffer2.allocUnsafe : void 0;
function cloneBuffer(buffer, isDeep) {
  if (isDeep) {
    return buffer.slice();
  }
  var length = buffer.length, result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);
  buffer.copy(result);
  return result;
}
var cloneBuffer_default = cloneBuffer;

// ../node_modules/lodash-es/_Uint8Array.js
var Uint8Array = root_default.Uint8Array;
var Uint8Array_default = Uint8Array;

// ../node_modules/lodash-es/_cloneArrayBuffer.js
function cloneArrayBuffer(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new Uint8Array_default(result).set(new Uint8Array_default(arrayBuffer));
  return result;
}
var cloneArrayBuffer_default = cloneArrayBuffer;

// ../node_modules/lodash-es/_cloneTypedArray.js
function cloneTypedArray(typedArray, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer_default(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}
var cloneTypedArray_default = cloneTypedArray;

// ../node_modules/lodash-es/_initCloneObject.js
function initCloneObject(object) {
  return typeof object.constructor == "function" && !isPrototype_default(object) ? baseCreate_default(getPrototype_default(object)) : {};
}
var initCloneObject_default = initCloneObject;

// ../node_modules/lodash-es/_createBaseFor.js
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var index = -1, iterable = Object(object), props = keysFunc(object), length = props.length;
    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}
var createBaseFor_default = createBaseFor;

// ../node_modules/lodash-es/_baseFor.js
var baseFor = createBaseFor_default();
var baseFor_default = baseFor;

// ../node_modules/lodash-es/_assignMergeValue.js
function assignMergeValue(object, key, value) {
  if (value !== void 0 && !eq_default(object[key], value) || value === void 0 && !(key in object)) {
    baseAssignValue_default(object, key, value);
  }
}
var assignMergeValue_default = assignMergeValue;

// ../node_modules/lodash-es/isArrayLikeObject.js
function isArrayLikeObject(value) {
  return isObjectLike_default(value) && isArrayLike_default(value);
}
var isArrayLikeObject_default = isArrayLikeObject;

// ../node_modules/lodash-es/_safeGet.js
function safeGet(object, key) {
  if (key === "constructor" && typeof object[key] === "function") {
    return;
  }
  if (key == "__proto__") {
    return;
  }
  return object[key];
}
var safeGet_default = safeGet;

// ../node_modules/lodash-es/toPlainObject.js
function toPlainObject(value) {
  return copyObject_default(value, keysIn_default(value));
}
var toPlainObject_default = toPlainObject;

// ../node_modules/lodash-es/_baseMergeDeep.js
function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
  var objValue = safeGet_default(object, key), srcValue = safeGet_default(source, key), stacked = stack.get(srcValue);
  if (stacked) {
    assignMergeValue_default(object, key, stacked);
    return;
  }
  var newValue = customizer ? customizer(objValue, srcValue, key + "", object, source, stack) : void 0;
  var isCommon = newValue === void 0;
  if (isCommon) {
    var isArr = isArray_default(srcValue), isBuff = !isArr && isBuffer_default(srcValue), isTyped = !isArr && !isBuff && isTypedArray_default(srcValue);
    newValue = srcValue;
    if (isArr || isBuff || isTyped) {
      if (isArray_default(objValue)) {
        newValue = objValue;
      } else if (isArrayLikeObject_default(objValue)) {
        newValue = copyArray_default(objValue);
      } else if (isBuff) {
        isCommon = false;
        newValue = cloneBuffer_default(srcValue, true);
      } else if (isTyped) {
        isCommon = false;
        newValue = cloneTypedArray_default(srcValue, true);
      } else {
        newValue = [];
      }
    } else if (isPlainObject_default(srcValue) || isArguments_default(srcValue)) {
      newValue = objValue;
      if (isArguments_default(objValue)) {
        newValue = toPlainObject_default(objValue);
      } else if (!isObject_default(objValue) || isFunction_default(objValue)) {
        newValue = initCloneObject_default(srcValue);
      }
    } else {
      isCommon = false;
    }
  }
  if (isCommon) {
    stack.set(srcValue, newValue);
    mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
    stack["delete"](srcValue);
  }
  assignMergeValue_default(object, key, newValue);
}
var baseMergeDeep_default = baseMergeDeep;

// ../node_modules/lodash-es/_baseMerge.js
function baseMerge(object, source, srcIndex, customizer, stack) {
  if (object === source) {
    return;
  }
  baseFor_default(source, function(srcValue, key) {
    stack || (stack = new Stack_default());
    if (isObject_default(srcValue)) {
      baseMergeDeep_default(object, source, key, srcIndex, baseMerge, customizer, stack);
    } else {
      var newValue = customizer ? customizer(safeGet_default(object, key), srcValue, key + "", object, source, stack) : void 0;
      if (newValue === void 0) {
        newValue = srcValue;
      }
      assignMergeValue_default(object, key, newValue);
    }
  }, keysIn_default);
}
var baseMerge_default = baseMerge;

// ../node_modules/lodash-es/merge.js
var merge = createAssigner_default(function(object, source, srcIndex) {
  baseMerge_default(object, source, srcIndex);
});
var merge_default = merge;

// ../node_modules/naive-ui/es/_mixins/use-locale.mjs
function useLocale(ns) {
  const {
    mergedLocaleRef,
    mergedDateLocaleRef
  } = inject10(configProviderInjectionKey, null) || {};
  const localeRef = computed8(() => {
    var _a, _b;
    return (_b = (_a = mergedLocaleRef === null || mergedLocaleRef === void 0 ? void 0 : mergedLocaleRef.value) === null || _a === void 0 ? void 0 : _a[ns]) !== null && _b !== void 0 ? _b : enUS_default[ns];
  });
  const dateLocaleRef = computed8(() => {
    var _a;
    return (_a = mergedDateLocaleRef === null || mergedDateLocaleRef === void 0 ? void 0 : mergedDateLocaleRef.value) !== null && _a !== void 0 ? _a : enUS_default2;
  });
  return {
    dateLocaleRef,
    localeRef
  };
}

// ../node_modules/naive-ui/es/_mixins/use-rtl.mjs
import { computed as computed9, inject as inject11, onBeforeMount as onBeforeMount2, watchEffect as watchEffect2 } from "vue";

// ../node_modules/naive-ui/es/_mixins/common.mjs
var cssrAnchorMetaName2 = "naive-ui-style";

// ../node_modules/naive-ui/es/_mixins/use-rtl.mjs
function useRtl(mountId, rtlStateRef, clsPrefixRef) {
  if (!rtlStateRef) return void 0;
  const ssrAdapter2 = useSsrAdapter();
  const componentRtlStateRef = computed9(() => {
    const {
      value: rtlState
    } = rtlStateRef;
    if (!rtlState) {
      return void 0;
    }
    const componentRtlState = rtlState[mountId];
    if (!componentRtlState) {
      return void 0;
    }
    return componentRtlState;
  });
  const NConfigProvider = inject11(configProviderInjectionKey, null);
  const mountStyle = () => {
    watchEffect2(() => {
      const {
        value: clsPrefix
      } = clsPrefixRef;
      const id = `${clsPrefix}${mountId}Rtl`;
      if (exists(id, ssrAdapter2)) return;
      const {
        value: componentRtlState
      } = componentRtlStateRef;
      if (!componentRtlState) return;
      componentRtlState.style.mount({
        id,
        head: true,
        anchorMetaName: cssrAnchorMetaName2,
        props: {
          bPrefix: clsPrefix ? `.${clsPrefix}-` : void 0
        },
        ssr: ssrAdapter2,
        parent: NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.styleMountTarget
      });
    });
  };
  if (ssrAdapter2) {
    mountStyle();
  } else {
    onBeforeMount2(mountStyle);
  }
  return componentRtlStateRef;
}

// ../node_modules/naive-ui/es/_mixins/use-style.mjs
import { inject as inject12, onBeforeMount as onBeforeMount3 } from "vue";

// ../node_modules/naive-ui/es/_styles/common/_common.mjs
var common_default = {
  fontFamily: 'v-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
  fontFamilyMono: "v-mono, SFMono-Regular, Menlo, Consolas, Courier, monospace",
  fontWeight: "400",
  fontWeightStrong: "500",
  cubicBezierEaseInOut: "cubic-bezier(.4, 0, .2, 1)",
  cubicBezierEaseOut: "cubic-bezier(0, 0, .2, 1)",
  cubicBezierEaseIn: "cubic-bezier(.4, 0, 1, 1)",
  borderRadius: "3px",
  borderRadiusSmall: "2px",
  fontSize: "14px",
  fontSizeMini: "12px",
  fontSizeTiny: "12px",
  fontSizeSmall: "14px",
  fontSizeMedium: "14px",
  fontSizeLarge: "15px",
  fontSizeHuge: "16px",
  lineHeight: "1.6",
  heightMini: "16px",
  // private now, it's too small
  heightTiny: "22px",
  heightSmall: "28px",
  heightMedium: "34px",
  heightLarge: "40px",
  heightHuge: "46px"
};

// ../node_modules/naive-ui/es/_styles/global/index.cssr.mjs
var {
  fontSize,
  fontFamily,
  lineHeight
} = common_default;
var index_cssr_default = c2("body", `
 margin: 0;
 font-size: ${fontSize};
 font-family: ${fontFamily};
 line-height: ${lineHeight};
 -webkit-text-size-adjust: 100%;
 -webkit-tap-highlight-color: transparent;
`, [c2("input", `
 font-family: inherit;
 font-size: inherit;
 `)]);

// ../node_modules/naive-ui/es/_mixins/use-style.mjs
function useStyle(mountId, style2, clsPrefixRef) {
  if (!style2) {
    if (true) throwError("use-style", "No style is specified.");
    return;
  }
  const ssrAdapter2 = useSsrAdapter();
  const NConfigProvider = inject12(configProviderInjectionKey, null);
  const mountStyle = () => {
    const clsPrefix = clsPrefixRef.value;
    style2.mount({
      id: clsPrefix === void 0 ? mountId : clsPrefix + mountId,
      head: true,
      anchorMetaName: cssrAnchorMetaName2,
      props: {
        bPrefix: clsPrefix ? `.${clsPrefix}-` : void 0
      },
      ssr: ssrAdapter2,
      parent: NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.styleMountTarget
    });
    if (!(NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.preflightStyleDisabled)) {
      index_cssr_default.mount({
        id: "n-global",
        head: true,
        anchorMetaName: cssrAnchorMetaName2,
        ssr: ssrAdapter2,
        parent: NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.styleMountTarget
      });
    }
  };
  if (ssrAdapter2) {
    mountStyle();
  } else {
    onBeforeMount3(mountStyle);
  }
}

// ../node_modules/naive-ui/es/_mixins/use-theme.mjs
import { computed as computed10, inject as inject13, onBeforeMount as onBeforeMount4 } from "vue";
function createTheme(theme) {
  return theme;
}
function useTheme(resolveId, mountId, style2, defaultTheme, props, clsPrefixRef) {
  const ssrAdapter2 = useSsrAdapter();
  const NConfigProvider = inject13(configProviderInjectionKey, null);
  if (style2) {
    const mountStyle = () => {
      const clsPrefix = clsPrefixRef === null || clsPrefixRef === void 0 ? void 0 : clsPrefixRef.value;
      style2.mount({
        id: clsPrefix === void 0 ? mountId : clsPrefix + mountId,
        head: true,
        props: {
          bPrefix: clsPrefix ? `.${clsPrefix}-` : void 0
        },
        anchorMetaName: cssrAnchorMetaName2,
        ssr: ssrAdapter2,
        parent: NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.styleMountTarget
      });
      if (!(NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.preflightStyleDisabled)) {
        index_cssr_default.mount({
          id: "n-global",
          head: true,
          anchorMetaName: cssrAnchorMetaName2,
          ssr: ssrAdapter2,
          parent: NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.styleMountTarget
        });
      }
    };
    if (ssrAdapter2) {
      mountStyle();
    } else {
      onBeforeMount4(mountStyle);
    }
  }
  const mergedThemeRef = computed10(() => {
    var _a;
    const {
      theme: {
        common: selfCommon,
        self: self7,
        peers = {}
      } = {},
      themeOverrides: selfOverrides = {},
      builtinThemeOverrides: builtinOverrides = {}
    } = props;
    const {
      common: selfCommonOverrides,
      peers: peersOverrides
    } = selfOverrides;
    const {
      common: globalCommon = void 0,
      [resolveId]: {
        common: globalSelfCommon = void 0,
        self: globalSelf = void 0,
        peers: globalPeers = {}
      } = {}
    } = (NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedThemeRef.value) || {};
    const {
      common: globalCommonOverrides = void 0,
      [resolveId]: globalSelfOverrides = {}
    } = (NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedThemeOverridesRef.value) || {};
    const {
      common: globalSelfCommonOverrides,
      peers: globalPeersOverrides = {}
    } = globalSelfOverrides;
    const mergedCommon = merge_default({}, selfCommon || globalSelfCommon || globalCommon || defaultTheme.common, globalCommonOverrides, globalSelfCommonOverrides, selfCommonOverrides);
    const mergedSelf = merge_default(
      // {}, executed every time, no need for empty obj
      (_a = self7 || globalSelf || defaultTheme.self) === null || _a === void 0 ? void 0 : _a(mergedCommon),
      builtinOverrides,
      globalSelfOverrides,
      selfOverrides
    );
    return {
      common: mergedCommon,
      self: mergedSelf,
      peers: merge_default({}, defaultTheme.peers, globalPeers, peers),
      peerOverrides: merge_default({}, builtinOverrides.peers, globalPeersOverrides, peersOverrides)
    };
  });
  return mergedThemeRef;
}
useTheme.props = {
  theme: Object,
  themeOverrides: Object,
  builtinThemeOverrides: Object
};
var use_theme_default = useTheme;

// ../node_modules/naive-ui/es/_internal/clear/src/Clear.mjs
import { defineComponent as defineComponent19, h as h18, toRef as toRef5 } from "vue";

// ../node_modules/naive-ui/es/_internal/icon/src/Icon.mjs
import { defineComponent as defineComponent9, h as h4, toRef as toRef4 } from "vue";

// ../node_modules/naive-ui/es/_internal/icon/src/styles/index.cssr.mjs
var index_cssr_default2 = cB("base-icon", `
 height: 1em;
 width: 1em;
 line-height: 1em;
 text-align: center;
 display: inline-block;
 position: relative;
 fill: currentColor;
`, [c2("svg", `
 height: 1em;
 width: 1em;
 `)]);

// ../node_modules/naive-ui/es/_internal/icon/src/Icon.mjs
var Icon_default = defineComponent9({
  name: "BaseIcon",
  props: {
    role: String,
    ariaLabel: String,
    ariaDisabled: {
      type: Boolean,
      default: void 0
    },
    ariaHidden: {
      type: Boolean,
      default: void 0
    },
    clsPrefix: {
      type: String,
      required: true
    },
    onClick: Function,
    onMousedown: Function,
    onMouseup: Function
  },
  setup(props) {
    useStyle("-base-icon", index_cssr_default2, toRef4(props, "clsPrefix"));
  },
  render() {
    return h4("i", {
      class: `${this.clsPrefix}-base-icon`,
      onClick: this.onClick,
      onMousedown: this.onMousedown,
      onMouseup: this.onMouseup,
      role: this.role,
      "aria-label": this.ariaLabel,
      "aria-hidden": this.ariaHidden,
      "aria-disabled": this.ariaDisabled
    }, this.$slots);
  }
});

// ../node_modules/naive-ui/es/_internal/icon-switch-transition/src/IconSwitchTransition.mjs
import { defineComponent as defineComponent10, h as h5, Transition } from "vue";
var IconSwitchTransition_default = defineComponent10({
  name: "BaseIconSwitchTransition",
  setup(_, {
    slots
  }) {
    const isMountedRef = isMounted();
    return () => h5(Transition, {
      name: "icon-switch-transition",
      appear: isMountedRef.value
    }, slots);
  }
});

// ../node_modules/naive-ui/es/_internal/icons/replaceable.mjs
import { defineComponent as defineComponent11, h as h6, inject as inject14 } from "vue";
function replaceable(name, icon) {
  const IconComponent = defineComponent11({
    render() {
      return icon();
    }
  });
  return defineComponent11({
    name: upperFirst_default(name),
    setup() {
      var _a;
      const mergedIconsRef = (_a = inject14(configProviderInjectionKey, null)) === null || _a === void 0 ? void 0 : _a.mergedIconsRef;
      return () => {
        var _a2;
        const iconOverride = (_a2 = mergedIconsRef === null || mergedIconsRef === void 0 ? void 0 : mergedIconsRef.value) === null || _a2 === void 0 ? void 0 : _a2[name];
        return iconOverride ? iconOverride() : h6(IconComponent, null);
      };
    }
  });
}

// ../node_modules/naive-ui/es/_internal/icons/Backward.mjs
import { defineComponent as defineComponent12, h as h7 } from "vue";
var Backward_default = defineComponent12({
  name: "Backward",
  render() {
    return h7("svg", {
      viewBox: "0 0 20 20",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg"
    }, h7("path", {
      d: "M12.2674 15.793C11.9675 16.0787 11.4927 16.0672 11.2071 15.7673L6.20572 10.5168C5.9298 10.2271 5.9298 9.7719 6.20572 9.48223L11.2071 4.23177C11.4927 3.93184 11.9675 3.92031 12.2674 4.206C12.5673 4.49169 12.5789 4.96642 12.2932 5.26634L7.78458 9.99952L12.2932 14.7327C12.5789 15.0326 12.5673 15.5074 12.2674 15.793Z",
      fill: "currentColor"
    }));
  }
});

// ../node_modules/naive-ui/es/_internal/icons/ChevronDown.mjs
import { defineComponent as defineComponent13, h as h8 } from "vue";
var ChevronDown_default = defineComponent13({
  name: "ChevronDown",
  render() {
    return h8("svg", {
      viewBox: "0 0 16 16",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg"
    }, h8("path", {
      d: "M3.14645 5.64645C3.34171 5.45118 3.65829 5.45118 3.85355 5.64645L8 9.79289L12.1464 5.64645C12.3417 5.45118 12.6583 5.45118 12.8536 5.64645C13.0488 5.84171 13.0488 6.15829 12.8536 6.35355L8.35355 10.8536C8.15829 11.0488 7.84171 11.0488 7.64645 10.8536L3.14645 6.35355C2.95118 6.15829 2.95118 5.84171 3.14645 5.64645Z",
      fill: "currentColor"
    }));
  }
});

// ../node_modules/naive-ui/es/_internal/icons/Clear.mjs
import { h as h9 } from "vue";
var Clear_default = replaceable("clear", () => h9("svg", {
  viewBox: "0 0 16 16",
  version: "1.1",
  xmlns: "http://www.w3.org/2000/svg"
}, h9("g", {
  stroke: "none",
  "stroke-width": "1",
  fill: "none",
  "fill-rule": "evenodd"
}, h9("g", {
  fill: "currentColor",
  "fill-rule": "nonzero"
}, h9("path", {
  d: "M8,2 C11.3137085,2 14,4.6862915 14,8 C14,11.3137085 11.3137085,14 8,14 C4.6862915,14 2,11.3137085 2,8 C2,4.6862915 4.6862915,2 8,2 Z M6.5343055,5.83859116 C6.33943736,5.70359511 6.07001296,5.72288026 5.89644661,5.89644661 L5.89644661,5.89644661 L5.83859116,5.9656945 C5.70359511,6.16056264 5.72288026,6.42998704 5.89644661,6.60355339 L5.89644661,6.60355339 L7.293,8 L5.89644661,9.39644661 L5.83859116,9.4656945 C5.70359511,9.66056264 5.72288026,9.92998704 5.89644661,10.1035534 L5.89644661,10.1035534 L5.9656945,10.1614088 C6.16056264,10.2964049 6.42998704,10.2771197 6.60355339,10.1035534 L6.60355339,10.1035534 L8,8.707 L9.39644661,10.1035534 L9.4656945,10.1614088 C9.66056264,10.2964049 9.92998704,10.2771197 10.1035534,10.1035534 L10.1035534,10.1035534 L10.1614088,10.0343055 C10.2964049,9.83943736 10.2771197,9.57001296 10.1035534,9.39644661 L10.1035534,9.39644661 L8.707,8 L10.1035534,6.60355339 L10.1614088,6.5343055 C10.2964049,6.33943736 10.2771197,6.07001296 10.1035534,5.89644661 L10.1035534,5.89644661 L10.0343055,5.83859116 C9.83943736,5.70359511 9.57001296,5.72288026 9.39644661,5.89644661 L9.39644661,5.89644661 L8,7.293 L6.60355339,5.89644661 Z"
})))));

// ../node_modules/naive-ui/es/_internal/icons/Date.mjs
import { h as h10 } from "vue";
var Date_default = replaceable("date", () => h10("svg", {
  width: "28px",
  height: "28px",
  viewBox: "0 0 28 28",
  version: "1.1",
  xmlns: "http://www.w3.org/2000/svg"
}, h10("g", {
  stroke: "none",
  "stroke-width": "1",
  "fill-rule": "evenodd"
}, h10("g", {
  "fill-rule": "nonzero"
}, h10("path", {
  d: "M21.75,3 C23.5449254,3 25,4.45507456 25,6.25 L25,21.75 C25,23.5449254 23.5449254,25 21.75,25 L6.25,25 C4.45507456,25 3,23.5449254 3,21.75 L3,6.25 C3,4.45507456 4.45507456,3 6.25,3 L21.75,3 Z M23.5,9.503 L4.5,9.503 L4.5,21.75 C4.5,22.7164983 5.28350169,23.5 6.25,23.5 L21.75,23.5 C22.7164983,23.5 23.5,22.7164983 23.5,21.75 L23.5,9.503 Z M21.75,4.5 L6.25,4.5 C5.28350169,4.5 4.5,5.28350169 4.5,6.25 L4.5,8.003 L23.5,8.003 L23.5,6.25 C23.5,5.28350169 22.7164983,4.5 21.75,4.5 Z"
})))));

// ../node_modules/naive-ui/es/_internal/icons/Eye.mjs
import { defineComponent as defineComponent14, h as h11 } from "vue";
var Eye_default = defineComponent14({
  name: "Eye",
  render() {
    return h11("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 512 512"
    }, h11("path", {
      d: "M255.66 112c-77.94 0-157.89 45.11-220.83 135.33a16 16 0 0 0-.27 17.77C82.92 340.8 161.8 400 255.66 400c92.84 0 173.34-59.38 221.79-135.25a16.14 16.14 0 0 0 0-17.47C428.89 172.28 347.8 112 255.66 112z",
      fill: "none",
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": "32"
    }), h11("circle", {
      cx: "256",
      cy: "256",
      r: "80",
      fill: "none",
      stroke: "currentColor",
      "stroke-miterlimit": "10",
      "stroke-width": "32"
    }));
  }
});

// ../node_modules/naive-ui/es/_internal/icons/EyeOff.mjs
import { defineComponent as defineComponent15, h as h12 } from "vue";
var EyeOff_default = defineComponent15({
  name: "EyeOff",
  render() {
    return h12("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 512 512"
    }, h12("path", {
      d: "M432 448a15.92 15.92 0 0 1-11.31-4.69l-352-352a16 16 0 0 1 22.62-22.62l352 352A16 16 0 0 1 432 448z",
      fill: "currentColor"
    }), h12("path", {
      d: "M255.66 384c-41.49 0-81.5-12.28-118.92-36.5c-34.07-22-64.74-53.51-88.7-91v-.08c19.94-28.57 41.78-52.73 65.24-72.21a2 2 0 0 0 .14-2.94L93.5 161.38a2 2 0 0 0-2.71-.12c-24.92 21-48.05 46.76-69.08 76.92a31.92 31.92 0 0 0-.64 35.54c26.41 41.33 60.4 76.14 98.28 100.65C162 402 207.9 416 255.66 416a239.13 239.13 0 0 0 75.8-12.58a2 2 0 0 0 .77-3.31l-21.58-21.58a4 4 0 0 0-3.83-1a204.8 204.8 0 0 1-51.16 6.47z",
      fill: "currentColor"
    }), h12("path", {
      d: "M490.84 238.6c-26.46-40.92-60.79-75.68-99.27-100.53C349 110.55 302 96 255.66 96a227.34 227.34 0 0 0-74.89 12.83a2 2 0 0 0-.75 3.31l21.55 21.55a4 4 0 0 0 3.88 1a192.82 192.82 0 0 1 50.21-6.69c40.69 0 80.58 12.43 118.55 37c34.71 22.4 65.74 53.88 89.76 91a.13.13 0 0 1 0 .16a310.72 310.72 0 0 1-64.12 72.73a2 2 0 0 0-.15 2.95l19.9 19.89a2 2 0 0 0 2.7.13a343.49 343.49 0 0 0 68.64-78.48a32.2 32.2 0 0 0-.1-34.78z",
      fill: "currentColor"
    }), h12("path", {
      d: "M256 160a95.88 95.88 0 0 0-21.37 2.4a2 2 0 0 0-1 3.38l112.59 112.56a2 2 0 0 0 3.38-1A96 96 0 0 0 256 160z",
      fill: "currentColor"
    }), h12("path", {
      d: "M165.78 233.66a2 2 0 0 0-3.38 1a96 96 0 0 0 115 115a2 2 0 0 0 1-3.38z",
      fill: "currentColor"
    }));
  }
});

// ../node_modules/naive-ui/es/_internal/icons/FastBackward.mjs
import { defineComponent as defineComponent16, h as h13 } from "vue";
var FastBackward_default = defineComponent16({
  name: "FastBackward",
  render() {
    return h13("svg", {
      viewBox: "0 0 20 20",
      version: "1.1",
      xmlns: "http://www.w3.org/2000/svg"
    }, h13("g", {
      stroke: "none",
      "stroke-width": "1",
      fill: "none",
      "fill-rule": "evenodd"
    }, h13("g", {
      fill: "currentColor",
      "fill-rule": "nonzero"
    }, h13("path", {
      d: "M8.73171,16.7949 C9.03264,17.0795 9.50733,17.0663 9.79196,16.7654 C10.0766,16.4644 10.0634,15.9897 9.76243,15.7051 L4.52339,10.75 L17.2471,10.75 C17.6613,10.75 17.9971,10.4142 17.9971,10 C17.9971,9.58579 17.6613,9.25 17.2471,9.25 L4.52112,9.25 L9.76243,4.29275 C10.0634,4.00812 10.0766,3.53343 9.79196,3.2325 C9.50733,2.93156 9.03264,2.91834 8.73171,3.20297 L2.31449,9.27241 C2.14819,9.4297 2.04819,9.62981 2.01448,9.8386 C2.00308,9.89058 1.99707,9.94459 1.99707,10 C1.99707,10.0576 2.00356,10.1137 2.01585,10.1675 C2.05084,10.3733 2.15039,10.5702 2.31449,10.7254 L8.73171,16.7949 Z"
    }))));
  }
});

// ../node_modules/naive-ui/es/_internal/icons/FastForward.mjs
import { defineComponent as defineComponent17, h as h14 } from "vue";
var FastForward_default = defineComponent17({
  name: "FastForward",
  render() {
    return h14("svg", {
      viewBox: "0 0 20 20",
      version: "1.1",
      xmlns: "http://www.w3.org/2000/svg"
    }, h14("g", {
      stroke: "none",
      "stroke-width": "1",
      fill: "none",
      "fill-rule": "evenodd"
    }, h14("g", {
      fill: "currentColor",
      "fill-rule": "nonzero"
    }, h14("path", {
      d: "M11.2654,3.20511 C10.9644,2.92049 10.4897,2.93371 10.2051,3.23464 C9.92049,3.53558 9.93371,4.01027 10.2346,4.29489 L15.4737,9.25 L2.75,9.25 C2.33579,9.25 2,9.58579 2,10.0000012 C2,10.4142 2.33579,10.75 2.75,10.75 L15.476,10.75 L10.2346,15.7073 C9.93371,15.9919 9.92049,16.4666 10.2051,16.7675 C10.4897,17.0684 10.9644,17.0817 11.2654,16.797 L17.6826,10.7276 C17.8489,10.5703 17.9489,10.3702 17.9826,10.1614 C17.994,10.1094 18,10.0554 18,10.0000012 C18,9.94241 17.9935,9.88633 17.9812,9.83246 C17.9462,9.62667 17.8467,9.42976 17.6826,9.27455 L11.2654,3.20511 Z"
    }))));
  }
});

// ../node_modules/naive-ui/es/_internal/icons/Forward.mjs
import { defineComponent as defineComponent18, h as h15 } from "vue";
var Forward_default = defineComponent18({
  name: "Forward",
  render() {
    return h15("svg", {
      viewBox: "0 0 20 20",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg"
    }, h15("path", {
      d: "M7.73271 4.20694C8.03263 3.92125 8.50737 3.93279 8.79306 4.23271L13.7944 9.48318C14.0703 9.77285 14.0703 10.2281 13.7944 10.5178L8.79306 15.7682C8.50737 16.0681 8.03263 16.0797 7.73271 15.794C7.43279 15.5083 7.42125 15.0336 7.70694 14.7336L12.2155 10.0005L7.70694 5.26729C7.42125 4.96737 7.43279 4.49264 7.73271 4.20694Z",
      fill: "currentColor"
    }));
  }
});

// ../node_modules/naive-ui/es/_internal/icons/Time.mjs
import { h as h16 } from "vue";
var Time_default = replaceable("time", () => h16("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 512 512"
}, h16("path", {
  d: "M256,64C150,64,64,150,64,256s86,192,192,192,192-86,192-192S362,64,256,64Z",
  style: "\n        fill: none;\n        stroke: currentColor;\n        stroke-miterlimit: 10;\n        stroke-width: 32px;\n      "
}), h16("polyline", {
  points: "256 128 256 272 352 272",
  style: "\n        fill: none;\n        stroke: currentColor;\n        stroke-linecap: round;\n        stroke-linejoin: round;\n        stroke-width: 32px;\n      "
})));

// ../node_modules/naive-ui/es/_internal/icons/To.mjs
import { h as h17 } from "vue";
var To_default = replaceable("to", () => h17("svg", {
  viewBox: "0 0 20 20",
  version: "1.1",
  xmlns: "http://www.w3.org/2000/svg"
}, h17("g", {
  stroke: "none",
  "stroke-width": "1",
  fill: "none",
  "fill-rule": "evenodd"
}, h17("g", {
  fill: "currentColor",
  "fill-rule": "nonzero"
}, h17("path", {
  d: "M11.2654,3.20511 C10.9644,2.92049 10.4897,2.93371 10.2051,3.23464 C9.92049,3.53558 9.93371,4.01027 10.2346,4.29489 L15.4737,9.25 L2.75,9.25 C2.33579,9.25 2,9.58579 2,10.0000012 C2,10.4142 2.33579,10.75 2.75,10.75 L15.476,10.75 L10.2346,15.7073 C9.93371,15.9919 9.92049,16.4666 10.2051,16.7675 C10.4897,17.0684 10.9644,17.0817 11.2654,16.797 L17.6826,10.7276 C17.8489,10.5703 17.9489,10.3702 17.9826,10.1614 C17.994,10.1094 18,10.0554 18,10.0000012 C18,9.94241 17.9935,9.88633 17.9812,9.83246 C17.9462,9.62667 17.8467,9.42976 17.6826,9.27455 L11.2654,3.20511 Z"
})))));

// ../node_modules/naive-ui/es/_styles/transitions/icon-switch.cssr.mjs
var {
  cubicBezierEaseInOut
} = common_default;
function iconSwitchTransition({
  originalTransform = "",
  left = 0,
  top = 0,
  transition = `all .3s ${cubicBezierEaseInOut} !important`
} = {}) {
  return [c2("&.icon-switch-transition-enter-from, &.icon-switch-transition-leave-to", {
    transform: `${originalTransform} scale(0.75)`,
    left,
    top,
    opacity: 0
  }), c2("&.icon-switch-transition-enter-to, &.icon-switch-transition-leave-from", {
    transform: `scale(1) ${originalTransform}`,
    left,
    top,
    opacity: 1
  }), c2("&.icon-switch-transition-enter-active, &.icon-switch-transition-leave-active", {
    transformOrigin: "center",
    position: "absolute",
    left,
    top,
    transition
  })];
}

// ../node_modules/naive-ui/es/_internal/clear/src/styles/index.cssr.mjs
var index_cssr_default3 = cB("base-clear", `
 flex-shrink: 0;
 height: 1em;
 width: 1em;
 position: relative;
`, [c2(">", [cE("clear", `
 font-size: var(--n-clear-size);
 height: 1em;
 width: 1em;
 cursor: pointer;
 color: var(--n-clear-color);
 transition: color .3s var(--n-bezier);
 display: flex;
 `, [c2("&:hover", `
 color: var(--n-clear-color-hover)!important;
 `), c2("&:active", `
 color: var(--n-clear-color-pressed)!important;
 `)]), cE("placeholder", `
 display: flex;
 `), cE("clear, placeholder", `
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateX(-50%) translateY(-50%);
 `, [iconSwitchTransition({
  originalTransform: "translateX(-50%) translateY(-50%)",
  left: "50%",
  top: "50%"
})])])]);

// ../node_modules/naive-ui/es/_internal/clear/src/Clear.mjs
var Clear_default2 = defineComponent19({
  name: "BaseClear",
  props: {
    clsPrefix: {
      type: String,
      required: true
    },
    show: Boolean,
    onClear: Function
  },
  setup(props) {
    useStyle("-base-clear", index_cssr_default3, toRef5(props, "clsPrefix"));
    return {
      handleMouseDown(e) {
        e.preventDefault();
      }
    };
  },
  render() {
    const {
      clsPrefix
    } = this;
    return h18("div", {
      class: `${clsPrefix}-base-clear`
    }, h18(IconSwitchTransition_default, null, {
      default: () => {
        var _a, _b;
        return this.show ? h18("div", {
          key: "dismiss",
          class: `${clsPrefix}-base-clear__clear`,
          onClick: this.onClear,
          onMousedown: this.handleMouseDown,
          "data-clear": true
        }, resolveSlot(this.$slots.icon, () => [h18(Icon_default, {
          clsPrefix
        }, {
          default: () => h18(Clear_default, null)
        })])) : h18("div", {
          key: "icon",
          class: `${clsPrefix}-base-clear__placeholder`
        }, (_b = (_a = this.$slots).placeholder) === null || _b === void 0 ? void 0 : _b.call(_a));
      }
    }));
  }
});

// ../node_modules/naive-ui/es/_internal/fade-in-expand-transition/src/FadeInExpandTransition.mjs
import { defineComponent as defineComponent20, h as h19, Transition as Transition2, TransitionGroup } from "vue";
var FadeInExpandTransition_default = defineComponent20({
  name: "FadeInExpandTransition",
  props: {
    appear: Boolean,
    group: Boolean,
    mode: String,
    onLeave: Function,
    onAfterLeave: Function,
    onAfterEnter: Function,
    width: Boolean,
    // reverse mode is only used in tree
    // it make it from expanded to collapsed after mounted
    reverse: Boolean
  },
  setup(props, {
    slots
  }) {
    function handleBeforeLeave(el) {
      if (props.width) {
        el.style.maxWidth = `${el.offsetWidth}px`;
      } else {
        el.style.maxHeight = `${el.offsetHeight}px`;
      }
      void el.offsetWidth;
    }
    function handleLeave(el) {
      if (props.width) {
        el.style.maxWidth = "0";
      } else {
        el.style.maxHeight = "0";
      }
      void el.offsetWidth;
      const {
        onLeave
      } = props;
      if (onLeave) onLeave();
    }
    function handleAfterLeave(el) {
      if (props.width) {
        el.style.maxWidth = "";
      } else {
        el.style.maxHeight = "";
      }
      const {
        onAfterLeave
      } = props;
      if (onAfterLeave) onAfterLeave();
    }
    function handleEnter(el) {
      el.style.transition = "none";
      if (props.width) {
        const memorizedWidth = el.offsetWidth;
        el.style.maxWidth = "0";
        void el.offsetWidth;
        el.style.transition = "";
        el.style.maxWidth = `${memorizedWidth}px`;
      } else {
        if (props.reverse) {
          el.style.maxHeight = `${el.offsetHeight}px`;
          void el.offsetHeight;
          el.style.transition = "";
          el.style.maxHeight = "0";
        } else {
          const memorizedHeight = el.offsetHeight;
          el.style.maxHeight = "0";
          void el.offsetWidth;
          el.style.transition = "";
          el.style.maxHeight = `${memorizedHeight}px`;
        }
      }
      void el.offsetWidth;
    }
    function handleAfterEnter(el) {
      var _a;
      if (props.width) {
        el.style.maxWidth = "";
      } else {
        if (!props.reverse) {
          el.style.maxHeight = "";
        }
      }
      (_a = props.onAfterEnter) === null || _a === void 0 ? void 0 : _a.call(props);
    }
    return () => {
      const {
        group,
        width,
        appear,
        mode
      } = props;
      const type = group ? TransitionGroup : Transition2;
      const resolvedProps = {
        name: width ? "fade-in-width-expand-transition" : "fade-in-height-expand-transition",
        appear,
        onEnter: handleEnter,
        onAfterEnter: handleAfterEnter,
        onBeforeLeave: handleBeforeLeave,
        onLeave: handleLeave,
        onAfterLeave: handleAfterLeave
      };
      if (!group) {
        ;
        resolvedProps.mode = mode;
      }
      return h19(type, resolvedProps, slots);
    };
  }
});

// ../node_modules/naive-ui/es/_internal/focus-detector/src/FocusDetector.mjs
import { defineComponent as defineComponent21, h as h20 } from "vue";
var FocusDetector_default = defineComponent21({
  props: {
    onFocus: Function,
    onBlur: Function
  },
  setup(props) {
    return () => h20("div", {
      style: "width: 0; height: 0",
      tabindex: 0,
      onFocus: props.onFocus,
      onBlur: props.onBlur
    });
  }
});

// ../node_modules/naive-ui/es/_internal/focus-detector/index.mjs
var focus_detector_default = FocusDetector_default;

// ../node_modules/naive-ui/es/_internal/loading/src/Loading.mjs
import { defineComponent as defineComponent22, h as h21, toRef as toRef6 } from "vue";

// ../node_modules/naive-ui/es/_internal/loading/src/styles/index.cssr.mjs
var index_cssr_default4 = c2([c2("@keyframes rotator", `
 0% {
 -webkit-transform: rotate(0deg);
 transform: rotate(0deg);
 }
 100% {
 -webkit-transform: rotate(360deg);
 transform: rotate(360deg);
 }`), cB("base-loading", `
 position: relative;
 line-height: 0;
 width: 1em;
 height: 1em;
 `, [cE("transition-wrapper", `
 position: absolute;
 width: 100%;
 height: 100%;
 `, [iconSwitchTransition()]), cE("placeholder", `
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateX(-50%) translateY(-50%);
 `, [iconSwitchTransition({
  left: "50%",
  top: "50%",
  originalTransform: "translateX(-50%) translateY(-50%)"
})]), cE("container", `
 animation: rotator 3s linear infinite both;
 `, [cE("icon", `
 height: 1em;
 width: 1em;
 `)])])]);

// ../node_modules/naive-ui/es/_internal/loading/src/Loading.mjs
var duration = "1.6s";
var exposedLoadingProps = {
  strokeWidth: {
    type: Number,
    default: 28
  },
  stroke: {
    type: String,
    default: void 0
  }
};
var Loading_default = defineComponent22({
  name: "BaseLoading",
  props: Object.assign({
    clsPrefix: {
      type: String,
      required: true
    },
    show: {
      type: Boolean,
      default: true
    },
    scale: {
      type: Number,
      default: 1
    },
    radius: {
      type: Number,
      default: 100
    }
  }, exposedLoadingProps),
  setup(props) {
    useStyle("-base-loading", index_cssr_default4, toRef6(props, "clsPrefix"));
  },
  render() {
    const {
      clsPrefix,
      radius,
      strokeWidth,
      stroke,
      scale
    } = this;
    const scaledRadius = radius / scale;
    return h21("div", {
      class: `${clsPrefix}-base-loading`,
      role: "img",
      "aria-label": "loading"
    }, h21(IconSwitchTransition_default, null, {
      default: () => this.show ? h21("div", {
        key: "icon",
        class: `${clsPrefix}-base-loading__transition-wrapper`
      }, h21("div", {
        class: `${clsPrefix}-base-loading__container`
      }, h21("svg", {
        class: `${clsPrefix}-base-loading__icon`,
        viewBox: `0 0 ${2 * scaledRadius} ${2 * scaledRadius}`,
        xmlns: "http://www.w3.org/2000/svg",
        style: {
          color: stroke
        }
      }, h21("g", null, h21("animateTransform", {
        attributeName: "transform",
        type: "rotate",
        values: `0 ${scaledRadius} ${scaledRadius};270 ${scaledRadius} ${scaledRadius}`,
        begin: "0s",
        dur: duration,
        fill: "freeze",
        repeatCount: "indefinite"
      }), h21("circle", {
        class: `${clsPrefix}-base-loading__icon`,
        fill: "none",
        stroke: "currentColor",
        "stroke-width": strokeWidth,
        "stroke-linecap": "round",
        cx: scaledRadius,
        cy: scaledRadius,
        r: radius - strokeWidth / 2,
        "stroke-dasharray": 5.67 * radius,
        "stroke-dashoffset": 18.48 * radius
      }, h21("animateTransform", {
        attributeName: "transform",
        type: "rotate",
        values: `0 ${scaledRadius} ${scaledRadius};135 ${scaledRadius} ${scaledRadius};450 ${scaledRadius} ${scaledRadius}`,
        begin: "0s",
        dur: duration,
        fill: "freeze",
        repeatCount: "indefinite"
      }), h21("animate", {
        attributeName: "stroke-dashoffset",
        values: `${5.67 * radius};${1.42 * radius};${5.67 * radius}`,
        begin: "0s",
        dur: duration,
        fill: "freeze",
        repeatCount: "indefinite"
      })))))) : h21("div", {
        key: "placeholder",
        class: `${clsPrefix}-base-loading__placeholder`
      }, this.$slots)
    }));
  }
});

// ../node_modules/naive-ui/es/_styles/transitions/fade-in.cssr.mjs
var {
  cubicBezierEaseInOut: cubicBezierEaseInOut2
} = common_default;
function fadeInTransition({
  name = "fade-in",
  enterDuration = "0.2s",
  leaveDuration = "0.2s",
  enterCubicBezier = cubicBezierEaseInOut2,
  leaveCubicBezier = cubicBezierEaseInOut2
} = {}) {
  return [c2(`&.${name}-transition-enter-active`, {
    transition: `all ${enterDuration} ${enterCubicBezier}!important`
  }), c2(`&.${name}-transition-leave-active`, {
    transition: `all ${leaveDuration} ${leaveCubicBezier}!important`
  }), c2(`&.${name}-transition-enter-from, &.${name}-transition-leave-to`, {
    opacity: 0
  }), c2(`&.${name}-transition-leave-from, &.${name}-transition-enter-to`, {
    opacity: 1
  })];
}

// ../node_modules/naive-ui/es/_internal/scrollbar/src/Scrollbar.mjs
import { computed as computed11, defineComponent as defineComponent23, Fragment as Fragment3, h as h22, mergeProps as mergeProps2, onBeforeUnmount as onBeforeUnmount8, onMounted as onMounted7, ref as ref10, Transition as Transition3, watchEffect as watchEffect3 } from "vue";

// ../node_modules/naive-ui/es/_styles/common/light.mjs
var base = {
  neutralBase: "#FFF",
  neutralInvertBase: "#000",
  neutralTextBase: "#000",
  neutralPopover: "#fff",
  neutralCard: "#fff",
  neutralModal: "#fff",
  neutralBody: "#fff",
  alpha1: "0.82",
  alpha2: "0.72",
  alpha3: "0.38",
  alpha4: "0.24",
  // disabled text, placeholder, icon
  alpha5: "0.18",
  // disabled placeholder
  alphaClose: "0.6",
  alphaDisabled: "0.5",
  alphaDisabledInput: "0.02",
  alphaPending: "0.05",
  alphaTablePending: "0.02",
  alphaPressed: "0.07",
  alphaAvatar: "0.2",
  alphaRail: "0.14",
  alphaProgressRail: ".08",
  alphaBorder: "0.12",
  alphaDivider: "0.06",
  alphaInput: "0",
  alphaAction: "0.02",
  alphaTab: "0.04",
  alphaScrollbar: "0.25",
  alphaScrollbarHover: "0.4",
  alphaCode: "0.05",
  alphaTag: "0.02",
  // primary
  primaryHover: "#36ad6a",
  primaryDefault: "#18a058",
  primaryActive: "#0c7a43",
  primarySuppl: "#36ad6a",
  // info
  infoHover: "#4098fc",
  infoDefault: "#2080f0",
  infoActive: "#1060c9",
  infoSuppl: "#4098fc",
  // error
  errorHover: "#de576d",
  errorDefault: "#d03050",
  errorActive: "#ab1f3f",
  errorSuppl: "#de576d",
  // warning
  warningHover: "#fcb040",
  warningDefault: "#f0a020",
  warningActive: "#c97c10",
  warningSuppl: "#fcb040",
  // success
  successHover: "#36ad6a",
  successDefault: "#18a058",
  successActive: "#0c7a43",
  successSuppl: "#36ad6a"
};
var baseBackgroundRgb = rgba(base.neutralBase);
var baseInvertBackgroundRgb = rgba(base.neutralInvertBase);
var overlayPrefix = `rgba(${baseInvertBackgroundRgb.slice(0, 3).join(", ")}, `;
function overlay(alpha) {
  return `${overlayPrefix + String(alpha)})`;
}
function neutral(alpha) {
  const overlayRgba = Array.from(baseInvertBackgroundRgb);
  overlayRgba[3] = Number(alpha);
  return composite(baseBackgroundRgb, overlayRgba);
}
var derived = Object.assign(Object.assign({
  name: "common"
}, common_default), {
  baseColor: base.neutralBase,
  // primary color
  primaryColor: base.primaryDefault,
  primaryColorHover: base.primaryHover,
  primaryColorPressed: base.primaryActive,
  primaryColorSuppl: base.primarySuppl,
  // info color
  infoColor: base.infoDefault,
  infoColorHover: base.infoHover,
  infoColorPressed: base.infoActive,
  infoColorSuppl: base.infoSuppl,
  // success color
  successColor: base.successDefault,
  successColorHover: base.successHover,
  successColorPressed: base.successActive,
  successColorSuppl: base.successSuppl,
  // warning color
  warningColor: base.warningDefault,
  warningColorHover: base.warningHover,
  warningColorPressed: base.warningActive,
  warningColorSuppl: base.warningSuppl,
  // error color
  errorColor: base.errorDefault,
  errorColorHover: base.errorHover,
  errorColorPressed: base.errorActive,
  errorColorSuppl: base.errorSuppl,
  // text color
  textColorBase: base.neutralTextBase,
  textColor1: "rgb(31, 34, 37)",
  textColor2: "rgb(51, 54, 57)",
  textColor3: "rgb(118, 124, 130)",
  // textColor4: neutral(base.alpha4), // disabled, placeholder, icon
  // textColor5: neutral(base.alpha5),
  textColorDisabled: neutral(base.alpha4),
  placeholderColor: neutral(base.alpha4),
  placeholderColorDisabled: neutral(base.alpha5),
  iconColor: neutral(base.alpha4),
  iconColorHover: scaleColor(neutral(base.alpha4), {
    lightness: 0.75
  }),
  iconColorPressed: scaleColor(neutral(base.alpha4), {
    lightness: 0.9
  }),
  iconColorDisabled: neutral(base.alpha5),
  opacity1: base.alpha1,
  opacity2: base.alpha2,
  opacity3: base.alpha3,
  opacity4: base.alpha4,
  opacity5: base.alpha5,
  dividerColor: "rgb(239, 239, 245)",
  borderColor: "rgb(224, 224, 230)",
  // close
  closeIconColor: neutral(Number(base.alphaClose)),
  closeIconColorHover: neutral(Number(base.alphaClose)),
  closeIconColorPressed: neutral(Number(base.alphaClose)),
  closeColorHover: "rgba(0, 0, 0, .09)",
  closeColorPressed: "rgba(0, 0, 0, .13)",
  // clear
  clearColor: neutral(base.alpha4),
  clearColorHover: scaleColor(neutral(base.alpha4), {
    lightness: 0.75
  }),
  clearColorPressed: scaleColor(neutral(base.alpha4), {
    lightness: 0.9
  }),
  scrollbarColor: overlay(base.alphaScrollbar),
  scrollbarColorHover: overlay(base.alphaScrollbarHover),
  scrollbarWidth: "5px",
  scrollbarHeight: "5px",
  scrollbarBorderRadius: "5px",
  progressRailColor: neutral(base.alphaProgressRail),
  railColor: "rgb(219, 219, 223)",
  popoverColor: base.neutralPopover,
  tableColor: base.neutralCard,
  cardColor: base.neutralCard,
  modalColor: base.neutralModal,
  bodyColor: base.neutralBody,
  tagColor: "#eee",
  avatarColor: neutral(base.alphaAvatar),
  invertedColor: "rgb(0, 20, 40)",
  inputColor: neutral(base.alphaInput),
  codeColor: "rgb(244, 244, 248)",
  tabColor: "rgb(247, 247, 250)",
  actionColor: "rgb(250, 250, 252)",
  tableHeaderColor: "rgb(250, 250, 252)",
  hoverColor: "rgb(243, 243, 245)",
  // use color with alpha since it can be nested with header filter & sorter effect
  tableColorHover: "rgba(0, 0, 100, 0.03)",
  tableColorStriped: "rgba(0, 0, 100, 0.02)",
  pressedColor: "rgb(237, 237, 239)",
  opacityDisabled: base.alphaDisabled,
  inputColorDisabled: "rgb(250, 250, 252)",
  // secondary button color
  // can also be used in tertiary button & quaternary button
  buttonColor2: "rgba(46, 51, 56, .05)",
  buttonColor2Hover: "rgba(46, 51, 56, .09)",
  buttonColor2Pressed: "rgba(46, 51, 56, .13)",
  boxShadow1: "0 1px 2px -2px rgba(0, 0, 0, .08), 0 3px 6px 0 rgba(0, 0, 0, .06), 0 5px 12px 4px rgba(0, 0, 0, .04)",
  boxShadow2: "0 3px 6px -4px rgba(0, 0, 0, .12), 0 6px 16px 0 rgba(0, 0, 0, .08), 0 9px 28px 8px rgba(0, 0, 0, .05)",
  boxShadow3: "0 6px 16px -9px rgba(0, 0, 0, .08), 0 9px 28px 0 rgba(0, 0, 0, .05), 0 12px 48px 16px rgba(0, 0, 0, .03)"
});
var light_default = derived;

// ../node_modules/naive-ui/es/_internal/scrollbar/styles/common.mjs
var commonVars = {
  railInsetHorizontalBottom: "auto 2px 4px 2px",
  railInsetHorizontalTop: "4px 2px auto 2px",
  railInsetVerticalRight: "2px 4px 2px auto",
  railInsetVerticalLeft: "2px auto 2px 4px",
  railColor: "transparent"
};

// ../node_modules/naive-ui/es/_internal/scrollbar/styles/light.mjs
function self2(vars) {
  const {
    scrollbarColor,
    scrollbarColorHover,
    scrollbarHeight,
    scrollbarWidth,
    scrollbarBorderRadius
  } = vars;
  return Object.assign(Object.assign({}, commonVars), {
    height: scrollbarHeight,
    width: scrollbarWidth,
    borderRadius: scrollbarBorderRadius,
    color: scrollbarColor,
    colorHover: scrollbarColorHover
  });
}
var scrollbarLight = {
  name: "Scrollbar",
  common: light_default,
  self: self2
};
var light_default2 = scrollbarLight;

// ../node_modules/naive-ui/es/_internal/scrollbar/src/styles/index.cssr.mjs
var index_cssr_default5 = cB("scrollbar", `
 overflow: hidden;
 position: relative;
 z-index: auto;
 height: 100%;
 width: 100%;
`, [c2(">", [cB("scrollbar-container", `
 width: 100%;
 overflow: scroll;
 height: 100%;
 min-height: inherit;
 max-height: inherit;
 scrollbar-width: none;
 `, [c2("&::-webkit-scrollbar, &::-webkit-scrollbar-track-piece, &::-webkit-scrollbar-thumb", `
 width: 0;
 height: 0;
 display: none;
 `), c2(">", [
  // We can't set overflow hidden since it affects positioning.
  cB("scrollbar-content", `
 box-sizing: border-box;
 min-width: 100%;
 `)
])])]), c2(">, +", [cB("scrollbar-rail", `
 position: absolute;
 pointer-events: none;
 user-select: none;
 background: var(--n-scrollbar-rail-color);
 -webkit-user-select: none;
 `, [cM("horizontal", `
 height: var(--n-scrollbar-height);
 `, [c2(">", [cE("scrollbar", `
 height: var(--n-scrollbar-height);
 border-radius: var(--n-scrollbar-border-radius);
 right: 0;
 `)])]), cM("horizontal--top", `
 top: var(--n-scrollbar-rail-top-horizontal-top); 
 right: var(--n-scrollbar-rail-right-horizontal-top); 
 bottom: var(--n-scrollbar-rail-bottom-horizontal-top); 
 left: var(--n-scrollbar-rail-left-horizontal-top); 
 `), cM("horizontal--bottom", `
 top: var(--n-scrollbar-rail-top-horizontal-bottom); 
 right: var(--n-scrollbar-rail-right-horizontal-bottom); 
 bottom: var(--n-scrollbar-rail-bottom-horizontal-bottom); 
 left: var(--n-scrollbar-rail-left-horizontal-bottom); 
 `), cM("vertical", `
 width: var(--n-scrollbar-width);
 `, [c2(">", [cE("scrollbar", `
 width: var(--n-scrollbar-width);
 border-radius: var(--n-scrollbar-border-radius);
 bottom: 0;
 `)])]), cM("vertical--left", `
 top: var(--n-scrollbar-rail-top-vertical-left); 
 right: var(--n-scrollbar-rail-right-vertical-left); 
 bottom: var(--n-scrollbar-rail-bottom-vertical-left); 
 left: var(--n-scrollbar-rail-left-vertical-left); 
 `), cM("vertical--right", `
 top: var(--n-scrollbar-rail-top-vertical-right); 
 right: var(--n-scrollbar-rail-right-vertical-right); 
 bottom: var(--n-scrollbar-rail-bottom-vertical-right); 
 left: var(--n-scrollbar-rail-left-vertical-right); 
 `), cM("disabled", [c2(">", [cE("scrollbar", "pointer-events: none;")])]), c2(">", [cE("scrollbar", `
 z-index: 1;
 position: absolute;
 cursor: pointer;
 pointer-events: all;
 background-color: var(--n-scrollbar-color);
 transition: background-color .2s var(--n-scrollbar-bezier);
 `, [fadeInTransition(), c2("&:hover", "background-color: var(--n-scrollbar-color-hover);")])])])])]);

// ../node_modules/naive-ui/es/_internal/scrollbar/src/Scrollbar.mjs
var scrollbarProps = Object.assign(Object.assign({}, use_theme_default.props), {
  duration: {
    type: Number,
    default: 0
  },
  scrollable: {
    type: Boolean,
    default: true
  },
  xScrollable: Boolean,
  trigger: {
    type: String,
    default: "hover"
  },
  useUnifiedContainer: Boolean,
  triggerDisplayManually: Boolean,
  // If container is set, resize observer won't not attached
  container: Function,
  content: Function,
  containerClass: String,
  containerStyle: [String, Object],
  contentClass: [String, Array],
  contentStyle: [String, Object],
  horizontalRailStyle: [String, Object],
  verticalRailStyle: [String, Object],
  onScroll: Function,
  onWheel: Function,
  onResize: Function,
  internalOnUpdateScrollLeft: Function,
  internalHoistYRail: Boolean,
  yPlacement: {
    type: String,
    default: "right"
  },
  xPlacement: {
    type: String,
    default: "bottom"
  }
});
var Scrollbar = defineComponent23({
  name: "Scrollbar",
  props: scrollbarProps,
  inheritAttrs: false,
  setup(props) {
    const {
      mergedClsPrefixRef,
      inlineThemeDisabled,
      mergedRtlRef
    } = useConfig(props);
    const rtlEnabledRef = useRtl("Scrollbar", mergedRtlRef, mergedClsPrefixRef);
    const wrapperRef = ref10(null);
    const containerRef = ref10(null);
    const contentRef = ref10(null);
    const yRailRef = ref10(null);
    const xRailRef = ref10(null);
    const contentHeightRef = ref10(null);
    const contentWidthRef = ref10(null);
    const containerHeightRef = ref10(null);
    const containerWidthRef = ref10(null);
    const yRailSizeRef = ref10(null);
    const xRailSizeRef = ref10(null);
    const containerScrollTopRef = ref10(0);
    const containerScrollLeftRef = ref10(0);
    const isShowXBarRef = ref10(false);
    const isShowYBarRef = ref10(false);
    let yBarPressed = false;
    let xBarPressed = false;
    let xBarVanishTimerId;
    let yBarVanishTimerId;
    let memoYTop = 0;
    let memoXLeft = 0;
    let memoMouseX = 0;
    let memoMouseY = 0;
    const isIos2 = useIsIos();
    const themeRef = use_theme_default("Scrollbar", "-scrollbar", index_cssr_default5, light_default2, props, mergedClsPrefixRef);
    const yBarSizeRef = computed11(() => {
      const {
        value: containerHeight
      } = containerHeightRef;
      const {
        value: contentHeight
      } = contentHeightRef;
      const {
        value: yRailSize
      } = yRailSizeRef;
      if (containerHeight === null || contentHeight === null || yRailSize === null) {
        return 0;
      } else {
        return Math.min(containerHeight, yRailSize * containerHeight / contentHeight + depx(themeRef.value.self.width) * 1.5);
      }
    });
    const yBarSizePxRef = computed11(() => {
      return `${yBarSizeRef.value}px`;
    });
    const xBarSizeRef = computed11(() => {
      const {
        value: containerWidth
      } = containerWidthRef;
      const {
        value: contentWidth
      } = contentWidthRef;
      const {
        value: xRailSize
      } = xRailSizeRef;
      if (containerWidth === null || contentWidth === null || xRailSize === null) {
        return 0;
      } else {
        return xRailSize * containerWidth / contentWidth + depx(themeRef.value.self.height) * 1.5;
      }
    });
    const xBarSizePxRef = computed11(() => {
      return `${xBarSizeRef.value}px`;
    });
    const yBarTopRef = computed11(() => {
      const {
        value: containerHeight
      } = containerHeightRef;
      const {
        value: containerScrollTop
      } = containerScrollTopRef;
      const {
        value: contentHeight
      } = contentHeightRef;
      const {
        value: yRailSize
      } = yRailSizeRef;
      if (containerHeight === null || contentHeight === null || yRailSize === null) {
        return 0;
      } else {
        const heightDiff = contentHeight - containerHeight;
        if (!heightDiff) return 0;
        return containerScrollTop / heightDiff * (yRailSize - yBarSizeRef.value);
      }
    });
    const yBarTopPxRef = computed11(() => {
      return `${yBarTopRef.value}px`;
    });
    const xBarLeftRef = computed11(() => {
      const {
        value: containerWidth
      } = containerWidthRef;
      const {
        value: containerScrollLeft
      } = containerScrollLeftRef;
      const {
        value: contentWidth
      } = contentWidthRef;
      const {
        value: xRailSize
      } = xRailSizeRef;
      if (containerWidth === null || contentWidth === null || xRailSize === null) {
        return 0;
      } else {
        const widthDiff = contentWidth - containerWidth;
        if (!widthDiff) return 0;
        return containerScrollLeft / widthDiff * (xRailSize - xBarSizeRef.value);
      }
    });
    const xBarLeftPxRef = computed11(() => {
      return `${xBarLeftRef.value}px`;
    });
    const needYBarRef = computed11(() => {
      const {
        value: containerHeight
      } = containerHeightRef;
      const {
        value: contentHeight
      } = contentHeightRef;
      return containerHeight !== null && contentHeight !== null && contentHeight > containerHeight;
    });
    const needXBarRef = computed11(() => {
      const {
        value: containerWidth
      } = containerWidthRef;
      const {
        value: contentWidth
      } = contentWidthRef;
      return containerWidth !== null && contentWidth !== null && contentWidth > containerWidth;
    });
    const mergedShowXBarRef = computed11(() => {
      const {
        trigger: trigger2
      } = props;
      return trigger2 === "none" || isShowXBarRef.value;
    });
    const mergedShowYBarRef = computed11(() => {
      const {
        trigger: trigger2
      } = props;
      return trigger2 === "none" || isShowYBarRef.value;
    });
    const mergedContainerRef = computed11(() => {
      const {
        container
      } = props;
      if (container) return container();
      return containerRef.value;
    });
    const mergedContentRef = computed11(() => {
      const {
        content
      } = props;
      if (content) return content();
      return contentRef.value;
    });
    const scrollTo = (options, y) => {
      if (!props.scrollable) return;
      if (typeof options === "number") {
        scrollToPosition(options, y !== null && y !== void 0 ? y : 0, 0, false, "auto");
        return;
      }
      const {
        left,
        top,
        index,
        elSize,
        position,
        behavior,
        el,
        debounce = true
      } = options;
      if (left !== void 0 || top !== void 0) {
        scrollToPosition(left !== null && left !== void 0 ? left : 0, top !== null && top !== void 0 ? top : 0, 0, false, behavior);
      }
      if (el !== void 0) {
        scrollToPosition(0, el.offsetTop, el.offsetHeight, debounce, behavior);
      } else if (index !== void 0 && elSize !== void 0) {
        scrollToPosition(0, index * elSize, elSize, debounce, behavior);
      } else if (position === "bottom") {
        scrollToPosition(0, Number.MAX_SAFE_INTEGER, 0, false, behavior);
      } else if (position === "top") {
        scrollToPosition(0, 0, 0, false, behavior);
      }
    };
    const activateState = useReactivated(() => {
      if (!props.container) {
        scrollTo({
          top: containerScrollTopRef.value,
          left: containerScrollLeftRef.value
        });
      }
    });
    const handleContentResize = () => {
      if (activateState.isDeactivated) return;
      sync();
    };
    const handleContainerResize = (e) => {
      if (activateState.isDeactivated) return;
      const {
        onResize
      } = props;
      if (onResize) onResize(e);
      sync();
    };
    const scrollBy = (options, y) => {
      if (!props.scrollable) return;
      const {
        value: container
      } = mergedContainerRef;
      if (!container) return;
      if (typeof options === "object") {
        container.scrollBy(options);
      } else {
        container.scrollBy(options, y || 0);
      }
    };
    function scrollToPosition(left, top, elSize, debounce, behavior) {
      const {
        value: container
      } = mergedContainerRef;
      if (!container) return;
      if (debounce) {
        const {
          scrollTop,
          offsetHeight
        } = container;
        if (top > scrollTop) {
          if (top + elSize <= scrollTop + offsetHeight) {
          } else {
            container.scrollTo({
              left,
              top: top + elSize - offsetHeight,
              behavior
            });
          }
          return;
        }
      }
      container.scrollTo({
        left,
        top,
        behavior
      });
    }
    function handleMouseEnterWrapper() {
      showXBar();
      showYBar();
      sync();
    }
    function handleMouseLeaveWrapper() {
      hideBar();
    }
    function hideBar() {
      hideYBar();
      hideXBar();
    }
    function hideYBar() {
      if (yBarVanishTimerId !== void 0) {
        window.clearTimeout(yBarVanishTimerId);
      }
      yBarVanishTimerId = window.setTimeout(() => {
        isShowYBarRef.value = false;
      }, props.duration);
    }
    function hideXBar() {
      if (xBarVanishTimerId !== void 0) {
        window.clearTimeout(xBarVanishTimerId);
      }
      xBarVanishTimerId = window.setTimeout(() => {
        isShowXBarRef.value = false;
      }, props.duration);
    }
    function showXBar() {
      if (xBarVanishTimerId !== void 0) {
        window.clearTimeout(xBarVanishTimerId);
      }
      isShowXBarRef.value = true;
    }
    function showYBar() {
      if (yBarVanishTimerId !== void 0) {
        window.clearTimeout(yBarVanishTimerId);
      }
      isShowYBarRef.value = true;
    }
    function handleScroll(e) {
      const {
        onScroll
      } = props;
      if (onScroll) onScroll(e);
      syncScrollState();
    }
    function syncScrollState() {
      const {
        value: container
      } = mergedContainerRef;
      if (container) {
        containerScrollTopRef.value = container.scrollTop;
        containerScrollLeftRef.value = container.scrollLeft * ((rtlEnabledRef === null || rtlEnabledRef === void 0 ? void 0 : rtlEnabledRef.value) ? -1 : 1);
      }
    }
    function syncPositionState() {
      const {
        value: content
      } = mergedContentRef;
      if (content) {
        contentHeightRef.value = content.offsetHeight;
        contentWidthRef.value = content.offsetWidth;
      }
      const {
        value: container
      } = mergedContainerRef;
      if (container) {
        containerHeightRef.value = container.offsetHeight;
        containerWidthRef.value = container.offsetWidth;
      }
      const {
        value: xRailEl
      } = xRailRef;
      const {
        value: yRailEl
      } = yRailRef;
      if (xRailEl) {
        xRailSizeRef.value = xRailEl.offsetWidth;
      }
      if (yRailEl) {
        yRailSizeRef.value = yRailEl.offsetHeight;
      }
    }
    function syncUnifiedContainer() {
      const {
        value: container
      } = mergedContainerRef;
      if (container) {
        containerScrollTopRef.value = container.scrollTop;
        containerScrollLeftRef.value = container.scrollLeft * ((rtlEnabledRef === null || rtlEnabledRef === void 0 ? void 0 : rtlEnabledRef.value) ? -1 : 1);
        containerHeightRef.value = container.offsetHeight;
        containerWidthRef.value = container.offsetWidth;
        contentHeightRef.value = container.scrollHeight;
        contentWidthRef.value = container.scrollWidth;
      }
      const {
        value: xRailEl
      } = xRailRef;
      const {
        value: yRailEl
      } = yRailRef;
      if (xRailEl) {
        xRailSizeRef.value = xRailEl.offsetWidth;
      }
      if (yRailEl) {
        yRailSizeRef.value = yRailEl.offsetHeight;
      }
    }
    function sync() {
      if (!props.scrollable) return;
      if (props.useUnifiedContainer) {
        syncUnifiedContainer();
      } else {
        syncPositionState();
        syncScrollState();
      }
    }
    function isMouseUpAway(e) {
      var _a;
      return !((_a = wrapperRef.value) === null || _a === void 0 ? void 0 : _a.contains(getPreciseEventTarget(e)));
    }
    function handleXScrollMouseDown(e) {
      e.preventDefault();
      e.stopPropagation();
      xBarPressed = true;
      on("mousemove", window, handleXScrollMouseMove, true);
      on("mouseup", window, handleXScrollMouseUp, true);
      memoXLeft = containerScrollLeftRef.value;
      memoMouseX = (rtlEnabledRef === null || rtlEnabledRef === void 0 ? void 0 : rtlEnabledRef.value) ? window.innerWidth - e.clientX : e.clientX;
    }
    function handleXScrollMouseMove(e) {
      if (!xBarPressed) return;
      if (xBarVanishTimerId !== void 0) {
        window.clearTimeout(xBarVanishTimerId);
      }
      if (yBarVanishTimerId !== void 0) {
        window.clearTimeout(yBarVanishTimerId);
      }
      const {
        value: containerWidth
      } = containerWidthRef;
      const {
        value: contentWidth
      } = contentWidthRef;
      const {
        value: xBarSize
      } = xBarSizeRef;
      if (containerWidth === null || contentWidth === null) return;
      const dX = (rtlEnabledRef === null || rtlEnabledRef === void 0 ? void 0 : rtlEnabledRef.value) ? window.innerWidth - e.clientX - memoMouseX : e.clientX - memoMouseX;
      const dScrollLeft = dX * (contentWidth - containerWidth) / (containerWidth - xBarSize);
      const toScrollLeftUpperBound = contentWidth - containerWidth;
      let toScrollLeft = memoXLeft + dScrollLeft;
      toScrollLeft = Math.min(toScrollLeftUpperBound, toScrollLeft);
      toScrollLeft = Math.max(toScrollLeft, 0);
      const {
        value: container
      } = mergedContainerRef;
      if (container) {
        container.scrollLeft = toScrollLeft * ((rtlEnabledRef === null || rtlEnabledRef === void 0 ? void 0 : rtlEnabledRef.value) ? -1 : 1);
        const {
          internalOnUpdateScrollLeft
        } = props;
        if (internalOnUpdateScrollLeft) internalOnUpdateScrollLeft(toScrollLeft);
      }
    }
    function handleXScrollMouseUp(e) {
      e.preventDefault();
      e.stopPropagation();
      off("mousemove", window, handleXScrollMouseMove, true);
      off("mouseup", window, handleXScrollMouseUp, true);
      xBarPressed = false;
      sync();
      if (isMouseUpAway(e)) {
        hideBar();
      }
    }
    function handleYScrollMouseDown(e) {
      e.preventDefault();
      e.stopPropagation();
      yBarPressed = true;
      on("mousemove", window, handleYScrollMouseMove, true);
      on("mouseup", window, handleYScrollMouseUp, true);
      memoYTop = containerScrollTopRef.value;
      memoMouseY = e.clientY;
    }
    function handleYScrollMouseMove(e) {
      if (!yBarPressed) return;
      if (xBarVanishTimerId !== void 0) {
        window.clearTimeout(xBarVanishTimerId);
      }
      if (yBarVanishTimerId !== void 0) {
        window.clearTimeout(yBarVanishTimerId);
      }
      const {
        value: containerHeight
      } = containerHeightRef;
      const {
        value: contentHeight
      } = contentHeightRef;
      const {
        value: yBarSize
      } = yBarSizeRef;
      if (containerHeight === null || contentHeight === null) return;
      const dY = e.clientY - memoMouseY;
      const dScrollTop = dY * (contentHeight - containerHeight) / (containerHeight - yBarSize);
      const toScrollTopUpperBound = contentHeight - containerHeight;
      let toScrollTop = memoYTop + dScrollTop;
      toScrollTop = Math.min(toScrollTopUpperBound, toScrollTop);
      toScrollTop = Math.max(toScrollTop, 0);
      const {
        value: container
      } = mergedContainerRef;
      if (container) {
        container.scrollTop = toScrollTop;
      }
    }
    function handleYScrollMouseUp(e) {
      e.preventDefault();
      e.stopPropagation();
      off("mousemove", window, handleYScrollMouseMove, true);
      off("mouseup", window, handleYScrollMouseUp, true);
      yBarPressed = false;
      sync();
      if (isMouseUpAway(e)) {
        hideBar();
      }
    }
    watchEffect3(() => {
      const {
        value: needXBar
      } = needXBarRef;
      const {
        value: needYBar
      } = needYBarRef;
      const {
        value: mergedClsPrefix
      } = mergedClsPrefixRef;
      const {
        value: xRailEl
      } = xRailRef;
      const {
        value: yRailEl
      } = yRailRef;
      if (xRailEl) {
        if (!needXBar) {
          xRailEl.classList.add(`${mergedClsPrefix}-scrollbar-rail--disabled`);
        } else {
          xRailEl.classList.remove(`${mergedClsPrefix}-scrollbar-rail--disabled`);
        }
      }
      if (yRailEl) {
        if (!needYBar) {
          yRailEl.classList.add(`${mergedClsPrefix}-scrollbar-rail--disabled`);
        } else {
          yRailEl.classList.remove(`${mergedClsPrefix}-scrollbar-rail--disabled`);
        }
      }
    });
    onMounted7(() => {
      if (props.container) return;
      sync();
    });
    onBeforeUnmount8(() => {
      if (xBarVanishTimerId !== void 0) {
        window.clearTimeout(xBarVanishTimerId);
      }
      if (yBarVanishTimerId !== void 0) {
        window.clearTimeout(yBarVanishTimerId);
      }
      off("mousemove", window, handleYScrollMouseMove, true);
      off("mouseup", window, handleYScrollMouseUp, true);
    });
    const cssVarsRef = computed11(() => {
      const {
        common: {
          cubicBezierEaseInOut: cubicBezierEaseInOut4
        },
        self: {
          color,
          colorHover,
          height,
          width,
          borderRadius,
          railInsetHorizontalTop,
          railInsetHorizontalBottom,
          railInsetVerticalRight,
          railInsetVerticalLeft,
          railColor
        }
      } = themeRef.value;
      const {
        top: railTopHorizontalTop,
        right: railRightHorizontalTop,
        bottom: railBottomHorizontalTop,
        left: railLeftHorizontalTop
      } = getMargin(railInsetHorizontalTop);
      const {
        top: railTopHorizontalBottom,
        right: railRightHorizontalBottom,
        bottom: railBottomHorizontalBottom,
        left: railLeftHorizontalBottom
      } = getMargin(railInsetHorizontalBottom);
      const {
        top: railTopVerticalRight,
        right: railRightVerticalRight,
        bottom: railBottomVerticalRight,
        left: railLeftVerticalRight
      } = getMargin((rtlEnabledRef === null || rtlEnabledRef === void 0 ? void 0 : rtlEnabledRef.value) ? rtlInset(railInsetVerticalRight) : railInsetVerticalRight);
      const {
        top: railTopVerticalLeft,
        right: railRightVerticalLeft,
        bottom: railBottomVerticalLeft,
        left: railLeftVerticalLeft
      } = getMargin((rtlEnabledRef === null || rtlEnabledRef === void 0 ? void 0 : rtlEnabledRef.value) ? rtlInset(railInsetVerticalLeft) : railInsetVerticalLeft);
      return {
        "--n-scrollbar-bezier": cubicBezierEaseInOut4,
        "--n-scrollbar-color": color,
        "--n-scrollbar-color-hover": colorHover,
        "--n-scrollbar-border-radius": borderRadius,
        "--n-scrollbar-width": width,
        "--n-scrollbar-height": height,
        "--n-scrollbar-rail-top-horizontal-top": railTopHorizontalTop,
        "--n-scrollbar-rail-right-horizontal-top": railRightHorizontalTop,
        "--n-scrollbar-rail-bottom-horizontal-top": railBottomHorizontalTop,
        "--n-scrollbar-rail-left-horizontal-top": railLeftHorizontalTop,
        "--n-scrollbar-rail-top-horizontal-bottom": railTopHorizontalBottom,
        "--n-scrollbar-rail-right-horizontal-bottom": railRightHorizontalBottom,
        "--n-scrollbar-rail-bottom-horizontal-bottom": railBottomHorizontalBottom,
        "--n-scrollbar-rail-left-horizontal-bottom": railLeftHorizontalBottom,
        "--n-scrollbar-rail-top-vertical-right": railTopVerticalRight,
        "--n-scrollbar-rail-right-vertical-right": railRightVerticalRight,
        "--n-scrollbar-rail-bottom-vertical-right": railBottomVerticalRight,
        "--n-scrollbar-rail-left-vertical-right": railLeftVerticalRight,
        "--n-scrollbar-rail-top-vertical-left": railTopVerticalLeft,
        "--n-scrollbar-rail-right-vertical-left": railRightVerticalLeft,
        "--n-scrollbar-rail-bottom-vertical-left": railBottomVerticalLeft,
        "--n-scrollbar-rail-left-vertical-left": railLeftVerticalLeft,
        "--n-scrollbar-rail-color": railColor
      };
    });
    const themeClassHandle = inlineThemeDisabled ? useThemeClass("scrollbar", void 0, cssVarsRef, props) : void 0;
    const exposedMethods = {
      scrollTo,
      scrollBy,
      sync,
      syncUnifiedContainer,
      handleMouseEnterWrapper,
      handleMouseLeaveWrapper
    };
    return Object.assign(Object.assign({}, exposedMethods), {
      mergedClsPrefix: mergedClsPrefixRef,
      rtlEnabled: rtlEnabledRef,
      containerScrollTop: containerScrollTopRef,
      wrapperRef,
      containerRef,
      contentRef,
      yRailRef,
      xRailRef,
      needYBar: needYBarRef,
      needXBar: needXBarRef,
      yBarSizePx: yBarSizePxRef,
      xBarSizePx: xBarSizePxRef,
      yBarTopPx: yBarTopPxRef,
      xBarLeftPx: xBarLeftPxRef,
      isShowXBar: mergedShowXBarRef,
      isShowYBar: mergedShowYBarRef,
      isIos: isIos2,
      handleScroll,
      handleContentResize,
      handleContainerResize,
      handleYScrollMouseDown,
      handleXScrollMouseDown,
      cssVars: inlineThemeDisabled ? void 0 : cssVarsRef,
      themeClass: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.themeClass,
      onRender: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.onRender
    });
  },
  render() {
    var _a;
    const {
      $slots,
      mergedClsPrefix,
      triggerDisplayManually,
      rtlEnabled,
      internalHoistYRail,
      yPlacement,
      xPlacement,
      xScrollable
    } = this;
    if (!this.scrollable) return (_a = $slots.default) === null || _a === void 0 ? void 0 : _a.call($slots);
    const triggerIsNone = this.trigger === "none";
    const createYRail = (className, style2) => {
      return h22("div", {
        ref: "yRailRef",
        class: [`${mergedClsPrefix}-scrollbar-rail`, `${mergedClsPrefix}-scrollbar-rail--vertical`, `${mergedClsPrefix}-scrollbar-rail--vertical--${yPlacement}`, className],
        "data-scrollbar-rail": true,
        style: [style2 || "", this.verticalRailStyle],
        "aria-hidden": true
      }, h22(triggerIsNone ? Wrapper : Transition3, triggerIsNone ? null : {
        name: "fade-in-transition"
      }, {
        default: () => this.needYBar && this.isShowYBar && !this.isIos ? h22("div", {
          class: `${mergedClsPrefix}-scrollbar-rail__scrollbar`,
          style: {
            height: this.yBarSizePx,
            top: this.yBarTopPx
          },
          onMousedown: this.handleYScrollMouseDown
        }) : null
      }));
    };
    const createChildren = () => {
      var _a2, _b;
      (_a2 = this.onRender) === null || _a2 === void 0 ? void 0 : _a2.call(this);
      return h22("div", mergeProps2(this.$attrs, {
        role: "none",
        ref: "wrapperRef",
        class: [`${mergedClsPrefix}-scrollbar`, this.themeClass, rtlEnabled && `${mergedClsPrefix}-scrollbar--rtl`],
        style: this.cssVars,
        onMouseenter: triggerDisplayManually ? void 0 : this.handleMouseEnterWrapper,
        onMouseleave: triggerDisplayManually ? void 0 : this.handleMouseLeaveWrapper
      }), [this.container ? (_b = $slots.default) === null || _b === void 0 ? void 0 : _b.call($slots) : h22("div", {
        role: "none",
        ref: "containerRef",
        class: [`${mergedClsPrefix}-scrollbar-container`, this.containerClass],
        style: this.containerStyle,
        onScroll: this.handleScroll,
        onWheel: this.onWheel
      }, h22(VResizeObserver_default, {
        onResize: this.handleContentResize
      }, {
        default: () => h22("div", {
          ref: "contentRef",
          role: "none",
          style: [{
            width: this.xScrollable ? "fit-content" : null
          }, this.contentStyle],
          class: [`${mergedClsPrefix}-scrollbar-content`, this.contentClass]
        }, $slots)
      })), internalHoistYRail ? null : createYRail(void 0, void 0), xScrollable && h22("div", {
        ref: "xRailRef",
        class: [`${mergedClsPrefix}-scrollbar-rail`, `${mergedClsPrefix}-scrollbar-rail--horizontal`, `${mergedClsPrefix}-scrollbar-rail--horizontal--${xPlacement}`],
        style: this.horizontalRailStyle,
        "data-scrollbar-rail": true,
        "aria-hidden": true
      }, h22(triggerIsNone ? Wrapper : Transition3, triggerIsNone ? null : {
        name: "fade-in-transition"
      }, {
        default: () => this.needXBar && this.isShowXBar && !this.isIos ? h22("div", {
          class: `${mergedClsPrefix}-scrollbar-rail__scrollbar`,
          style: {
            width: this.xBarSizePx,
            right: rtlEnabled ? this.xBarLeftPx : void 0,
            left: rtlEnabled ? void 0 : this.xBarLeftPx
          },
          onMousedown: this.handleXScrollMouseDown
        }) : null
      }))]);
    };
    const scrollbarNode = this.container ? createChildren() : h22(VResizeObserver_default, {
      onResize: this.handleContainerResize
    }, {
      default: createChildren
    });
    if (internalHoistYRail) {
      return h22(Fragment3, null, scrollbarNode, createYRail(this.themeClass, this.cssVars));
    } else {
      return scrollbarNode;
    }
  }
});
var Scrollbar_default = Scrollbar;

// ../node_modules/naive-ui/es/_styles/transitions/fade-in-scale-up.cssr.mjs
var {
  cubicBezierEaseIn,
  cubicBezierEaseOut
} = common_default;
function fadeInScaleUpTransition({
  transformOrigin = "inherit",
  duration: duration2 = ".2s",
  enterScale = ".9",
  originalTransform = "",
  originalTransition = ""
} = {}) {
  return [c2("&.fade-in-scale-up-transition-leave-active", {
    transformOrigin,
    transition: `opacity ${duration2} ${cubicBezierEaseIn}, transform ${duration2} ${cubicBezierEaseIn} ${originalTransition && `,${originalTransition}`}`
  }), c2("&.fade-in-scale-up-transition-enter-active", {
    transformOrigin,
    transition: `opacity ${duration2} ${cubicBezierEaseOut}, transform ${duration2} ${cubicBezierEaseOut} ${originalTransition && `,${originalTransition}`}`
  }), c2("&.fade-in-scale-up-transition-enter-from, &.fade-in-scale-up-transition-leave-to", {
    opacity: 0,
    transform: `${originalTransform} scale(${enterScale})`
  }), c2("&.fade-in-scale-up-transition-leave-from, &.fade-in-scale-up-transition-enter-to", {
    opacity: 1,
    transform: `${originalTransform} scale(1)`
  })];
}

// ../node_modules/naive-ui/es/_internal/suffix/src/Suffix.mjs
import { defineComponent as defineComponent24, h as h23 } from "vue";
var Suffix_default = defineComponent24({
  name: "InternalSelectionSuffix",
  props: {
    clsPrefix: {
      type: String,
      required: true
    },
    showArrow: {
      type: Boolean,
      default: void 0
    },
    showClear: {
      type: Boolean,
      default: void 0
    },
    loading: {
      type: Boolean,
      default: false
    },
    onClear: Function
  },
  setup(props, {
    slots
  }) {
    return () => {
      const {
        clsPrefix
      } = props;
      return h23(Loading_default, {
        clsPrefix,
        class: `${clsPrefix}-base-suffix`,
        strokeWidth: 24,
        scale: 0.85,
        show: props.loading
      }, {
        default: () => props.showArrow ? h23(Clear_default2, {
          clsPrefix,
          show: props.showClear,
          onClear: props.onClear
        }, {
          placeholder: () => h23(Icon_default, {
            clsPrefix,
            class: `${clsPrefix}-base-suffix__arrow`
          }, {
            default: () => resolveSlot(slots.default, () => [h23(ChevronDown_default, null)])
          })
        }) : null
      });
    };
  }
});

// ../node_modules/naive-ui/es/_styles/transitions/fade-in-width-expand.cssr.mjs
var {
  cubicBezierEaseInOut: cubicBezierEaseInOut3
} = common_default;
function fadeInWidthExpandTransition({
  duration: duration2 = ".2s",
  delay = ".1s"
} = {}) {
  return [c2("&.fade-in-width-expand-transition-leave-from, &.fade-in-width-expand-transition-enter-to", {
    opacity: 1
  }), c2("&.fade-in-width-expand-transition-leave-to, &.fade-in-width-expand-transition-enter-from", `
 opacity: 0!important;
 margin-left: 0!important;
 margin-right: 0!important;
 `), c2("&.fade-in-width-expand-transition-leave-active", `
 overflow: hidden;
 transition:
 opacity ${duration2} ${cubicBezierEaseInOut3},
 max-width ${duration2} ${cubicBezierEaseInOut3} ${delay},
 margin-left ${duration2} ${cubicBezierEaseInOut3} ${delay},
 margin-right ${duration2} ${cubicBezierEaseInOut3} ${delay};
 `), c2("&.fade-in-width-expand-transition-enter-active", `
 overflow: hidden;
 transition:
 opacity ${duration2} ${cubicBezierEaseInOut3} ${delay},
 max-width ${duration2} ${cubicBezierEaseInOut3},
 margin-left ${duration2} ${cubicBezierEaseInOut3},
 margin-right ${duration2} ${cubicBezierEaseInOut3};
 `)];
}

// ../node_modules/naive-ui/es/_internal/wave/src/Wave.mjs
import { defineComponent as defineComponent25, h as h24, nextTick as nextTick2, onBeforeUnmount as onBeforeUnmount9, ref as ref11, toRef as toRef7 } from "vue";

// ../node_modules/naive-ui/es/_internal/wave/src/styles/index.cssr.mjs
var index_cssr_default6 = cB("base-wave", `
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 border-radius: inherit;
`);

// ../node_modules/naive-ui/es/_internal/wave/src/Wave.mjs
var Wave_default = defineComponent25({
  name: "BaseWave",
  props: {
    clsPrefix: {
      type: String,
      required: true
    }
  },
  setup(props) {
    useStyle("-base-wave", index_cssr_default6, toRef7(props, "clsPrefix"));
    const selfRef = ref11(null);
    const activeRef = ref11(false);
    let animationTimerId = null;
    onBeforeUnmount9(() => {
      if (animationTimerId !== null) {
        window.clearTimeout(animationTimerId);
      }
    });
    return {
      active: activeRef,
      selfRef,
      play() {
        if (animationTimerId !== null) {
          window.clearTimeout(animationTimerId);
          activeRef.value = false;
          animationTimerId = null;
        }
        void nextTick2(() => {
          var _a;
          void ((_a = selfRef.value) === null || _a === void 0 ? void 0 : _a.offsetHeight);
          activeRef.value = true;
          animationTimerId = window.setTimeout(() => {
            activeRef.value = false;
            animationTimerId = null;
          }, 1e3);
        });
      }
    };
  },
  render() {
    const {
      clsPrefix
    } = this;
    return h24("div", {
      ref: "selfRef",
      "aria-hidden": true,
      class: [`${clsPrefix}-base-wave`, this.active && `${clsPrefix}-base-wave--active`]
    });
  }
});

// ../node_modules/naive-ui/es/input/src/Input.mjs
import { computed as computed13, defineComponent as defineComponent27, Fragment as Fragment4, getCurrentInstance as getCurrentInstance4, h as h26, nextTick as nextTick3, onMounted as onMounted8, provide as provide4, ref as ref13, toRef as toRef8, watch as watch7, watchEffect as watchEffect4 } from "vue";

// ../node_modules/naive-ui/es/_utils/env/browser.mjs
var isChrome = isBrowser2 && "chrome" in window;
var isFirefox = isBrowser2 && navigator.userAgent.includes("Firefox");
var isSafari = isBrowser2 && navigator.userAgent.includes("Safari") && !isChrome;

// ../node_modules/naive-ui/es/input/styles/_common.mjs
var common_default2 = {
  paddingTiny: "0 8px",
  paddingSmall: "0 10px",
  paddingMedium: "0 12px",
  paddingLarge: "0 14px",
  clearSize: "16px"
};

// ../node_modules/naive-ui/es/input/styles/light.mjs
function self3(vars) {
  const {
    textColor2,
    textColor3,
    textColorDisabled,
    primaryColor,
    primaryColorHover,
    inputColor,
    inputColorDisabled,
    borderColor,
    warningColor,
    warningColorHover,
    errorColor,
    errorColorHover,
    borderRadius,
    lineHeight: lineHeight2,
    fontSizeTiny,
    fontSizeSmall,
    fontSizeMedium,
    fontSizeLarge,
    heightTiny,
    heightSmall,
    heightMedium,
    heightLarge,
    actionColor,
    clearColor,
    clearColorHover,
    clearColorPressed,
    placeholderColor,
    placeholderColorDisabled,
    iconColor,
    iconColorDisabled,
    iconColorHover,
    iconColorPressed,
    fontWeight
  } = vars;
  return Object.assign(Object.assign({}, common_default2), {
    fontWeight,
    countTextColorDisabled: textColorDisabled,
    countTextColor: textColor3,
    heightTiny,
    heightSmall,
    heightMedium,
    heightLarge,
    fontSizeTiny,
    fontSizeSmall,
    fontSizeMedium,
    fontSizeLarge,
    lineHeight: lineHeight2,
    lineHeightTextarea: lineHeight2,
    borderRadius,
    iconSize: "16px",
    groupLabelColor: actionColor,
    groupLabelTextColor: textColor2,
    textColor: textColor2,
    textColorDisabled,
    textDecorationColor: textColor2,
    caretColor: primaryColor,
    placeholderColor,
    placeholderColorDisabled,
    color: inputColor,
    colorDisabled: inputColorDisabled,
    colorFocus: inputColor,
    groupLabelBorder: `1px solid ${borderColor}`,
    border: `1px solid ${borderColor}`,
    borderHover: `1px solid ${primaryColorHover}`,
    borderDisabled: `1px solid ${borderColor}`,
    borderFocus: `1px solid ${primaryColorHover}`,
    boxShadowFocus: `0 0 0 2px ${changeColor(primaryColor, {
      alpha: 0.2
    })}`,
    loadingColor: primaryColor,
    // warning
    loadingColorWarning: warningColor,
    borderWarning: `1px solid ${warningColor}`,
    borderHoverWarning: `1px solid ${warningColorHover}`,
    colorFocusWarning: inputColor,
    borderFocusWarning: `1px solid ${warningColorHover}`,
    boxShadowFocusWarning: `0 0 0 2px ${changeColor(warningColor, {
      alpha: 0.2
    })}`,
    caretColorWarning: warningColor,
    // error
    loadingColorError: errorColor,
    borderError: `1px solid ${errorColor}`,
    borderHoverError: `1px solid ${errorColorHover}`,
    colorFocusError: inputColor,
    borderFocusError: `1px solid ${errorColorHover}`,
    boxShadowFocusError: `0 0 0 2px ${changeColor(errorColor, {
      alpha: 0.2
    })}`,
    caretColorError: errorColor,
    clearColor,
    clearColorHover,
    clearColorPressed,
    iconColor,
    iconColorDisabled,
    iconColorHover,
    iconColorPressed,
    suffixTextColor: textColor2
  });
}
var inputLight = {
  name: "Input",
  common: light_default,
  self: self3
};
var light_default3 = inputLight;

// ../node_modules/naive-ui/es/input/src/interface.mjs
var inputInjectionKey = createInjectionKey("n-input");

// ../node_modules/naive-ui/es/input/src/styles/input.cssr.mjs
var input_cssr_default = cB("input", `
 max-width: 100%;
 cursor: text;
 line-height: 1.5;
 z-index: auto;
 outline: none;
 box-sizing: border-box;
 position: relative;
 display: inline-flex;
 border-radius: var(--n-border-radius);
 background-color: var(--n-color);
 transition: background-color .3s var(--n-bezier);
 font-size: var(--n-font-size);
 font-weight: var(--n-font-weight);
 --n-padding-vertical: calc((var(--n-height) - 1.5 * var(--n-font-size)) / 2);
`, [
  // common
  cE("input, textarea", `
 overflow: hidden;
 flex-grow: 1;
 position: relative;
 `),
  cE("input-el, textarea-el, input-mirror, textarea-mirror, separator, placeholder", `
 box-sizing: border-box;
 font-size: inherit;
 line-height: 1.5;
 font-family: inherit;
 border: none;
 outline: none;
 background-color: #0000;
 text-align: inherit;
 transition:
 -webkit-text-fill-color .3s var(--n-bezier),
 caret-color .3s var(--n-bezier),
 color .3s var(--n-bezier),
 text-decoration-color .3s var(--n-bezier);
 `),
  cE("input-el, textarea-el", `
 -webkit-appearance: none;
 scrollbar-width: none;
 width: 100%;
 min-width: 0;
 text-decoration-color: var(--n-text-decoration-color);
 color: var(--n-text-color);
 caret-color: var(--n-caret-color);
 background-color: transparent;
 `, [c2("&::-webkit-scrollbar, &::-webkit-scrollbar-track-piece, &::-webkit-scrollbar-thumb", `
 width: 0;
 height: 0;
 display: none;
 `), c2("&::placeholder", `
 color: #0000;
 -webkit-text-fill-color: transparent !important;
 `), c2("&:-webkit-autofill ~", [cE("placeholder", "display: none;")])]),
  cM("round", [cNotM("textarea", "border-radius: calc(var(--n-height) / 2);")]),
  cE("placeholder", `
 pointer-events: none;
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 overflow: hidden;
 color: var(--n-placeholder-color);
 `, [c2("span", `
 width: 100%;
 display: inline-block;
 `)]),
  cM("textarea", [cE("placeholder", "overflow: visible;")]),
  cNotM("autosize", "width: 100%;"),
  cM("autosize", [cE("textarea-el, input-el", `
 position: absolute;
 top: 0;
 left: 0;
 height: 100%;
 `)]),
  // input
  cB("input-wrapper", `
 overflow: hidden;
 display: inline-flex;
 flex-grow: 1;
 position: relative;
 padding-left: var(--n-padding-left);
 padding-right: var(--n-padding-right);
 `),
  cE("input-mirror", `
 padding: 0;
 height: var(--n-height);
 line-height: var(--n-height);
 overflow: hidden;
 visibility: hidden;
 position: static;
 white-space: pre;
 pointer-events: none;
 `),
  cE("input-el", `
 padding: 0;
 height: var(--n-height);
 line-height: var(--n-height);
 `, [c2("&[type=password]::-ms-reveal", "display: none;"), c2("+", [cE("placeholder", `
 display: flex;
 align-items: center; 
 `)])]),
  cNotM("textarea", [cE("placeholder", "white-space: nowrap;")]),
  cE("eye", `
 display: flex;
 align-items: center;
 justify-content: center;
 transition: color .3s var(--n-bezier);
 `),
  // textarea
  cM("textarea", "width: 100%;", [cB("input-word-count", `
 position: absolute;
 right: var(--n-padding-right);
 bottom: var(--n-padding-vertical);
 `), cM("resizable", [cB("input-wrapper", `
 resize: vertical;
 min-height: var(--n-height);
 `)]), cE("textarea-el, textarea-mirror, placeholder", `
 height: 100%;
 padding-left: 0;
 padding-right: 0;
 padding-top: var(--n-padding-vertical);
 padding-bottom: var(--n-padding-vertical);
 word-break: break-word;
 display: inline-block;
 vertical-align: bottom;
 box-sizing: border-box;
 line-height: var(--n-line-height-textarea);
 margin: 0;
 resize: none;
 white-space: pre-wrap;
 scroll-padding-block-end: var(--n-padding-vertical);
 `), cE("textarea-mirror", `
 width: 100%;
 pointer-events: none;
 overflow: hidden;
 visibility: hidden;
 position: static;
 white-space: pre-wrap;
 overflow-wrap: break-word;
 `)]),
  // pair
  cM("pair", [cE("input-el, placeholder", "text-align: center;"), cE("separator", `
 display: flex;
 align-items: center;
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
 white-space: nowrap;
 `, [cB("icon", `
 color: var(--n-icon-color);
 `), cB("base-icon", `
 color: var(--n-icon-color);
 `)])]),
  cM("disabled", `
 cursor: not-allowed;
 background-color: var(--n-color-disabled);
 `, [cE("border", "border: var(--n-border-disabled);"), cE("input-el, textarea-el", `
 cursor: not-allowed;
 color: var(--n-text-color-disabled);
 text-decoration-color: var(--n-text-color-disabled);
 `), cE("placeholder", "color: var(--n-placeholder-color-disabled);"), cE("separator", "color: var(--n-text-color-disabled);", [cB("icon", `
 color: var(--n-icon-color-disabled);
 `), cB("base-icon", `
 color: var(--n-icon-color-disabled);
 `)]), cB("input-word-count", `
 color: var(--n-count-text-color-disabled);
 `), cE("suffix, prefix", "color: var(--n-text-color-disabled);", [cB("icon", `
 color: var(--n-icon-color-disabled);
 `), cB("internal-icon", `
 color: var(--n-icon-color-disabled);
 `)])]),
  cNotM("disabled", [cE("eye", `
 color: var(--n-icon-color);
 cursor: pointer;
 `, [c2("&:hover", `
 color: var(--n-icon-color-hover);
 `), c2("&:active", `
 color: var(--n-icon-color-pressed);
 `)]), c2("&:hover", [cE("state-border", "border: var(--n-border-hover);")]), cM("focus", "background-color: var(--n-color-focus);", [cE("state-border", `
 border: var(--n-border-focus);
 box-shadow: var(--n-box-shadow-focus);
 `)])]),
  cE("border, state-border", `
 box-sizing: border-box;
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 pointer-events: none;
 border-radius: inherit;
 border: var(--n-border);
 transition:
 box-shadow .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `),
  cE("state-border", `
 border-color: #0000;
 z-index: 1;
 `),
  cE("prefix", "margin-right: 4px;"),
  cE("suffix", `
 margin-left: 4px;
 `),
  cE("suffix, prefix", `
 transition: color .3s var(--n-bezier);
 flex-wrap: nowrap;
 flex-shrink: 0;
 line-height: var(--n-height);
 white-space: nowrap;
 display: inline-flex;
 align-items: center;
 justify-content: center;
 color: var(--n-suffix-text-color);
 `, [cB("base-loading", `
 font-size: var(--n-icon-size);
 margin: 0 2px;
 color: var(--n-loading-color);
 `), cB("base-clear", `
 font-size: var(--n-icon-size);
 `, [cE("placeholder", [cB("base-icon", `
 transition: color .3s var(--n-bezier);
 color: var(--n-icon-color);
 font-size: var(--n-icon-size);
 `)])]), c2(">", [cB("icon", `
 transition: color .3s var(--n-bezier);
 color: var(--n-icon-color);
 font-size: var(--n-icon-size);
 `)]), cB("base-icon", `
 font-size: var(--n-icon-size);
 `)]),
  cB("input-word-count", `
 pointer-events: none;
 line-height: 1.5;
 font-size: .85em;
 color: var(--n-count-text-color);
 transition: color .3s var(--n-bezier);
 margin-left: 4px;
 font-variant: tabular-nums;
 `),
  ["warning", "error"].map((status) => cM(`${status}-status`, [cNotM("disabled", [cB("base-loading", `
 color: var(--n-loading-color-${status})
 `), cE("input-el, textarea-el", `
 caret-color: var(--n-caret-color-${status});
 `), cE("state-border", `
 border: var(--n-border-${status});
 `), c2("&:hover", [cE("state-border", `
 border: var(--n-border-hover-${status});
 `)]), c2("&:focus", `
 background-color: var(--n-color-focus-${status});
 `, [cE("state-border", `
 box-shadow: var(--n-box-shadow-focus-${status});
 border: var(--n-border-focus-${status});
 `)]), cM("focus", `
 background-color: var(--n-color-focus-${status});
 `, [cE("state-border", `
 box-shadow: var(--n-box-shadow-focus-${status});
 border: var(--n-border-focus-${status});
 `)])])]))
]);
var safariStyle = cB("input", [cM("disabled", [cE("input-el, textarea-el", `
 -webkit-text-fill-color: var(--n-text-color-disabled);
 `)])]);

// ../node_modules/naive-ui/es/input/src/utils.mjs
import { ref as ref12, watch as watch6 } from "vue";
function len(s) {
  let count = 0;
  for (const _ of s) {
    count++;
  }
  return count;
}
function isEmptyInputValue(value) {
  return value === "" || value == null;
}
function useCursor(inputElRef) {
  const selectionRef = ref12(null);
  function recordCursor() {
    const {
      value: input
    } = inputElRef;
    if (!(input === null || input === void 0 ? void 0 : input.focus)) {
      reset();
      return;
    }
    const {
      selectionStart,
      selectionEnd,
      value
    } = input;
    if (selectionStart == null || selectionEnd == null) {
      reset();
      return;
    }
    selectionRef.value = {
      start: selectionStart,
      end: selectionEnd,
      beforeText: value.slice(0, selectionStart),
      afterText: value.slice(selectionEnd)
    };
  }
  function restoreCursor() {
    var _a;
    const {
      value: selection
    } = selectionRef;
    const {
      value: inputEl
    } = inputElRef;
    if (!selection || !inputEl) {
      return;
    }
    const {
      value
    } = inputEl;
    const {
      start,
      beforeText,
      afterText
    } = selection;
    let startPos = value.length;
    if (value.endsWith(afterText)) {
      startPos = value.length - afterText.length;
    } else if (value.startsWith(beforeText)) {
      startPos = beforeText.length;
    } else {
      const beforeLastChar = beforeText[start - 1];
      const newIndex = value.indexOf(beforeLastChar, start - 1);
      if (newIndex !== -1) {
        startPos = newIndex + 1;
      }
    }
    (_a = inputEl.setSelectionRange) === null || _a === void 0 ? void 0 : _a.call(inputEl, startPos, startPos);
  }
  function reset() {
    selectionRef.value = null;
  }
  watch6(inputElRef, reset);
  return {
    recordCursor,
    restoreCursor
  };
}

// ../node_modules/naive-ui/es/input/src/WordCount.mjs
import { computed as computed12, defineComponent as defineComponent26, h as h25, inject as inject15 } from "vue";
var WordCount_default = defineComponent26({
  name: "InputWordCount",
  setup(_, {
    slots
  }) {
    const {
      mergedValueRef,
      maxlengthRef,
      mergedClsPrefixRef,
      countGraphemesRef
    } = inject15(inputInjectionKey);
    const wordCountRef = computed12(() => {
      const {
        value: mergedValue
      } = mergedValueRef;
      if (mergedValue === null || Array.isArray(mergedValue)) return 0;
      return (countGraphemesRef.value || len)(mergedValue);
    });
    return () => {
      const {
        value: maxlength
      } = maxlengthRef;
      const {
        value: mergedValue
      } = mergedValueRef;
      return h25("span", {
        class: `${mergedClsPrefixRef.value}-input-word-count`
      }, resolveSlotWithTypedProps(slots.default, {
        value: mergedValue === null || Array.isArray(mergedValue) ? "" : mergedValue
      }, () => [maxlength === void 0 ? wordCountRef.value : `${wordCountRef.value} / ${maxlength}`]));
    };
  }
});

// ../node_modules/naive-ui/es/input/src/Input.mjs
var inputProps = Object.assign(Object.assign({}, use_theme_default.props), {
  bordered: {
    type: Boolean,
    default: void 0
  },
  type: {
    type: String,
    default: "text"
  },
  placeholder: [Array, String],
  defaultValue: {
    type: [String, Array],
    default: null
  },
  value: [String, Array],
  disabled: {
    type: Boolean,
    default: void 0
  },
  size: String,
  rows: {
    type: [Number, String],
    default: 3
  },
  round: Boolean,
  minlength: [String, Number],
  maxlength: [String, Number],
  clearable: Boolean,
  autosize: {
    type: [Boolean, Object],
    default: false
  },
  pair: Boolean,
  separator: String,
  readonly: {
    type: [String, Boolean],
    default: false
  },
  passivelyActivated: Boolean,
  showPasswordOn: String,
  stateful: {
    type: Boolean,
    default: true
  },
  autofocus: Boolean,
  inputProps: Object,
  resizable: {
    type: Boolean,
    default: true
  },
  showCount: Boolean,
  loading: {
    type: Boolean,
    default: void 0
  },
  allowInput: Function,
  renderCount: Function,
  onMousedown: Function,
  onKeydown: Function,
  onKeyup: [Function, Array],
  onInput: [Function, Array],
  onFocus: [Function, Array],
  onBlur: [Function, Array],
  onClick: [Function, Array],
  onChange: [Function, Array],
  onClear: [Function, Array],
  countGraphemes: Function,
  status: String,
  "onUpdate:value": [Function, Array],
  onUpdateValue: [Function, Array],
  /** private */
  textDecoration: [String, Array],
  attrSize: {
    type: Number,
    default: 20
  },
  onInputBlur: [Function, Array],
  onInputFocus: [Function, Array],
  onDeactivate: [Function, Array],
  onActivate: [Function, Array],
  onWrapperFocus: [Function, Array],
  onWrapperBlur: [Function, Array],
  internalDeactivateOnEnter: Boolean,
  internalForceFocus: Boolean,
  internalLoadingBeforeSuffix: {
    type: Boolean,
    default: true
  },
  /** deprecated */
  showPasswordToggle: Boolean
});
var Input_default = defineComponent27({
  name: "Input",
  props: inputProps,
  slots: Object,
  setup(props) {
    const {
      mergedClsPrefixRef,
      mergedBorderedRef,
      inlineThemeDisabled,
      mergedRtlRef
    } = useConfig(props);
    const themeRef = use_theme_default("Input", "-input", input_cssr_default, light_default3, props, mergedClsPrefixRef);
    if (isSafari) {
      useStyle("-input-safari", safariStyle, mergedClsPrefixRef);
    }
    const wrapperElRef = ref13(null);
    const textareaElRef = ref13(null);
    const textareaMirrorElRef = ref13(null);
    const inputMirrorElRef = ref13(null);
    const inputElRef = ref13(null);
    const inputEl2Ref = ref13(null);
    const currentFocusedInputRef = ref13(null);
    const focusedInputCursorControl = useCursor(currentFocusedInputRef);
    const textareaScrollbarInstRef = ref13(null);
    const {
      localeRef
    } = useLocale("Input");
    const uncontrolledValueRef = ref13(props.defaultValue);
    const controlledValueRef = toRef8(props, "value");
    const mergedValueRef = useMergedState(controlledValueRef, uncontrolledValueRef);
    const formItem = useFormItem(props);
    const {
      mergedSizeRef,
      mergedDisabledRef,
      mergedStatusRef
    } = formItem;
    const focusedRef = ref13(false);
    const hoverRef = ref13(false);
    const isComposingRef = ref13(false);
    const activatedRef = ref13(false);
    let syncSource = null;
    const mergedPlaceholderRef = computed13(() => {
      const {
        placeholder,
        pair
      } = props;
      if (pair) {
        if (Array.isArray(placeholder)) {
          return placeholder;
        } else if (placeholder === void 0) {
          return ["", ""];
        }
        return [placeholder, placeholder];
      } else if (placeholder === void 0) {
        return [localeRef.value.placeholder];
      } else {
        return [placeholder];
      }
    });
    const showPlaceholder1Ref = computed13(() => {
      const {
        value: isComposing
      } = isComposingRef;
      const {
        value: mergedValue
      } = mergedValueRef;
      const {
        value: mergedPlaceholder
      } = mergedPlaceholderRef;
      return !isComposing && (isEmptyInputValue(mergedValue) || Array.isArray(mergedValue) && isEmptyInputValue(mergedValue[0])) && mergedPlaceholder[0];
    });
    const showPlaceholder2Ref = computed13(() => {
      const {
        value: isComposing
      } = isComposingRef;
      const {
        value: mergedValue
      } = mergedValueRef;
      const {
        value: mergedPlaceholder
      } = mergedPlaceholderRef;
      return !isComposing && mergedPlaceholder[1] && (isEmptyInputValue(mergedValue) || Array.isArray(mergedValue) && isEmptyInputValue(mergedValue[1]));
    });
    const mergedFocusRef = use_memo_default(() => {
      return props.internalForceFocus || focusedRef.value;
    });
    const showClearButton = use_memo_default(() => {
      if (mergedDisabledRef.value || props.readonly || !props.clearable || !mergedFocusRef.value && !hoverRef.value) {
        return false;
      }
      const {
        value: mergedValue
      } = mergedValueRef;
      const {
        value: mergedFocus
      } = mergedFocusRef;
      if (props.pair) {
        return !!(Array.isArray(mergedValue) && (mergedValue[0] || mergedValue[1])) && (hoverRef.value || mergedFocus);
      } else {
        return !!mergedValue && (hoverRef.value || mergedFocus);
      }
    });
    const mergedShowPasswordOnRef = computed13(() => {
      const {
        showPasswordOn
      } = props;
      if (showPasswordOn) {
        return showPasswordOn;
      }
      if (props.showPasswordToggle) return "click";
      return void 0;
    });
    const passwordVisibleRef = ref13(false);
    const textDecorationStyleRef = computed13(() => {
      const {
        textDecoration
      } = props;
      if (!textDecoration) return ["", ""];
      if (Array.isArray(textDecoration)) {
        return textDecoration.map((v) => ({
          textDecoration: v
        }));
      }
      return [{
        textDecoration
      }];
    });
    const textAreaScrollContainerWidthRef = ref13(void 0);
    const updateTextAreaStyle = () => {
      var _a, _b;
      if (props.type === "textarea") {
        const {
          autosize
        } = props;
        if (autosize) {
          textAreaScrollContainerWidthRef.value = (_b = (_a = textareaScrollbarInstRef.value) === null || _a === void 0 ? void 0 : _a.$el) === null || _b === void 0 ? void 0 : _b.offsetWidth;
        }
        if (!textareaElRef.value) return;
        if (typeof autosize === "boolean") return;
        const {
          paddingTop: stylePaddingTop,
          paddingBottom: stylePaddingBottom,
          lineHeight: styleLineHeight
        } = window.getComputedStyle(textareaElRef.value);
        const paddingTop = Number(stylePaddingTop.slice(0, -2));
        const paddingBottom = Number(stylePaddingBottom.slice(0, -2));
        const lineHeight2 = Number(styleLineHeight.slice(0, -2));
        const {
          value: textareaMirrorEl
        } = textareaMirrorElRef;
        if (!textareaMirrorEl) return;
        if (autosize.minRows) {
          const minRows = Math.max(autosize.minRows, 1);
          const styleMinHeight = `${paddingTop + paddingBottom + lineHeight2 * minRows}px`;
          textareaMirrorEl.style.minHeight = styleMinHeight;
        }
        if (autosize.maxRows) {
          const styleMaxHeight = `${paddingTop + paddingBottom + lineHeight2 * autosize.maxRows}px`;
          textareaMirrorEl.style.maxHeight = styleMaxHeight;
        }
      }
    };
    const maxlengthRef = computed13(() => {
      const {
        maxlength
      } = props;
      return maxlength === void 0 ? void 0 : Number(maxlength);
    });
    onMounted8(() => {
      const {
        value
      } = mergedValueRef;
      if (!Array.isArray(value)) {
        syncMirror(value);
      }
    });
    const vm = getCurrentInstance4().proxy;
    function doUpdateValue(value, meta) {
      const {
        onUpdateValue,
        "onUpdate:value": _onUpdateValue,
        onInput
      } = props;
      const {
        nTriggerFormInput
      } = formItem;
      if (onUpdateValue) call(onUpdateValue, value, meta);
      if (_onUpdateValue) call(_onUpdateValue, value, meta);
      if (onInput) call(onInput, value, meta);
      uncontrolledValueRef.value = value;
      nTriggerFormInput();
    }
    function doChange(value, meta) {
      const {
        onChange
      } = props;
      const {
        nTriggerFormChange
      } = formItem;
      if (onChange) call(onChange, value, meta);
      uncontrolledValueRef.value = value;
      nTriggerFormChange();
    }
    function doBlur(e) {
      const {
        onBlur
      } = props;
      const {
        nTriggerFormBlur
      } = formItem;
      if (onBlur) call(onBlur, e);
      nTriggerFormBlur();
    }
    function doFocus(e) {
      const {
        onFocus
      } = props;
      const {
        nTriggerFormFocus
      } = formItem;
      if (onFocus) call(onFocus, e);
      nTriggerFormFocus();
    }
    function doClear(e) {
      const {
        onClear
      } = props;
      if (onClear) call(onClear, e);
    }
    function doUpdateValueBlur(e) {
      const {
        onInputBlur
      } = props;
      if (onInputBlur) call(onInputBlur, e);
    }
    function doUpdateValueFocus(e) {
      const {
        onInputFocus
      } = props;
      if (onInputFocus) call(onInputFocus, e);
    }
    function doDeactivate() {
      const {
        onDeactivate
      } = props;
      if (onDeactivate) call(onDeactivate);
    }
    function doActivate() {
      const {
        onActivate
      } = props;
      if (onActivate) call(onActivate);
    }
    function doClick(e) {
      const {
        onClick
      } = props;
      if (onClick) call(onClick, e);
    }
    function doWrapperFocus(e) {
      const {
        onWrapperFocus
      } = props;
      if (onWrapperFocus) call(onWrapperFocus, e);
    }
    function doWrapperBlur(e) {
      const {
        onWrapperBlur
      } = props;
      if (onWrapperBlur) call(onWrapperBlur, e);
    }
    function handleCompositionStart() {
      isComposingRef.value = true;
    }
    function handleCompositionEnd(e) {
      isComposingRef.value = false;
      if (e.target === inputEl2Ref.value) {
        handleInput(e, 1);
      } else {
        handleInput(e, 0);
      }
    }
    function handleInput(e, index = 0, event = "input") {
      const targetValue = e.target.value;
      syncMirror(targetValue);
      if (e instanceof InputEvent && !e.isComposing) {
        isComposingRef.value = false;
      }
      if (props.type === "textarea") {
        const {
          value: textareaScrollbarInst
        } = textareaScrollbarInstRef;
        if (textareaScrollbarInst) {
          textareaScrollbarInst.syncUnifiedContainer();
        }
      }
      syncSource = targetValue;
      if (isComposingRef.value) return;
      focusedInputCursorControl.recordCursor();
      const isIncomingValueValid = allowInput(targetValue);
      if (isIncomingValueValid) {
        if (!props.pair) {
          if (event === "input") {
            doUpdateValue(targetValue, {
              source: index
            });
          } else {
            doChange(targetValue, {
              source: index
            });
          }
        } else {
          let {
            value
          } = mergedValueRef;
          if (!Array.isArray(value)) {
            value = ["", ""];
          } else {
            value = [value[0], value[1]];
          }
          value[index] = targetValue;
          if (event === "input") {
            doUpdateValue(value, {
              source: index
            });
          } else {
            doChange(value, {
              source: index
            });
          }
        }
      }
      vm.$forceUpdate();
      if (!isIncomingValueValid) {
        void nextTick3(focusedInputCursorControl.restoreCursor);
      }
    }
    function allowInput(value) {
      const {
        countGraphemes,
        maxlength,
        minlength
      } = props;
      if (countGraphemes) {
        let graphemesCount;
        if (maxlength !== void 0) {
          if (graphemesCount === void 0) {
            graphemesCount = countGraphemes(value);
          }
          if (graphemesCount > Number(maxlength)) return false;
        }
        if (minlength !== void 0) {
          if (graphemesCount === void 0) {
            graphemesCount = countGraphemes(value);
          }
          if (graphemesCount < Number(maxlength)) return false;
        }
      }
      const {
        allowInput: allowInput2
      } = props;
      if (typeof allowInput2 === "function") {
        return allowInput2(value);
      }
      return true;
    }
    function handleInputBlur(e) {
      doUpdateValueBlur(e);
      if (e.relatedTarget === wrapperElRef.value) {
        doDeactivate();
      }
      if (!(e.relatedTarget !== null && (e.relatedTarget === inputElRef.value || e.relatedTarget === inputEl2Ref.value || e.relatedTarget === textareaElRef.value))) {
        activatedRef.value = false;
      }
      dealWithEvent(e, "blur");
      currentFocusedInputRef.value = null;
    }
    function handleInputFocus(e, index) {
      doUpdateValueFocus(e);
      focusedRef.value = true;
      activatedRef.value = true;
      doActivate();
      dealWithEvent(e, "focus");
      if (index === 0) {
        currentFocusedInputRef.value = inputElRef.value;
      } else if (index === 1) {
        currentFocusedInputRef.value = inputEl2Ref.value;
      } else if (index === 2) {
        currentFocusedInputRef.value = textareaElRef.value;
      }
    }
    function handleWrapperBlur(e) {
      if (props.passivelyActivated) {
        doWrapperBlur(e);
        dealWithEvent(e, "blur");
      }
    }
    function handleWrapperFocus(e) {
      if (props.passivelyActivated) {
        focusedRef.value = true;
        doWrapperFocus(e);
        dealWithEvent(e, "focus");
      }
    }
    function dealWithEvent(e, type) {
      if (e.relatedTarget !== null && (e.relatedTarget === inputElRef.value || e.relatedTarget === inputEl2Ref.value || e.relatedTarget === textareaElRef.value || e.relatedTarget === wrapperElRef.value)) {
      } else {
        if (type === "focus") {
          doFocus(e);
          focusedRef.value = true;
        } else if (type === "blur") {
          doBlur(e);
          focusedRef.value = false;
        }
      }
    }
    function handleChange(e, index) {
      handleInput(e, index, "change");
    }
    function handleClick(e) {
      doClick(e);
    }
    function handleClear(e) {
      doClear(e);
      clearValue();
    }
    function clearValue() {
      if (props.pair) {
        doUpdateValue(["", ""], {
          source: "clear"
        });
        doChange(["", ""], {
          source: "clear"
        });
      } else {
        doUpdateValue("", {
          source: "clear"
        });
        doChange("", {
          source: "clear"
        });
      }
    }
    function handleMouseDown(e) {
      const {
        onMousedown
      } = props;
      if (onMousedown) onMousedown(e);
      const {
        tagName
      } = e.target;
      if (tagName !== "INPUT" && tagName !== "TEXTAREA") {
        if (props.resizable) {
          const {
            value: wrapperEl
          } = wrapperElRef;
          if (wrapperEl) {
            const {
              left,
              top,
              width,
              height
            } = wrapperEl.getBoundingClientRect();
            const resizeHandleSize = 14;
            if (left + width - resizeHandleSize < e.clientX && e.clientX < left + width && top + height - resizeHandleSize < e.clientY && e.clientY < top + height) {
              return;
            }
          }
        }
        e.preventDefault();
        if (!focusedRef.value) {
          focus();
        }
      }
    }
    function handleMouseEnter() {
      var _a;
      hoverRef.value = true;
      if (props.type === "textarea") {
        (_a = textareaScrollbarInstRef.value) === null || _a === void 0 ? void 0 : _a.handleMouseEnterWrapper();
      }
    }
    function handleMouseLeave() {
      var _a;
      hoverRef.value = false;
      if (props.type === "textarea") {
        (_a = textareaScrollbarInstRef.value) === null || _a === void 0 ? void 0 : _a.handleMouseLeaveWrapper();
      }
    }
    function handlePasswordToggleClick() {
      if (mergedDisabledRef.value) return;
      if (mergedShowPasswordOnRef.value !== "click") return;
      passwordVisibleRef.value = !passwordVisibleRef.value;
    }
    function handlePasswordToggleMousedown(e) {
      if (mergedDisabledRef.value) return;
      e.preventDefault();
      const preventDefaultOnce = (e2) => {
        e2.preventDefault();
        off("mouseup", document, preventDefaultOnce);
      };
      on("mouseup", document, preventDefaultOnce);
      if (mergedShowPasswordOnRef.value !== "mousedown") return;
      passwordVisibleRef.value = true;
      const hidePassword = () => {
        passwordVisibleRef.value = false;
        off("mouseup", document, hidePassword);
      };
      on("mouseup", document, hidePassword);
    }
    function handleWrapperKeyup(e) {
      if (props.onKeyup) call(props.onKeyup, e);
    }
    function handleWrapperKeydown(e) {
      if (props.onKeydown) call(props.onKeydown, e);
      switch (e.key) {
        case "Escape":
          handleWrapperKeydownEsc();
          break;
        case "Enter":
          handleWrapperKeydownEnter(e);
          break;
      }
    }
    function handleWrapperKeydownEnter(e) {
      var _a, _b;
      if (props.passivelyActivated) {
        const {
          value: focused
        } = activatedRef;
        if (focused) {
          if (props.internalDeactivateOnEnter) {
            handleWrapperKeydownEsc();
          }
          return;
        }
        e.preventDefault();
        if (props.type === "textarea") {
          (_a = textareaElRef.value) === null || _a === void 0 ? void 0 : _a.focus();
        } else {
          (_b = inputElRef.value) === null || _b === void 0 ? void 0 : _b.focus();
        }
      }
    }
    function handleWrapperKeydownEsc() {
      if (props.passivelyActivated) {
        activatedRef.value = false;
        void nextTick3(() => {
          var _a;
          (_a = wrapperElRef.value) === null || _a === void 0 ? void 0 : _a.focus();
        });
      }
    }
    function focus() {
      var _a, _b, _c;
      if (mergedDisabledRef.value) return;
      if (props.passivelyActivated) {
        (_a = wrapperElRef.value) === null || _a === void 0 ? void 0 : _a.focus();
      } else {
        (_b = textareaElRef.value) === null || _b === void 0 ? void 0 : _b.focus();
        (_c = inputElRef.value) === null || _c === void 0 ? void 0 : _c.focus();
      }
    }
    function blur() {
      var _a;
      if ((_a = wrapperElRef.value) === null || _a === void 0 ? void 0 : _a.contains(document.activeElement)) {
        ;
        document.activeElement.blur();
      }
    }
    function select() {
      var _a, _b;
      (_a = textareaElRef.value) === null || _a === void 0 ? void 0 : _a.select();
      (_b = inputElRef.value) === null || _b === void 0 ? void 0 : _b.select();
    }
    function activate() {
      if (mergedDisabledRef.value) return;
      if (textareaElRef.value) textareaElRef.value.focus();
      else if (inputElRef.value) inputElRef.value.focus();
    }
    function deactivate() {
      const {
        value: wrapperEl
      } = wrapperElRef;
      if ((wrapperEl === null || wrapperEl === void 0 ? void 0 : wrapperEl.contains(document.activeElement)) && wrapperEl !== document.activeElement) {
        handleWrapperKeydownEsc();
      }
    }
    function scrollTo(options) {
      if (props.type === "textarea") {
        const {
          value: textareaEl
        } = textareaElRef;
        textareaEl === null || textareaEl === void 0 ? void 0 : textareaEl.scrollTo(options);
      } else {
        const {
          value: inputEl
        } = inputElRef;
        inputEl === null || inputEl === void 0 ? void 0 : inputEl.scrollTo(options);
      }
    }
    function syncMirror(value) {
      const {
        type,
        pair,
        autosize
      } = props;
      if (!pair && autosize) {
        if (type === "textarea") {
          const {
            value: textareaMirrorEl
          } = textareaMirrorElRef;
          if (textareaMirrorEl) {
            textareaMirrorEl.textContent = `${value !== null && value !== void 0 ? value : ""}\r
`;
          }
        } else {
          const {
            value: inputMirrorEl
          } = inputMirrorElRef;
          if (inputMirrorEl) {
            if (value) {
              inputMirrorEl.textContent = value;
            } else {
              inputMirrorEl.innerHTML = "&nbsp;";
            }
          }
        }
      }
    }
    function handleTextAreaMirrorResize() {
      updateTextAreaStyle();
    }
    const placeholderStyleRef = ref13({
      top: "0"
    });
    function handleTextAreaScroll(e) {
      var _a;
      const {
        scrollTop
      } = e.target;
      placeholderStyleRef.value.top = `${-scrollTop}px`;
      (_a = textareaScrollbarInstRef.value) === null || _a === void 0 ? void 0 : _a.syncUnifiedContainer();
    }
    let stopWatchMergedValue1 = null;
    watchEffect4(() => {
      const {
        autosize,
        type
      } = props;
      if (autosize && type === "textarea") {
        stopWatchMergedValue1 = watch7(mergedValueRef, (value) => {
          if (!Array.isArray(value) && value !== syncSource) {
            syncMirror(value);
          }
        });
      } else {
        stopWatchMergedValue1 === null || stopWatchMergedValue1 === void 0 ? void 0 : stopWatchMergedValue1();
      }
    });
    let stopWatchMergedValue2 = null;
    watchEffect4(() => {
      if (props.type === "textarea") {
        stopWatchMergedValue2 = watch7(mergedValueRef, (value) => {
          var _a;
          if (!Array.isArray(value) && value !== syncSource) {
            (_a = textareaScrollbarInstRef.value) === null || _a === void 0 ? void 0 : _a.syncUnifiedContainer();
          }
        });
      } else {
        stopWatchMergedValue2 === null || stopWatchMergedValue2 === void 0 ? void 0 : stopWatchMergedValue2();
      }
    });
    provide4(inputInjectionKey, {
      mergedValueRef,
      maxlengthRef,
      mergedClsPrefixRef,
      countGraphemesRef: toRef8(props, "countGraphemes")
    });
    const exposedProps = {
      wrapperElRef,
      inputElRef,
      textareaElRef,
      isCompositing: isComposingRef,
      clear: clearValue,
      focus,
      blur,
      select,
      deactivate,
      activate,
      scrollTo
    };
    const rtlEnabledRef = useRtl("Input", mergedRtlRef, mergedClsPrefixRef);
    const cssVarsRef = computed13(() => {
      const {
        value: size2
      } = mergedSizeRef;
      const {
        common: {
          cubicBezierEaseInOut: cubicBezierEaseInOut4
        },
        self: {
          color,
          borderRadius,
          textColor,
          caretColor,
          caretColorError,
          caretColorWarning,
          textDecorationColor,
          border,
          borderDisabled,
          borderHover,
          borderFocus,
          placeholderColor,
          placeholderColorDisabled,
          lineHeightTextarea,
          colorDisabled,
          colorFocus,
          textColorDisabled,
          boxShadowFocus,
          iconSize,
          colorFocusWarning,
          boxShadowFocusWarning,
          borderWarning,
          borderFocusWarning,
          borderHoverWarning,
          colorFocusError,
          boxShadowFocusError,
          borderError,
          borderFocusError,
          borderHoverError,
          clearSize,
          clearColor,
          clearColorHover,
          clearColorPressed,
          iconColor,
          iconColorDisabled,
          suffixTextColor,
          countTextColor,
          countTextColorDisabled,
          iconColorHover,
          iconColorPressed,
          loadingColor,
          loadingColorError,
          loadingColorWarning,
          fontWeight,
          [createKey("padding", size2)]: padding,
          [createKey("fontSize", size2)]: fontSize2,
          [createKey("height", size2)]: height
        }
      } = themeRef.value;
      const {
        left: paddingLeft,
        right: paddingRight
      } = getMargin(padding);
      return {
        "--n-bezier": cubicBezierEaseInOut4,
        "--n-count-text-color": countTextColor,
        "--n-count-text-color-disabled": countTextColorDisabled,
        "--n-color": color,
        "--n-font-size": fontSize2,
        "--n-font-weight": fontWeight,
        "--n-border-radius": borderRadius,
        "--n-height": height,
        "--n-padding-left": paddingLeft,
        "--n-padding-right": paddingRight,
        "--n-text-color": textColor,
        "--n-caret-color": caretColor,
        "--n-text-decoration-color": textDecorationColor,
        "--n-border": border,
        "--n-border-disabled": borderDisabled,
        "--n-border-hover": borderHover,
        "--n-border-focus": borderFocus,
        "--n-placeholder-color": placeholderColor,
        "--n-placeholder-color-disabled": placeholderColorDisabled,
        "--n-icon-size": iconSize,
        "--n-line-height-textarea": lineHeightTextarea,
        "--n-color-disabled": colorDisabled,
        "--n-color-focus": colorFocus,
        "--n-text-color-disabled": textColorDisabled,
        "--n-box-shadow-focus": boxShadowFocus,
        "--n-loading-color": loadingColor,
        // form warning
        "--n-caret-color-warning": caretColorWarning,
        "--n-color-focus-warning": colorFocusWarning,
        "--n-box-shadow-focus-warning": boxShadowFocusWarning,
        "--n-border-warning": borderWarning,
        "--n-border-focus-warning": borderFocusWarning,
        "--n-border-hover-warning": borderHoverWarning,
        "--n-loading-color-warning": loadingColorWarning,
        // form error
        "--n-caret-color-error": caretColorError,
        "--n-color-focus-error": colorFocusError,
        "--n-box-shadow-focus-error": boxShadowFocusError,
        "--n-border-error": borderError,
        "--n-border-focus-error": borderFocusError,
        "--n-border-hover-error": borderHoverError,
        "--n-loading-color-error": loadingColorError,
        // clear-button
        "--n-clear-color": clearColor,
        "--n-clear-size": clearSize,
        "--n-clear-color-hover": clearColorHover,
        "--n-clear-color-pressed": clearColorPressed,
        "--n-icon-color": iconColor,
        "--n-icon-color-hover": iconColorHover,
        "--n-icon-color-pressed": iconColorPressed,
        "--n-icon-color-disabled": iconColorDisabled,
        "--n-suffix-text-color": suffixTextColor
      };
    });
    const themeClassHandle = inlineThemeDisabled ? useThemeClass("input", computed13(() => {
      const {
        value: size2
      } = mergedSizeRef;
      return size2[0];
    }), cssVarsRef, props) : void 0;
    return Object.assign(Object.assign({}, exposedProps), {
      // DOM ref
      wrapperElRef,
      inputElRef,
      inputMirrorElRef,
      inputEl2Ref,
      textareaElRef,
      textareaMirrorElRef,
      textareaScrollbarInstRef,
      // value
      rtlEnabled: rtlEnabledRef,
      uncontrolledValue: uncontrolledValueRef,
      mergedValue: mergedValueRef,
      passwordVisible: passwordVisibleRef,
      mergedPlaceholder: mergedPlaceholderRef,
      showPlaceholder1: showPlaceholder1Ref,
      showPlaceholder2: showPlaceholder2Ref,
      mergedFocus: mergedFocusRef,
      isComposing: isComposingRef,
      activated: activatedRef,
      showClearButton,
      mergedSize: mergedSizeRef,
      mergedDisabled: mergedDisabledRef,
      textDecorationStyle: textDecorationStyleRef,
      mergedClsPrefix: mergedClsPrefixRef,
      mergedBordered: mergedBorderedRef,
      mergedShowPasswordOn: mergedShowPasswordOnRef,
      placeholderStyle: placeholderStyleRef,
      mergedStatus: mergedStatusRef,
      textAreaScrollContainerWidth: textAreaScrollContainerWidthRef,
      // methods
      handleTextAreaScroll,
      handleCompositionStart,
      handleCompositionEnd,
      handleInput,
      handleInputBlur,
      handleInputFocus,
      handleWrapperBlur,
      handleWrapperFocus,
      handleMouseEnter,
      handleMouseLeave,
      handleMouseDown,
      handleChange,
      handleClick,
      handleClear,
      handlePasswordToggleClick,
      handlePasswordToggleMousedown,
      handleWrapperKeydown,
      handleWrapperKeyup,
      handleTextAreaMirrorResize,
      getTextareaScrollContainer: () => {
        return textareaElRef.value;
      },
      mergedTheme: themeRef,
      cssVars: inlineThemeDisabled ? void 0 : cssVarsRef,
      themeClass: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.themeClass,
      onRender: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.onRender
    });
  },
  render() {
    var _a, _b;
    const {
      mergedClsPrefix,
      mergedStatus,
      themeClass,
      type,
      countGraphemes,
      onRender
    } = this;
    const $slots = this.$slots;
    onRender === null || onRender === void 0 ? void 0 : onRender();
    return h26("div", {
      ref: "wrapperElRef",
      class: [`${mergedClsPrefix}-input`, themeClass, mergedStatus && `${mergedClsPrefix}-input--${mergedStatus}-status`, {
        [`${mergedClsPrefix}-input--rtl`]: this.rtlEnabled,
        [`${mergedClsPrefix}-input--disabled`]: this.mergedDisabled,
        [`${mergedClsPrefix}-input--textarea`]: type === "textarea",
        [`${mergedClsPrefix}-input--resizable`]: this.resizable && !this.autosize,
        [`${mergedClsPrefix}-input--autosize`]: this.autosize,
        [`${mergedClsPrefix}-input--round`]: this.round && !(type === "textarea"),
        [`${mergedClsPrefix}-input--pair`]: this.pair,
        [`${mergedClsPrefix}-input--focus`]: this.mergedFocus,
        [`${mergedClsPrefix}-input--stateful`]: this.stateful
      }],
      style: this.cssVars,
      tabindex: !this.mergedDisabled && this.passivelyActivated && !this.activated ? 0 : void 0,
      onFocus: this.handleWrapperFocus,
      onBlur: this.handleWrapperBlur,
      onClick: this.handleClick,
      onMousedown: this.handleMouseDown,
      onMouseenter: this.handleMouseEnter,
      onMouseleave: this.handleMouseLeave,
      onCompositionstart: this.handleCompositionStart,
      onCompositionend: this.handleCompositionEnd,
      onKeyup: this.handleWrapperKeyup,
      onKeydown: this.handleWrapperKeydown
    }, h26("div", {
      class: `${mergedClsPrefix}-input-wrapper`
    }, resolveWrappedSlot($slots.prefix, (children) => children && h26("div", {
      class: `${mergedClsPrefix}-input__prefix`
    }, children)), type === "textarea" ? h26(Scrollbar_default, {
      ref: "textareaScrollbarInstRef",
      class: `${mergedClsPrefix}-input__textarea`,
      container: this.getTextareaScrollContainer,
      triggerDisplayManually: true,
      useUnifiedContainer: true,
      internalHoistYRail: true
    }, {
      default: () => {
        var _a2, _b2;
        const {
          textAreaScrollContainerWidth
        } = this;
        const scrollContainerWidthStyle = {
          width: this.autosize && textAreaScrollContainerWidth && `${textAreaScrollContainerWidth}px`
        };
        return h26(Fragment4, null, h26("textarea", Object.assign({}, this.inputProps, {
          ref: "textareaElRef",
          class: [`${mergedClsPrefix}-input__textarea-el`, (_a2 = this.inputProps) === null || _a2 === void 0 ? void 0 : _a2.class],
          autofocus: this.autofocus,
          rows: Number(this.rows),
          placeholder: this.placeholder,
          value: this.mergedValue,
          disabled: this.mergedDisabled,
          maxlength: countGraphemes ? void 0 : this.maxlength,
          minlength: countGraphemes ? void 0 : this.minlength,
          readonly: this.readonly,
          tabindex: this.passivelyActivated && !this.activated ? -1 : void 0,
          style: [this.textDecorationStyle[0], (_b2 = this.inputProps) === null || _b2 === void 0 ? void 0 : _b2.style, scrollContainerWidthStyle],
          onBlur: this.handleInputBlur,
          onFocus: (e) => {
            this.handleInputFocus(e, 2);
          },
          onInput: this.handleInput,
          onChange: this.handleChange,
          onScroll: this.handleTextAreaScroll
        })), this.showPlaceholder1 ? h26("div", {
          class: `${mergedClsPrefix}-input__placeholder`,
          style: [this.placeholderStyle, scrollContainerWidthStyle],
          key: "placeholder"
        }, this.mergedPlaceholder[0]) : null, this.autosize ? h26(VResizeObserver_default, {
          onResize: this.handleTextAreaMirrorResize
        }, {
          default: () => h26("div", {
            ref: "textareaMirrorElRef",
            class: `${mergedClsPrefix}-input__textarea-mirror`,
            key: "mirror"
          })
        }) : null);
      }
    }) : h26("div", {
      class: `${mergedClsPrefix}-input__input`
    }, h26("input", Object.assign({
      type: type === "password" && this.mergedShowPasswordOn && this.passwordVisible ? "text" : type
    }, this.inputProps, {
      ref: "inputElRef",
      class: [`${mergedClsPrefix}-input__input-el`, (_a = this.inputProps) === null || _a === void 0 ? void 0 : _a.class],
      style: [this.textDecorationStyle[0], (_b = this.inputProps) === null || _b === void 0 ? void 0 : _b.style],
      tabindex: this.passivelyActivated && !this.activated ? -1 : void 0,
      placeholder: this.mergedPlaceholder[0],
      disabled: this.mergedDisabled,
      maxlength: countGraphemes ? void 0 : this.maxlength,
      minlength: countGraphemes ? void 0 : this.minlength,
      value: Array.isArray(this.mergedValue) ? this.mergedValue[0] : this.mergedValue,
      readonly: this.readonly,
      autofocus: this.autofocus,
      size: this.attrSize,
      onBlur: this.handleInputBlur,
      onFocus: (e) => {
        this.handleInputFocus(e, 0);
      },
      onInput: (e) => {
        this.handleInput(e, 0);
      },
      onChange: (e) => {
        this.handleChange(e, 0);
      }
    })), this.showPlaceholder1 ? h26("div", {
      class: `${mergedClsPrefix}-input__placeholder`
    }, h26("span", null, this.mergedPlaceholder[0])) : null, this.autosize ? h26("div", {
      class: `${mergedClsPrefix}-input__input-mirror`,
      key: "mirror",
      ref: "inputMirrorElRef"
    }, "\xA0") : null), !this.pair && resolveWrappedSlot($slots.suffix, (children) => {
      return children || this.clearable || this.showCount || this.mergedShowPasswordOn || this.loading !== void 0 ? h26("div", {
        class: `${mergedClsPrefix}-input__suffix`
      }, [resolveWrappedSlot($slots["clear-icon-placeholder"], (children2) => {
        return (this.clearable || children2) && h26(Clear_default2, {
          clsPrefix: mergedClsPrefix,
          show: this.showClearButton,
          onClear: this.handleClear
        }, {
          placeholder: () => children2,
          icon: () => {
            var _a2, _b2;
            return (_b2 = (_a2 = this.$slots)["clear-icon"]) === null || _b2 === void 0 ? void 0 : _b2.call(_a2);
          }
        });
      }), !this.internalLoadingBeforeSuffix ? children : null, this.loading !== void 0 ? h26(Suffix_default, {
        clsPrefix: mergedClsPrefix,
        loading: this.loading,
        showArrow: false,
        showClear: false,
        style: this.cssVars
      }) : null, this.internalLoadingBeforeSuffix ? children : null, this.showCount && this.type !== "textarea" ? h26(WordCount_default, null, {
        default: (props) => {
          var _a2;
          const {
            renderCount
          } = this;
          if (renderCount) {
            return renderCount(props);
          }
          return (_a2 = $slots.count) === null || _a2 === void 0 ? void 0 : _a2.call($slots, props);
        }
      }) : null, this.mergedShowPasswordOn && this.type === "password" ? h26("div", {
        class: `${mergedClsPrefix}-input__eye`,
        onMousedown: this.handlePasswordToggleMousedown,
        onClick: this.handlePasswordToggleClick
      }, this.passwordVisible ? resolveSlot($slots["password-visible-icon"], () => [h26(Icon_default, {
        clsPrefix: mergedClsPrefix
      }, {
        default: () => h26(Eye_default, null)
      })]) : resolveSlot($slots["password-invisible-icon"], () => [h26(Icon_default, {
        clsPrefix: mergedClsPrefix
      }, {
        default: () => h26(EyeOff_default, null)
      })])) : null]) : null;
    })), this.pair ? h26("span", {
      class: `${mergedClsPrefix}-input__separator`
    }, resolveSlot($slots.separator, () => [this.separator])) : null, this.pair ? h26("div", {
      class: `${mergedClsPrefix}-input-wrapper`
    }, h26("div", {
      class: `${mergedClsPrefix}-input__input`
    }, h26("input", {
      ref: "inputEl2Ref",
      type: this.type,
      class: `${mergedClsPrefix}-input__input-el`,
      tabindex: this.passivelyActivated && !this.activated ? -1 : void 0,
      placeholder: this.mergedPlaceholder[1],
      disabled: this.mergedDisabled,
      maxlength: countGraphemes ? void 0 : this.maxlength,
      minlength: countGraphemes ? void 0 : this.minlength,
      value: Array.isArray(this.mergedValue) ? this.mergedValue[1] : void 0,
      readonly: this.readonly,
      style: this.textDecorationStyle[1],
      onBlur: this.handleInputBlur,
      onFocus: (e) => {
        this.handleInputFocus(e, 1);
      },
      onInput: (e) => {
        this.handleInput(e, 1);
      },
      onChange: (e) => {
        this.handleChange(e, 1);
      }
    }), this.showPlaceholder2 ? h26("div", {
      class: `${mergedClsPrefix}-input__placeholder`
    }, h26("span", null, this.mergedPlaceholder[1])) : null), resolveWrappedSlot($slots.suffix, (children) => {
      return (this.clearable || children) && h26("div", {
        class: `${mergedClsPrefix}-input__suffix`
      }, [this.clearable && h26(Clear_default2, {
        clsPrefix: mergedClsPrefix,
        show: this.showClearButton,
        onClear: this.handleClear
      }, {
        icon: () => {
          var _a2;
          return (_a2 = $slots["clear-icon"]) === null || _a2 === void 0 ? void 0 : _a2.call($slots);
        },
        placeholder: () => {
          var _a2;
          return (_a2 = $slots["clear-icon-placeholder"]) === null || _a2 === void 0 ? void 0 : _a2.call($slots);
        }
      }), children]);
    })) : null, this.mergedBordered ? h26("div", {
      class: `${mergedClsPrefix}-input__border`
    }) : null, this.mergedBordered ? h26("div", {
      class: `${mergedClsPrefix}-input__state-border`
    }) : null, this.showCount && type === "textarea" ? h26(WordCount_default, null, {
      default: (props) => {
        var _a2;
        const {
          renderCount
        } = this;
        if (renderCount) {
          return renderCount(props);
        }
        return (_a2 = $slots.count) === null || _a2 === void 0 ? void 0 : _a2.call($slots, props);
      }
    }) : null);
  }
});

// ../node_modules/naive-ui/es/button/src/Button.mjs
import { computed as computed14, defineComponent as defineComponent28, h as h27, inject as inject16, ref as ref14, watchEffect as watchEffect5 } from "vue";

// ../node_modules/naive-ui/es/_utils/color/index.mjs
function createHoverColor(rgb) {
  return composite(rgb, [255, 255, 255, 0.16]);
}
function createPressedColor(rgb) {
  return composite(rgb, [0, 0, 0, 0.12]);
}

// ../node_modules/naive-ui/es/button-group/src/context.mjs
var buttonGroupInjectionKey = createInjectionKey("n-button-group");

// ../node_modules/naive-ui/es/button/styles/_common.mjs
var common_default3 = {
  paddingTiny: "0 6px",
  paddingSmall: "0 10px",
  paddingMedium: "0 14px",
  paddingLarge: "0 18px",
  paddingRoundTiny: "0 10px",
  paddingRoundSmall: "0 14px",
  paddingRoundMedium: "0 18px",
  paddingRoundLarge: "0 22px",
  iconMarginTiny: "6px",
  iconMarginSmall: "6px",
  iconMarginMedium: "6px",
  iconMarginLarge: "6px",
  iconSizeTiny: "14px",
  iconSizeSmall: "18px",
  iconSizeMedium: "18px",
  iconSizeLarge: "20px",
  rippleDuration: ".6s"
};

// ../node_modules/naive-ui/es/button/styles/light.mjs
function self4(vars) {
  const {
    heightTiny,
    heightSmall,
    heightMedium,
    heightLarge,
    borderRadius,
    fontSizeTiny,
    fontSizeSmall,
    fontSizeMedium,
    fontSizeLarge,
    opacityDisabled,
    textColor2,
    textColor3,
    primaryColorHover,
    primaryColorPressed,
    borderColor,
    primaryColor,
    baseColor,
    infoColor,
    infoColorHover,
    infoColorPressed,
    successColor,
    successColorHover,
    successColorPressed,
    warningColor,
    warningColorHover,
    warningColorPressed,
    errorColor,
    errorColorHover,
    errorColorPressed,
    fontWeight,
    buttonColor2,
    buttonColor2Hover,
    buttonColor2Pressed,
    fontWeightStrong
  } = vars;
  return Object.assign(Object.assign({}, common_default3), {
    heightTiny,
    heightSmall,
    heightMedium,
    heightLarge,
    borderRadiusTiny: borderRadius,
    borderRadiusSmall: borderRadius,
    borderRadiusMedium: borderRadius,
    borderRadiusLarge: borderRadius,
    fontSizeTiny,
    fontSizeSmall,
    fontSizeMedium,
    fontSizeLarge,
    opacityDisabled,
    // secondary
    colorOpacitySecondary: "0.16",
    colorOpacitySecondaryHover: "0.22",
    colorOpacitySecondaryPressed: "0.28",
    colorSecondary: buttonColor2,
    colorSecondaryHover: buttonColor2Hover,
    colorSecondaryPressed: buttonColor2Pressed,
    // tertiary
    colorTertiary: buttonColor2,
    colorTertiaryHover: buttonColor2Hover,
    colorTertiaryPressed: buttonColor2Pressed,
    // quaternary
    colorQuaternary: "#0000",
    colorQuaternaryHover: buttonColor2Hover,
    colorQuaternaryPressed: buttonColor2Pressed,
    // default type
    color: "#0000",
    colorHover: "#0000",
    colorPressed: "#0000",
    colorFocus: "#0000",
    colorDisabled: "#0000",
    textColor: textColor2,
    textColorTertiary: textColor3,
    textColorHover: primaryColorHover,
    textColorPressed: primaryColorPressed,
    textColorFocus: primaryColorHover,
    textColorDisabled: textColor2,
    textColorText: textColor2,
    textColorTextHover: primaryColorHover,
    textColorTextPressed: primaryColorPressed,
    textColorTextFocus: primaryColorHover,
    textColorTextDisabled: textColor2,
    textColorGhost: textColor2,
    textColorGhostHover: primaryColorHover,
    textColorGhostPressed: primaryColorPressed,
    textColorGhostFocus: primaryColorHover,
    textColorGhostDisabled: textColor2,
    border: `1px solid ${borderColor}`,
    borderHover: `1px solid ${primaryColorHover}`,
    borderPressed: `1px solid ${primaryColorPressed}`,
    borderFocus: `1px solid ${primaryColorHover}`,
    borderDisabled: `1px solid ${borderColor}`,
    rippleColor: primaryColor,
    // primary
    colorPrimary: primaryColor,
    colorHoverPrimary: primaryColorHover,
    colorPressedPrimary: primaryColorPressed,
    colorFocusPrimary: primaryColorHover,
    colorDisabledPrimary: primaryColor,
    textColorPrimary: baseColor,
    textColorHoverPrimary: baseColor,
    textColorPressedPrimary: baseColor,
    textColorFocusPrimary: baseColor,
    textColorDisabledPrimary: baseColor,
    textColorTextPrimary: primaryColor,
    textColorTextHoverPrimary: primaryColorHover,
    textColorTextPressedPrimary: primaryColorPressed,
    textColorTextFocusPrimary: primaryColorHover,
    textColorTextDisabledPrimary: textColor2,
    textColorGhostPrimary: primaryColor,
    textColorGhostHoverPrimary: primaryColorHover,
    textColorGhostPressedPrimary: primaryColorPressed,
    textColorGhostFocusPrimary: primaryColorHover,
    textColorGhostDisabledPrimary: primaryColor,
    borderPrimary: `1px solid ${primaryColor}`,
    borderHoverPrimary: `1px solid ${primaryColorHover}`,
    borderPressedPrimary: `1px solid ${primaryColorPressed}`,
    borderFocusPrimary: `1px solid ${primaryColorHover}`,
    borderDisabledPrimary: `1px solid ${primaryColor}`,
    rippleColorPrimary: primaryColor,
    // info
    colorInfo: infoColor,
    colorHoverInfo: infoColorHover,
    colorPressedInfo: infoColorPressed,
    colorFocusInfo: infoColorHover,
    colorDisabledInfo: infoColor,
    textColorInfo: baseColor,
    textColorHoverInfo: baseColor,
    textColorPressedInfo: baseColor,
    textColorFocusInfo: baseColor,
    textColorDisabledInfo: baseColor,
    textColorTextInfo: infoColor,
    textColorTextHoverInfo: infoColorHover,
    textColorTextPressedInfo: infoColorPressed,
    textColorTextFocusInfo: infoColorHover,
    textColorTextDisabledInfo: textColor2,
    textColorGhostInfo: infoColor,
    textColorGhostHoverInfo: infoColorHover,
    textColorGhostPressedInfo: infoColorPressed,
    textColorGhostFocusInfo: infoColorHover,
    textColorGhostDisabledInfo: infoColor,
    borderInfo: `1px solid ${infoColor}`,
    borderHoverInfo: `1px solid ${infoColorHover}`,
    borderPressedInfo: `1px solid ${infoColorPressed}`,
    borderFocusInfo: `1px solid ${infoColorHover}`,
    borderDisabledInfo: `1px solid ${infoColor}`,
    rippleColorInfo: infoColor,
    // success
    colorSuccess: successColor,
    colorHoverSuccess: successColorHover,
    colorPressedSuccess: successColorPressed,
    colorFocusSuccess: successColorHover,
    colorDisabledSuccess: successColor,
    textColorSuccess: baseColor,
    textColorHoverSuccess: baseColor,
    textColorPressedSuccess: baseColor,
    textColorFocusSuccess: baseColor,
    textColorDisabledSuccess: baseColor,
    textColorTextSuccess: successColor,
    textColorTextHoverSuccess: successColorHover,
    textColorTextPressedSuccess: successColorPressed,
    textColorTextFocusSuccess: successColorHover,
    textColorTextDisabledSuccess: textColor2,
    textColorGhostSuccess: successColor,
    textColorGhostHoverSuccess: successColorHover,
    textColorGhostPressedSuccess: successColorPressed,
    textColorGhostFocusSuccess: successColorHover,
    textColorGhostDisabledSuccess: successColor,
    borderSuccess: `1px solid ${successColor}`,
    borderHoverSuccess: `1px solid ${successColorHover}`,
    borderPressedSuccess: `1px solid ${successColorPressed}`,
    borderFocusSuccess: `1px solid ${successColorHover}`,
    borderDisabledSuccess: `1px solid ${successColor}`,
    rippleColorSuccess: successColor,
    // warning
    colorWarning: warningColor,
    colorHoverWarning: warningColorHover,
    colorPressedWarning: warningColorPressed,
    colorFocusWarning: warningColorHover,
    colorDisabledWarning: warningColor,
    textColorWarning: baseColor,
    textColorHoverWarning: baseColor,
    textColorPressedWarning: baseColor,
    textColorFocusWarning: baseColor,
    textColorDisabledWarning: baseColor,
    textColorTextWarning: warningColor,
    textColorTextHoverWarning: warningColorHover,
    textColorTextPressedWarning: warningColorPressed,
    textColorTextFocusWarning: warningColorHover,
    textColorTextDisabledWarning: textColor2,
    textColorGhostWarning: warningColor,
    textColorGhostHoverWarning: warningColorHover,
    textColorGhostPressedWarning: warningColorPressed,
    textColorGhostFocusWarning: warningColorHover,
    textColorGhostDisabledWarning: warningColor,
    borderWarning: `1px solid ${warningColor}`,
    borderHoverWarning: `1px solid ${warningColorHover}`,
    borderPressedWarning: `1px solid ${warningColorPressed}`,
    borderFocusWarning: `1px solid ${warningColorHover}`,
    borderDisabledWarning: `1px solid ${warningColor}`,
    rippleColorWarning: warningColor,
    // error
    colorError: errorColor,
    colorHoverError: errorColorHover,
    colorPressedError: errorColorPressed,
    colorFocusError: errorColorHover,
    colorDisabledError: errorColor,
    textColorError: baseColor,
    textColorHoverError: baseColor,
    textColorPressedError: baseColor,
    textColorFocusError: baseColor,
    textColorDisabledError: baseColor,
    textColorTextError: errorColor,
    textColorTextHoverError: errorColorHover,
    textColorTextPressedError: errorColorPressed,
    textColorTextFocusError: errorColorHover,
    textColorTextDisabledError: textColor2,
    textColorGhostError: errorColor,
    textColorGhostHoverError: errorColorHover,
    textColorGhostPressedError: errorColorPressed,
    textColorGhostFocusError: errorColorHover,
    textColorGhostDisabledError: errorColor,
    borderError: `1px solid ${errorColor}`,
    borderHoverError: `1px solid ${errorColorHover}`,
    borderPressedError: `1px solid ${errorColorPressed}`,
    borderFocusError: `1px solid ${errorColorHover}`,
    borderDisabledError: `1px solid ${errorColor}`,
    rippleColorError: errorColor,
    waveOpacity: "0.6",
    fontWeight,
    fontWeightStrong
  });
}
var buttonLight = {
  name: "Button",
  common: light_default,
  self: self4
};
var light_default4 = buttonLight;

// ../node_modules/naive-ui/es/button/src/styles/index.cssr.mjs
var index_cssr_default7 = c2([cB("button", `
 margin: 0;
 font-weight: var(--n-font-weight);
 line-height: 1;
 font-family: inherit;
 padding: var(--n-padding);
 height: var(--n-height);
 font-size: var(--n-font-size);
 border-radius: var(--n-border-radius);
 color: var(--n-text-color);
 background-color: var(--n-color);
 width: var(--n-width);
 white-space: nowrap;
 outline: none;
 position: relative;
 z-index: auto;
 border: none;
 display: inline-flex;
 flex-wrap: nowrap;
 flex-shrink: 0;
 align-items: center;
 justify-content: center;
 user-select: none;
 -webkit-user-select: none;
 text-align: center;
 cursor: pointer;
 text-decoration: none;
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 opacity .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `, [cM("color", [cE("border", {
  borderColor: "var(--n-border-color)"
}), cM("disabled", [cE("border", {
  borderColor: "var(--n-border-color-disabled)"
})]), cNotM("disabled", [c2("&:focus", [cE("state-border", {
  borderColor: "var(--n-border-color-focus)"
})]), c2("&:hover", [cE("state-border", {
  borderColor: "var(--n-border-color-hover)"
})]), c2("&:active", [cE("state-border", {
  borderColor: "var(--n-border-color-pressed)"
})]), cM("pressed", [cE("state-border", {
  borderColor: "var(--n-border-color-pressed)"
})])])]), cM("disabled", {
  backgroundColor: "var(--n-color-disabled)",
  color: "var(--n-text-color-disabled)"
}, [cE("border", {
  border: "var(--n-border-disabled)"
})]), cNotM("disabled", [c2("&:focus", {
  backgroundColor: "var(--n-color-focus)",
  color: "var(--n-text-color-focus)"
}, [cE("state-border", {
  border: "var(--n-border-focus)"
})]), c2("&:hover", {
  backgroundColor: "var(--n-color-hover)",
  color: "var(--n-text-color-hover)"
}, [cE("state-border", {
  border: "var(--n-border-hover)"
})]), c2("&:active", {
  backgroundColor: "var(--n-color-pressed)",
  color: "var(--n-text-color-pressed)"
}, [cE("state-border", {
  border: "var(--n-border-pressed)"
})]), cM("pressed", {
  backgroundColor: "var(--n-color-pressed)",
  color: "var(--n-text-color-pressed)"
}, [cE("state-border", {
  border: "var(--n-border-pressed)"
})])]), cM("loading", "cursor: wait;"), cB("base-wave", `
 pointer-events: none;
 top: 0;
 right: 0;
 bottom: 0;
 left: 0;
 animation-iteration-count: 1;
 animation-duration: var(--n-ripple-duration);
 animation-timing-function: var(--n-bezier-ease-out), var(--n-bezier-ease-out);
 `, [cM("active", {
  zIndex: 1,
  animationName: "button-wave-spread, button-wave-opacity"
})]), isBrowser2 && "MozBoxSizing" in document.createElement("div").style ? c2("&::moz-focus-inner", {
  border: 0
}) : null, cE("border, state-border", `
 position: absolute;
 left: 0;
 top: 0;
 right: 0;
 bottom: 0;
 border-radius: inherit;
 transition: border-color .3s var(--n-bezier);
 pointer-events: none;
 `), cE("border", {
  border: "var(--n-border)"
}), cE("state-border", {
  border: "var(--n-border)",
  borderColor: "#0000",
  zIndex: 1
}), cE("icon", `
 margin: var(--n-icon-margin);
 margin-left: 0;
 height: var(--n-icon-size);
 width: var(--n-icon-size);
 max-width: var(--n-icon-size);
 font-size: var(--n-icon-size);
 position: relative;
 flex-shrink: 0;
 `, [cB("icon-slot", `
 height: var(--n-icon-size);
 width: var(--n-icon-size);
 position: absolute;
 left: 0;
 top: 50%;
 transform: translateY(-50%);
 display: flex;
 align-items: center;
 justify-content: center;
 `, [iconSwitchTransition({
  top: "50%",
  originalTransform: "translateY(-50%)"
})]), fadeInWidthExpandTransition()]), cE("content", `
 display: flex;
 align-items: center;
 flex-wrap: nowrap;
 min-width: 0;
 `, [c2("~", [cE("icon", {
  margin: "var(--n-icon-margin)",
  marginRight: 0
})])]), cM("block", `
 display: flex;
 width: 100%;
 `), cM("dashed", [cE("border, state-border", {
  borderStyle: "dashed !important"
})]), cM("disabled", {
  cursor: "not-allowed",
  opacity: "var(--n-opacity-disabled)"
})]), c2("@keyframes button-wave-spread", {
  from: {
    boxShadow: "0 0 0.5px 0 var(--n-ripple-color)"
  },
  to: {
    // don't use exact 5px since chrome will display the animation with glitches
    boxShadow: "0 0 0.5px 4.5px var(--n-ripple-color)"
  }
}), c2("@keyframes button-wave-opacity", {
  from: {
    opacity: "var(--n-wave-opacity)"
  },
  to: {
    opacity: 0
  }
})]);

// ../node_modules/naive-ui/es/button/src/Button.mjs
var buttonProps = Object.assign(Object.assign({}, use_theme_default.props), {
  color: String,
  textColor: String,
  text: Boolean,
  block: Boolean,
  loading: Boolean,
  disabled: Boolean,
  circle: Boolean,
  size: String,
  ghost: Boolean,
  round: Boolean,
  secondary: Boolean,
  tertiary: Boolean,
  quaternary: Boolean,
  strong: Boolean,
  focusable: {
    type: Boolean,
    default: true
  },
  keyboard: {
    type: Boolean,
    default: true
  },
  tag: {
    type: String,
    default: "button"
  },
  type: {
    type: String,
    default: "default"
  },
  dashed: Boolean,
  renderIcon: Function,
  iconPlacement: {
    type: String,
    default: "left"
  },
  attrType: {
    type: String,
    default: "button"
  },
  bordered: {
    type: Boolean,
    default: true
  },
  onClick: [Function, Array],
  nativeFocusBehavior: {
    type: Boolean,
    default: !isSafari
  }
});
var Button = defineComponent28({
  name: "Button",
  props: buttonProps,
  slots: Object,
  setup(props) {
    if (true) {
      watchEffect5(() => {
        const {
          dashed,
          ghost,
          text,
          secondary,
          tertiary,
          quaternary
        } = props;
        if ((dashed || ghost || text) && (secondary || tertiary || quaternary)) {
          warnOnce("button", "`dashed`, `ghost` and `text` props can't be used along with `secondary`, `tertiary` and `quaternary` props.");
        }
      });
    }
    const selfElRef = ref14(null);
    const waveElRef = ref14(null);
    const enterPressedRef = ref14(false);
    const showBorderRef = use_memo_default(() => {
      return !props.quaternary && !props.tertiary && !props.secondary && !props.text && (!props.color || props.ghost || props.dashed) && props.bordered;
    });
    const NButtonGroup = inject16(buttonGroupInjectionKey, {});
    const {
      mergedSizeRef
    } = useFormItem({}, {
      defaultSize: "medium",
      mergedSize: (NFormItem) => {
        const {
          size: size2
        } = props;
        if (size2) return size2;
        const {
          size: buttonGroupSize
        } = NButtonGroup;
        if (buttonGroupSize) return buttonGroupSize;
        const {
          mergedSize: formItemSize
        } = NFormItem || {};
        if (formItemSize) {
          return formItemSize.value;
        }
        return "medium";
      }
    });
    const mergedFocusableRef = computed14(() => {
      return props.focusable && !props.disabled;
    });
    const handleMousedown = (e) => {
      var _a;
      if (!mergedFocusableRef.value) {
        e.preventDefault();
      }
      if (props.nativeFocusBehavior) {
        return;
      }
      e.preventDefault();
      if (props.disabled) {
        return;
      }
      if (mergedFocusableRef.value) {
        (_a = selfElRef.value) === null || _a === void 0 ? void 0 : _a.focus({
          preventScroll: true
        });
      }
    };
    const handleClick = (e) => {
      var _a;
      if (!props.disabled && !props.loading) {
        const {
          onClick
        } = props;
        if (onClick) call(onClick, e);
        if (!props.text) {
          (_a = waveElRef.value) === null || _a === void 0 ? void 0 : _a.play();
        }
      }
    };
    const handleKeyup = (e) => {
      switch (e.key) {
        case "Enter":
          if (!props.keyboard) {
            return;
          }
          enterPressedRef.value = false;
      }
    };
    const handleKeydown = (e) => {
      switch (e.key) {
        case "Enter":
          if (!props.keyboard || props.loading) {
            e.preventDefault();
            return;
          }
          enterPressedRef.value = true;
      }
    };
    const handleBlur = () => {
      enterPressedRef.value = false;
    };
    const {
      inlineThemeDisabled,
      mergedClsPrefixRef,
      mergedRtlRef
    } = useConfig(props);
    const themeRef = use_theme_default("Button", "-button", index_cssr_default7, light_default4, props, mergedClsPrefixRef);
    const rtlEnabledRef = useRtl("Button", mergedRtlRef, mergedClsPrefixRef);
    const cssVarsRef = computed14(() => {
      const theme = themeRef.value;
      const {
        common: {
          cubicBezierEaseInOut: cubicBezierEaseInOut4,
          cubicBezierEaseOut: cubicBezierEaseOut2
        },
        self: self7
      } = theme;
      const {
        rippleDuration,
        opacityDisabled,
        fontWeight,
        fontWeightStrong
      } = self7;
      const size2 = mergedSizeRef.value;
      const {
        dashed,
        type,
        ghost,
        text,
        color,
        round,
        circle,
        textColor,
        secondary,
        tertiary,
        quaternary,
        strong
      } = props;
      const fontProps = {
        "--n-font-weight": strong ? fontWeightStrong : fontWeight
      };
      let colorProps = {
        "--n-color": "initial",
        "--n-color-hover": "initial",
        "--n-color-pressed": "initial",
        "--n-color-focus": "initial",
        "--n-color-disabled": "initial",
        "--n-ripple-color": "initial",
        "--n-text-color": "initial",
        "--n-text-color-hover": "initial",
        "--n-text-color-pressed": "initial",
        "--n-text-color-focus": "initial",
        "--n-text-color-disabled": "initial"
      };
      const typeIsTertiary = type === "tertiary";
      const typeIsDefault = type === "default";
      const mergedType = typeIsTertiary ? "default" : type;
      if (text) {
        const propTextColor = textColor || color;
        const mergedTextColor = propTextColor || self7[createKey("textColorText", mergedType)];
        colorProps = {
          "--n-color": "#0000",
          "--n-color-hover": "#0000",
          "--n-color-pressed": "#0000",
          "--n-color-focus": "#0000",
          "--n-color-disabled": "#0000",
          "--n-ripple-color": "#0000",
          "--n-text-color": mergedTextColor,
          "--n-text-color-hover": propTextColor ? createHoverColor(propTextColor) : self7[createKey("textColorTextHover", mergedType)],
          "--n-text-color-pressed": propTextColor ? createPressedColor(propTextColor) : self7[createKey("textColorTextPressed", mergedType)],
          "--n-text-color-focus": propTextColor ? createHoverColor(propTextColor) : self7[createKey("textColorTextHover", mergedType)],
          "--n-text-color-disabled": propTextColor || self7[createKey("textColorTextDisabled", mergedType)]
        };
      } else if (ghost || dashed) {
        const mergedTextColor = textColor || color;
        colorProps = {
          "--n-color": "#0000",
          "--n-color-hover": "#0000",
          "--n-color-pressed": "#0000",
          "--n-color-focus": "#0000",
          "--n-color-disabled": "#0000",
          "--n-ripple-color": color || self7[createKey("rippleColor", mergedType)],
          "--n-text-color": mergedTextColor || self7[createKey("textColorGhost", mergedType)],
          "--n-text-color-hover": mergedTextColor ? createHoverColor(mergedTextColor) : self7[createKey("textColorGhostHover", mergedType)],
          "--n-text-color-pressed": mergedTextColor ? createPressedColor(mergedTextColor) : self7[createKey("textColorGhostPressed", mergedType)],
          "--n-text-color-focus": mergedTextColor ? createHoverColor(mergedTextColor) : self7[createKey("textColorGhostHover", mergedType)],
          "--n-text-color-disabled": mergedTextColor || self7[createKey("textColorGhostDisabled", mergedType)]
        };
      } else if (secondary) {
        const typeTextColor = typeIsDefault ? self7.textColor : typeIsTertiary ? self7.textColorTertiary : self7[createKey("color", mergedType)];
        const mergedTextColor = color || typeTextColor;
        const isColoredType = type !== "default" && type !== "tertiary";
        colorProps = {
          "--n-color": isColoredType ? changeColor(mergedTextColor, {
            alpha: Number(self7.colorOpacitySecondary)
          }) : self7.colorSecondary,
          "--n-color-hover": isColoredType ? changeColor(mergedTextColor, {
            alpha: Number(self7.colorOpacitySecondaryHover)
          }) : self7.colorSecondaryHover,
          "--n-color-pressed": isColoredType ? changeColor(mergedTextColor, {
            alpha: Number(self7.colorOpacitySecondaryPressed)
          }) : self7.colorSecondaryPressed,
          "--n-color-focus": isColoredType ? changeColor(mergedTextColor, {
            alpha: Number(self7.colorOpacitySecondaryHover)
          }) : self7.colorSecondaryHover,
          "--n-color-disabled": self7.colorSecondary,
          "--n-ripple-color": "#0000",
          "--n-text-color": mergedTextColor,
          "--n-text-color-hover": mergedTextColor,
          "--n-text-color-pressed": mergedTextColor,
          "--n-text-color-focus": mergedTextColor,
          "--n-text-color-disabled": mergedTextColor
        };
      } else if (tertiary || quaternary) {
        const typeColor = typeIsDefault ? self7.textColor : typeIsTertiary ? self7.textColorTertiary : self7[createKey("color", mergedType)];
        const mergedColor = color || typeColor;
        if (tertiary) {
          colorProps["--n-color"] = self7.colorTertiary;
          colorProps["--n-color-hover"] = self7.colorTertiaryHover;
          colorProps["--n-color-pressed"] = self7.colorTertiaryPressed;
          colorProps["--n-color-focus"] = self7.colorSecondaryHover;
          colorProps["--n-color-disabled"] = self7.colorTertiary;
        } else {
          colorProps["--n-color"] = self7.colorQuaternary;
          colorProps["--n-color-hover"] = self7.colorQuaternaryHover;
          colorProps["--n-color-pressed"] = self7.colorQuaternaryPressed;
          colorProps["--n-color-focus"] = self7.colorQuaternaryHover;
          colorProps["--n-color-disabled"] = self7.colorQuaternary;
        }
        colorProps["--n-ripple-color"] = "#0000";
        colorProps["--n-text-color"] = mergedColor;
        colorProps["--n-text-color-hover"] = mergedColor;
        colorProps["--n-text-color-pressed"] = mergedColor;
        colorProps["--n-text-color-focus"] = mergedColor;
        colorProps["--n-text-color-disabled"] = mergedColor;
      } else {
        colorProps = {
          "--n-color": color || self7[createKey("color", mergedType)],
          "--n-color-hover": color ? createHoverColor(color) : self7[createKey("colorHover", mergedType)],
          "--n-color-pressed": color ? createPressedColor(color) : self7[createKey("colorPressed", mergedType)],
          "--n-color-focus": color ? createHoverColor(color) : self7[createKey("colorFocus", mergedType)],
          "--n-color-disabled": color || self7[createKey("colorDisabled", mergedType)],
          "--n-ripple-color": color || self7[createKey("rippleColor", mergedType)],
          "--n-text-color": textColor || (color ? self7.textColorPrimary : typeIsTertiary ? self7.textColorTertiary : self7[createKey("textColor", mergedType)]),
          "--n-text-color-hover": textColor || (color ? self7.textColorHoverPrimary : self7[createKey("textColorHover", mergedType)]),
          "--n-text-color-pressed": textColor || (color ? self7.textColorPressedPrimary : self7[createKey("textColorPressed", mergedType)]),
          "--n-text-color-focus": textColor || (color ? self7.textColorFocusPrimary : self7[createKey("textColorFocus", mergedType)]),
          "--n-text-color-disabled": textColor || (color ? self7.textColorDisabledPrimary : self7[createKey("textColorDisabled", mergedType)])
        };
      }
      let borderProps = {
        "--n-border": "initial",
        "--n-border-hover": "initial",
        "--n-border-pressed": "initial",
        "--n-border-focus": "initial",
        "--n-border-disabled": "initial"
      };
      if (text) {
        borderProps = {
          "--n-border": "none",
          "--n-border-hover": "none",
          "--n-border-pressed": "none",
          "--n-border-focus": "none",
          "--n-border-disabled": "none"
        };
      } else {
        borderProps = {
          "--n-border": self7[createKey("border", mergedType)],
          "--n-border-hover": self7[createKey("borderHover", mergedType)],
          "--n-border-pressed": self7[createKey("borderPressed", mergedType)],
          "--n-border-focus": self7[createKey("borderFocus", mergedType)],
          "--n-border-disabled": self7[createKey("borderDisabled", mergedType)]
        };
      }
      const {
        [createKey("height", size2)]: height,
        [createKey("fontSize", size2)]: fontSize2,
        [createKey("padding", size2)]: padding,
        [createKey("paddingRound", size2)]: paddingRound,
        [createKey("iconSize", size2)]: iconSize,
        [createKey("borderRadius", size2)]: borderRadius,
        [createKey("iconMargin", size2)]: iconMargin,
        waveOpacity
      } = self7;
      const sizeProps = {
        "--n-width": circle && !text ? height : "initial",
        "--n-height": text ? "initial" : height,
        "--n-font-size": fontSize2,
        "--n-padding": circle ? "initial" : text ? "initial" : round ? paddingRound : padding,
        "--n-icon-size": iconSize,
        "--n-icon-margin": iconMargin,
        "--n-border-radius": text ? "initial" : circle || round ? height : borderRadius
      };
      return Object.assign(Object.assign(Object.assign(Object.assign({
        "--n-bezier": cubicBezierEaseInOut4,
        "--n-bezier-ease-out": cubicBezierEaseOut2,
        "--n-ripple-duration": rippleDuration,
        "--n-opacity-disabled": opacityDisabled,
        "--n-wave-opacity": waveOpacity
      }, fontProps), colorProps), borderProps), sizeProps);
    });
    const themeClassHandle = inlineThemeDisabled ? useThemeClass("button", computed14(() => {
      let hash = "";
      const {
        dashed,
        type,
        ghost,
        text,
        color,
        round,
        circle,
        textColor,
        secondary,
        tertiary,
        quaternary,
        strong
      } = props;
      if (dashed) hash += "a";
      if (ghost) hash += "b";
      if (text) hash += "c";
      if (round) hash += "d";
      if (circle) hash += "e";
      if (secondary) hash += "f";
      if (tertiary) hash += "g";
      if (quaternary) hash += "h";
      if (strong) hash += "i";
      if (color) hash += `j${color2Class(color)}`;
      if (textColor) hash += `k${color2Class(textColor)}`;
      const {
        value: size2
      } = mergedSizeRef;
      hash += `l${size2[0]}`;
      hash += `m${type[0]}`;
      return hash;
    }), cssVarsRef, props) : void 0;
    return {
      selfElRef,
      waveElRef,
      mergedClsPrefix: mergedClsPrefixRef,
      mergedFocusable: mergedFocusableRef,
      mergedSize: mergedSizeRef,
      showBorder: showBorderRef,
      enterPressed: enterPressedRef,
      rtlEnabled: rtlEnabledRef,
      handleMousedown,
      handleKeydown,
      handleBlur,
      handleKeyup,
      handleClick,
      customColorCssVars: computed14(() => {
        const {
          color
        } = props;
        if (!color) return null;
        const hoverColor = createHoverColor(color);
        return {
          "--n-border-color": color,
          "--n-border-color-hover": hoverColor,
          "--n-border-color-pressed": createPressedColor(color),
          "--n-border-color-focus": hoverColor,
          "--n-border-color-disabled": color
        };
      }),
      cssVars: inlineThemeDisabled ? void 0 : cssVarsRef,
      themeClass: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.themeClass,
      onRender: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.onRender
    };
  },
  render() {
    const {
      mergedClsPrefix,
      tag: Component,
      onRender
    } = this;
    onRender === null || onRender === void 0 ? void 0 : onRender();
    const children = resolveWrappedSlot(this.$slots.default, (children2) => children2 && h27("span", {
      class: `${mergedClsPrefix}-button__content`
    }, children2));
    return h27(Component, {
      ref: "selfElRef",
      class: [
        this.themeClass,
        `${mergedClsPrefix}-button`,
        `${mergedClsPrefix}-button--${this.type}-type`,
        `${mergedClsPrefix}-button--${this.mergedSize}-type`,
        this.rtlEnabled && `${mergedClsPrefix}-button--rtl`,
        this.disabled && `${mergedClsPrefix}-button--disabled`,
        this.block && `${mergedClsPrefix}-button--block`,
        this.enterPressed && `${mergedClsPrefix}-button--pressed`,
        !this.text && this.dashed && `${mergedClsPrefix}-button--dashed`,
        this.color && `${mergedClsPrefix}-button--color`,
        this.secondary && `${mergedClsPrefix}-button--secondary`,
        this.loading && `${mergedClsPrefix}-button--loading`,
        this.ghost && `${mergedClsPrefix}-button--ghost`
        // required for button group border collapse
      ],
      tabindex: this.mergedFocusable ? 0 : -1,
      type: this.attrType,
      style: this.cssVars,
      disabled: this.disabled,
      onClick: this.handleClick,
      onBlur: this.handleBlur,
      onMousedown: this.handleMousedown,
      onKeyup: this.handleKeyup,
      onKeydown: this.handleKeydown
    }, this.iconPlacement === "right" && children, h27(FadeInExpandTransition_default, {
      width: true
    }, {
      default: () => resolveWrappedSlot(this.$slots.icon, (children2) => (this.loading || this.renderIcon || children2) && h27("span", {
        class: `${mergedClsPrefix}-button__icon`,
        style: {
          margin: isSlotEmpty(this.$slots.default) ? "0" : ""
        }
      }, h27(IconSwitchTransition_default, null, {
        default: () => this.loading ? h27(Loading_default, {
          clsPrefix: mergedClsPrefix,
          key: "loading",
          class: `${mergedClsPrefix}-icon-slot`,
          strokeWidth: 20
        }) : h27("div", {
          key: "icon",
          class: `${mergedClsPrefix}-icon-slot`,
          role: "none"
        }, this.renderIcon ? this.renderIcon() : children2)
      })))
    }), this.iconPlacement === "left" && children, !this.text ? h27(Wave_default, {
      ref: "waveElRef",
      clsPrefix: mergedClsPrefix
    }) : null, this.showBorder ? h27("div", {
      "aria-hidden": true,
      class: `${mergedClsPrefix}-button__border`,
      style: this.customColorCssVars
    }) : null, this.showBorder ? h27("div", {
      "aria-hidden": true,
      class: `${mergedClsPrefix}-button__state-border`,
      style: this.customColorCssVars
    }) : null);
  }
});
var Button_default = Button;
var XButton = Button;

// ../node_modules/date-fns/constructFrom.mjs
function constructFrom(date, value) {
  if (date instanceof Date) {
    return new date.constructor(value);
  } else {
    return new Date(value);
  }
}

// ../node_modules/date-fns/addDays.mjs
function addDays(date, amount) {
  const _date = toDate(date);
  if (isNaN(amount)) return constructFrom(date, NaN);
  if (!amount) {
    return _date;
  }
  _date.setDate(_date.getDate() + amount);
  return _date;
}

// ../node_modules/date-fns/addMonths.mjs
function addMonths(date, amount) {
  const _date = toDate(date);
  if (isNaN(amount)) return constructFrom(date, NaN);
  if (!amount) {
    return _date;
  }
  const dayOfMonth = _date.getDate();
  const endOfDesiredMonth = constructFrom(date, _date.getTime());
  endOfDesiredMonth.setMonth(_date.getMonth() + amount + 1, 0);
  const daysInMonth = endOfDesiredMonth.getDate();
  if (dayOfMonth >= daysInMonth) {
    return endOfDesiredMonth;
  } else {
    _date.setFullYear(
      endOfDesiredMonth.getFullYear(),
      endOfDesiredMonth.getMonth(),
      dayOfMonth
    );
    return _date;
  }
}

// ../node_modules/date-fns/constants.mjs
var daysInYear = 365.2425;
var maxTime = Math.pow(10, 8) * 24 * 60 * 60 * 1e3;
var minTime = -maxTime;
var millisecondsInWeek = 6048e5;
var millisecondsInDay = 864e5;
var millisecondsInMinute = 6e4;
var millisecondsInHour = 36e5;
var millisecondsInSecond = 1e3;
var secondsInHour = 3600;
var secondsInDay = secondsInHour * 24;
var secondsInWeek = secondsInDay * 7;
var secondsInYear = secondsInDay * daysInYear;
var secondsInMonth = secondsInYear / 12;
var secondsInQuarter = secondsInMonth * 3;

// ../node_modules/date-fns/startOfISOWeek.mjs
function startOfISOWeek(date) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

// ../node_modules/date-fns/getISOWeekYear.mjs
function getISOWeekYear(date) {
  const _date = toDate(date);
  const year = _date.getFullYear();
  const fourthOfJanuaryOfNextYear = constructFrom(date, 0);
  fourthOfJanuaryOfNextYear.setFullYear(year + 1, 0, 4);
  fourthOfJanuaryOfNextYear.setHours(0, 0, 0, 0);
  const startOfNextYear = startOfISOWeek(fourthOfJanuaryOfNextYear);
  const fourthOfJanuaryOfThisYear = constructFrom(date, 0);
  fourthOfJanuaryOfThisYear.setFullYear(year, 0, 4);
  fourthOfJanuaryOfThisYear.setHours(0, 0, 0, 0);
  const startOfThisYear = startOfISOWeek(fourthOfJanuaryOfThisYear);
  if (_date.getTime() >= startOfNextYear.getTime()) {
    return year + 1;
  } else if (_date.getTime() >= startOfThisYear.getTime()) {
    return year;
  } else {
    return year - 1;
  }
}

// ../node_modules/date-fns/startOfDay.mjs
function startOfDay(date) {
  const _date = toDate(date);
  _date.setHours(0, 0, 0, 0);
  return _date;
}

// ../node_modules/date-fns/_lib/getTimezoneOffsetInMilliseconds.mjs
function getTimezoneOffsetInMilliseconds(date) {
  const _date = toDate(date);
  const utcDate = new Date(
    Date.UTC(
      _date.getFullYear(),
      _date.getMonth(),
      _date.getDate(),
      _date.getHours(),
      _date.getMinutes(),
      _date.getSeconds(),
      _date.getMilliseconds()
    )
  );
  utcDate.setUTCFullYear(_date.getFullYear());
  return +date - +utcDate;
}

// ../node_modules/date-fns/differenceInCalendarDays.mjs
function differenceInCalendarDays(dateLeft, dateRight) {
  const startOfDayLeft = startOfDay(dateLeft);
  const startOfDayRight = startOfDay(dateRight);
  const timestampLeft = +startOfDayLeft - getTimezoneOffsetInMilliseconds(startOfDayLeft);
  const timestampRight = +startOfDayRight - getTimezoneOffsetInMilliseconds(startOfDayRight);
  return Math.round((timestampLeft - timestampRight) / millisecondsInDay);
}

// ../node_modules/date-fns/startOfISOWeekYear.mjs
function startOfISOWeekYear(date) {
  const year = getISOWeekYear(date);
  const fourthOfJanuary = constructFrom(date, 0);
  fourthOfJanuary.setFullYear(year, 0, 4);
  fourthOfJanuary.setHours(0, 0, 0, 0);
  return startOfISOWeek(fourthOfJanuary);
}

// ../node_modules/date-fns/addQuarters.mjs
function addQuarters(date, amount) {
  const months = amount * 3;
  return addMonths(date, months);
}

// ../node_modules/date-fns/addYears.mjs
function addYears(date, amount) {
  return addMonths(date, amount * 12);
}

// ../node_modules/date-fns/isSameDay.mjs
function isSameDay(dateLeft, dateRight) {
  const dateLeftStartOfDay = startOfDay(dateLeft);
  const dateRightStartOfDay = startOfDay(dateRight);
  return +dateLeftStartOfDay === +dateRightStartOfDay;
}

// ../node_modules/date-fns/isDate.mjs
function isDate(value) {
  return value instanceof Date || typeof value === "object" && Object.prototype.toString.call(value) === "[object Date]";
}

// ../node_modules/date-fns/isValid.mjs
function isValid(date) {
  if (!isDate(date) && typeof date !== "number") {
    return false;
  }
  const _date = toDate(date);
  return !isNaN(Number(_date));
}

// ../node_modules/date-fns/getQuarter.mjs
function getQuarter(date) {
  const _date = toDate(date);
  const quarter = Math.trunc(_date.getMonth() / 3) + 1;
  return quarter;
}

// ../node_modules/date-fns/startOfMinute.mjs
function startOfMinute(date) {
  const _date = toDate(date);
  _date.setSeconds(0, 0);
  return _date;
}

// ../node_modules/date-fns/startOfQuarter.mjs
function startOfQuarter(date) {
  const _date = toDate(date);
  const currentMonth = _date.getMonth();
  const month = currentMonth - currentMonth % 3;
  _date.setMonth(month, 1);
  _date.setHours(0, 0, 0, 0);
  return _date;
}

// ../node_modules/date-fns/startOfMonth.mjs
function startOfMonth(date) {
  const _date = toDate(date);
  _date.setDate(1);
  _date.setHours(0, 0, 0, 0);
  return _date;
}

// ../node_modules/date-fns/startOfYear.mjs
function startOfYear(date) {
  const cleanDate = toDate(date);
  const _date = constructFrom(date, 0);
  _date.setFullYear(cleanDate.getFullYear(), 0, 1);
  _date.setHours(0, 0, 0, 0);
  return _date;
}

// ../node_modules/date-fns/getDayOfYear.mjs
function getDayOfYear(date) {
  const _date = toDate(date);
  const diff = differenceInCalendarDays(_date, startOfYear(_date));
  const dayOfYear = diff + 1;
  return dayOfYear;
}

// ../node_modules/date-fns/getISOWeek.mjs
function getISOWeek(date) {
  const _date = toDate(date);
  const diff = +startOfISOWeek(_date) - +startOfISOWeekYear(_date);
  return Math.round(diff / millisecondsInWeek) + 1;
}

// ../node_modules/date-fns/getWeekYear.mjs
function getWeekYear(date, options) {
  const _date = toDate(date);
  const year = _date.getFullYear();
  const defaultOptions2 = getDefaultOptions();
  const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
  const firstWeekOfNextYear = constructFrom(date, 0);
  firstWeekOfNextYear.setFullYear(year + 1, 0, firstWeekContainsDate);
  firstWeekOfNextYear.setHours(0, 0, 0, 0);
  const startOfNextYear = startOfWeek(firstWeekOfNextYear, options);
  const firstWeekOfThisYear = constructFrom(date, 0);
  firstWeekOfThisYear.setFullYear(year, 0, firstWeekContainsDate);
  firstWeekOfThisYear.setHours(0, 0, 0, 0);
  const startOfThisYear = startOfWeek(firstWeekOfThisYear, options);
  if (_date.getTime() >= startOfNextYear.getTime()) {
    return year + 1;
  } else if (_date.getTime() >= startOfThisYear.getTime()) {
    return year;
  } else {
    return year - 1;
  }
}

// ../node_modules/date-fns/startOfWeekYear.mjs
function startOfWeekYear(date, options) {
  const defaultOptions2 = getDefaultOptions();
  const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
  const year = getWeekYear(date, options);
  const firstWeek = constructFrom(date, 0);
  firstWeek.setFullYear(year, 0, firstWeekContainsDate);
  firstWeek.setHours(0, 0, 0, 0);
  const _date = startOfWeek(firstWeek, options);
  return _date;
}

// ../node_modules/date-fns/getWeek.mjs
function getWeek(date, options) {
  const _date = toDate(date);
  const diff = +startOfWeek(_date, options) - +startOfWeekYear(_date, options);
  return Math.round(diff / millisecondsInWeek) + 1;
}

// ../node_modules/date-fns/_lib/addLeadingZeros.mjs
function addLeadingZeros(number, targetLength) {
  const sign = number < 0 ? "-" : "";
  const output = Math.abs(number).toString().padStart(targetLength, "0");
  return sign + output;
}

// ../node_modules/date-fns/_lib/format/lightFormatters.mjs
var lightFormatters = {
  // Year
  y(date, token) {
    const signedYear = date.getFullYear();
    const year = signedYear > 0 ? signedYear : 1 - signedYear;
    return addLeadingZeros(token === "yy" ? year % 100 : year, token.length);
  },
  // Month
  M(date, token) {
    const month = date.getMonth();
    return token === "M" ? String(month + 1) : addLeadingZeros(month + 1, 2);
  },
  // Day of the month
  d(date, token) {
    return addLeadingZeros(date.getDate(), token.length);
  },
  // AM or PM
  a(date, token) {
    const dayPeriodEnumValue = date.getHours() / 12 >= 1 ? "pm" : "am";
    switch (token) {
      case "a":
      case "aa":
        return dayPeriodEnumValue.toUpperCase();
      case "aaa":
        return dayPeriodEnumValue;
      case "aaaaa":
        return dayPeriodEnumValue[0];
      case "aaaa":
      default:
        return dayPeriodEnumValue === "am" ? "a.m." : "p.m.";
    }
  },
  // Hour [1-12]
  h(date, token) {
    return addLeadingZeros(date.getHours() % 12 || 12, token.length);
  },
  // Hour [0-23]
  H(date, token) {
    return addLeadingZeros(date.getHours(), token.length);
  },
  // Minute
  m(date, token) {
    return addLeadingZeros(date.getMinutes(), token.length);
  },
  // Second
  s(date, token) {
    return addLeadingZeros(date.getSeconds(), token.length);
  },
  // Fraction of second
  S(date, token) {
    const numberOfDigits = token.length;
    const milliseconds = date.getMilliseconds();
    const fractionalSeconds = Math.trunc(
      milliseconds * Math.pow(10, numberOfDigits - 3)
    );
    return addLeadingZeros(fractionalSeconds, token.length);
  }
};

// ../node_modules/date-fns/_lib/format/formatters.mjs
var dayPeriodEnum = {
  am: "am",
  pm: "pm",
  midnight: "midnight",
  noon: "noon",
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
  night: "night"
};
var formatters = {
  // Era
  G: function(date, token, localize2) {
    const era = date.getFullYear() > 0 ? 1 : 0;
    switch (token) {
      // AD, BC
      case "G":
      case "GG":
      case "GGG":
        return localize2.era(era, { width: "abbreviated" });
      // A, B
      case "GGGGG":
        return localize2.era(era, { width: "narrow" });
      // Anno Domini, Before Christ
      case "GGGG":
      default:
        return localize2.era(era, { width: "wide" });
    }
  },
  // Year
  y: function(date, token, localize2) {
    if (token === "yo") {
      const signedYear = date.getFullYear();
      const year = signedYear > 0 ? signedYear : 1 - signedYear;
      return localize2.ordinalNumber(year, { unit: "year" });
    }
    return lightFormatters.y(date, token);
  },
  // Local week-numbering year
  Y: function(date, token, localize2, options) {
    const signedWeekYear = getWeekYear(date, options);
    const weekYear = signedWeekYear > 0 ? signedWeekYear : 1 - signedWeekYear;
    if (token === "YY") {
      const twoDigitYear = weekYear % 100;
      return addLeadingZeros(twoDigitYear, 2);
    }
    if (token === "Yo") {
      return localize2.ordinalNumber(weekYear, { unit: "year" });
    }
    return addLeadingZeros(weekYear, token.length);
  },
  // ISO week-numbering year
  R: function(date, token) {
    const isoWeekYear = getISOWeekYear(date);
    return addLeadingZeros(isoWeekYear, token.length);
  },
  // Extended year. This is a single number designating the year of this calendar system.
  // The main difference between `y` and `u` localizers are B.C. years:
  // | Year | `y` | `u` |
  // |------|-----|-----|
  // | AC 1 |   1 |   1 |
  // | BC 1 |   1 |   0 |
  // | BC 2 |   2 |  -1 |
  // Also `yy` always returns the last two digits of a year,
  // while `uu` pads single digit years to 2 characters and returns other years unchanged.
  u: function(date, token) {
    const year = date.getFullYear();
    return addLeadingZeros(year, token.length);
  },
  // Quarter
  Q: function(date, token, localize2) {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    switch (token) {
      // 1, 2, 3, 4
      case "Q":
        return String(quarter);
      // 01, 02, 03, 04
      case "QQ":
        return addLeadingZeros(quarter, 2);
      // 1st, 2nd, 3rd, 4th
      case "Qo":
        return localize2.ordinalNumber(quarter, { unit: "quarter" });
      // Q1, Q2, Q3, Q4
      case "QQQ":
        return localize2.quarter(quarter, {
          width: "abbreviated",
          context: "formatting"
        });
      // 1, 2, 3, 4 (narrow quarter; could be not numerical)
      case "QQQQQ":
        return localize2.quarter(quarter, {
          width: "narrow",
          context: "formatting"
        });
      // 1st quarter, 2nd quarter, ...
      case "QQQQ":
      default:
        return localize2.quarter(quarter, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Stand-alone quarter
  q: function(date, token, localize2) {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    switch (token) {
      // 1, 2, 3, 4
      case "q":
        return String(quarter);
      // 01, 02, 03, 04
      case "qq":
        return addLeadingZeros(quarter, 2);
      // 1st, 2nd, 3rd, 4th
      case "qo":
        return localize2.ordinalNumber(quarter, { unit: "quarter" });
      // Q1, Q2, Q3, Q4
      case "qqq":
        return localize2.quarter(quarter, {
          width: "abbreviated",
          context: "standalone"
        });
      // 1, 2, 3, 4 (narrow quarter; could be not numerical)
      case "qqqqq":
        return localize2.quarter(quarter, {
          width: "narrow",
          context: "standalone"
        });
      // 1st quarter, 2nd quarter, ...
      case "qqqq":
      default:
        return localize2.quarter(quarter, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  // Month
  M: function(date, token, localize2) {
    const month = date.getMonth();
    switch (token) {
      case "M":
      case "MM":
        return lightFormatters.M(date, token);
      // 1st, 2nd, ..., 12th
      case "Mo":
        return localize2.ordinalNumber(month + 1, { unit: "month" });
      // Jan, Feb, ..., Dec
      case "MMM":
        return localize2.month(month, {
          width: "abbreviated",
          context: "formatting"
        });
      // J, F, ..., D
      case "MMMMM":
        return localize2.month(month, {
          width: "narrow",
          context: "formatting"
        });
      // January, February, ..., December
      case "MMMM":
      default:
        return localize2.month(month, { width: "wide", context: "formatting" });
    }
  },
  // Stand-alone month
  L: function(date, token, localize2) {
    const month = date.getMonth();
    switch (token) {
      // 1, 2, ..., 12
      case "L":
        return String(month + 1);
      // 01, 02, ..., 12
      case "LL":
        return addLeadingZeros(month + 1, 2);
      // 1st, 2nd, ..., 12th
      case "Lo":
        return localize2.ordinalNumber(month + 1, { unit: "month" });
      // Jan, Feb, ..., Dec
      case "LLL":
        return localize2.month(month, {
          width: "abbreviated",
          context: "standalone"
        });
      // J, F, ..., D
      case "LLLLL":
        return localize2.month(month, {
          width: "narrow",
          context: "standalone"
        });
      // January, February, ..., December
      case "LLLL":
      default:
        return localize2.month(month, { width: "wide", context: "standalone" });
    }
  },
  // Local week of year
  w: function(date, token, localize2, options) {
    const week = getWeek(date, options);
    if (token === "wo") {
      return localize2.ordinalNumber(week, { unit: "week" });
    }
    return addLeadingZeros(week, token.length);
  },
  // ISO week of year
  I: function(date, token, localize2) {
    const isoWeek = getISOWeek(date);
    if (token === "Io") {
      return localize2.ordinalNumber(isoWeek, { unit: "week" });
    }
    return addLeadingZeros(isoWeek, token.length);
  },
  // Day of the month
  d: function(date, token, localize2) {
    if (token === "do") {
      return localize2.ordinalNumber(date.getDate(), { unit: "date" });
    }
    return lightFormatters.d(date, token);
  },
  // Day of year
  D: function(date, token, localize2) {
    const dayOfYear = getDayOfYear(date);
    if (token === "Do") {
      return localize2.ordinalNumber(dayOfYear, { unit: "dayOfYear" });
    }
    return addLeadingZeros(dayOfYear, token.length);
  },
  // Day of week
  E: function(date, token, localize2) {
    const dayOfWeek = date.getDay();
    switch (token) {
      // Tue
      case "E":
      case "EE":
      case "EEE":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      // T
      case "EEEEE":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      // Tu
      case "EEEEEE":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      // Tuesday
      case "EEEE":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Local day of week
  e: function(date, token, localize2, options) {
    const dayOfWeek = date.getDay();
    const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
    switch (token) {
      // Numerical value (Nth day of week with current locale or weekStartsOn)
      case "e":
        return String(localDayOfWeek);
      // Padded numerical value
      case "ee":
        return addLeadingZeros(localDayOfWeek, 2);
      // 1st, 2nd, ..., 7th
      case "eo":
        return localize2.ordinalNumber(localDayOfWeek, { unit: "day" });
      case "eee":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      // T
      case "eeeee":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      // Tu
      case "eeeeee":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      // Tuesday
      case "eeee":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Stand-alone local day of week
  c: function(date, token, localize2, options) {
    const dayOfWeek = date.getDay();
    const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
    switch (token) {
      // Numerical value (same as in `e`)
      case "c":
        return String(localDayOfWeek);
      // Padded numerical value
      case "cc":
        return addLeadingZeros(localDayOfWeek, token.length);
      // 1st, 2nd, ..., 7th
      case "co":
        return localize2.ordinalNumber(localDayOfWeek, { unit: "day" });
      case "ccc":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "standalone"
        });
      // T
      case "ccccc":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "standalone"
        });
      // Tu
      case "cccccc":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "standalone"
        });
      // Tuesday
      case "cccc":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  // ISO day of week
  i: function(date, token, localize2) {
    const dayOfWeek = date.getDay();
    const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    switch (token) {
      // 2
      case "i":
        return String(isoDayOfWeek);
      // 02
      case "ii":
        return addLeadingZeros(isoDayOfWeek, token.length);
      // 2nd
      case "io":
        return localize2.ordinalNumber(isoDayOfWeek, { unit: "day" });
      // Tue
      case "iii":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      // T
      case "iiiii":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      // Tu
      case "iiiiii":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      // Tuesday
      case "iiii":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // AM or PM
  a: function(date, token, localize2) {
    const hours = date.getHours();
    const dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
    switch (token) {
      case "a":
      case "aa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "aaa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "aaaaa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      case "aaaa":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // AM, PM, midnight, noon
  b: function(date, token, localize2) {
    const hours = date.getHours();
    let dayPeriodEnumValue;
    if (hours === 12) {
      dayPeriodEnumValue = dayPeriodEnum.noon;
    } else if (hours === 0) {
      dayPeriodEnumValue = dayPeriodEnum.midnight;
    } else {
      dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
    }
    switch (token) {
      case "b":
      case "bb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "bbb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "bbbbb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      case "bbbb":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // in the morning, in the afternoon, in the evening, at night
  B: function(date, token, localize2) {
    const hours = date.getHours();
    let dayPeriodEnumValue;
    if (hours >= 17) {
      dayPeriodEnumValue = dayPeriodEnum.evening;
    } else if (hours >= 12) {
      dayPeriodEnumValue = dayPeriodEnum.afternoon;
    } else if (hours >= 4) {
      dayPeriodEnumValue = dayPeriodEnum.morning;
    } else {
      dayPeriodEnumValue = dayPeriodEnum.night;
    }
    switch (token) {
      case "B":
      case "BB":
      case "BBB":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "BBBBB":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      case "BBBB":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Hour [1-12]
  h: function(date, token, localize2) {
    if (token === "ho") {
      let hours = date.getHours() % 12;
      if (hours === 0) hours = 12;
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return lightFormatters.h(date, token);
  },
  // Hour [0-23]
  H: function(date, token, localize2) {
    if (token === "Ho") {
      return localize2.ordinalNumber(date.getHours(), { unit: "hour" });
    }
    return lightFormatters.H(date, token);
  },
  // Hour [0-11]
  K: function(date, token, localize2) {
    const hours = date.getHours() % 12;
    if (token === "Ko") {
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return addLeadingZeros(hours, token.length);
  },
  // Hour [1-24]
  k: function(date, token, localize2) {
    let hours = date.getHours();
    if (hours === 0) hours = 24;
    if (token === "ko") {
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return addLeadingZeros(hours, token.length);
  },
  // Minute
  m: function(date, token, localize2) {
    if (token === "mo") {
      return localize2.ordinalNumber(date.getMinutes(), { unit: "minute" });
    }
    return lightFormatters.m(date, token);
  },
  // Second
  s: function(date, token, localize2) {
    if (token === "so") {
      return localize2.ordinalNumber(date.getSeconds(), { unit: "second" });
    }
    return lightFormatters.s(date, token);
  },
  // Fraction of second
  S: function(date, token) {
    return lightFormatters.S(date, token);
  },
  // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
  X: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    if (timezoneOffset === 0) {
      return "Z";
    }
    switch (token) {
      // Hours and optional minutes
      case "X":
        return formatTimezoneWithOptionalMinutes(timezoneOffset);
      // Hours, minutes and optional seconds without `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `XX`
      case "XXXX":
      case "XX":
        return formatTimezone(timezoneOffset);
      // Hours, minutes and optional seconds with `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `XXX`
      case "XXXXX":
      case "XXX":
      // Hours and minutes with `:` delimiter
      default:
        return formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
  x: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      // Hours and optional minutes
      case "x":
        return formatTimezoneWithOptionalMinutes(timezoneOffset);
      // Hours, minutes and optional seconds without `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `xx`
      case "xxxx":
      case "xx":
        return formatTimezone(timezoneOffset);
      // Hours, minutes and optional seconds with `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `xxx`
      case "xxxxx":
      case "xxx":
      // Hours and minutes with `:` delimiter
      default:
        return formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (GMT)
  O: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      // Short
      case "O":
      case "OO":
      case "OOO":
        return "GMT" + formatTimezoneShort(timezoneOffset, ":");
      // Long
      case "OOOO":
      default:
        return "GMT" + formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (specific non-location)
  z: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      // Short
      case "z":
      case "zz":
      case "zzz":
        return "GMT" + formatTimezoneShort(timezoneOffset, ":");
      // Long
      case "zzzz":
      default:
        return "GMT" + formatTimezone(timezoneOffset, ":");
    }
  },
  // Seconds timestamp
  t: function(date, token, _localize) {
    const timestamp = Math.trunc(date.getTime() / 1e3);
    return addLeadingZeros(timestamp, token.length);
  },
  // Milliseconds timestamp
  T: function(date, token, _localize) {
    const timestamp = date.getTime();
    return addLeadingZeros(timestamp, token.length);
  }
};
function formatTimezoneShort(offset, delimiter = "") {
  const sign = offset > 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  const hours = Math.trunc(absOffset / 60);
  const minutes = absOffset % 60;
  if (minutes === 0) {
    return sign + String(hours);
  }
  return sign + String(hours) + delimiter + addLeadingZeros(minutes, 2);
}
function formatTimezoneWithOptionalMinutes(offset, delimiter) {
  if (offset % 60 === 0) {
    const sign = offset > 0 ? "-" : "+";
    return sign + addLeadingZeros(Math.abs(offset) / 60, 2);
  }
  return formatTimezone(offset, delimiter);
}
function formatTimezone(offset, delimiter = "") {
  const sign = offset > 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  const hours = addLeadingZeros(Math.trunc(absOffset / 60), 2);
  const minutes = addLeadingZeros(absOffset % 60, 2);
  return sign + hours + delimiter + minutes;
}

// ../node_modules/date-fns/_lib/format/longFormatters.mjs
var dateLongFormatter = (pattern, formatLong2) => {
  switch (pattern) {
    case "P":
      return formatLong2.date({ width: "short" });
    case "PP":
      return formatLong2.date({ width: "medium" });
    case "PPP":
      return formatLong2.date({ width: "long" });
    case "PPPP":
    default:
      return formatLong2.date({ width: "full" });
  }
};
var timeLongFormatter = (pattern, formatLong2) => {
  switch (pattern) {
    case "p":
      return formatLong2.time({ width: "short" });
    case "pp":
      return formatLong2.time({ width: "medium" });
    case "ppp":
      return formatLong2.time({ width: "long" });
    case "pppp":
    default:
      return formatLong2.time({ width: "full" });
  }
};
var dateTimeLongFormatter = (pattern, formatLong2) => {
  const matchResult = pattern.match(/(P+)(p+)?/) || [];
  const datePattern = matchResult[1];
  const timePattern = matchResult[2];
  if (!timePattern) {
    return dateLongFormatter(pattern, formatLong2);
  }
  let dateTimeFormat;
  switch (datePattern) {
    case "P":
      dateTimeFormat = formatLong2.dateTime({ width: "short" });
      break;
    case "PP":
      dateTimeFormat = formatLong2.dateTime({ width: "medium" });
      break;
    case "PPP":
      dateTimeFormat = formatLong2.dateTime({ width: "long" });
      break;
    case "PPPP":
    default:
      dateTimeFormat = formatLong2.dateTime({ width: "full" });
      break;
  }
  return dateTimeFormat.replace("{{date}}", dateLongFormatter(datePattern, formatLong2)).replace("{{time}}", timeLongFormatter(timePattern, formatLong2));
};
var longFormatters = {
  p: timeLongFormatter,
  P: dateTimeLongFormatter
};

// ../node_modules/date-fns/_lib/protectedTokens.mjs
var dayOfYearTokenRE = /^D+$/;
var weekYearTokenRE = /^Y+$/;
var throwTokens = ["D", "DD", "YY", "YYYY"];
function isProtectedDayOfYearToken(token) {
  return dayOfYearTokenRE.test(token);
}
function isProtectedWeekYearToken(token) {
  return weekYearTokenRE.test(token);
}
function warnOrThrowProtectedError(token, format3, input) {
  const _message = message(token, format3, input);
  console.warn(_message);
  if (throwTokens.includes(token)) throw new RangeError(_message);
}
function message(token, format3, input) {
  const subject = token[0] === "Y" ? "years" : "days of the month";
  return `Use \`${token.toLowerCase()}\` instead of \`${token}\` (in \`${format3}\`) for formatting ${subject} to the input \`${input}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
}

// ../node_modules/date-fns/format.mjs
var formattingTokensRegExp = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;
var longFormattingTokensRegExp = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;
var escapedStringRegExp = /^'([^]*?)'?$/;
var doubleQuoteRegExp = /''/g;
var unescapedLatinCharacterRegExp = /[a-zA-Z]/;
function format(date, formatStr, options) {
  const defaultOptions2 = getDefaultOptions();
  const locale = options?.locale ?? defaultOptions2.locale ?? enUS2;
  const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
  const weekStartsOn = options?.weekStartsOn ?? options?.locale?.options?.weekStartsOn ?? defaultOptions2.weekStartsOn ?? defaultOptions2.locale?.options?.weekStartsOn ?? 0;
  const originalDate = toDate(date);
  if (!isValid(originalDate)) {
    throw new RangeError("Invalid time value");
  }
  let parts = formatStr.match(longFormattingTokensRegExp).map((substring) => {
    const firstCharacter = substring[0];
    if (firstCharacter === "p" || firstCharacter === "P") {
      const longFormatter = longFormatters[firstCharacter];
      return longFormatter(substring, locale.formatLong);
    }
    return substring;
  }).join("").match(formattingTokensRegExp).map((substring) => {
    if (substring === "''") {
      return { isToken: false, value: "'" };
    }
    const firstCharacter = substring[0];
    if (firstCharacter === "'") {
      return { isToken: false, value: cleanEscapedString(substring) };
    }
    if (formatters[firstCharacter]) {
      return { isToken: true, value: substring };
    }
    if (firstCharacter.match(unescapedLatinCharacterRegExp)) {
      throw new RangeError(
        "Format string contains an unescaped latin alphabet character `" + firstCharacter + "`"
      );
    }
    return { isToken: false, value: substring };
  });
  if (locale.localize.preprocessor) {
    parts = locale.localize.preprocessor(originalDate, parts);
  }
  const formatterOptions = {
    firstWeekContainsDate,
    weekStartsOn,
    locale
  };
  return parts.map((part) => {
    if (!part.isToken) return part.value;
    const token = part.value;
    if (!options?.useAdditionalWeekYearTokens && isProtectedWeekYearToken(token) || !options?.useAdditionalDayOfYearTokens && isProtectedDayOfYearToken(token)) {
      warnOrThrowProtectedError(token, formatStr, String(date));
    }
    const formatter = formatters[token[0]];
    return formatter(originalDate, token, locale.localize, formatterOptions);
  }).join("");
}
function cleanEscapedString(input) {
  const matched = input.match(escapedStringRegExp);
  if (!matched) {
    return input;
  }
  return matched[1].replace(doubleQuoteRegExp, "'");
}

// ../node_modules/date-fns/getDate.mjs
function getDate(date) {
  const _date = toDate(date);
  const dayOfMonth = _date.getDate();
  return dayOfMonth;
}

// ../node_modules/date-fns/getDay.mjs
function getDay(date) {
  const _date = toDate(date);
  const day = _date.getDay();
  return day;
}

// ../node_modules/date-fns/getDaysInMonth.mjs
function getDaysInMonth(date) {
  const _date = toDate(date);
  const year = _date.getFullYear();
  const monthIndex = _date.getMonth();
  const lastDayOfMonth = constructFrom(date, 0);
  lastDayOfMonth.setFullYear(year, monthIndex + 1, 0);
  lastDayOfMonth.setHours(0, 0, 0, 0);
  return lastDayOfMonth.getDate();
}

// ../node_modules/date-fns/getDefaultOptions.mjs
function getDefaultOptions2() {
  return Object.assign({}, getDefaultOptions());
}

// ../node_modules/date-fns/getHours.mjs
function getHours(date) {
  const _date = toDate(date);
  const hours = _date.getHours();
  return hours;
}

// ../node_modules/date-fns/getISODay.mjs
function getISODay(date) {
  const _date = toDate(date);
  let day = _date.getDay();
  if (day === 0) {
    day = 7;
  }
  return day;
}

// ../node_modules/date-fns/getMilliseconds.mjs
function getMilliseconds(date) {
  const _date = toDate(date);
  const milliseconds = _date.getMilliseconds();
  return milliseconds;
}

// ../node_modules/date-fns/getMinutes.mjs
function getMinutes(date) {
  const _date = toDate(date);
  const minutes = _date.getMinutes();
  return minutes;
}

// ../node_modules/date-fns/getMonth.mjs
function getMonth(date) {
  const _date = toDate(date);
  const month = _date.getMonth();
  return month;
}

// ../node_modules/date-fns/getSeconds.mjs
function getSeconds(date) {
  const _date = toDate(date);
  const seconds = _date.getSeconds();
  return seconds;
}

// ../node_modules/date-fns/getTime.mjs
function getTime(date) {
  const _date = toDate(date);
  const timestamp = _date.getTime();
  return timestamp;
}

// ../node_modules/date-fns/getYear.mjs
function getYear(date) {
  return toDate(date).getFullYear();
}

// ../node_modules/date-fns/transpose.mjs
function transpose(fromDate, constructor) {
  const date = constructor instanceof Date ? constructFrom(constructor, 0) : new constructor(0);
  date.setFullYear(
    fromDate.getFullYear(),
    fromDate.getMonth(),
    fromDate.getDate()
  );
  date.setHours(
    fromDate.getHours(),
    fromDate.getMinutes(),
    fromDate.getSeconds(),
    fromDate.getMilliseconds()
  );
  return date;
}

// ../node_modules/date-fns/parse/_lib/Setter.mjs
var TIMEZONE_UNIT_PRIORITY = 10;
var Setter = class {
  subPriority = 0;
  validate(_utcDate, _options) {
    return true;
  }
};
var ValueSetter = class extends Setter {
  constructor(value, validateValue, setValue, priority, subPriority) {
    super();
    this.value = value;
    this.validateValue = validateValue;
    this.setValue = setValue;
    this.priority = priority;
    if (subPriority) {
      this.subPriority = subPriority;
    }
  }
  validate(date, options) {
    return this.validateValue(date, this.value, options);
  }
  set(date, flags, options) {
    return this.setValue(date, flags, this.value, options);
  }
};
var DateToSystemTimezoneSetter = class extends Setter {
  priority = TIMEZONE_UNIT_PRIORITY;
  subPriority = -1;
  set(date, flags) {
    if (flags.timestampIsSet) return date;
    return constructFrom(date, transpose(date, Date));
  }
};

// ../node_modules/date-fns/parse/_lib/Parser.mjs
var Parser = class {
  run(dateString, token, match2, options) {
    const result = this.parse(dateString, token, match2, options);
    if (!result) {
      return null;
    }
    return {
      setter: new ValueSetter(
        result.value,
        this.validate,
        this.set,
        this.priority,
        this.subPriority
      ),
      rest: result.rest
    };
  }
  validate(_utcDate, _value, _options) {
    return true;
  }
};

// ../node_modules/date-fns/parse/_lib/parsers/EraParser.mjs
var EraParser = class extends Parser {
  priority = 140;
  parse(dateString, token, match2) {
    switch (token) {
      // AD, BC
      case "G":
      case "GG":
      case "GGG":
        return match2.era(dateString, { width: "abbreviated" }) || match2.era(dateString, { width: "narrow" });
      // A, B
      case "GGGGG":
        return match2.era(dateString, { width: "narrow" });
      // Anno Domini, Before Christ
      case "GGGG":
      default:
        return match2.era(dateString, { width: "wide" }) || match2.era(dateString, { width: "abbreviated" }) || match2.era(dateString, { width: "narrow" });
    }
  }
  set(date, flags, value) {
    flags.era = value;
    date.setFullYear(value, 0, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["R", "u", "t", "T"];
};

// ../node_modules/date-fns/parse/_lib/constants.mjs
var numericPatterns = {
  month: /^(1[0-2]|0?\d)/,
  // 0 to 12
  date: /^(3[0-1]|[0-2]?\d)/,
  // 0 to 31
  dayOfYear: /^(36[0-6]|3[0-5]\d|[0-2]?\d?\d)/,
  // 0 to 366
  week: /^(5[0-3]|[0-4]?\d)/,
  // 0 to 53
  hour23h: /^(2[0-3]|[0-1]?\d)/,
  // 0 to 23
  hour24h: /^(2[0-4]|[0-1]?\d)/,
  // 0 to 24
  hour11h: /^(1[0-1]|0?\d)/,
  // 0 to 11
  hour12h: /^(1[0-2]|0?\d)/,
  // 0 to 12
  minute: /^[0-5]?\d/,
  // 0 to 59
  second: /^[0-5]?\d/,
  // 0 to 59
  singleDigit: /^\d/,
  // 0 to 9
  twoDigits: /^\d{1,2}/,
  // 0 to 99
  threeDigits: /^\d{1,3}/,
  // 0 to 999
  fourDigits: /^\d{1,4}/,
  // 0 to 9999
  anyDigitsSigned: /^-?\d+/,
  singleDigitSigned: /^-?\d/,
  // 0 to 9, -0 to -9
  twoDigitsSigned: /^-?\d{1,2}/,
  // 0 to 99, -0 to -99
  threeDigitsSigned: /^-?\d{1,3}/,
  // 0 to 999, -0 to -999
  fourDigitsSigned: /^-?\d{1,4}/
  // 0 to 9999, -0 to -9999
};
var timezonePatterns = {
  basicOptionalMinutes: /^([+-])(\d{2})(\d{2})?|Z/,
  basic: /^([+-])(\d{2})(\d{2})|Z/,
  basicOptionalSeconds: /^([+-])(\d{2})(\d{2})((\d{2}))?|Z/,
  extended: /^([+-])(\d{2}):(\d{2})|Z/,
  extendedOptionalSeconds: /^([+-])(\d{2}):(\d{2})(:(\d{2}))?|Z/
};

// ../node_modules/date-fns/parse/_lib/utils.mjs
function mapValue(parseFnResult, mapFn) {
  if (!parseFnResult) {
    return parseFnResult;
  }
  return {
    value: mapFn(parseFnResult.value),
    rest: parseFnResult.rest
  };
}
function parseNumericPattern(pattern, dateString) {
  const matchResult = dateString.match(pattern);
  if (!matchResult) {
    return null;
  }
  return {
    value: parseInt(matchResult[0], 10),
    rest: dateString.slice(matchResult[0].length)
  };
}
function parseTimezonePattern(pattern, dateString) {
  const matchResult = dateString.match(pattern);
  if (!matchResult) {
    return null;
  }
  if (matchResult[0] === "Z") {
    return {
      value: 0,
      rest: dateString.slice(1)
    };
  }
  const sign = matchResult[1] === "+" ? 1 : -1;
  const hours = matchResult[2] ? parseInt(matchResult[2], 10) : 0;
  const minutes = matchResult[3] ? parseInt(matchResult[3], 10) : 0;
  const seconds = matchResult[5] ? parseInt(matchResult[5], 10) : 0;
  return {
    value: sign * (hours * millisecondsInHour + minutes * millisecondsInMinute + seconds * millisecondsInSecond),
    rest: dateString.slice(matchResult[0].length)
  };
}
function parseAnyDigitsSigned(dateString) {
  return parseNumericPattern(numericPatterns.anyDigitsSigned, dateString);
}
function parseNDigits(n, dateString) {
  switch (n) {
    case 1:
      return parseNumericPattern(numericPatterns.singleDigit, dateString);
    case 2:
      return parseNumericPattern(numericPatterns.twoDigits, dateString);
    case 3:
      return parseNumericPattern(numericPatterns.threeDigits, dateString);
    case 4:
      return parseNumericPattern(numericPatterns.fourDigits, dateString);
    default:
      return parseNumericPattern(new RegExp("^\\d{1," + n + "}"), dateString);
  }
}
function parseNDigitsSigned(n, dateString) {
  switch (n) {
    case 1:
      return parseNumericPattern(numericPatterns.singleDigitSigned, dateString);
    case 2:
      return parseNumericPattern(numericPatterns.twoDigitsSigned, dateString);
    case 3:
      return parseNumericPattern(numericPatterns.threeDigitsSigned, dateString);
    case 4:
      return parseNumericPattern(numericPatterns.fourDigitsSigned, dateString);
    default:
      return parseNumericPattern(new RegExp("^-?\\d{1," + n + "}"), dateString);
  }
}
function dayPeriodEnumToHours(dayPeriod) {
  switch (dayPeriod) {
    case "morning":
      return 4;
    case "evening":
      return 17;
    case "pm":
    case "noon":
    case "afternoon":
      return 12;
    case "am":
    case "midnight":
    case "night":
    default:
      return 0;
  }
}
function normalizeTwoDigitYear(twoDigitYear, currentYear) {
  const isCommonEra = currentYear > 0;
  const absCurrentYear = isCommonEra ? currentYear : 1 - currentYear;
  let result;
  if (absCurrentYear <= 50) {
    result = twoDigitYear || 100;
  } else {
    const rangeEnd = absCurrentYear + 50;
    const rangeEndCentury = Math.trunc(rangeEnd / 100) * 100;
    const isPreviousCentury = twoDigitYear >= rangeEnd % 100;
    result = twoDigitYear + rangeEndCentury - (isPreviousCentury ? 100 : 0);
  }
  return isCommonEra ? result : 1 - result;
}
function isLeapYearIndex(year) {
  return year % 400 === 0 || year % 4 === 0 && year % 100 !== 0;
}

// ../node_modules/date-fns/parse/_lib/parsers/YearParser.mjs
var YearParser = class extends Parser {
  priority = 130;
  incompatibleTokens = ["Y", "R", "u", "w", "I", "i", "e", "c", "t", "T"];
  parse(dateString, token, match2) {
    const valueCallback = (year) => ({
      year,
      isTwoDigitYear: token === "yy"
    });
    switch (token) {
      case "y":
        return mapValue(parseNDigits(4, dateString), valueCallback);
      case "yo":
        return mapValue(
          match2.ordinalNumber(dateString, {
            unit: "year"
          }),
          valueCallback
        );
      default:
        return mapValue(parseNDigits(token.length, dateString), valueCallback);
    }
  }
  validate(_date, value) {
    return value.isTwoDigitYear || value.year > 0;
  }
  set(date, flags, value) {
    const currentYear = date.getFullYear();
    if (value.isTwoDigitYear) {
      const normalizedTwoDigitYear = normalizeTwoDigitYear(
        value.year,
        currentYear
      );
      date.setFullYear(normalizedTwoDigitYear, 0, 1);
      date.setHours(0, 0, 0, 0);
      return date;
    }
    const year = !("era" in flags) || flags.era === 1 ? value.year : 1 - value.year;
    date.setFullYear(year, 0, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
};

// ../node_modules/date-fns/parse/_lib/parsers/LocalWeekYearParser.mjs
var LocalWeekYearParser = class extends Parser {
  priority = 130;
  parse(dateString, token, match2) {
    const valueCallback = (year) => ({
      year,
      isTwoDigitYear: token === "YY"
    });
    switch (token) {
      case "Y":
        return mapValue(parseNDigits(4, dateString), valueCallback);
      case "Yo":
        return mapValue(
          match2.ordinalNumber(dateString, {
            unit: "year"
          }),
          valueCallback
        );
      default:
        return mapValue(parseNDigits(token.length, dateString), valueCallback);
    }
  }
  validate(_date, value) {
    return value.isTwoDigitYear || value.year > 0;
  }
  set(date, flags, value, options) {
    const currentYear = getWeekYear(date, options);
    if (value.isTwoDigitYear) {
      const normalizedTwoDigitYear = normalizeTwoDigitYear(
        value.year,
        currentYear
      );
      date.setFullYear(
        normalizedTwoDigitYear,
        0,
        options.firstWeekContainsDate
      );
      date.setHours(0, 0, 0, 0);
      return startOfWeek(date, options);
    }
    const year = !("era" in flags) || flags.era === 1 ? value.year : 1 - value.year;
    date.setFullYear(year, 0, options.firstWeekContainsDate);
    date.setHours(0, 0, 0, 0);
    return startOfWeek(date, options);
  }
  incompatibleTokens = [
    "y",
    "R",
    "u",
    "Q",
    "q",
    "M",
    "L",
    "I",
    "d",
    "D",
    "i",
    "t",
    "T"
  ];
};

// ../node_modules/date-fns/parse/_lib/parsers/ISOWeekYearParser.mjs
var ISOWeekYearParser = class extends Parser {
  priority = 130;
  parse(dateString, token) {
    if (token === "R") {
      return parseNDigitsSigned(4, dateString);
    }
    return parseNDigitsSigned(token.length, dateString);
  }
  set(date, _flags, value) {
    const firstWeekOfYear = constructFrom(date, 0);
    firstWeekOfYear.setFullYear(value, 0, 4);
    firstWeekOfYear.setHours(0, 0, 0, 0);
    return startOfISOWeek(firstWeekOfYear);
  }
  incompatibleTokens = [
    "G",
    "y",
    "Y",
    "u",
    "Q",
    "q",
    "M",
    "L",
    "w",
    "d",
    "D",
    "e",
    "c",
    "t",
    "T"
  ];
};

// ../node_modules/date-fns/parse/_lib/parsers/ExtendedYearParser.mjs
var ExtendedYearParser = class extends Parser {
  priority = 130;
  parse(dateString, token) {
    if (token === "u") {
      return parseNDigitsSigned(4, dateString);
    }
    return parseNDigitsSigned(token.length, dateString);
  }
  set(date, _flags, value) {
    date.setFullYear(value, 0, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["G", "y", "Y", "R", "w", "I", "i", "e", "c", "t", "T"];
};

// ../node_modules/date-fns/parse/_lib/parsers/QuarterParser.mjs
var QuarterParser = class extends Parser {
  priority = 120;
  parse(dateString, token, match2) {
    switch (token) {
      // 1, 2, 3, 4
      case "Q":
      case "QQ":
        return parseNDigits(token.length, dateString);
      // 1st, 2nd, 3rd, 4th
      case "Qo":
        return match2.ordinalNumber(dateString, { unit: "quarter" });
      // Q1, Q2, Q3, Q4
      case "QQQ":
        return match2.quarter(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.quarter(dateString, {
          width: "narrow",
          context: "formatting"
        });
      // 1, 2, 3, 4 (narrow quarter; could be not numerical)
      case "QQQQQ":
        return match2.quarter(dateString, {
          width: "narrow",
          context: "formatting"
        });
      // 1st quarter, 2nd quarter, ...
      case "QQQQ":
      default:
        return match2.quarter(dateString, {
          width: "wide",
          context: "formatting"
        }) || match2.quarter(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.quarter(dateString, {
          width: "narrow",
          context: "formatting"
        });
    }
  }
  validate(_date, value) {
    return value >= 1 && value <= 4;
  }
  set(date, _flags, value) {
    date.setMonth((value - 1) * 3, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "Y",
    "R",
    "q",
    "M",
    "L",
    "w",
    "I",
    "d",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T"
  ];
};

// ../node_modules/date-fns/parse/_lib/parsers/StandAloneQuarterParser.mjs
var StandAloneQuarterParser = class extends Parser {
  priority = 120;
  parse(dateString, token, match2) {
    switch (token) {
      // 1, 2, 3, 4
      case "q":
      case "qq":
        return parseNDigits(token.length, dateString);
      // 1st, 2nd, 3rd, 4th
      case "qo":
        return match2.ordinalNumber(dateString, { unit: "quarter" });
      // Q1, Q2, Q3, Q4
      case "qqq":
        return match2.quarter(dateString, {
          width: "abbreviated",
          context: "standalone"
        }) || match2.quarter(dateString, {
          width: "narrow",
          context: "standalone"
        });
      // 1, 2, 3, 4 (narrow quarter; could be not numerical)
      case "qqqqq":
        return match2.quarter(dateString, {
          width: "narrow",
          context: "standalone"
        });
      // 1st quarter, 2nd quarter, ...
      case "qqqq":
      default:
        return match2.quarter(dateString, {
          width: "wide",
          context: "standalone"
        }) || match2.quarter(dateString, {
          width: "abbreviated",
          context: "standalone"
        }) || match2.quarter(dateString, {
          width: "narrow",
          context: "standalone"
        });
    }
  }
  validate(_date, value) {
    return value >= 1 && value <= 4;
  }
  set(date, _flags, value) {
    date.setMonth((value - 1) * 3, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "Y",
    "R",
    "Q",
    "M",
    "L",
    "w",
    "I",
    "d",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T"
  ];
};

// ../node_modules/date-fns/parse/_lib/parsers/MonthParser.mjs
var MonthParser = class extends Parser {
  incompatibleTokens = [
    "Y",
    "R",
    "q",
    "Q",
    "L",
    "w",
    "I",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T"
  ];
  priority = 110;
  parse(dateString, token, match2) {
    const valueCallback = (value) => value - 1;
    switch (token) {
      // 1, 2, ..., 12
      case "M":
        return mapValue(
          parseNumericPattern(numericPatterns.month, dateString),
          valueCallback
        );
      // 01, 02, ..., 12
      case "MM":
        return mapValue(parseNDigits(2, dateString), valueCallback);
      // 1st, 2nd, ..., 12th
      case "Mo":
        return mapValue(
          match2.ordinalNumber(dateString, {
            unit: "month"
          }),
          valueCallback
        );
      // Jan, Feb, ..., Dec
      case "MMM":
        return match2.month(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.month(dateString, { width: "narrow", context: "formatting" });
      // J, F, ..., D
      case "MMMMM":
        return match2.month(dateString, {
          width: "narrow",
          context: "formatting"
        });
      // January, February, ..., December
      case "MMMM":
      default:
        return match2.month(dateString, { width: "wide", context: "formatting" }) || match2.month(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.month(dateString, { width: "narrow", context: "formatting" });
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 11;
  }
  set(date, _flags, value) {
    date.setMonth(value, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
};

// ../node_modules/date-fns/parse/_lib/parsers/StandAloneMonthParser.mjs
var StandAloneMonthParser = class extends Parser {
  priority = 110;
  parse(dateString, token, match2) {
    const valueCallback = (value) => value - 1;
    switch (token) {
      // 1, 2, ..., 12
      case "L":
        return mapValue(
          parseNumericPattern(numericPatterns.month, dateString),
          valueCallback
        );
      // 01, 02, ..., 12
      case "LL":
        return mapValue(parseNDigits(2, dateString), valueCallback);
      // 1st, 2nd, ..., 12th
      case "Lo":
        return mapValue(
          match2.ordinalNumber(dateString, {
            unit: "month"
          }),
          valueCallback
        );
      // Jan, Feb, ..., Dec
      case "LLL":
        return match2.month(dateString, {
          width: "abbreviated",
          context: "standalone"
        }) || match2.month(dateString, { width: "narrow", context: "standalone" });
      // J, F, ..., D
      case "LLLLL":
        return match2.month(dateString, {
          width: "narrow",
          context: "standalone"
        });
      // January, February, ..., December
      case "LLLL":
      default:
        return match2.month(dateString, { width: "wide", context: "standalone" }) || match2.month(dateString, {
          width: "abbreviated",
          context: "standalone"
        }) || match2.month(dateString, { width: "narrow", context: "standalone" });
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 11;
  }
  set(date, _flags, value) {
    date.setMonth(value, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "Y",
    "R",
    "q",
    "Q",
    "M",
    "w",
    "I",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T"
  ];
};

// ../node_modules/date-fns/setWeek.mjs
function setWeek(date, week, options) {
  const _date = toDate(date);
  const diff = getWeek(_date, options) - week;
  _date.setDate(_date.getDate() - diff * 7);
  return _date;
}

// ../node_modules/date-fns/parse/_lib/parsers/LocalWeekParser.mjs
var LocalWeekParser = class extends Parser {
  priority = 100;
  parse(dateString, token, match2) {
    switch (token) {
      case "w":
        return parseNumericPattern(numericPatterns.week, dateString);
      case "wo":
        return match2.ordinalNumber(dateString, { unit: "week" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 1 && value <= 53;
  }
  set(date, _flags, value, options) {
    return startOfWeek(setWeek(date, value, options), options);
  }
  incompatibleTokens = [
    "y",
    "R",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "I",
    "d",
    "D",
    "i",
    "t",
    "T"
  ];
};

// ../node_modules/date-fns/setISOWeek.mjs
function setISOWeek(date, week) {
  const _date = toDate(date);
  const diff = getISOWeek(_date) - week;
  _date.setDate(_date.getDate() - diff * 7);
  return _date;
}

// ../node_modules/date-fns/parse/_lib/parsers/ISOWeekParser.mjs
var ISOWeekParser = class extends Parser {
  priority = 100;
  parse(dateString, token, match2) {
    switch (token) {
      case "I":
        return parseNumericPattern(numericPatterns.week, dateString);
      case "Io":
        return match2.ordinalNumber(dateString, { unit: "week" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 1 && value <= 53;
  }
  set(date, _flags, value) {
    return startOfISOWeek(setISOWeek(date, value));
  }
  incompatibleTokens = [
    "y",
    "Y",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "w",
    "d",
    "D",
    "e",
    "c",
    "t",
    "T"
  ];
};

// ../node_modules/date-fns/parse/_lib/parsers/DateParser.mjs
var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var DAYS_IN_MONTH_LEAP_YEAR = [
  31,
  29,
  31,
  30,
  31,
  30,
  31,
  31,
  30,
  31,
  30,
  31
];
var DateParser = class extends Parser {
  priority = 90;
  subPriority = 1;
  parse(dateString, token, match2) {
    switch (token) {
      case "d":
        return parseNumericPattern(numericPatterns.date, dateString);
      case "do":
        return match2.ordinalNumber(dateString, { unit: "date" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(date, value) {
    const year = date.getFullYear();
    const isLeapYear = isLeapYearIndex(year);
    const month = date.getMonth();
    if (isLeapYear) {
      return value >= 1 && value <= DAYS_IN_MONTH_LEAP_YEAR[month];
    } else {
      return value >= 1 && value <= DAYS_IN_MONTH[month];
    }
  }
  set(date, _flags, value) {
    date.setDate(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "Y",
    "R",
    "q",
    "Q",
    "w",
    "I",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T"
  ];
};

// ../node_modules/date-fns/parse/_lib/parsers/DayOfYearParser.mjs
var DayOfYearParser = class extends Parser {
  priority = 90;
  subpriority = 1;
  parse(dateString, token, match2) {
    switch (token) {
      case "D":
      case "DD":
        return parseNumericPattern(numericPatterns.dayOfYear, dateString);
      case "Do":
        return match2.ordinalNumber(dateString, { unit: "date" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(date, value) {
    const year = date.getFullYear();
    const isLeapYear = isLeapYearIndex(year);
    if (isLeapYear) {
      return value >= 1 && value <= 366;
    } else {
      return value >= 1 && value <= 365;
    }
  }
  set(date, _flags, value) {
    date.setMonth(0, value);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "Y",
    "R",
    "q",
    "Q",
    "M",
    "L",
    "w",
    "I",
    "d",
    "E",
    "i",
    "e",
    "c",
    "t",
    "T"
  ];
};

// ../node_modules/date-fns/setDay.mjs
function setDay(date, day, options) {
  const defaultOptions2 = getDefaultOptions();
  const weekStartsOn = options?.weekStartsOn ?? options?.locale?.options?.weekStartsOn ?? defaultOptions2.weekStartsOn ?? defaultOptions2.locale?.options?.weekStartsOn ?? 0;
  const _date = toDate(date);
  const currentDay = _date.getDay();
  const remainder = day % 7;
  const dayIndex = (remainder + 7) % 7;
  const delta = 7 - weekStartsOn;
  const diff = day < 0 || day > 6 ? day - (currentDay + delta) % 7 : (dayIndex + delta) % 7 - (currentDay + delta) % 7;
  return addDays(_date, diff);
}

// ../node_modules/date-fns/parse/_lib/parsers/DayParser.mjs
var DayParser = class extends Parser {
  priority = 90;
  parse(dateString, token, match2) {
    switch (token) {
      // Tue
      case "E":
      case "EE":
      case "EEE":
        return match2.day(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.day(dateString, { width: "short", context: "formatting" }) || match2.day(dateString, { width: "narrow", context: "formatting" });
      // T
      case "EEEEE":
        return match2.day(dateString, {
          width: "narrow",
          context: "formatting"
        });
      // Tu
      case "EEEEEE":
        return match2.day(dateString, { width: "short", context: "formatting" }) || match2.day(dateString, { width: "narrow", context: "formatting" });
      // Tuesday
      case "EEEE":
      default:
        return match2.day(dateString, { width: "wide", context: "formatting" }) || match2.day(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.day(dateString, { width: "short", context: "formatting" }) || match2.day(dateString, { width: "narrow", context: "formatting" });
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 6;
  }
  set(date, _flags, value, options) {
    date = setDay(date, value, options);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["D", "i", "e", "c", "t", "T"];
};

// ../node_modules/date-fns/parse/_lib/parsers/LocalDayParser.mjs
var LocalDayParser = class extends Parser {
  priority = 90;
  parse(dateString, token, match2, options) {
    const valueCallback = (value) => {
      const wholeWeekDays = Math.floor((value - 1) / 7) * 7;
      return (value + options.weekStartsOn + 6) % 7 + wholeWeekDays;
    };
    switch (token) {
      // 3
      case "e":
      case "ee":
        return mapValue(parseNDigits(token.length, dateString), valueCallback);
      // 3rd
      case "eo":
        return mapValue(
          match2.ordinalNumber(dateString, {
            unit: "day"
          }),
          valueCallback
        );
      // Tue
      case "eee":
        return match2.day(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.day(dateString, { width: "short", context: "formatting" }) || match2.day(dateString, { width: "narrow", context: "formatting" });
      // T
      case "eeeee":
        return match2.day(dateString, {
          width: "narrow",
          context: "formatting"
        });
      // Tu
      case "eeeeee":
        return match2.day(dateString, { width: "short", context: "formatting" }) || match2.day(dateString, { width: "narrow", context: "formatting" });
      // Tuesday
      case "eeee":
      default:
        return match2.day(dateString, { width: "wide", context: "formatting" }) || match2.day(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.day(dateString, { width: "short", context: "formatting" }) || match2.day(dateString, { width: "narrow", context: "formatting" });
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 6;
  }
  set(date, _flags, value, options) {
    date = setDay(date, value, options);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "y",
    "R",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "I",
    "d",
    "D",
    "E",
    "i",
    "c",
    "t",
    "T"
  ];
};

// ../node_modules/date-fns/parse/_lib/parsers/StandAloneLocalDayParser.mjs
var StandAloneLocalDayParser = class extends Parser {
  priority = 90;
  parse(dateString, token, match2, options) {
    const valueCallback = (value) => {
      const wholeWeekDays = Math.floor((value - 1) / 7) * 7;
      return (value + options.weekStartsOn + 6) % 7 + wholeWeekDays;
    };
    switch (token) {
      // 3
      case "c":
      case "cc":
        return mapValue(parseNDigits(token.length, dateString), valueCallback);
      // 3rd
      case "co":
        return mapValue(
          match2.ordinalNumber(dateString, {
            unit: "day"
          }),
          valueCallback
        );
      // Tue
      case "ccc":
        return match2.day(dateString, {
          width: "abbreviated",
          context: "standalone"
        }) || match2.day(dateString, { width: "short", context: "standalone" }) || match2.day(dateString, { width: "narrow", context: "standalone" });
      // T
      case "ccccc":
        return match2.day(dateString, {
          width: "narrow",
          context: "standalone"
        });
      // Tu
      case "cccccc":
        return match2.day(dateString, { width: "short", context: "standalone" }) || match2.day(dateString, { width: "narrow", context: "standalone" });
      // Tuesday
      case "cccc":
      default:
        return match2.day(dateString, { width: "wide", context: "standalone" }) || match2.day(dateString, {
          width: "abbreviated",
          context: "standalone"
        }) || match2.day(dateString, { width: "short", context: "standalone" }) || match2.day(dateString, { width: "narrow", context: "standalone" });
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 6;
  }
  set(date, _flags, value, options) {
    date = setDay(date, value, options);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "y",
    "R",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "I",
    "d",
    "D",
    "E",
    "i",
    "e",
    "t",
    "T"
  ];
};

// ../node_modules/date-fns/setISODay.mjs
function setISODay(date, day) {
  const _date = toDate(date);
  const currentDay = getISODay(_date);
  const diff = day - currentDay;
  return addDays(_date, diff);
}

// ../node_modules/date-fns/parse/_lib/parsers/ISODayParser.mjs
var ISODayParser = class extends Parser {
  priority = 90;
  parse(dateString, token, match2) {
    const valueCallback = (value) => {
      if (value === 0) {
        return 7;
      }
      return value;
    };
    switch (token) {
      // 2
      case "i":
      case "ii":
        return parseNDigits(token.length, dateString);
      // 2nd
      case "io":
        return match2.ordinalNumber(dateString, { unit: "day" });
      // Tue
      case "iii":
        return mapValue(
          match2.day(dateString, {
            width: "abbreviated",
            context: "formatting"
          }) || match2.day(dateString, {
            width: "short",
            context: "formatting"
          }) || match2.day(dateString, {
            width: "narrow",
            context: "formatting"
          }),
          valueCallback
        );
      // T
      case "iiiii":
        return mapValue(
          match2.day(dateString, {
            width: "narrow",
            context: "formatting"
          }),
          valueCallback
        );
      // Tu
      case "iiiiii":
        return mapValue(
          match2.day(dateString, {
            width: "short",
            context: "formatting"
          }) || match2.day(dateString, {
            width: "narrow",
            context: "formatting"
          }),
          valueCallback
        );
      // Tuesday
      case "iiii":
      default:
        return mapValue(
          match2.day(dateString, {
            width: "wide",
            context: "formatting"
          }) || match2.day(dateString, {
            width: "abbreviated",
            context: "formatting"
          }) || match2.day(dateString, {
            width: "short",
            context: "formatting"
          }) || match2.day(dateString, {
            width: "narrow",
            context: "formatting"
          }),
          valueCallback
        );
    }
  }
  validate(_date, value) {
    return value >= 1 && value <= 7;
  }
  set(date, _flags, value) {
    date = setISODay(date, value);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "y",
    "Y",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "w",
    "d",
    "D",
    "E",
    "e",
    "c",
    "t",
    "T"
  ];
};

// ../node_modules/date-fns/parse/_lib/parsers/AMPMParser.mjs
var AMPMParser = class extends Parser {
  priority = 80;
  parse(dateString, token, match2) {
    switch (token) {
      case "a":
      case "aa":
      case "aaa":
        return match2.dayPeriod(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
      case "aaaaa":
        return match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
      case "aaaa":
      default:
        return match2.dayPeriod(dateString, {
          width: "wide",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
    }
  }
  set(date, _flags, value) {
    date.setHours(dayPeriodEnumToHours(value), 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["b", "B", "H", "k", "t", "T"];
};

// ../node_modules/date-fns/parse/_lib/parsers/AMPMMidnightParser.mjs
var AMPMMidnightParser = class extends Parser {
  priority = 80;
  parse(dateString, token, match2) {
    switch (token) {
      case "b":
      case "bb":
      case "bbb":
        return match2.dayPeriod(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
      case "bbbbb":
        return match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
      case "bbbb":
      default:
        return match2.dayPeriod(dateString, {
          width: "wide",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
    }
  }
  set(date, _flags, value) {
    date.setHours(dayPeriodEnumToHours(value), 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["a", "B", "H", "k", "t", "T"];
};

// ../node_modules/date-fns/parse/_lib/parsers/DayPeriodParser.mjs
var DayPeriodParser = class extends Parser {
  priority = 80;
  parse(dateString, token, match2) {
    switch (token) {
      case "B":
      case "BB":
      case "BBB":
        return match2.dayPeriod(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
      case "BBBBB":
        return match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
      case "BBBB":
      default:
        return match2.dayPeriod(dateString, {
          width: "wide",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
    }
  }
  set(date, _flags, value) {
    date.setHours(dayPeriodEnumToHours(value), 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["a", "b", "t", "T"];
};

// ../node_modules/date-fns/parse/_lib/parsers/Hour1to12Parser.mjs
var Hour1to12Parser = class extends Parser {
  priority = 70;
  parse(dateString, token, match2) {
    switch (token) {
      case "h":
        return parseNumericPattern(numericPatterns.hour12h, dateString);
      case "ho":
        return match2.ordinalNumber(dateString, { unit: "hour" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 1 && value <= 12;
  }
  set(date, _flags, value) {
    const isPM = date.getHours() >= 12;
    if (isPM && value < 12) {
      date.setHours(value + 12, 0, 0, 0);
    } else if (!isPM && value === 12) {
      date.setHours(0, 0, 0, 0);
    } else {
      date.setHours(value, 0, 0, 0);
    }
    return date;
  }
  incompatibleTokens = ["H", "K", "k", "t", "T"];
};

// ../node_modules/date-fns/parse/_lib/parsers/Hour0to23Parser.mjs
var Hour0to23Parser = class extends Parser {
  priority = 70;
  parse(dateString, token, match2) {
    switch (token) {
      case "H":
        return parseNumericPattern(numericPatterns.hour23h, dateString);
      case "Ho":
        return match2.ordinalNumber(dateString, { unit: "hour" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 23;
  }
  set(date, _flags, value) {
    date.setHours(value, 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["a", "b", "h", "K", "k", "t", "T"];
};

// ../node_modules/date-fns/parse/_lib/parsers/Hour0To11Parser.mjs
var Hour0To11Parser = class extends Parser {
  priority = 70;
  parse(dateString, token, match2) {
    switch (token) {
      case "K":
        return parseNumericPattern(numericPatterns.hour11h, dateString);
      case "Ko":
        return match2.ordinalNumber(dateString, { unit: "hour" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 11;
  }
  set(date, _flags, value) {
    const isPM = date.getHours() >= 12;
    if (isPM && value < 12) {
      date.setHours(value + 12, 0, 0, 0);
    } else {
      date.setHours(value, 0, 0, 0);
    }
    return date;
  }
  incompatibleTokens = ["h", "H", "k", "t", "T"];
};

// ../node_modules/date-fns/parse/_lib/parsers/Hour1To24Parser.mjs
var Hour1To24Parser = class extends Parser {
  priority = 70;
  parse(dateString, token, match2) {
    switch (token) {
      case "k":
        return parseNumericPattern(numericPatterns.hour24h, dateString);
      case "ko":
        return match2.ordinalNumber(dateString, { unit: "hour" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 1 && value <= 24;
  }
  set(date, _flags, value) {
    const hours = value <= 24 ? value % 24 : value;
    date.setHours(hours, 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["a", "b", "h", "H", "K", "t", "T"];
};

// ../node_modules/date-fns/parse/_lib/parsers/MinuteParser.mjs
var MinuteParser = class extends Parser {
  priority = 60;
  parse(dateString, token, match2) {
    switch (token) {
      case "m":
        return parseNumericPattern(numericPatterns.minute, dateString);
      case "mo":
        return match2.ordinalNumber(dateString, { unit: "minute" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 59;
  }
  set(date, _flags, value) {
    date.setMinutes(value, 0, 0);
    return date;
  }
  incompatibleTokens = ["t", "T"];
};

// ../node_modules/date-fns/parse/_lib/parsers/SecondParser.mjs
var SecondParser = class extends Parser {
  priority = 50;
  parse(dateString, token, match2) {
    switch (token) {
      case "s":
        return parseNumericPattern(numericPatterns.second, dateString);
      case "so":
        return match2.ordinalNumber(dateString, { unit: "second" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 59;
  }
  set(date, _flags, value) {
    date.setSeconds(value, 0);
    return date;
  }
  incompatibleTokens = ["t", "T"];
};

// ../node_modules/date-fns/parse/_lib/parsers/FractionOfSecondParser.mjs
var FractionOfSecondParser = class extends Parser {
  priority = 30;
  parse(dateString, token) {
    const valueCallback = (value) => Math.trunc(value * Math.pow(10, -token.length + 3));
    return mapValue(parseNDigits(token.length, dateString), valueCallback);
  }
  set(date, _flags, value) {
    date.setMilliseconds(value);
    return date;
  }
  incompatibleTokens = ["t", "T"];
};

// ../node_modules/date-fns/parse/_lib/parsers/ISOTimezoneWithZParser.mjs
var ISOTimezoneWithZParser = class extends Parser {
  priority = 10;
  parse(dateString, token) {
    switch (token) {
      case "X":
        return parseTimezonePattern(
          timezonePatterns.basicOptionalMinutes,
          dateString
        );
      case "XX":
        return parseTimezonePattern(timezonePatterns.basic, dateString);
      case "XXXX":
        return parseTimezonePattern(
          timezonePatterns.basicOptionalSeconds,
          dateString
        );
      case "XXXXX":
        return parseTimezonePattern(
          timezonePatterns.extendedOptionalSeconds,
          dateString
        );
      case "XXX":
      default:
        return parseTimezonePattern(timezonePatterns.extended, dateString);
    }
  }
  set(date, flags, value) {
    if (flags.timestampIsSet) return date;
    return constructFrom(
      date,
      date.getTime() - getTimezoneOffsetInMilliseconds(date) - value
    );
  }
  incompatibleTokens = ["t", "T", "x"];
};

// ../node_modules/date-fns/parse/_lib/parsers/ISOTimezoneParser.mjs
var ISOTimezoneParser = class extends Parser {
  priority = 10;
  parse(dateString, token) {
    switch (token) {
      case "x":
        return parseTimezonePattern(
          timezonePatterns.basicOptionalMinutes,
          dateString
        );
      case "xx":
        return parseTimezonePattern(timezonePatterns.basic, dateString);
      case "xxxx":
        return parseTimezonePattern(
          timezonePatterns.basicOptionalSeconds,
          dateString
        );
      case "xxxxx":
        return parseTimezonePattern(
          timezonePatterns.extendedOptionalSeconds,
          dateString
        );
      case "xxx":
      default:
        return parseTimezonePattern(timezonePatterns.extended, dateString);
    }
  }
  set(date, flags, value) {
    if (flags.timestampIsSet) return date;
    return constructFrom(
      date,
      date.getTime() - getTimezoneOffsetInMilliseconds(date) - value
    );
  }
  incompatibleTokens = ["t", "T", "X"];
};

// ../node_modules/date-fns/parse/_lib/parsers/TimestampSecondsParser.mjs
var TimestampSecondsParser = class extends Parser {
  priority = 40;
  parse(dateString) {
    return parseAnyDigitsSigned(dateString);
  }
  set(date, _flags, value) {
    return [constructFrom(date, value * 1e3), { timestampIsSet: true }];
  }
  incompatibleTokens = "*";
};

// ../node_modules/date-fns/parse/_lib/parsers/TimestampMillisecondsParser.mjs
var TimestampMillisecondsParser = class extends Parser {
  priority = 20;
  parse(dateString) {
    return parseAnyDigitsSigned(dateString);
  }
  set(date, _flags, value) {
    return [constructFrom(date, value), { timestampIsSet: true }];
  }
  incompatibleTokens = "*";
};

// ../node_modules/date-fns/parse/_lib/parsers.mjs
var parsers = {
  G: new EraParser(),
  y: new YearParser(),
  Y: new LocalWeekYearParser(),
  R: new ISOWeekYearParser(),
  u: new ExtendedYearParser(),
  Q: new QuarterParser(),
  q: new StandAloneQuarterParser(),
  M: new MonthParser(),
  L: new StandAloneMonthParser(),
  w: new LocalWeekParser(),
  I: new ISOWeekParser(),
  d: new DateParser(),
  D: new DayOfYearParser(),
  E: new DayParser(),
  e: new LocalDayParser(),
  c: new StandAloneLocalDayParser(),
  i: new ISODayParser(),
  a: new AMPMParser(),
  b: new AMPMMidnightParser(),
  B: new DayPeriodParser(),
  h: new Hour1to12Parser(),
  H: new Hour0to23Parser(),
  K: new Hour0To11Parser(),
  k: new Hour1To24Parser(),
  m: new MinuteParser(),
  s: new SecondParser(),
  S: new FractionOfSecondParser(),
  X: new ISOTimezoneWithZParser(),
  x: new ISOTimezoneParser(),
  t: new TimestampSecondsParser(),
  T: new TimestampMillisecondsParser()
};

// ../node_modules/date-fns/parse.mjs
var formattingTokensRegExp2 = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;
var longFormattingTokensRegExp2 = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;
var escapedStringRegExp2 = /^'([^]*?)'?$/;
var doubleQuoteRegExp2 = /''/g;
var notWhitespaceRegExp = /\S/;
var unescapedLatinCharacterRegExp2 = /[a-zA-Z]/;
function parse(dateStr, formatStr, referenceDate, options) {
  const defaultOptions2 = getDefaultOptions2();
  const locale = options?.locale ?? defaultOptions2.locale ?? enUS2;
  const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
  const weekStartsOn = options?.weekStartsOn ?? options?.locale?.options?.weekStartsOn ?? defaultOptions2.weekStartsOn ?? defaultOptions2.locale?.options?.weekStartsOn ?? 0;
  if (formatStr === "") {
    if (dateStr === "") {
      return toDate(referenceDate);
    } else {
      return constructFrom(referenceDate, NaN);
    }
  }
  const subFnOptions = {
    firstWeekContainsDate,
    weekStartsOn,
    locale
  };
  const setters = [new DateToSystemTimezoneSetter()];
  const tokens = formatStr.match(longFormattingTokensRegExp2).map((substring) => {
    const firstCharacter = substring[0];
    if (firstCharacter in longFormatters) {
      const longFormatter = longFormatters[firstCharacter];
      return longFormatter(substring, locale.formatLong);
    }
    return substring;
  }).join("").match(formattingTokensRegExp2);
  const usedTokens = [];
  for (let token of tokens) {
    if (!options?.useAdditionalWeekYearTokens && isProtectedWeekYearToken(token)) {
      warnOrThrowProtectedError(token, formatStr, dateStr);
    }
    if (!options?.useAdditionalDayOfYearTokens && isProtectedDayOfYearToken(token)) {
      warnOrThrowProtectedError(token, formatStr, dateStr);
    }
    const firstCharacter = token[0];
    const parser = parsers[firstCharacter];
    if (parser) {
      const { incompatibleTokens } = parser;
      if (Array.isArray(incompatibleTokens)) {
        const incompatibleToken = usedTokens.find(
          (usedToken) => incompatibleTokens.includes(usedToken.token) || usedToken.token === firstCharacter
        );
        if (incompatibleToken) {
          throw new RangeError(
            `The format string mustn't contain \`${incompatibleToken.fullToken}\` and \`${token}\` at the same time`
          );
        }
      } else if (parser.incompatibleTokens === "*" && usedTokens.length > 0) {
        throw new RangeError(
          `The format string mustn't contain \`${token}\` and any other token at the same time`
        );
      }
      usedTokens.push({ token: firstCharacter, fullToken: token });
      const parseResult = parser.run(
        dateStr,
        token,
        locale.match,
        subFnOptions
      );
      if (!parseResult) {
        return constructFrom(referenceDate, NaN);
      }
      setters.push(parseResult.setter);
      dateStr = parseResult.rest;
    } else {
      if (firstCharacter.match(unescapedLatinCharacterRegExp2)) {
        throw new RangeError(
          "Format string contains an unescaped latin alphabet character `" + firstCharacter + "`"
        );
      }
      if (token === "''") {
        token = "'";
      } else if (firstCharacter === "'") {
        token = cleanEscapedString2(token);
      }
      if (dateStr.indexOf(token) === 0) {
        dateStr = dateStr.slice(token.length);
      } else {
        return constructFrom(referenceDate, NaN);
      }
    }
  }
  if (dateStr.length > 0 && notWhitespaceRegExp.test(dateStr)) {
    return constructFrom(referenceDate, NaN);
  }
  const uniquePrioritySetters = setters.map((setter) => setter.priority).sort((a, b) => b - a).filter((priority, index, array) => array.indexOf(priority) === index).map(
    (priority) => setters.filter((setter) => setter.priority === priority).sort((a, b) => b.subPriority - a.subPriority)
  ).map((setterArray) => setterArray[0]);
  let date = toDate(referenceDate);
  if (isNaN(date.getTime())) {
    return constructFrom(referenceDate, NaN);
  }
  const flags = {};
  for (const setter of uniquePrioritySetters) {
    if (!setter.validate(date, subFnOptions)) {
      return constructFrom(referenceDate, NaN);
    }
    const result = setter.set(date, flags, subFnOptions);
    if (Array.isArray(result)) {
      date = result[0];
      Object.assign(flags, result[1]);
    } else {
      date = result;
    }
  }
  return constructFrom(referenceDate, date);
}
function cleanEscapedString2(input) {
  return input.match(escapedStringRegExp2)[1].replace(doubleQuoteRegExp2, "'");
}

// ../node_modules/date-fns/startOfHour.mjs
function startOfHour(date) {
  const _date = toDate(date);
  _date.setMinutes(0, 0, 0);
  return _date;
}

// ../node_modules/date-fns/isSameMonth.mjs
function isSameMonth(dateLeft, dateRight) {
  const _dateLeft = toDate(dateLeft);
  const _dateRight = toDate(dateRight);
  return _dateLeft.getFullYear() === _dateRight.getFullYear() && _dateLeft.getMonth() === _dateRight.getMonth();
}

// ../node_modules/date-fns/isSameQuarter.mjs
function isSameQuarter(dateLeft, dateRight) {
  const dateLeftStartOfQuarter = startOfQuarter(dateLeft);
  const dateRightStartOfQuarter = startOfQuarter(dateRight);
  return +dateLeftStartOfQuarter === +dateRightStartOfQuarter;
}

// ../node_modules/date-fns/startOfSecond.mjs
function startOfSecond(date) {
  const _date = toDate(date);
  _date.setMilliseconds(0);
  return _date;
}

// ../node_modules/date-fns/isSameYear.mjs
function isSameYear(dateLeft, dateRight) {
  const _dateLeft = toDate(dateLeft);
  const _dateRight = toDate(dateRight);
  return _dateLeft.getFullYear() === _dateRight.getFullYear();
}

// ../node_modules/date-fns/setMonth.mjs
function setMonth(date, month) {
  const _date = toDate(date);
  const year = _date.getFullYear();
  const day = _date.getDate();
  const dateWithDesiredMonth = constructFrom(date, 0);
  dateWithDesiredMonth.setFullYear(year, month, 15);
  dateWithDesiredMonth.setHours(0, 0, 0, 0);
  const daysInMonth = getDaysInMonth(dateWithDesiredMonth);
  _date.setMonth(month, Math.min(day, daysInMonth));
  return _date;
}

// ../node_modules/date-fns/set.mjs
function set(date, values) {
  let _date = toDate(date);
  if (isNaN(+_date)) {
    return constructFrom(date, NaN);
  }
  if (values.year != null) {
    _date.setFullYear(values.year);
  }
  if (values.month != null) {
    _date = setMonth(_date, values.month);
  }
  if (values.date != null) {
    _date.setDate(values.date);
  }
  if (values.hours != null) {
    _date.setHours(values.hours);
  }
  if (values.minutes != null) {
    _date.setMinutes(values.minutes);
  }
  if (values.seconds != null) {
    _date.setSeconds(values.seconds);
  }
  if (values.milliseconds != null) {
    _date.setMilliseconds(values.milliseconds);
  }
  return _date;
}

// ../node_modules/date-fns/setHours.mjs
function setHours(date, hours) {
  const _date = toDate(date);
  _date.setHours(hours);
  return _date;
}

// ../node_modules/date-fns/setMinutes.mjs
function setMinutes(date, minutes) {
  const _date = toDate(date);
  _date.setMinutes(minutes);
  return _date;
}

// ../node_modules/date-fns/setQuarter.mjs
function setQuarter(date, quarter) {
  const _date = toDate(date);
  const oldQuarter = Math.trunc(_date.getMonth() / 3) + 1;
  const diff = quarter - oldQuarter;
  return setMonth(_date, _date.getMonth() + diff * 3);
}

// ../node_modules/date-fns/setSeconds.mjs
function setSeconds(date, seconds) {
  const _date = toDate(date);
  _date.setSeconds(seconds);
  return _date;
}

// ../node_modules/date-fns/setYear.mjs
function setYear(date, year) {
  const _date = toDate(date);
  if (isNaN(+_date)) {
    return constructFrom(date, NaN);
  }
  _date.setFullYear(year);
  return _date;
}

// ../node_modules/naive-ui/es/date-picker/src/utils.mjs
var matcherMap = {
  date: isSameDay,
  month: isSameMonth,
  year: isSameYear,
  quarter: isSameQuarter
};
function makeWeekMatcher(firstDayOfWeek) {
  return (sourceTime, patternTime) => {
    const weekStartsOn = (firstDayOfWeek + 1) % 7;
    return isSameWeek(sourceTime, patternTime, {
      weekStartsOn
    });
  };
}
function matchDate(sourceTime, patternTime, type, firstDayOfWeek = 0) {
  const matcher = type === "week" ? makeWeekMatcher(firstDayOfWeek) : matcherMap[type];
  return matcher(sourceTime, patternTime);
}
function dateOrWeekItem(time3, monthTs, valueTs, currentTs, mode, firstDayOfWeek) {
  if (mode === "date") {
    return dateItem(time3, monthTs, valueTs, currentTs);
  } else {
    return weekItem(time3, monthTs, valueTs, currentTs, firstDayOfWeek);
  }
}
function dateItem(time3, monthTs, valueTs, currentTs) {
  let inSpan = false;
  let startOfSpan = false;
  let endOfSpan = false;
  if (Array.isArray(valueTs)) {
    if (valueTs[0] < time3 && time3 < valueTs[1]) {
      inSpan = true;
    }
    if (matchDate(valueTs[0], time3, "date")) startOfSpan = true;
    if (matchDate(valueTs[1], time3, "date")) endOfSpan = true;
  }
  const selected = valueTs !== null && (Array.isArray(valueTs) ? matchDate(valueTs[0], time3, "date") || matchDate(valueTs[1], time3, "date") : matchDate(valueTs, time3, "date"));
  return {
    type: "date",
    dateObject: {
      date: getDate(time3),
      month: getMonth(time3),
      year: getYear(time3)
    },
    inCurrentMonth: isSameMonth(time3, monthTs),
    isCurrentDate: matchDate(currentTs, time3, "date"),
    inSpan,
    inSelectedWeek: false,
    startOfSpan,
    endOfSpan,
    selected,
    ts: getTime(time3)
  };
}
function getMonthString(month, monthFormat, locale) {
  const date = new Date(2e3, month, 1).getTime();
  return format(date, monthFormat, {
    locale
  });
}
function getYearString(year, yearFormat, locale) {
  const date = new Date(year, 1, 1).getTime();
  return format(date, yearFormat, {
    locale
  });
}
function getQuarterString(quarter, quarterFormat, locale) {
  const date = new Date(2e3, quarter * 3 - 2, 1).getTime();
  return format(date, quarterFormat, {
    locale
  });
}
function weekItem(time3, monthTs, valueTs, currentTs, firstDayOfWeek) {
  let inSpan = false;
  let startOfSpan = false;
  let endOfSpan = false;
  if (Array.isArray(valueTs)) {
    if (valueTs[0] < time3 && time3 < valueTs[1]) {
      inSpan = true;
    }
    if (matchDate(valueTs[0], time3, "week", firstDayOfWeek)) startOfSpan = true;
    if (matchDate(valueTs[1], time3, "week", firstDayOfWeek)) endOfSpan = true;
  }
  const inSelectedWeek = valueTs !== null && (Array.isArray(valueTs) ? matchDate(valueTs[0], time3, "week", firstDayOfWeek) || matchDate(valueTs[1], time3, "week", firstDayOfWeek) : matchDate(valueTs, time3, "week", firstDayOfWeek));
  return {
    type: "date",
    dateObject: {
      date: getDate(time3),
      month: getMonth(time3),
      year: getYear(time3)
    },
    inCurrentMonth: isSameMonth(time3, monthTs),
    isCurrentDate: matchDate(currentTs, time3, "date"),
    inSpan,
    startOfSpan,
    endOfSpan,
    selected: false,
    inSelectedWeek,
    ts: getTime(time3)
  };
}
function monthItem(monthTs, valueTs, currentTs, {
  monthFormat
}) {
  return {
    type: "month",
    monthFormat,
    dateObject: {
      month: getMonth(monthTs),
      year: getYear(monthTs)
    },
    isCurrent: isSameMonth(currentTs, monthTs),
    selected: valueTs !== null && matchDate(valueTs, monthTs, "month"),
    ts: getTime(monthTs)
  };
}
function yearItem(yearTs, valueTs, currentTs, {
  yearFormat
}) {
  return {
    type: "year",
    yearFormat,
    dateObject: {
      year: getYear(yearTs)
    },
    isCurrent: isSameYear(currentTs, yearTs),
    selected: valueTs !== null && matchDate(valueTs, yearTs, "year"),
    ts: getTime(yearTs)
  };
}
function quarterItem(quarterTs, valueTs, currentTs, {
  quarterFormat
}) {
  return {
    type: "quarter",
    quarterFormat,
    dateObject: {
      quarter: getQuarter(quarterTs),
      year: getYear(quarterTs)
    },
    isCurrent: isSameQuarter(currentTs, quarterTs),
    selected: valueTs !== null && matchDate(valueTs, quarterTs, "quarter"),
    ts: getTime(quarterTs)
  };
}
function dateArray(monthTs, valueTs, currentTs, startDay, strip = false, weekMode = false) {
  const granularity = weekMode ? "week" : "date";
  const displayMonth = getMonth(monthTs);
  let displayMonthIterator = getTime(startOfMonth(monthTs));
  let lastMonthIterator = getTime(addDays(displayMonthIterator, -1));
  const calendarDays = [];
  let protectLastMonthDateIsShownFlag = !strip;
  while (getDay(lastMonthIterator) !== startDay || protectLastMonthDateIsShownFlag) {
    calendarDays.unshift(dateOrWeekItem(lastMonthIterator, monthTs, valueTs, currentTs, granularity, startDay));
    lastMonthIterator = getTime(addDays(lastMonthIterator, -1));
    protectLastMonthDateIsShownFlag = false;
  }
  while (getMonth(displayMonthIterator) === displayMonth) {
    calendarDays.push(dateOrWeekItem(displayMonthIterator, monthTs, valueTs, currentTs, granularity, startDay));
    displayMonthIterator = getTime(addDays(displayMonthIterator, 1));
  }
  const endIndex = strip ? calendarDays.length <= 28 ? 28 : calendarDays.length <= 35 ? 35 : 42 : 42;
  while (calendarDays.length < endIndex) {
    calendarDays.push(dateOrWeekItem(displayMonthIterator, monthTs, valueTs, currentTs, granularity, startDay));
    displayMonthIterator = getTime(addDays(displayMonthIterator, 1));
  }
  return calendarDays;
}
function monthArray(yearAnchorTs, valueTs, currentTs, format3) {
  const calendarMonths = [];
  const yearStart = startOfYear(yearAnchorTs);
  for (let i = 0; i < 12; i++) {
    calendarMonths.push(monthItem(getTime(addMonths(yearStart, i)), valueTs, currentTs, format3));
  }
  return calendarMonths;
}
function quarterArray(yearAnchorTs, valueTs, currentTs, format3) {
  const calendarQuarters = [];
  const yearStart = startOfYear(yearAnchorTs);
  for (let i = 0; i < 4; i++) {
    calendarQuarters.push(quarterItem(getTime(addQuarters(yearStart, i)), valueTs, currentTs, format3));
  }
  return calendarQuarters;
}
function yearArray(valueTs, currentTs, format3, rangeRef) {
  const range = rangeRef.value;
  const calendarYears = [];
  const startTime = startOfYear(setYear(/* @__PURE__ */ new Date(), range[0]));
  for (let i = 0; i < range[1] - range[0]; i++) {
    calendarYears.push(yearItem(getTime(addYears(startTime, i)), valueTs, currentTs, format3));
  }
  return calendarYears;
}
function strictParse(string, pattern, backup, option) {
  const result = parse(string, pattern, backup, option);
  if (!isValid(result)) return result;
  else if (format(result, pattern, option) === string) return result;
  else return new Date(Number.NaN);
}
function getDefaultTime(timeValue) {
  if (timeValue === void 0) {
    return void 0;
  }
  if (typeof timeValue === "number") {
    return timeValue;
  }
  const [hour, minute, second] = timeValue.split(":");
  return {
    hours: Number(hour),
    minutes: Number(minute),
    seconds: Number(second)
  };
}
function pluckValueFromRange(value, type) {
  return Array.isArray(value) ? value[type === "start" ? 0 : 1] : null;
}

// ../node_modules/naive-ui/es/config-provider/src/ConfigProvider.mjs
import { computed as computed15, defineComponent as defineComponent29, h as h28, inject as inject17, markRaw, provide as provide5 } from "vue";
var configProviderProps = {
  abstract: Boolean,
  bordered: {
    type: Boolean,
    default: void 0
  },
  clsPrefix: String,
  locale: Object,
  dateLocale: Object,
  namespace: String,
  rtl: Array,
  tag: {
    type: String,
    default: "div"
  },
  hljs: Object,
  katex: Object,
  theme: Object,
  themeOverrides: Object,
  componentOptions: Object,
  icons: Object,
  breakpoints: Object,
  preflightStyleDisabled: Boolean,
  styleMountTarget: Object,
  inlineThemeDisabled: {
    type: Boolean,
    default: void 0
  },
  // deprecated
  as: {
    type: String,
    validator: () => {
      warn3("config-provider", "`as` is deprecated, please use `tag` instead.");
      return true;
    },
    default: void 0
  }
};
var ConfigProvider_default = defineComponent29({
  name: "ConfigProvider",
  alias: ["App"],
  props: configProviderProps,
  setup(props) {
    const NConfigProvider = inject17(configProviderInjectionKey, null);
    const mergedThemeRef = computed15(() => {
      const {
        theme
      } = props;
      if (theme === null) return void 0;
      const inheritedTheme = NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedThemeRef.value;
      return theme === void 0 ? inheritedTheme : inheritedTheme === void 0 ? theme : Object.assign({}, inheritedTheme, theme);
    });
    const mergedThemeOverridesRef = computed15(() => {
      const {
        themeOverrides
      } = props;
      if (themeOverrides === null) return void 0;
      if (themeOverrides === void 0) {
        return NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedThemeOverridesRef.value;
      } else {
        const inheritedThemeOverrides = NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedThemeOverridesRef.value;
        if (inheritedThemeOverrides === void 0) {
          return themeOverrides;
        } else {
          return merge_default({}, inheritedThemeOverrides, themeOverrides);
        }
      }
    });
    const mergedNamespaceRef = use_memo_default(() => {
      const {
        namespace: namespace2
      } = props;
      return namespace2 === void 0 ? NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedNamespaceRef.value : namespace2;
    });
    const mergedBorderedRef = use_memo_default(() => {
      const {
        bordered
      } = props;
      return bordered === void 0 ? NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedBorderedRef.value : bordered;
    });
    const mergedIconsRef = computed15(() => {
      const {
        icons
      } = props;
      return icons === void 0 ? NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedIconsRef.value : icons;
    });
    const mergedComponentPropsRef = computed15(() => {
      const {
        componentOptions
      } = props;
      if (componentOptions !== void 0) return componentOptions;
      return NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedComponentPropsRef.value;
    });
    const mergedClsPrefixRef = computed15(() => {
      const {
        clsPrefix
      } = props;
      if (clsPrefix !== void 0) return clsPrefix;
      if (NConfigProvider) return NConfigProvider.mergedClsPrefixRef.value;
      return defaultClsPrefix;
    });
    const mergedRtlRef = computed15(() => {
      var _a;
      const {
        rtl
      } = props;
      if (rtl === void 0) {
        return NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedRtlRef.value;
      }
      const rtlEnabledState = {};
      for (const rtlInfo of rtl) {
        rtlEnabledState[rtlInfo.name] = markRaw(rtlInfo);
        (_a = rtlInfo.peers) === null || _a === void 0 ? void 0 : _a.forEach((peerRtlInfo) => {
          if (!(peerRtlInfo.name in rtlEnabledState)) {
            rtlEnabledState[peerRtlInfo.name] = markRaw(peerRtlInfo);
          }
        });
      }
      return rtlEnabledState;
    });
    const mergedBreakpointsRef = computed15(() => {
      return props.breakpoints || (NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedBreakpointsRef.value);
    });
    const inlineThemeDisabled = props.inlineThemeDisabled || (NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.inlineThemeDisabled);
    const preflightStyleDisabled = props.preflightStyleDisabled || (NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.preflightStyleDisabled);
    const styleMountTarget = props.styleMountTarget || (NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.styleMountTarget);
    const mergedThemeHashRef = computed15(() => {
      const {
        value: theme
      } = mergedThemeRef;
      const {
        value: mergedThemeOverrides
      } = mergedThemeOverridesRef;
      const hasThemeOverrides = mergedThemeOverrides && Object.keys(mergedThemeOverrides).length !== 0;
      const themeName = theme === null || theme === void 0 ? void 0 : theme.name;
      if (themeName) {
        if (hasThemeOverrides) {
          return `${themeName}-${hash_browser_esm_default(JSON.stringify(mergedThemeOverridesRef.value))}`;
        }
        return themeName;
      } else {
        if (hasThemeOverrides) {
          return hash_browser_esm_default(JSON.stringify(mergedThemeOverridesRef.value));
        }
        return "";
      }
    });
    provide5(configProviderInjectionKey, {
      mergedThemeHashRef,
      mergedBreakpointsRef,
      mergedRtlRef,
      mergedIconsRef,
      mergedComponentPropsRef,
      mergedBorderedRef,
      mergedNamespaceRef,
      mergedClsPrefixRef,
      mergedLocaleRef: computed15(() => {
        const {
          locale
        } = props;
        if (locale === null) return void 0;
        return locale === void 0 ? NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedLocaleRef.value : locale;
      }),
      mergedDateLocaleRef: computed15(() => {
        const {
          dateLocale
        } = props;
        if (dateLocale === null) return void 0;
        return dateLocale === void 0 ? NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedDateLocaleRef.value : dateLocale;
      }),
      mergedHljsRef: computed15(() => {
        const {
          hljs
        } = props;
        return hljs === void 0 ? NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedHljsRef.value : hljs;
      }),
      mergedKatexRef: computed15(() => {
        const {
          katex
        } = props;
        return katex === void 0 ? NConfigProvider === null || NConfigProvider === void 0 ? void 0 : NConfigProvider.mergedKatexRef.value : katex;
      }),
      mergedThemeRef,
      mergedThemeOverridesRef,
      inlineThemeDisabled: inlineThemeDisabled || false,
      preflightStyleDisabled: preflightStyleDisabled || false,
      styleMountTarget
    });
    return {
      mergedClsPrefix: mergedClsPrefixRef,
      mergedBordered: mergedBorderedRef,
      mergedNamespace: mergedNamespaceRef,
      mergedTheme: mergedThemeRef,
      mergedThemeOverrides: mergedThemeOverridesRef
    };
  },
  render() {
    var _a, _b, _c, _d;
    return !this.abstract ? h28(this.as || this.tag, {
      class: `${this.mergedClsPrefix || defaultClsPrefix}-config-provider`
    }, (_b = (_a = this.$slots).default) === null || _b === void 0 ? void 0 : _b.call(_a)) : (_d = (_c = this.$slots).default) === null || _d === void 0 ? void 0 : _d.call(_c);
  }
});

// ../node_modules/naive-ui/es/date-picker/src/DatePicker.mjs
import { computed as computed22, defineComponent as defineComponent40, h as h39, provide as provide7, ref as ref21, toRef as toRef10, Transition as Transition6, watch as watch11, watchEffect as watchEffect11, withDirectives as withDirectives5 } from "vue";

// ../node_modules/naive-ui/es/time-picker/styles/_common.mjs
var common_default4 = {
  itemFontSize: "12px",
  itemHeight: "36px",
  itemWidth: "52px",
  panelActionPadding: "8px 0"
};

// ../node_modules/naive-ui/es/time-picker/styles/light.mjs
function self5(vars) {
  const {
    popoverColor,
    textColor2,
    primaryColor,
    hoverColor,
    dividerColor,
    opacityDisabled,
    boxShadow2,
    borderRadius,
    iconColor,
    iconColorDisabled
  } = vars;
  return Object.assign(Object.assign({}, common_default4), {
    panelColor: popoverColor,
    panelBoxShadow: boxShadow2,
    panelDividerColor: dividerColor,
    itemTextColor: textColor2,
    itemTextColorActive: primaryColor,
    itemColorHover: hoverColor,
    itemOpacityDisabled: opacityDisabled,
    itemBorderRadius: borderRadius,
    borderRadius,
    iconColor,
    iconColorDisabled
  });
}
var timePickerLight = createTheme({
  name: "TimePicker",
  common: light_default,
  peers: {
    Scrollbar: light_default2,
    Button: light_default4,
    Input: light_default3
  },
  self: self5
});
var light_default5 = timePickerLight;

// ../node_modules/naive-ui/es/date-picker/styles/_common.mjs
var common_default5 = {
  itemSize: "24px",
  itemCellWidth: "38px",
  itemCellHeight: "32px",
  scrollItemWidth: "80px",
  scrollItemHeight: "40px",
  panelExtraFooterPadding: "8px 12px",
  panelActionPadding: "8px 12px",
  calendarTitlePadding: "0",
  calendarTitleHeight: "28px",
  arrowSize: "14px",
  panelHeaderPadding: "8px 12px",
  calendarDaysHeight: "32px",
  calendarTitleGridTempateColumns: "28px 28px 1fr 28px 28px",
  // type
  calendarLeftPaddingDate: "6px 12px 4px 12px",
  calendarLeftPaddingDatetime: "4px 12px",
  calendarLeftPaddingDaterange: "6px 12px 4px 12px",
  calendarLeftPaddingDatetimerange: "4px 12px",
  calendarLeftPaddingMonth: "0",
  // TODO: make it actually effective
  calendarLeftPaddingYear: "0",
  calendarLeftPaddingQuarter: "0",
  calendarLeftPaddingMonthrange: "0",
  calendarLeftPaddingQuarterrange: "0",
  calendarLeftPaddingYearrange: "0",
  calendarLeftPaddingWeek: "6px 12px 4px 12px",
  calendarRightPaddingDate: "6px 12px 4px 12px",
  calendarRightPaddingDatetime: "4px 12px",
  calendarRightPaddingDaterange: "6px 12px 4px 12px",
  calendarRightPaddingDatetimerange: "4px 12px",
  calendarRightPaddingMonth: "0",
  calendarRightPaddingYear: "0",
  calendarRightPaddingQuarter: "0",
  calendarRightPaddingMonthrange: "0",
  calendarRightPaddingQuarterrange: "0",
  calendarRightPaddingYearrange: "0",
  calendarRightPaddingWeek: "0"
};

// ../node_modules/naive-ui/es/date-picker/styles/light.mjs
function self6(vars) {
  const {
    hoverColor,
    fontSize: fontSize2,
    textColor2,
    textColorDisabled,
    popoverColor,
    primaryColor,
    borderRadiusSmall,
    iconColor,
    iconColorDisabled,
    textColor1,
    dividerColor,
    boxShadow2,
    borderRadius,
    fontWeightStrong
  } = vars;
  return Object.assign(Object.assign({}, common_default5), {
    itemFontSize: fontSize2,
    calendarDaysFontSize: fontSize2,
    calendarTitleFontSize: fontSize2,
    itemTextColor: textColor2,
    itemTextColorDisabled: textColorDisabled,
    itemTextColorActive: popoverColor,
    itemTextColorCurrent: primaryColor,
    itemColorIncluded: changeColor(primaryColor, {
      alpha: 0.1
    }),
    itemColorHover: hoverColor,
    itemColorDisabled: hoverColor,
    itemColorActive: primaryColor,
    itemBorderRadius: borderRadiusSmall,
    panelColor: popoverColor,
    panelTextColor: textColor2,
    arrowColor: iconColor,
    calendarTitleTextColor: textColor1,
    calendarTitleColorHover: hoverColor,
    calendarDaysTextColor: textColor2,
    panelHeaderDividerColor: dividerColor,
    calendarDaysDividerColor: dividerColor,
    calendarDividerColor: dividerColor,
    panelActionDividerColor: dividerColor,
    panelBoxShadow: boxShadow2,
    panelBorderRadius: borderRadius,
    calendarTitleFontWeight: fontWeightStrong,
    scrollItemBorderRadius: borderRadius,
    iconColor,
    iconColorDisabled
  });
}
var datePickerLight = createTheme({
  name: "DatePicker",
  common: light_default,
  peers: {
    Input: light_default3,
    Button: light_default4,
    TimePicker: light_default5,
    Scrollbar: light_default2
  },
  self: self6
});
var light_default6 = datePickerLight;

// ../node_modules/naive-ui/es/date-picker/src/interface.mjs
var datePickerInjectionKey = createInjectionKey("n-date-picker");

// ../node_modules/naive-ui/es/date-picker/src/panel/date.mjs
import { defineComponent as defineComponent32, h as h31, watchEffect as watchEffect6 } from "vue";

// ../node_modules/naive-ui/es/date-picker/src/panel/panelHeader.mjs
import { defineComponent as defineComponent31, h as h30, ref as ref17, Transition as Transition4, withDirectives as withDirectives3 } from "vue";

// ../node_modules/naive-ui/es/date-picker/src/panel/month.mjs
import { defineComponent as defineComponent30, h as h29, onMounted as onMounted9 } from "vue";

// ../node_modules/naive-ui/es/date-picker/src/config.mjs
var MONTH_ITEM_HEIGHT = 40;

// ../node_modules/naive-ui/es/date-picker/src/panel/use-calendar.mjs
import { computed as computed17, inject as inject19, ref as ref16, watch as watch8 } from "vue";

// ../node_modules/naive-ui/es/date-picker/src/panel/use-panel-common.mjs
import { computed as computed16, inject as inject18, nextTick as nextTick4, ref as ref15 } from "vue";
var TIME_FORMAT = "HH:mm:ss";
var usePanelCommonProps = {
  active: Boolean,
  dateFormat: String,
  calendarDayFormat: String,
  calendarHeaderYearFormat: String,
  calendarHeaderMonthFormat: String,
  calendarHeaderMonthYearSeparator: {
    type: String,
    required: true
  },
  calendarHeaderMonthBeforeYear: {
    type: Boolean,
    default: void 0
  },
  timePickerFormat: {
    type: String,
    value: TIME_FORMAT
  },
  value: {
    type: [Array, Number],
    default: null
  },
  shortcuts: Object,
  defaultTime: [Number, String, Array],
  inputReadonly: Boolean,
  onClear: Function,
  onConfirm: Function,
  onClose: Function,
  onTabOut: Function,
  onKeydown: Function,
  actions: Array,
  onUpdateValue: {
    type: Function,
    required: true
  },
  themeClass: String,
  onRender: Function,
  panel: Boolean,
  onNextMonth: Function,
  onPrevMonth: Function,
  onNextYear: Function,
  onPrevYear: Function
};
function usePanelCommon(props) {
  const {
    dateLocaleRef,
    timePickerSizeRef,
    timePickerPropsRef,
    localeRef,
    mergedClsPrefixRef,
    mergedThemeRef
  } = inject18(datePickerInjectionKey);
  const dateFnsOptionsRef = computed16(() => {
    return {
      locale: dateLocaleRef.value.locale
    };
  });
  const selfRef = ref15(null);
  const keyboardState = useKeyboard();
  function doClear() {
    const {
      onClear
    } = props;
    if (onClear) onClear();
  }
  function doConfirm() {
    const {
      onConfirm,
      value
    } = props;
    if (onConfirm) onConfirm(value);
  }
  function doUpdateValue(value, doUpdate) {
    const {
      onUpdateValue
    } = props;
    onUpdateValue(value, doUpdate);
  }
  function doClose(disableUpdateOnClose = false) {
    const {
      onClose
    } = props;
    if (onClose) onClose(disableUpdateOnClose);
  }
  function doTabOut() {
    const {
      onTabOut
    } = props;
    if (onTabOut) onTabOut();
  }
  function handleClearClick() {
    doUpdateValue(null, true);
    doClose(true);
    doClear();
  }
  function handleFocusDetectorFocus() {
    doTabOut();
  }
  function disableTransitionOneTick() {
    if (props.active || props.panel) {
      void nextTick4(() => {
        const {
          value: selfEl
        } = selfRef;
        if (!selfEl) return;
        const dateEls = selfEl.querySelectorAll("[data-n-date]");
        dateEls.forEach((el) => {
          el.classList.add("transition-disabled");
        });
        void selfEl.offsetWidth;
        dateEls.forEach((el) => {
          el.classList.remove("transition-disabled");
        });
      });
    }
  }
  function handlePanelKeyDown(e) {
    if (e.key === "Tab" && e.target === selfRef.value && keyboardState.shift) {
      e.preventDefault();
      doTabOut();
    }
  }
  function handlePanelFocus(e) {
    const {
      value: el
    } = selfRef;
    if (keyboardState.tab && e.target === el && (el === null || el === void 0 ? void 0 : el.contains(e.relatedTarget))) {
      doTabOut();
    }
  }
  let cachedValue = null;
  let cached = false;
  function cachePendingValue() {
    cachedValue = props.value;
    cached = true;
  }
  function clearPendingValue() {
    cached = false;
  }
  function restorePendingValue() {
    if (cached) {
      doUpdateValue(cachedValue, false);
      cached = false;
    }
  }
  function getShortcutValue(shortcut) {
    if (typeof shortcut === "function") {
      return shortcut();
    }
    return shortcut;
  }
  const showMonthYearPanel = ref15(false);
  function handleOpenQuickSelectMonthPanel() {
    showMonthYearPanel.value = !showMonthYearPanel.value;
  }
  return {
    mergedTheme: mergedThemeRef,
    mergedClsPrefix: mergedClsPrefixRef,
    dateFnsOptions: dateFnsOptionsRef,
    timePickerSize: timePickerSizeRef,
    timePickerProps: timePickerPropsRef,
    selfRef,
    locale: localeRef,
    doConfirm,
    doClose,
    doUpdateValue,
    doTabOut,
    handleClearClick,
    handleFocusDetectorFocus,
    disableTransitionOneTick,
    handlePanelKeyDown,
    handlePanelFocus,
    cachePendingValue,
    clearPendingValue,
    restorePendingValue,
    getShortcutValue,
    handleShortcutMouseleave: restorePendingValue,
    showMonthYearPanel,
    handleOpenQuickSelectMonthPanel
  };
}

// ../node_modules/naive-ui/es/date-picker/src/panel/use-calendar.mjs
var useCalendarProps = Object.assign(Object.assign({}, usePanelCommonProps), {
  defaultCalendarStartTime: Number,
  actions: {
    type: Array,
    default: () => ["now", "clear", "confirm"]
  }
});
function useCalendar(props, type) {
  var _a;
  const panelCommon = usePanelCommon(props);
  const {
    isValueInvalidRef,
    isDateDisabledRef,
    isDateInvalidRef,
    isTimeInvalidRef,
    isDateTimeInvalidRef,
    isHourDisabledRef,
    isMinuteDisabledRef,
    isSecondDisabledRef,
    localeRef,
    firstDayOfWeekRef,
    datePickerSlots,
    yearFormatRef,
    monthFormatRef,
    quarterFormatRef,
    yearRangeRef
  } = inject19(datePickerInjectionKey);
  const validation = {
    isValueInvalid: isValueInvalidRef,
    isDateDisabled: isDateDisabledRef,
    isDateInvalid: isDateInvalidRef,
    isTimeInvalid: isTimeInvalidRef,
    isDateTimeInvalid: isDateTimeInvalidRef,
    isHourDisabled: isHourDisabledRef,
    isMinuteDisabled: isMinuteDisabledRef,
    isSecondDisabled: isSecondDisabledRef
  };
  const mergedDateFormatRef = computed17(() => props.dateFormat || localeRef.value.dateFormat);
  const mergedDayFormatRef = computed17(() => props.calendarDayFormat || localeRef.value.dayFormat);
  const dateInputValueRef = ref16(props.value === null || Array.isArray(props.value) ? "" : format(props.value, mergedDateFormatRef.value));
  const calendarValueRef = ref16(props.value === null || Array.isArray(props.value) ? (_a = props.defaultCalendarStartTime) !== null && _a !== void 0 ? _a : Date.now() : props.value);
  const yearVlRef = ref16(null);
  const yearScrollbarRef = ref16(null);
  const monthScrollbarRef = ref16(null);
  const nowRef = ref16(Date.now());
  const dateArrayRef = computed17(() => {
    var _a2;
    return dateArray(calendarValueRef.value, props.value, nowRef.value, (_a2 = firstDayOfWeekRef.value) !== null && _a2 !== void 0 ? _a2 : localeRef.value.firstDayOfWeek, false, type === "week");
  });
  const monthArrayRef = computed17(() => {
    const {
      value
    } = props;
    return monthArray(calendarValueRef.value, Array.isArray(value) ? null : value, nowRef.value, {
      monthFormat: monthFormatRef.value
    });
  });
  const yearArrayRef = computed17(() => {
    const {
      value
    } = props;
    return yearArray(Array.isArray(value) ? null : value, nowRef.value, {
      yearFormat: yearFormatRef.value
    }, yearRangeRef);
  });
  const quarterArrayRef = computed17(() => {
    const {
      value
    } = props;
    return quarterArray(calendarValueRef.value, Array.isArray(value) ? null : value, nowRef.value, {
      quarterFormat: quarterFormatRef.value
    });
  });
  const weekdaysRef = computed17(() => {
    return dateArrayRef.value.slice(0, 7).map((dateItem2) => {
      const {
        ts
      } = dateItem2;
      return format(ts, mergedDayFormatRef.value, panelCommon.dateFnsOptions.value);
    });
  });
  const calendarMonthRef = computed17(() => {
    return format(calendarValueRef.value, props.calendarHeaderMonthFormat || localeRef.value.monthFormat, panelCommon.dateFnsOptions.value);
  });
  const calendarYearRef = computed17(() => {
    return format(calendarValueRef.value, props.calendarHeaderYearFormat || localeRef.value.yearFormat, panelCommon.dateFnsOptions.value);
  });
  const calendarMonthBeforeYearRef = computed17(() => {
    var _a2;
    return (_a2 = props.calendarHeaderMonthBeforeYear) !== null && _a2 !== void 0 ? _a2 : localeRef.value.monthBeforeYear;
  });
  watch8(calendarValueRef, (value, oldValue) => {
    if (type === "date" || type === "datetime") {
      if (!isSameMonth(value, oldValue)) {
        panelCommon.disableTransitionOneTick();
      }
    }
  });
  watch8(computed17(() => props.value), (value) => {
    if (value !== null && !Array.isArray(value)) {
      dateInputValueRef.value = format(value, mergedDateFormatRef.value, panelCommon.dateFnsOptions.value);
      calendarValueRef.value = value;
    } else {
      dateInputValueRef.value = "";
    }
  });
  function sanitizeValue(value) {
    var _a2;
    if (type === "datetime") return getTime(startOfSecond(value));
    if (type === "month") return getTime(startOfMonth(value));
    if (type === "year") return getTime(startOfYear(value));
    if (type === "quarter") return getTime(startOfQuarter(value));
    if (type === "week") {
      const weekStartsOn = (((_a2 = firstDayOfWeekRef.value) !== null && _a2 !== void 0 ? _a2 : localeRef.value.firstDayOfWeek) + 1) % 7;
      return getTime(startOfWeek(value, {
        weekStartsOn
      }));
    }
    return getTime(startOfDay(value));
  }
  function mergedIsDateDisabled(ts, detail) {
    const {
      isDateDisabled: {
        value: isDateDisabled
      }
    } = validation;
    if (!isDateDisabled) return false;
    return isDateDisabled(ts, detail);
  }
  function handleDateInput(value) {
    const date = strictParse(value, mergedDateFormatRef.value, /* @__PURE__ */ new Date(), panelCommon.dateFnsOptions.value);
    if (isValid(date)) {
      if (props.value === null) {
        panelCommon.doUpdateValue(getTime(sanitizeValue(Date.now())), props.panel);
      } else if (!Array.isArray(props.value)) {
        const newDateTime = set(props.value, {
          year: getYear(date),
          month: getMonth(date),
          date: getDate(date)
        });
        panelCommon.doUpdateValue(getTime(sanitizeValue(getTime(newDateTime))), props.panel);
      }
    } else {
      dateInputValueRef.value = value;
    }
  }
  function handleDateInputBlur() {
    const date = strictParse(dateInputValueRef.value, mergedDateFormatRef.value, /* @__PURE__ */ new Date(), panelCommon.dateFnsOptions.value);
    if (isValid(date)) {
      if (props.value === null) {
        panelCommon.doUpdateValue(getTime(sanitizeValue(Date.now())), false);
      } else if (!Array.isArray(props.value)) {
        const newDateTime = set(props.value, {
          year: getYear(date),
          month: getMonth(date),
          date: getDate(date)
        });
        panelCommon.doUpdateValue(getTime(sanitizeValue(getTime(newDateTime))), false);
      }
    } else {
      deriveDateInputValue();
    }
  }
  function clearSelectedDateTime() {
    panelCommon.doUpdateValue(null, true);
    dateInputValueRef.value = "";
    panelCommon.doClose(true);
    panelCommon.handleClearClick();
  }
  function handleNowClick() {
    panelCommon.doUpdateValue(getTime(sanitizeValue(Date.now())), true);
    const now = Date.now();
    calendarValueRef.value = now;
    panelCommon.doClose(true);
    if (props.panel && (type === "month" || type === "quarter" || type === "year")) {
      panelCommon.disableTransitionOneTick();
      justifyColumnsScrollState(now);
    }
  }
  const hoveredWeekRef = ref16(null);
  function handleDateMouseEnter(dateItem2) {
    if (dateItem2.type === "date" && type === "week") {
      hoveredWeekRef.value = sanitizeValue(getTime(dateItem2.ts));
    }
  }
  function isWeekHovered(dateItem2) {
    if (dateItem2.type === "date" && type === "week") {
      return sanitizeValue(getTime(dateItem2.ts)) === hoveredWeekRef.value;
    }
    return false;
  }
  function handleDateClick(dateItem2) {
    if (mergedIsDateDisabled(dateItem2.ts, dateItem2.type === "date" ? {
      type: "date",
      year: dateItem2.dateObject.year,
      month: dateItem2.dateObject.month,
      date: dateItem2.dateObject.date
    } : dateItem2.type === "month" ? {
      type: "month",
      year: dateItem2.dateObject.year,
      month: dateItem2.dateObject.month
    } : dateItem2.type === "year" ? {
      type: "year",
      year: dateItem2.dateObject.year
    } : {
      type: "quarter",
      year: dateItem2.dateObject.year,
      quarter: dateItem2.dateObject.quarter
    })) {
      return;
    }
    let newValue;
    if (props.value !== null && !Array.isArray(props.value)) {
      newValue = props.value;
    } else {
      newValue = Date.now();
    }
    if (type === "datetime" && props.defaultTime !== null && !Array.isArray(props.defaultTime)) {
      const time3 = getDefaultTime(props.defaultTime);
      if (time3) {
        newValue = getTime(set(newValue, time3));
      }
    }
    newValue = getTime(dateItem2.type === "quarter" && dateItem2.dateObject.quarter ? setQuarter(setYear(newValue, dateItem2.dateObject.year), dateItem2.dateObject.quarter) : set(newValue, dateItem2.dateObject));
    panelCommon.doUpdateValue(sanitizeValue(newValue), props.panel || type === "date" || type === "week" || type === "year");
    switch (type) {
      case "date":
      case "week":
        panelCommon.doClose();
        break;
      case "year":
        if (props.panel) {
          panelCommon.disableTransitionOneTick();
        }
        panelCommon.doClose();
        break;
      case "month":
        panelCommon.disableTransitionOneTick();
        justifyColumnsScrollState(newValue);
        break;
      case "quarter":
        panelCommon.disableTransitionOneTick();
        justifyColumnsScrollState(newValue);
        break;
    }
  }
  function handleQuickMonthClick(dateItem2, updatePanelValue) {
    let newValue;
    if (props.value !== null && !Array.isArray(props.value)) {
      newValue = props.value;
    } else {
      newValue = Date.now();
    }
    newValue = getTime(dateItem2.type === "month" ? setMonth(newValue, dateItem2.dateObject.month) : setYear(newValue, dateItem2.dateObject.year));
    updatePanelValue(newValue);
    justifyColumnsScrollState(newValue);
  }
  function onUpdateCalendarValue(value) {
    calendarValueRef.value = value;
  }
  function deriveDateInputValue(time3) {
    if (props.value === null || Array.isArray(props.value)) {
      dateInputValueRef.value = "";
      return;
    }
    if (time3 === void 0) {
      time3 = props.value;
    }
    dateInputValueRef.value = format(time3, mergedDateFormatRef.value, panelCommon.dateFnsOptions.value);
  }
  function handleConfirmClick() {
    if (validation.isDateInvalid.value || validation.isTimeInvalid.value) {
      return;
    }
    panelCommon.doConfirm();
    closeCalendar();
  }
  function closeCalendar() {
    if (props.active) {
      panelCommon.doClose();
    }
  }
  function nextYear() {
    var _a2;
    calendarValueRef.value = getTime(addYears(calendarValueRef.value, 1));
    (_a2 = props.onNextYear) === null || _a2 === void 0 ? void 0 : _a2.call(props);
  }
  function prevYear() {
    var _a2;
    calendarValueRef.value = getTime(addYears(calendarValueRef.value, -1));
    (_a2 = props.onPrevYear) === null || _a2 === void 0 ? void 0 : _a2.call(props);
  }
  function nextMonth() {
    var _a2;
    calendarValueRef.value = getTime(addMonths(calendarValueRef.value, 1));
    (_a2 = props.onNextMonth) === null || _a2 === void 0 ? void 0 : _a2.call(props);
  }
  function prevMonth() {
    var _a2;
    calendarValueRef.value = getTime(addMonths(calendarValueRef.value, -1));
    (_a2 = props.onPrevMonth) === null || _a2 === void 0 ? void 0 : _a2.call(props);
  }
  function virtualListContainer() {
    const {
      value
    } = yearVlRef;
    return (value === null || value === void 0 ? void 0 : value.listElRef) || null;
  }
  function virtualListContent() {
    const {
      value
    } = yearVlRef;
    return (value === null || value === void 0 ? void 0 : value.itemsElRef) || null;
  }
  function handleVirtualListScroll() {
    var _a2;
    (_a2 = yearScrollbarRef.value) === null || _a2 === void 0 ? void 0 : _a2.sync();
  }
  function handleTimePickerChange(value) {
    if (value === null) return;
    panelCommon.doUpdateValue(value, props.panel);
  }
  function handleSingleShortcutMouseenter(shortcut) {
    panelCommon.cachePendingValue();
    const shortcutValue = panelCommon.getShortcutValue(shortcut);
    if (typeof shortcutValue !== "number") return;
    panelCommon.doUpdateValue(shortcutValue, false);
  }
  function handleSingleShortcutClick(shortcut) {
    const shortcutValue = panelCommon.getShortcutValue(shortcut);
    if (typeof shortcutValue !== "number") return;
    panelCommon.doUpdateValue(shortcutValue, props.panel);
    panelCommon.clearPendingValue();
    handleConfirmClick();
  }
  function justifyColumnsScrollState(value) {
    const {
      value: mergedValue
    } = props;
    if (monthScrollbarRef.value) {
      const monthIndex = value === void 0 ? mergedValue === null ? getMonth(Date.now()) : getMonth(mergedValue) : getMonth(value);
      monthScrollbarRef.value.scrollTo({
        top: monthIndex * MONTH_ITEM_HEIGHT
      });
    }
    if (yearVlRef.value) {
      const yearIndex = (value === void 0 ? mergedValue === null ? getYear(Date.now()) : getYear(mergedValue) : getYear(value)) - yearRangeRef.value[0];
      yearVlRef.value.scrollTo({
        top: yearIndex * MONTH_ITEM_HEIGHT
      });
    }
  }
  const childComponentRefs = {
    monthScrollbarRef,
    yearScrollbarRef,
    yearVlRef
  };
  return Object.assign(Object.assign(Object.assign(Object.assign({
    dateArray: dateArrayRef,
    monthArray: monthArrayRef,
    yearArray: yearArrayRef,
    quarterArray: quarterArrayRef,
    calendarYear: calendarYearRef,
    calendarMonth: calendarMonthRef,
    weekdays: weekdaysRef,
    calendarMonthBeforeYear: calendarMonthBeforeYearRef,
    mergedIsDateDisabled,
    nextYear,
    prevYear,
    nextMonth,
    prevMonth,
    handleNowClick,
    handleConfirmClick,
    handleSingleShortcutMouseenter,
    handleSingleShortcutClick
  }, validation), panelCommon), childComponentRefs), {
    // datetime only
    handleDateClick,
    handleDateInputBlur,
    handleDateInput,
    handleDateMouseEnter,
    isWeekHovered,
    handleTimePickerChange,
    clearSelectedDateTime,
    virtualListContainer,
    virtualListContent,
    handleVirtualListScroll,
    timePickerSize: panelCommon.timePickerSize,
    dateInputValue: dateInputValueRef,
    datePickerSlots,
    handleQuickMonthClick,
    justifyColumnsScrollState,
    calendarValue: calendarValueRef,
    onUpdateCalendarValue
  });
}

// ../node_modules/naive-ui/es/date-picker/src/panel/month.mjs
var month_default = defineComponent30({
  name: "MonthPanel",
  props: Object.assign(Object.assign({}, useCalendarProps), {
    type: {
      type: String,
      required: true
    },
    // panelHeader prop
    useAsQuickJump: Boolean
  }),
  setup(props) {
    const useCalendarRef = useCalendar(props, props.type);
    const {
      dateLocaleRef
    } = useLocale("DatePicker");
    const getRenderContent = (item) => {
      switch (item.type) {
        case "year":
          return getYearString(item.dateObject.year, item.yearFormat, dateLocaleRef.value.locale);
        case "month":
          return getMonthString(item.dateObject.month, item.monthFormat, dateLocaleRef.value.locale);
        case "quarter":
          return getQuarterString(item.dateObject.quarter, item.quarterFormat, dateLocaleRef.value.locale);
      }
    };
    const {
      useAsQuickJump
    } = props;
    const renderItem = (item, i, mergedClsPrefix) => {
      const {
        mergedIsDateDisabled,
        handleDateClick,
        handleQuickMonthClick
      } = useCalendarRef;
      return h29("div", {
        "data-n-date": true,
        key: i,
        class: [`${mergedClsPrefix}-date-panel-month-calendar__picker-col-item`, item.isCurrent && `${mergedClsPrefix}-date-panel-month-calendar__picker-col-item--current`, item.selected && `${mergedClsPrefix}-date-panel-month-calendar__picker-col-item--selected`, !useAsQuickJump && mergedIsDateDisabled(item.ts, item.type === "year" ? {
          type: "year",
          year: item.dateObject.year
        } : item.type === "month" ? {
          type: "month",
          year: item.dateObject.year,
          month: item.dateObject.month
        } : item.type === "quarter" ? {
          type: "month",
          year: item.dateObject.year,
          month: item.dateObject.quarter
        } : null) && `${mergedClsPrefix}-date-panel-month-calendar__picker-col-item--disabled`],
        onClick: () => {
          if (useAsQuickJump) {
            handleQuickMonthClick(item, (value) => {
              ;
              props.onUpdateValue(value, false);
            });
          } else {
            handleDateClick(item);
          }
        }
      }, getRenderContent(item));
    };
    onMounted9(() => {
      useCalendarRef.justifyColumnsScrollState();
    });
    return Object.assign(Object.assign({}, useCalendarRef), {
      renderItem
    });
  },
  render() {
    const {
      mergedClsPrefix,
      mergedTheme,
      shortcuts,
      actions,
      renderItem,
      type,
      onRender
    } = this;
    onRender === null || onRender === void 0 ? void 0 : onRender();
    return h29("div", {
      ref: "selfRef",
      tabindex: 0,
      class: [`${mergedClsPrefix}-date-panel`, `${mergedClsPrefix}-date-panel--month`, !this.panel && `${mergedClsPrefix}-date-panel--shadow`, this.themeClass],
      onFocus: this.handlePanelFocus,
      onKeydown: this.handlePanelKeyDown
    }, h29("div", {
      class: `${mergedClsPrefix}-date-panel-month-calendar`
    }, h29(Scrollbar_default, {
      ref: "yearScrollbarRef",
      class: `${mergedClsPrefix}-date-panel-month-calendar__picker-col`,
      theme: mergedTheme.peers.Scrollbar,
      themeOverrides: mergedTheme.peerOverrides.Scrollbar,
      container: this.virtualListContainer,
      content: this.virtualListContent,
      horizontalRailStyle: {
        zIndex: 1
      },
      verticalRailStyle: {
        zIndex: 1
      }
    }, {
      default: () => h29(VirtualList_default, {
        ref: "yearVlRef",
        items: this.yearArray,
        itemSize: MONTH_ITEM_HEIGHT,
        showScrollbar: false,
        keyField: "ts",
        onScroll: this.handleVirtualListScroll,
        paddingBottom: 4
      }, {
        default: ({
          item,
          index
        }) => {
          return renderItem(item, index, mergedClsPrefix);
        }
      })
    }), type === "month" || type === "quarter" ? h29("div", {
      class: `${mergedClsPrefix}-date-panel-month-calendar__picker-col`
    }, h29(Scrollbar_default, {
      ref: "monthScrollbarRef",
      theme: mergedTheme.peers.Scrollbar,
      themeOverrides: mergedTheme.peerOverrides.Scrollbar
    }, {
      default: () => [(type === "month" ? this.monthArray : this.quarterArray).map((item, i) => renderItem(item, i, mergedClsPrefix)), h29("div", {
        class: `${mergedClsPrefix}-date-panel-${type}-calendar__padding`
      })]
    })) : null), resolveWrappedSlot(this.datePickerSlots.footer, (children) => {
      return children ? h29("div", {
        class: `${mergedClsPrefix}-date-panel-footer`
      }, children) : null;
    }), (actions === null || actions === void 0 ? void 0 : actions.length) || shortcuts ? h29("div", {
      class: `${mergedClsPrefix}-date-panel-actions`
    }, h29("div", {
      class: `${mergedClsPrefix}-date-panel-actions__prefix`
    }, shortcuts && Object.keys(shortcuts).map((key) => {
      const shortcut = shortcuts[key];
      return Array.isArray(shortcut) ? null : h29(XButton, {
        size: "tiny",
        onMouseenter: () => {
          this.handleSingleShortcutMouseenter(shortcut);
        },
        onClick: () => {
          this.handleSingleShortcutClick(shortcut);
        },
        onMouseleave: () => {
          this.handleShortcutMouseleave();
        }
      }, {
        default: () => key
      });
    })), h29("div", {
      class: `${mergedClsPrefix}-date-panel-actions__suffix`
    }, (actions === null || actions === void 0 ? void 0 : actions.includes("clear")) ? resolveSlotWithTypedProps(this.datePickerSlots.clear, {
      onClear: this.handleClearClick,
      text: this.locale.clear
    }, () => [h29(Button_default, {
      theme: mergedTheme.peers.Button,
      themeOverrides: mergedTheme.peerOverrides.Button,
      size: "tiny",
      onClick: this.handleClearClick
    }, {
      default: () => this.locale.clear
    })]) : null, (actions === null || actions === void 0 ? void 0 : actions.includes("now")) ? resolveSlotWithTypedProps(this.datePickerSlots.now, {
      onNow: this.handleNowClick,
      text: this.locale.now
    }, () => [h29(Button_default, {
      theme: mergedTheme.peers.Button,
      themeOverrides: mergedTheme.peerOverrides.Button,
      size: "tiny",
      onClick: this.handleNowClick
    }, {
      default: () => this.locale.now
    })]) : null, (actions === null || actions === void 0 ? void 0 : actions.includes("confirm")) ? resolveSlotWithTypedProps(this.datePickerSlots.confirm, {
      onConfirm: this.handleConfirmClick,
      disabled: this.isDateInvalid,
      text: this.locale.confirm
    }, () => [h29(Button_default, {
      theme: mergedTheme.peers.Button,
      themeOverrides: mergedTheme.peerOverrides.Button,
      size: "tiny",
      type: "primary",
      disabled: this.isDateInvalid,
      onClick: this.handleConfirmClick
    }, {
      default: () => this.locale.confirm
    })]) : null)) : null, h29(focus_detector_default, {
      onFocus: this.handleFocusDetectorFocus
    }));
  }
});

// ../node_modules/naive-ui/es/date-picker/src/panel/panelHeader.mjs
var panelHeader_default = defineComponent31({
  props: {
    mergedClsPrefix: {
      type: String,
      required: true
    },
    value: Number,
    monthBeforeYear: {
      type: Boolean,
      required: true
    },
    monthYearSeparator: {
      type: String,
      required: true
    },
    calendarMonth: {
      type: String,
      required: true
    },
    calendarYear: {
      type: String,
      required: true
    },
    onUpdateValue: {
      type: Function,
      required: true
    }
  },
  setup() {
    const triggerRef = ref17(null);
    const monthPanelRef = ref17(null);
    const showRef = ref17(false);
    function handleClickOutside(e) {
      var _a;
      if (showRef.value && !((_a = triggerRef.value) === null || _a === void 0 ? void 0 : _a.contains(getPreciseEventTarget(e)))) {
        showRef.value = false;
      }
    }
    function handleHeaderClick() {
      showRef.value = !showRef.value;
    }
    return {
      show: showRef,
      triggerRef,
      monthPanelRef,
      handleHeaderClick,
      handleClickOutside
    };
  },
  render() {
    const {
      handleClickOutside,
      mergedClsPrefix
    } = this;
    return h30("div", {
      class: `${mergedClsPrefix}-date-panel-month__month-year`,
      ref: "triggerRef"
    }, h30(Binder_default, null, {
      default: () => [h30(Target_default, null, {
        default: () => h30("div", {
          class: [`${mergedClsPrefix}-date-panel-month__text`, this.show && `${mergedClsPrefix}-date-panel-month__text--active`],
          onClick: this.handleHeaderClick
        }, this.monthBeforeYear ? [this.calendarMonth, this.monthYearSeparator, this.calendarYear] : [this.calendarYear, this.monthYearSeparator, this.calendarMonth])
      }), h30(Follower_default, {
        show: this.show,
        teleportDisabled: true
      }, {
        default: () => h30(Transition4, {
          name: "fade-in-scale-up-transition",
          appear: true
        }, {
          default: () => this.show ? withDirectives3(h30(month_default, {
            ref: "monthPanelRef",
            onUpdateValue: this.onUpdateValue,
            actions: [],
            calendarHeaderMonthYearSeparator: this.monthYearSeparator,
            // month and year click show month type
            type: "month",
            key: "month",
            useAsQuickJump: true,
            value: this.value
          }), [[clickoutside_default, handleClickOutside, void 0, {
            capture: true
          }]]) : null
        })
      })]
    }));
  }
});

// ../node_modules/naive-ui/es/date-picker/src/panel/date.mjs
var date_default = defineComponent32({
  name: "DatePanel",
  props: Object.assign(Object.assign({}, useCalendarProps), {
    type: {
      type: String,
      required: true
    }
  }),
  setup(props) {
    if (true) {
      watchEffect6(() => {
        var _a;
        if ((_a = props.actions) === null || _a === void 0 ? void 0 : _a.includes("confirm")) {
          warnOnce("date-picker", "The `confirm` action is not supported for n-date-picker of `date` type");
        }
      });
    }
    return useCalendar(props, props.type);
  },
  render() {
    var _a, _b, _c;
    const {
      mergedClsPrefix,
      mergedTheme,
      shortcuts,
      onRender,
      datePickerSlots,
      type
    } = this;
    onRender === null || onRender === void 0 ? void 0 : onRender();
    return h31("div", {
      ref: "selfRef",
      tabindex: 0,
      class: [`${mergedClsPrefix}-date-panel`, `${mergedClsPrefix}-date-panel--${type}`, !this.panel && `${mergedClsPrefix}-date-panel--shadow`, this.themeClass],
      onFocus: this.handlePanelFocus,
      onKeydown: this.handlePanelKeyDown
    }, h31("div", {
      class: `${mergedClsPrefix}-date-panel-calendar`
    }, h31("div", {
      class: `${mergedClsPrefix}-date-panel-month`
    }, h31("div", {
      class: `${mergedClsPrefix}-date-panel-month__fast-prev`,
      onClick: this.prevYear
    }, resolveSlot(datePickerSlots["prev-year"], () => [h31(FastBackward_default, null)])), h31("div", {
      class: `${mergedClsPrefix}-date-panel-month__prev`,
      onClick: this.prevMonth
    }, resolveSlot(datePickerSlots["prev-month"], () => [h31(Backward_default, null)])), h31(panelHeader_default, {
      monthYearSeparator: this.calendarHeaderMonthYearSeparator,
      monthBeforeYear: this.calendarMonthBeforeYear,
      value: this.calendarValue,
      onUpdateValue: this.onUpdateCalendarValue,
      mergedClsPrefix,
      calendarMonth: this.calendarMonth,
      calendarYear: this.calendarYear
    }), h31("div", {
      class: `${mergedClsPrefix}-date-panel-month__next`,
      onClick: this.nextMonth
    }, resolveSlot(datePickerSlots["next-month"], () => [h31(Forward_default, null)])), h31("div", {
      class: `${mergedClsPrefix}-date-panel-month__fast-next`,
      onClick: this.nextYear
    }, resolveSlot(datePickerSlots["next-year"], () => [h31(FastForward_default, null)]))), h31("div", {
      class: `${mergedClsPrefix}-date-panel-weekdays`
    }, this.weekdays.map((weekday) => h31("div", {
      key: weekday,
      class: `${mergedClsPrefix}-date-panel-weekdays__day`
    }, weekday))), h31("div", {
      class: `${mergedClsPrefix}-date-panel-dates`
    }, this.dateArray.map((dateItem2, i) => h31("div", {
      "data-n-date": true,
      key: i,
      class: [`${mergedClsPrefix}-date-panel-date`, {
        [`${mergedClsPrefix}-date-panel-date--current`]: dateItem2.isCurrentDate,
        [`${mergedClsPrefix}-date-panel-date--selected`]: dateItem2.selected,
        [`${mergedClsPrefix}-date-panel-date--excluded`]: !dateItem2.inCurrentMonth,
        [`${mergedClsPrefix}-date-panel-date--disabled`]: this.mergedIsDateDisabled(dateItem2.ts, {
          type: "date",
          year: dateItem2.dateObject.year,
          month: dateItem2.dateObject.month,
          date: dateItem2.dateObject.date
        }),
        [`${mergedClsPrefix}-date-panel-date--week-hovered`]: this.isWeekHovered(dateItem2),
        [`${mergedClsPrefix}-date-panel-date--week-selected`]: dateItem2.inSelectedWeek
      }],
      onClick: () => {
        this.handleDateClick(dateItem2);
      },
      onMouseenter: () => {
        this.handleDateMouseEnter(dateItem2);
      }
    }, h31("div", {
      class: `${mergedClsPrefix}-date-panel-date__trigger`
    }), dateItem2.dateObject.date, dateItem2.isCurrentDate ? h31("div", {
      class: `${mergedClsPrefix}-date-panel-date__sup`
    }) : null)))), this.datePickerSlots.footer ? h31("div", {
      class: `${mergedClsPrefix}-date-panel-footer`
    }, this.datePickerSlots.footer()) : null, ((_a = this.actions) === null || _a === void 0 ? void 0 : _a.length) || shortcuts ? h31("div", {
      class: `${mergedClsPrefix}-date-panel-actions`
    }, h31("div", {
      class: `${mergedClsPrefix}-date-panel-actions__prefix`
    }, shortcuts && Object.keys(shortcuts).map((key) => {
      const shortcut = shortcuts[key];
      return Array.isArray(shortcut) ? null : h31(XButton, {
        size: "tiny",
        onMouseenter: () => {
          this.handleSingleShortcutMouseenter(shortcut);
        },
        onClick: () => {
          this.handleSingleShortcutClick(shortcut);
        },
        onMouseleave: () => {
          this.handleShortcutMouseleave();
        }
      }, {
        default: () => key
      });
    })), h31("div", {
      class: `${mergedClsPrefix}-date-panel-actions__suffix`
    }, ((_b = this.actions) === null || _b === void 0 ? void 0 : _b.includes("clear")) ? resolveSlotWithTypedProps(this.$slots.clear, {
      onClear: this.handleClearClick,
      text: this.locale.clear
    }, () => [h31(Button_default, {
      theme: mergedTheme.peers.Button,
      themeOverrides: mergedTheme.peerOverrides.Button,
      size: "tiny",
      onClick: this.handleClearClick
    }, {
      default: () => this.locale.clear
    })]) : null, ((_c = this.actions) === null || _c === void 0 ? void 0 : _c.includes("now")) ? resolveSlotWithTypedProps(this.$slots.now, {
      onNow: this.handleNowClick,
      text: this.locale.now
    }, () => [h31(Button_default, {
      theme: mergedTheme.peers.Button,
      themeOverrides: mergedTheme.peerOverrides.Button,
      size: "tiny",
      onClick: this.handleNowClick
    }, {
      default: () => this.locale.now
    })]) : null)) : null, h31(focus_detector_default, {
      onFocus: this.handleFocusDetectorFocus
    }));
  }
});

// ../node_modules/naive-ui/es/date-picker/src/panel/daterange.mjs
import { defineComponent as defineComponent33, h as h32, watchEffect as watchEffect7 } from "vue";

// ../node_modules/naive-ui/es/date-picker/src/panel/use-dual-calendar.mjs
import { computed as computed18, inject as inject20, ref as ref18, watch as watch9 } from "vue";
var useDualCalendarProps = Object.assign(Object.assign({}, usePanelCommonProps), {
  defaultCalendarStartTime: Number,
  defaultCalendarEndTime: Number,
  bindCalendarMonths: Boolean,
  actions: {
    type: Array,
    default: () => ["clear", "confirm"]
  }
});
function useDualCalendar(props, type) {
  var _a, _b;
  const {
    isDateDisabledRef,
    isStartHourDisabledRef,
    isEndHourDisabledRef,
    isStartMinuteDisabledRef,
    isEndMinuteDisabledRef,
    isStartSecondDisabledRef,
    isEndSecondDisabledRef,
    isStartDateInvalidRef,
    isEndDateInvalidRef,
    isStartTimeInvalidRef,
    isEndTimeInvalidRef,
    isStartValueInvalidRef,
    isEndValueInvalidRef,
    isRangeInvalidRef,
    localeRef,
    rangesRef,
    closeOnSelectRef,
    updateValueOnCloseRef,
    firstDayOfWeekRef,
    datePickerSlots,
    monthFormatRef,
    yearFormatRef,
    quarterFormatRef,
    yearRangeRef
  } = inject20(datePickerInjectionKey);
  const validation = {
    isDateDisabled: isDateDisabledRef,
    isStartHourDisabled: isStartHourDisabledRef,
    isEndHourDisabled: isEndHourDisabledRef,
    isStartMinuteDisabled: isStartMinuteDisabledRef,
    isEndMinuteDisabled: isEndMinuteDisabledRef,
    isStartSecondDisabled: isStartSecondDisabledRef,
    isEndSecondDisabled: isEndSecondDisabledRef,
    isStartDateInvalid: isStartDateInvalidRef,
    isEndDateInvalid: isEndDateInvalidRef,
    isStartTimeInvalid: isStartTimeInvalidRef,
    isEndTimeInvalid: isEndTimeInvalidRef,
    isStartValueInvalid: isStartValueInvalidRef,
    isEndValueInvalid: isEndValueInvalidRef,
    isRangeInvalid: isRangeInvalidRef
  };
  const panelCommon = usePanelCommon(props);
  const startDatesElRef = ref18(null);
  const endDatesElRef = ref18(null);
  const startYearScrollbarRef = ref18(null);
  const endYearScrollbarRef = ref18(null);
  const startYearVlRef = ref18(null);
  const endYearVlRef = ref18(null);
  const startMonthScrollbarRef = ref18(null);
  const endMonthScrollbarRef = ref18(null);
  const {
    value
  } = props;
  const defaultCalendarStartTime = (_a = props.defaultCalendarStartTime) !== null && _a !== void 0 ? _a : Array.isArray(value) && typeof value[0] === "number" ? value[0] : Date.now();
  const startCalendarDateTimeRef = ref18(defaultCalendarStartTime);
  const endCalendarDateTimeRef = ref18((_b = props.defaultCalendarEndTime) !== null && _b !== void 0 ? _b : Array.isArray(value) && typeof value[1] === "number" ? value[1] : getTime(addMonths(defaultCalendarStartTime, 1)));
  adjustCalendarTimes(true);
  const nowRef = ref18(Date.now());
  const isSelectingRef = ref18(false);
  const memorizedStartDateTimeRef = ref18(0);
  const mergedDateFormatRef = computed18(() => props.dateFormat || localeRef.value.dateFormat);
  const mergedDayFormatRef = computed18(() => props.calendarDayFormat || localeRef.value.dayFormat);
  const startDateInput = ref18(Array.isArray(value) ? format(value[0], mergedDateFormatRef.value, panelCommon.dateFnsOptions.value) : "");
  const endDateInputRef = ref18(Array.isArray(value) ? format(value[1], mergedDateFormatRef.value, panelCommon.dateFnsOptions.value) : "");
  const selectingPhaseRef = computed18(() => {
    if (isSelectingRef.value) return "end";
    else return "start";
  });
  const startDateArrayRef = computed18(() => {
    var _a2;
    return dateArray(startCalendarDateTimeRef.value, props.value, nowRef.value, (_a2 = firstDayOfWeekRef.value) !== null && _a2 !== void 0 ? _a2 : localeRef.value.firstDayOfWeek);
  });
  const endDateArrayRef = computed18(() => {
    var _a2;
    return dateArray(endCalendarDateTimeRef.value, props.value, nowRef.value, (_a2 = firstDayOfWeekRef.value) !== null && _a2 !== void 0 ? _a2 : localeRef.value.firstDayOfWeek);
  });
  const weekdaysRef = computed18(() => {
    return startDateArrayRef.value.slice(0, 7).map((dateItem2) => {
      const {
        ts
      } = dateItem2;
      return format(ts, mergedDayFormatRef.value, panelCommon.dateFnsOptions.value);
    });
  });
  const startCalendarMonthRef = computed18(() => {
    return format(startCalendarDateTimeRef.value, props.calendarHeaderMonthFormat || localeRef.value.monthFormat, panelCommon.dateFnsOptions.value);
  });
  const endCalendarMonthRef = computed18(() => {
    return format(endCalendarDateTimeRef.value, props.calendarHeaderMonthFormat || localeRef.value.monthFormat, panelCommon.dateFnsOptions.value);
  });
  const startCalendarYearRef = computed18(() => {
    return format(startCalendarDateTimeRef.value, props.calendarHeaderYearFormat || localeRef.value.yearFormat, panelCommon.dateFnsOptions.value);
  });
  const endCalendarYearRef = computed18(() => {
    return format(endCalendarDateTimeRef.value, props.calendarHeaderYearFormat || localeRef.value.yearFormat, panelCommon.dateFnsOptions.value);
  });
  const startTimeValueRef = computed18(() => {
    const {
      value: value2
    } = props;
    if (Array.isArray(value2)) return value2[0];
    return null;
  });
  const endTimeValueRef = computed18(() => {
    const {
      value: value2
    } = props;
    if (Array.isArray(value2)) return value2[1];
    return null;
  });
  const shortcutsRef = computed18(() => {
    const {
      shortcuts
    } = props;
    return shortcuts || rangesRef.value;
  });
  const startYearArrayRef = computed18(() => {
    return yearArray(pluckValueFromRange(props.value, "start"), nowRef.value, {
      yearFormat: yearFormatRef.value
    }, yearRangeRef);
  });
  const endYearArrayRef = computed18(() => {
    return yearArray(pluckValueFromRange(props.value, "end"), nowRef.value, {
      yearFormat: yearFormatRef.value
    }, yearRangeRef);
  });
  const startQuarterArrayRef = computed18(() => {
    const startValue = pluckValueFromRange(props.value, "start");
    return quarterArray(startValue !== null && startValue !== void 0 ? startValue : Date.now(), startValue, nowRef.value, {
      quarterFormat: quarterFormatRef.value
    });
  });
  const endQuarterArrayRef = computed18(() => {
    const endValue = pluckValueFromRange(props.value, "end");
    return quarterArray(endValue !== null && endValue !== void 0 ? endValue : Date.now(), endValue, nowRef.value, {
      quarterFormat: quarterFormatRef.value
    });
  });
  const startMonthArrayRef = computed18(() => {
    const startValue = pluckValueFromRange(props.value, "start");
    return monthArray(startValue !== null && startValue !== void 0 ? startValue : Date.now(), startValue, nowRef.value, {
      monthFormat: monthFormatRef.value
    });
  });
  const endMonthArrayRef = computed18(() => {
    const endValue = pluckValueFromRange(props.value, "end");
    return monthArray(endValue !== null && endValue !== void 0 ? endValue : Date.now(), endValue, nowRef.value, {
      monthFormat: monthFormatRef.value
    });
  });
  const calendarMonthBeforeYearRef = computed18(() => {
    var _a2;
    return (_a2 = props.calendarHeaderMonthBeforeYear) !== null && _a2 !== void 0 ? _a2 : localeRef.value.monthBeforeYear;
  });
  watch9(computed18(() => props.value), (value2) => {
    if (value2 !== null && Array.isArray(value2)) {
      const [startMoment, endMoment] = value2;
      startDateInput.value = format(startMoment, mergedDateFormatRef.value, panelCommon.dateFnsOptions.value);
      endDateInputRef.value = format(endMoment, mergedDateFormatRef.value, panelCommon.dateFnsOptions.value);
      if (!isSelectingRef.value) {
        syncCalendarTimeWithValue(value2);
      }
    } else {
      startDateInput.value = "";
      endDateInputRef.value = "";
    }
  });
  function handleCalendarChange(value2, oldValue) {
    if (type === "daterange" || type === "datetimerange") {
      if (getYear(value2) !== getYear(oldValue) || getMonth(value2) !== getMonth(oldValue)) {
        panelCommon.disableTransitionOneTick();
      }
    }
  }
  watch9(startCalendarDateTimeRef, handleCalendarChange);
  watch9(endCalendarDateTimeRef, handleCalendarChange);
  function adjustCalendarTimes(byStartCalendarTime) {
    const startTime = startOfMonth(startCalendarDateTimeRef.value);
    const endTime = startOfMonth(endCalendarDateTimeRef.value);
    if (props.bindCalendarMonths || startTime >= endTime) {
      if (byStartCalendarTime) {
        endCalendarDateTimeRef.value = getTime(addMonths(startTime, 1));
      } else {
        startCalendarDateTimeRef.value = getTime(addMonths(endTime, -1));
      }
    }
  }
  function startCalendarNextYear() {
    startCalendarDateTimeRef.value = getTime(addMonths(startCalendarDateTimeRef.value, 12));
    adjustCalendarTimes(true);
  }
  function startCalendarPrevYear() {
    startCalendarDateTimeRef.value = getTime(addMonths(startCalendarDateTimeRef.value, -12));
    adjustCalendarTimes(true);
  }
  function startCalendarNextMonth() {
    startCalendarDateTimeRef.value = getTime(addMonths(startCalendarDateTimeRef.value, 1));
    adjustCalendarTimes(true);
  }
  function startCalendarPrevMonth() {
    startCalendarDateTimeRef.value = getTime(addMonths(startCalendarDateTimeRef.value, -1));
    adjustCalendarTimes(true);
  }
  function endCalendarNextYear() {
    endCalendarDateTimeRef.value = getTime(addMonths(endCalendarDateTimeRef.value, 12));
    adjustCalendarTimes(false);
  }
  function endCalendarPrevYear() {
    endCalendarDateTimeRef.value = getTime(addMonths(endCalendarDateTimeRef.value, -12));
    adjustCalendarTimes(false);
  }
  function endCalendarNextMonth() {
    endCalendarDateTimeRef.value = getTime(addMonths(endCalendarDateTimeRef.value, 1));
    adjustCalendarTimes(false);
  }
  function endCalendarPrevMonth() {
    endCalendarDateTimeRef.value = getTime(addMonths(endCalendarDateTimeRef.value, -1));
    adjustCalendarTimes(false);
  }
  function onUpdateStartCalendarValue(value2) {
    startCalendarDateTimeRef.value = value2;
    adjustCalendarTimes(true);
  }
  function onUpdateEndCalendarValue(value2) {
    endCalendarDateTimeRef.value = value2;
    adjustCalendarTimes(false);
  }
  function mergedIsDateDisabled(ts) {
    const isDateDisabled = isDateDisabledRef.value;
    if (!isDateDisabled) return false;
    if (!Array.isArray(props.value)) {
      return isDateDisabled(ts, "start", null);
    }
    if (selectingPhaseRef.value === "start") {
      return isDateDisabled(ts, "start", null);
    } else {
      const {
        value: memorizedStartDateTime
      } = memorizedStartDateTimeRef;
      if (ts < memorizedStartDateTimeRef.value) {
        return isDateDisabled(ts, "start", [memorizedStartDateTime, memorizedStartDateTime]);
      } else {
        return isDateDisabled(ts, "end", [memorizedStartDateTime, memorizedStartDateTime]);
      }
    }
  }
  function syncCalendarTimeWithValue(value2) {
    if (value2 === null) return;
    const [startMoment, endMoment] = value2;
    startCalendarDateTimeRef.value = startMoment;
    if (startOfMonth(endMoment) <= startOfMonth(startMoment)) {
      endCalendarDateTimeRef.value = getTime(startOfMonth(addMonths(startMoment, 1)));
    } else {
      endCalendarDateTimeRef.value = getTime(startOfMonth(endMoment));
    }
  }
  function handleDateClick(dateItem2) {
    if (!isSelectingRef.value) {
      isSelectingRef.value = true;
      memorizedStartDateTimeRef.value = dateItem2.ts;
      changeStartEndTime(dateItem2.ts, dateItem2.ts, "done");
    } else {
      isSelectingRef.value = false;
      const {
        value: value2
      } = props;
      if (props.panel && Array.isArray(value2)) {
        changeStartEndTime(value2[0], value2[1], "done");
      } else {
        if (closeOnSelectRef.value && type === "daterange") {
          if (updateValueOnCloseRef.value) {
            closeCalendar();
          } else {
            handleConfirmClick();
          }
        }
      }
    }
  }
  function handleDateMouseEnter(dateItem2) {
    if (isSelectingRef.value) {
      if (mergedIsDateDisabled(dateItem2.ts)) return;
      if (dateItem2.ts >= memorizedStartDateTimeRef.value) {
        changeStartEndTime(memorizedStartDateTimeRef.value, dateItem2.ts, "wipPreview");
      } else {
        changeStartEndTime(dateItem2.ts, memorizedStartDateTimeRef.value, "wipPreview");
      }
    }
  }
  function handleConfirmClick() {
    if (isRangeInvalidRef.value) {
      return;
    }
    panelCommon.doConfirm();
    closeCalendar();
  }
  function closeCalendar() {
    isSelectingRef.value = false;
    if (props.active) {
      panelCommon.doClose();
    }
  }
  function changeStartDateTime(time3) {
    if (typeof time3 !== "number") {
      time3 = getTime(time3);
    }
    if (props.value === null) {
      panelCommon.doUpdateValue([time3, time3], props.panel);
    } else if (Array.isArray(props.value)) {
      panelCommon.doUpdateValue([time3, Math.max(props.value[1], time3)], props.panel);
    }
  }
  function changeEndDateTime(time3) {
    if (typeof time3 !== "number") {
      time3 = getTime(time3);
    }
    if (props.value === null) {
      panelCommon.doUpdateValue([time3, time3], props.panel);
    } else if (Array.isArray(props.value)) {
      panelCommon.doUpdateValue([Math.min(props.value[0], time3), time3], props.panel);
    }
  }
  function changeStartEndTime(startTime, endTime, source) {
    if (typeof startTime !== "number") {
      startTime = getTime(startTime);
    }
    if (source !== "shortcutPreview" && source !== "shortcutDone") {
      let startDefaultTime;
      let endDefaultTime;
      if (type === "datetimerange") {
        const {
          defaultTime
        } = props;
        if (Array.isArray(defaultTime)) {
          startDefaultTime = getDefaultTime(defaultTime[0]);
          endDefaultTime = getDefaultTime(defaultTime[1]);
        } else {
          startDefaultTime = getDefaultTime(defaultTime);
          endDefaultTime = startDefaultTime;
        }
      }
      if (startDefaultTime) {
        startTime = getTime(set(startTime, startDefaultTime));
      }
      if (endDefaultTime) {
        endTime = getTime(set(endTime, endDefaultTime));
      }
    }
    panelCommon.doUpdateValue([startTime, endTime], props.panel && (source === "done" || source === "shortcutDone"));
  }
  function sanitizeValue(datetime) {
    if (type === "datetimerange") {
      return getTime(startOfSecond(datetime));
    } else if (type === "monthrange") {
      return getTime(startOfMonth(datetime));
    } else {
      return getTime(startOfDay(datetime));
    }
  }
  function handleStartDateInput(value2) {
    const date = strictParse(value2, mergedDateFormatRef.value, /* @__PURE__ */ new Date(), panelCommon.dateFnsOptions.value);
    if (isValid(date)) {
      if (!props.value) {
        const newValue = set(/* @__PURE__ */ new Date(), {
          year: getYear(date),
          month: getMonth(date),
          date: getDate(date)
        });
        changeStartDateTime(sanitizeValue(getTime(newValue)));
      } else if (Array.isArray(props.value)) {
        const newValue = set(props.value[0], {
          year: getYear(date),
          month: getMonth(date),
          date: getDate(date)
        });
        changeStartDateTime(sanitizeValue(getTime(newValue)));
      }
    } else {
      startDateInput.value = value2;
    }
  }
  function handleEndDateInput(value2) {
    const date = strictParse(value2, mergedDateFormatRef.value, /* @__PURE__ */ new Date(), panelCommon.dateFnsOptions.value);
    if (isValid(date)) {
      if (props.value === null) {
        const newValue = set(/* @__PURE__ */ new Date(), {
          year: getYear(date),
          month: getMonth(date),
          date: getDate(date)
        });
        changeEndDateTime(sanitizeValue(getTime(newValue)));
      } else if (Array.isArray(props.value)) {
        const newValue = set(props.value[1], {
          year: getYear(date),
          month: getMonth(date),
          date: getDate(date)
        });
        changeEndDateTime(sanitizeValue(getTime(newValue)));
      }
    } else {
      endDateInputRef.value = value2;
    }
  }
  function handleStartDateInputBlur() {
    const date = strictParse(startDateInput.value, mergedDateFormatRef.value, /* @__PURE__ */ new Date(), panelCommon.dateFnsOptions.value);
    const {
      value: value2
    } = props;
    if (isValid(date)) {
      if (value2 === null) {
        const newValue = set(/* @__PURE__ */ new Date(), {
          year: getYear(date),
          month: getMonth(date),
          date: getDate(date)
        });
        changeStartDateTime(sanitizeValue(getTime(newValue)));
      } else if (Array.isArray(value2)) {
        const newValue = set(value2[0], {
          year: getYear(date),
          month: getMonth(date),
          date: getDate(date)
        });
        changeStartDateTime(sanitizeValue(getTime(newValue)));
      }
    } else {
      refreshDisplayDateString();
    }
  }
  function handleEndDateInputBlur() {
    const date = strictParse(endDateInputRef.value, mergedDateFormatRef.value, /* @__PURE__ */ new Date(), panelCommon.dateFnsOptions.value);
    const {
      value: value2
    } = props;
    if (isValid(date)) {
      if (value2 === null) {
        const newValue = set(/* @__PURE__ */ new Date(), {
          year: getYear(date),
          month: getMonth(date),
          date: getDate(date)
        });
        changeEndDateTime(sanitizeValue(getTime(newValue)));
      } else if (Array.isArray(value2)) {
        const newValue = set(value2[1], {
          year: getYear(date),
          month: getMonth(date),
          date: getDate(date)
        });
        changeEndDateTime(sanitizeValue(getTime(newValue)));
      }
    } else {
      refreshDisplayDateString();
    }
  }
  function refreshDisplayDateString(times) {
    const {
      value: value2
    } = props;
    if (value2 === null || !Array.isArray(value2)) {
      startDateInput.value = "";
      endDateInputRef.value = "";
      return;
    }
    if (times === void 0) {
      times = value2;
    }
    startDateInput.value = format(times[0], mergedDateFormatRef.value, panelCommon.dateFnsOptions.value);
    endDateInputRef.value = format(times[1], mergedDateFormatRef.value, panelCommon.dateFnsOptions.value);
  }
  function handleStartTimePickerChange(value2) {
    if (value2 === null) return;
    changeStartDateTime(value2);
  }
  function handleEndTimePickerChange(value2) {
    if (value2 === null) return;
    changeEndDateTime(value2);
  }
  function handleRangeShortcutMouseenter(shortcut) {
    panelCommon.cachePendingValue();
    const shortcutValue = panelCommon.getShortcutValue(shortcut);
    if (!Array.isArray(shortcutValue)) return;
    changeStartEndTime(shortcutValue[0], shortcutValue[1], "shortcutPreview");
  }
  function handleRangeShortcutClick(shortcut) {
    const shortcutValue = panelCommon.getShortcutValue(shortcut);
    if (!Array.isArray(shortcutValue)) return;
    changeStartEndTime(shortcutValue[0], shortcutValue[1], "shortcutDone");
    panelCommon.clearPendingValue();
    handleConfirmClick();
  }
  function justifyColumnsScrollState(value2, type2) {
    const mergedValue = value2 === void 0 ? props.value : value2;
    if (value2 === void 0 || type2 === "start") {
      if (startMonthScrollbarRef.value) {
        const monthIndex = !Array.isArray(mergedValue) ? getMonth(Date.now()) : getMonth(mergedValue[0]);
        startMonthScrollbarRef.value.scrollTo({
          debounce: false,
          index: monthIndex,
          elSize: MONTH_ITEM_HEIGHT
        });
      }
      if (startYearVlRef.value) {
        const yearIndex = (!Array.isArray(mergedValue) ? getYear(Date.now()) : getYear(mergedValue[0])) - yearRangeRef.value[0];
        startYearVlRef.value.scrollTo({
          index: yearIndex,
          debounce: false
        });
      }
    }
    if (value2 === void 0 || type2 === "end") {
      if (endMonthScrollbarRef.value) {
        const monthIndex = !Array.isArray(mergedValue) ? getMonth(Date.now()) : getMonth(mergedValue[1]);
        endMonthScrollbarRef.value.scrollTo({
          debounce: false,
          index: monthIndex,
          elSize: MONTH_ITEM_HEIGHT
        });
      }
      if (endYearVlRef.value) {
        const yearIndex = (!Array.isArray(mergedValue) ? getYear(Date.now()) : getYear(mergedValue[1])) - yearRangeRef.value[0];
        endYearVlRef.value.scrollTo({
          index: yearIndex,
          debounce: false
        });
      }
    }
  }
  function handleColItemClick(dateItem2, clickType) {
    const {
      value: value2
    } = props;
    const noCurrentValue = !Array.isArray(value2);
    const itemTs = dateItem2.type === "year" && type !== "yearrange" ? noCurrentValue ? set(dateItem2.ts, {
      month: getMonth(type === "quarterrange" ? startOfQuarter(/* @__PURE__ */ new Date()) : /* @__PURE__ */ new Date())
    }).valueOf() : set(dateItem2.ts, {
      month: getMonth(type === "quarterrange" ? startOfQuarter(value2[clickType === "start" ? 0 : 1]) : value2[clickType === "start" ? 0 : 1])
    }).valueOf() : dateItem2.ts;
    if (noCurrentValue) {
      const partialValue = sanitizeValue(itemTs);
      const nextValue2 = [partialValue, partialValue];
      panelCommon.doUpdateValue(nextValue2, props.panel);
      justifyColumnsScrollState(nextValue2, "start");
      justifyColumnsScrollState(nextValue2, "end");
      panelCommon.disableTransitionOneTick();
      return;
    }
    const nextValue = [value2[0], value2[1]];
    let otherPartsChanged = false;
    if (clickType === "start") {
      nextValue[0] = sanitizeValue(itemTs);
      if (nextValue[0] > nextValue[1]) {
        nextValue[1] = nextValue[0];
        otherPartsChanged = true;
      }
    } else {
      nextValue[1] = sanitizeValue(itemTs);
      if (nextValue[0] > nextValue[1]) {
        nextValue[0] = nextValue[1];
        otherPartsChanged = true;
      }
    }
    panelCommon.doUpdateValue(nextValue, props.panel);
    switch (type) {
      case "monthrange":
      case "quarterrange":
        panelCommon.disableTransitionOneTick();
        if (otherPartsChanged) {
          justifyColumnsScrollState(nextValue, "start");
          justifyColumnsScrollState(nextValue, "end");
        } else {
          justifyColumnsScrollState(nextValue, clickType);
        }
        break;
      case "yearrange":
        panelCommon.disableTransitionOneTick();
        justifyColumnsScrollState(nextValue, "start");
        justifyColumnsScrollState(nextValue, "end");
    }
  }
  function handleStartYearVlScroll() {
    var _a2;
    (_a2 = startYearScrollbarRef.value) === null || _a2 === void 0 ? void 0 : _a2.sync();
  }
  function handleEndYearVlScroll() {
    var _a2;
    (_a2 = endYearScrollbarRef.value) === null || _a2 === void 0 ? void 0 : _a2.sync();
  }
  function virtualListContainer(type2) {
    var _a2, _b2;
    if (type2 === "start") {
      return ((_a2 = startYearVlRef.value) === null || _a2 === void 0 ? void 0 : _a2.listElRef) || null;
    } else {
      return ((_b2 = endYearVlRef.value) === null || _b2 === void 0 ? void 0 : _b2.listElRef) || null;
    }
  }
  function virtualListContent(type2) {
    var _a2, _b2;
    if (type2 === "start") {
      return ((_a2 = startYearVlRef.value) === null || _a2 === void 0 ? void 0 : _a2.itemsElRef) || null;
    } else {
      return ((_b2 = endYearVlRef.value) === null || _b2 === void 0 ? void 0 : _b2.itemsElRef) || null;
    }
  }
  const childComponentRefs = {
    startYearVlRef,
    endYearVlRef,
    startMonthScrollbarRef,
    endMonthScrollbarRef,
    startYearScrollbarRef,
    endYearScrollbarRef
  };
  return Object.assign(Object.assign(Object.assign(Object.assign({
    startDatesElRef,
    endDatesElRef,
    handleDateClick,
    handleColItemClick,
    handleDateMouseEnter,
    handleConfirmClick,
    startCalendarPrevYear,
    startCalendarPrevMonth,
    startCalendarNextYear,
    startCalendarNextMonth,
    endCalendarPrevYear,
    endCalendarPrevMonth,
    endCalendarNextMonth,
    endCalendarNextYear,
    mergedIsDateDisabled,
    changeStartEndTime,
    ranges: rangesRef,
    calendarMonthBeforeYear: calendarMonthBeforeYearRef,
    startCalendarMonth: startCalendarMonthRef,
    startCalendarYear: startCalendarYearRef,
    endCalendarMonth: endCalendarMonthRef,
    endCalendarYear: endCalendarYearRef,
    weekdays: weekdaysRef,
    startDateArray: startDateArrayRef,
    endDateArray: endDateArrayRef,
    startYearArray: startYearArrayRef,
    startMonthArray: startMonthArrayRef,
    startQuarterArray: startQuarterArrayRef,
    endYearArray: endYearArrayRef,
    endMonthArray: endMonthArrayRef,
    endQuarterArray: endQuarterArrayRef,
    isSelecting: isSelectingRef,
    handleRangeShortcutMouseenter,
    handleRangeShortcutClick
  }, panelCommon), validation), childComponentRefs), {
    // datetimerangeonly
    startDateDisplayString: startDateInput,
    endDateInput: endDateInputRef,
    timePickerSize: panelCommon.timePickerSize,
    startTimeValue: startTimeValueRef,
    endTimeValue: endTimeValueRef,
    datePickerSlots,
    shortcuts: shortcutsRef,
    startCalendarDateTime: startCalendarDateTimeRef,
    endCalendarDateTime: endCalendarDateTimeRef,
    justifyColumnsScrollState,
    handleFocusDetectorFocus: panelCommon.handleFocusDetectorFocus,
    handleStartTimePickerChange,
    handleEndTimePickerChange,
    handleStartDateInput,
    handleStartDateInputBlur,
    handleEndDateInput,
    handleEndDateInputBlur,
    handleStartYearVlScroll,
    handleEndYearVlScroll,
    virtualListContainer,
    virtualListContent,
    onUpdateStartCalendarValue,
    onUpdateEndCalendarValue
  });
}

// ../node_modules/naive-ui/es/date-picker/src/panel/daterange.mjs
var daterange_default = defineComponent33({
  name: "DateRangePanel",
  props: useDualCalendarProps,
  setup(props) {
    if (true) {
      watchEffect7(() => {
        var _a;
        if ((_a = props.actions) === null || _a === void 0 ? void 0 : _a.includes("now")) {
          warnOnce("date-picker", "The `now` action is not supported for n-date-picker of `daterange` type");
        }
      });
    }
    return useDualCalendar(props, "daterange");
  },
  render() {
    var _a, _b, _c;
    const {
      mergedClsPrefix,
      mergedTheme,
      shortcuts,
      onRender,
      datePickerSlots
    } = this;
    onRender === null || onRender === void 0 ? void 0 : onRender();
    return h32("div", {
      ref: "selfRef",
      tabindex: 0,
      class: [`${mergedClsPrefix}-date-panel`, `${mergedClsPrefix}-date-panel--daterange`, !this.panel && `${mergedClsPrefix}-date-panel--shadow`, this.themeClass],
      onKeydown: this.handlePanelKeyDown,
      onFocus: this.handlePanelFocus
    }, h32("div", {
      ref: "startDatesElRef",
      class: `${mergedClsPrefix}-date-panel-calendar ${mergedClsPrefix}-date-panel-calendar--start`
    }, h32("div", {
      class: `${mergedClsPrefix}-date-panel-month`
    }, h32("div", {
      class: `${mergedClsPrefix}-date-panel-month__fast-prev`,
      onClick: this.startCalendarPrevYear
    }, resolveSlot(datePickerSlots["prev-year"], () => [h32(FastBackward_default, null)])), h32("div", {
      class: `${mergedClsPrefix}-date-panel-month__prev`,
      onClick: this.startCalendarPrevMonth
    }, resolveSlot(datePickerSlots["prev-month"], () => [h32(Backward_default, null)])), h32(panelHeader_default, {
      monthYearSeparator: this.calendarHeaderMonthYearSeparator,
      monthBeforeYear: this.calendarMonthBeforeYear,
      value: this.startCalendarDateTime,
      onUpdateValue: this.onUpdateStartCalendarValue,
      mergedClsPrefix,
      calendarMonth: this.startCalendarMonth,
      calendarYear: this.startCalendarYear
    }), h32("div", {
      class: `${mergedClsPrefix}-date-panel-month__next`,
      onClick: this.startCalendarNextMonth
    }, resolveSlot(datePickerSlots["next-month"], () => [h32(Forward_default, null)])), h32("div", {
      class: `${mergedClsPrefix}-date-panel-month__fast-next`,
      onClick: this.startCalendarNextYear
    }, resolveSlot(datePickerSlots["next-year"], () => [h32(FastForward_default, null)]))), h32("div", {
      class: `${mergedClsPrefix}-date-panel-weekdays`
    }, this.weekdays.map((weekday) => h32("div", {
      key: weekday,
      class: `${mergedClsPrefix}-date-panel-weekdays__day`
    }, weekday))), h32("div", {
      class: `${mergedClsPrefix}-date-panel__divider`
    }), h32("div", {
      class: `${mergedClsPrefix}-date-panel-dates`
    }, this.startDateArray.map((dateItem2, i) => h32("div", {
      "data-n-date": true,
      key: i,
      class: [`${mergedClsPrefix}-date-panel-date`, {
        [`${mergedClsPrefix}-date-panel-date--excluded`]: !dateItem2.inCurrentMonth,
        [`${mergedClsPrefix}-date-panel-date--current`]: dateItem2.isCurrentDate,
        [`${mergedClsPrefix}-date-panel-date--selected`]: dateItem2.selected,
        [`${mergedClsPrefix}-date-panel-date--covered`]: dateItem2.inSpan,
        [`${mergedClsPrefix}-date-panel-date--start`]: dateItem2.startOfSpan,
        [`${mergedClsPrefix}-date-panel-date--end`]: dateItem2.endOfSpan,
        [`${mergedClsPrefix}-date-panel-date--disabled`]: this.mergedIsDateDisabled(dateItem2.ts)
      }],
      onClick: () => {
        this.handleDateClick(dateItem2);
      },
      onMouseenter: () => {
        this.handleDateMouseEnter(dateItem2);
      }
    }, h32("div", {
      class: `${mergedClsPrefix}-date-panel-date__trigger`
    }), dateItem2.dateObject.date, dateItem2.isCurrentDate ? h32("div", {
      class: `${mergedClsPrefix}-date-panel-date__sup`
    }) : null)))), h32("div", {
      class: `${mergedClsPrefix}-date-panel__vertical-divider`
    }), h32("div", {
      ref: "endDatesElRef",
      class: `${mergedClsPrefix}-date-panel-calendar ${mergedClsPrefix}-date-panel-calendar--end`
    }, h32("div", {
      class: `${mergedClsPrefix}-date-panel-month`
    }, h32("div", {
      class: `${mergedClsPrefix}-date-panel-month__fast-prev`,
      onClick: this.endCalendarPrevYear
    }, resolveSlot(datePickerSlots["prev-year"], () => [h32(FastBackward_default, null)])), h32("div", {
      class: `${mergedClsPrefix}-date-panel-month__prev`,
      onClick: this.endCalendarPrevMonth
    }, resolveSlot(datePickerSlots["prev-month"], () => [h32(Backward_default, null)])), h32(panelHeader_default, {
      monthYearSeparator: this.calendarHeaderMonthYearSeparator,
      monthBeforeYear: this.calendarMonthBeforeYear,
      value: this.endCalendarDateTime,
      onUpdateValue: this.onUpdateEndCalendarValue,
      mergedClsPrefix,
      calendarMonth: this.endCalendarMonth,
      calendarYear: this.endCalendarYear
    }), h32("div", {
      class: `${mergedClsPrefix}-date-panel-month__next`,
      onClick: this.endCalendarNextMonth
    }, resolveSlot(datePickerSlots["next-month"], () => [h32(Forward_default, null)])), h32("div", {
      class: `${mergedClsPrefix}-date-panel-month__fast-next`,
      onClick: this.endCalendarNextYear
    }, resolveSlot(datePickerSlots["next-year"], () => [h32(FastForward_default, null)]))), h32("div", {
      class: `${mergedClsPrefix}-date-panel-weekdays`
    }, this.weekdays.map((weekday) => h32("div", {
      key: weekday,
      class: `${mergedClsPrefix}-date-panel-weekdays__day`
    }, weekday))), h32("div", {
      class: `${mergedClsPrefix}-date-panel__divider`
    }), h32("div", {
      class: `${mergedClsPrefix}-date-panel-dates`
    }, this.endDateArray.map((dateItem2, i) => h32("div", {
      "data-n-date": true,
      key: i,
      class: [`${mergedClsPrefix}-date-panel-date`, {
        [`${mergedClsPrefix}-date-panel-date--excluded`]: !dateItem2.inCurrentMonth,
        [`${mergedClsPrefix}-date-panel-date--current`]: dateItem2.isCurrentDate,
        [`${mergedClsPrefix}-date-panel-date--selected`]: dateItem2.selected,
        [`${mergedClsPrefix}-date-panel-date--covered`]: dateItem2.inSpan,
        [`${mergedClsPrefix}-date-panel-date--start`]: dateItem2.startOfSpan,
        [`${mergedClsPrefix}-date-panel-date--end`]: dateItem2.endOfSpan,
        [`${mergedClsPrefix}-date-panel-date--disabled`]: this.mergedIsDateDisabled(dateItem2.ts)
      }],
      onClick: () => {
        this.handleDateClick(dateItem2);
      },
      onMouseenter: () => {
        this.handleDateMouseEnter(dateItem2);
      }
    }, h32("div", {
      class: `${mergedClsPrefix}-date-panel-date__trigger`
    }), dateItem2.dateObject.date, dateItem2.isCurrentDate ? h32("div", {
      class: `${mergedClsPrefix}-date-panel-date__sup`
    }) : null)))), this.datePickerSlots.footer ? h32("div", {
      class: `${mergedClsPrefix}-date-panel-footer`
    }, this.datePickerSlots.footer()) : null, ((_a = this.actions) === null || _a === void 0 ? void 0 : _a.length) || shortcuts ? h32("div", {
      class: `${mergedClsPrefix}-date-panel-actions`
    }, h32("div", {
      class: `${mergedClsPrefix}-date-panel-actions__prefix`
    }, shortcuts && Object.keys(shortcuts).map((key) => {
      const shortcut = shortcuts[key];
      return Array.isArray(shortcut) || typeof shortcut === "function" ? h32(XButton, {
        size: "tiny",
        onMouseenter: () => {
          this.handleRangeShortcutMouseenter(shortcut);
        },
        onClick: () => {
          this.handleRangeShortcutClick(shortcut);
        },
        onMouseleave: () => {
          this.handleShortcutMouseleave();
        }
      }, {
        default: () => key
      }) : null;
    })), h32("div", {
      class: `${mergedClsPrefix}-date-panel-actions__suffix`
    }, ((_b = this.actions) === null || _b === void 0 ? void 0 : _b.includes("clear")) ? resolveSlotWithTypedProps(datePickerSlots.clear, {
      onClear: this.handleClearClick,
      text: this.locale.clear
    }, () => [h32(Button_default, {
      theme: mergedTheme.peers.Button,
      themeOverrides: mergedTheme.peerOverrides.Button,
      size: "tiny",
      onClick: this.handleClearClick
    }, {
      default: () => this.locale.clear
    })]) : null, ((_c = this.actions) === null || _c === void 0 ? void 0 : _c.includes("confirm")) ? resolveSlotWithTypedProps(datePickerSlots.confirm, {
      onConfirm: this.handleConfirmClick,
      disabled: this.isRangeInvalid || this.isSelecting,
      text: this.locale.confirm
    }, () => [h32(Button_default, {
      theme: mergedTheme.peers.Button,
      themeOverrides: mergedTheme.peerOverrides.Button,
      size: "tiny",
      type: "primary",
      disabled: this.isRangeInvalid || this.isSelecting,
      onClick: this.handleConfirmClick
    }, {
      default: () => this.locale.confirm
    })]) : null)) : null, h32(focus_detector_default, {
      onFocus: this.handleFocusDetectorFocus
    }));
  }
});

// ../node_modules/naive-ui/es/date-picker/src/panel/datetime.mjs
import { defineComponent as defineComponent37, h as h36 } from "vue";

// ../node_modules/date-fns-tz/dist/esm/_lib/tzIntlTimeZoneName/index.js
function tzIntlTimeZoneName(length, date, options) {
  const defaultOptions2 = getDefaultOptions2();
  const dtf = getDTF(length, options.timeZone, options.locale ?? defaultOptions2.locale);
  return "formatToParts" in dtf ? partsTimeZone(dtf, date) : hackyTimeZone(dtf, date);
}
function partsTimeZone(dtf, date) {
  const formatted = dtf.formatToParts(date);
  for (let i = formatted.length - 1; i >= 0; --i) {
    if (formatted[i].type === "timeZoneName") {
      return formatted[i].value;
    }
  }
  return void 0;
}
function hackyTimeZone(dtf, date) {
  const formatted = dtf.format(date).replace(/\u200E/g, "");
  const tzNameMatch = / [\w-+ ]+$/.exec(formatted);
  return tzNameMatch ? tzNameMatch[0].substr(1) : "";
}
function getDTF(length, timeZone, locale) {
  return new Intl.DateTimeFormat(locale ? [locale.code, "en-US"] : void 0, {
    timeZone,
    timeZoneName: length
  });
}

// ../node_modules/date-fns-tz/dist/esm/_lib/tzTokenizeDate/index.js
function tzTokenizeDate(date, timeZone) {
  const dtf = getDateTimeFormat(timeZone);
  return "formatToParts" in dtf ? partsOffset(dtf, date) : hackyOffset(dtf, date);
}
var typeToPos = {
  year: 0,
  month: 1,
  day: 2,
  hour: 3,
  minute: 4,
  second: 5
};
function partsOffset(dtf, date) {
  try {
    const formatted = dtf.formatToParts(date);
    const filled = [];
    for (let i = 0; i < formatted.length; i++) {
      const pos = typeToPos[formatted[i].type];
      if (pos !== void 0) {
        filled[pos] = parseInt(formatted[i].value, 10);
      }
    }
    return filled;
  } catch (error) {
    if (error instanceof RangeError) {
      return [NaN];
    }
    throw error;
  }
}
function hackyOffset(dtf, date) {
  const formatted = dtf.format(date);
  const parsed = /(\d+)\/(\d+)\/(\d+),? (\d+):(\d+):(\d+)/.exec(formatted);
  return [
    parseInt(parsed[3], 10),
    parseInt(parsed[1], 10),
    parseInt(parsed[2], 10),
    parseInt(parsed[4], 10),
    parseInt(parsed[5], 10),
    parseInt(parsed[6], 10)
  ];
}
var dtfCache = {};
var testDateFormatted = new Intl.DateTimeFormat("en-US", {
  hourCycle: "h23",
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit"
}).format(/* @__PURE__ */ new Date("2014-06-25T04:00:00.123Z"));
var hourCycleSupported = testDateFormatted === "06/25/2014, 00:00:00" || testDateFormatted === "\u200E06\u200E/\u200E25\u200E/\u200E2014\u200E \u200E00\u200E:\u200E00\u200E:\u200E00";
function getDateTimeFormat(timeZone) {
  if (!dtfCache[timeZone]) {
    dtfCache[timeZone] = hourCycleSupported ? new Intl.DateTimeFormat("en-US", {
      hourCycle: "h23",
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }) : new Intl.DateTimeFormat("en-US", {
      hour12: false,
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }
  return dtfCache[timeZone];
}

// ../node_modules/date-fns-tz/dist/esm/_lib/newDateUTC/index.js
function newDateUTC(fullYear, month, day, hour, minute, second, millisecond) {
  const utcDate = /* @__PURE__ */ new Date(0);
  utcDate.setUTCFullYear(fullYear, month, day);
  utcDate.setUTCHours(hour, minute, second, millisecond);
  return utcDate;
}

// ../node_modules/date-fns-tz/dist/esm/_lib/tzParseTimezone/index.js
var MILLISECONDS_IN_HOUR = 36e5;
var MILLISECONDS_IN_MINUTE = 6e4;
var patterns = {
  timezone: /([Z+-].*)$/,
  timezoneZ: /^(Z)$/,
  timezoneHH: /^([+-]\d{2})$/,
  timezoneHHMM: /^([+-])(\d{2}):?(\d{2})$/
};
function tzParseTimezone(timezoneString, date, isUtcDate) {
  if (!timezoneString) {
    return 0;
  }
  let token = patterns.timezoneZ.exec(timezoneString);
  if (token) {
    return 0;
  }
  let hours;
  let absoluteOffset;
  token = patterns.timezoneHH.exec(timezoneString);
  if (token) {
    hours = parseInt(token[1], 10);
    if (!validateTimezone(hours)) {
      return NaN;
    }
    return -(hours * MILLISECONDS_IN_HOUR);
  }
  token = patterns.timezoneHHMM.exec(timezoneString);
  if (token) {
    hours = parseInt(token[2], 10);
    const minutes = parseInt(token[3], 10);
    if (!validateTimezone(hours, minutes)) {
      return NaN;
    }
    absoluteOffset = Math.abs(hours) * MILLISECONDS_IN_HOUR + minutes * MILLISECONDS_IN_MINUTE;
    return token[1] === "+" ? -absoluteOffset : absoluteOffset;
  }
  if (isValidTimezoneIANAString(timezoneString)) {
    date = new Date(date || Date.now());
    const utcDate = isUtcDate ? date : toUtcDate(date);
    const offset = calcOffset(utcDate, timezoneString);
    const fixedOffset = isUtcDate ? offset : fixOffset(date, offset, timezoneString);
    return -fixedOffset;
  }
  return NaN;
}
function toUtcDate(date) {
  return newDateUTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
}
function calcOffset(date, timezoneString) {
  const tokens = tzTokenizeDate(date, timezoneString);
  const asUTC = newDateUTC(tokens[0], tokens[1] - 1, tokens[2], tokens[3] % 24, tokens[4], tokens[5], 0).getTime();
  let asTS = date.getTime();
  const over = asTS % 1e3;
  asTS -= over >= 0 ? over : 1e3 + over;
  return asUTC - asTS;
}
function fixOffset(date, offset, timezoneString) {
  const localTS = date.getTime();
  let utcGuess = localTS - offset;
  const o2 = calcOffset(new Date(utcGuess), timezoneString);
  if (offset === o2) {
    return offset;
  }
  utcGuess -= o2 - offset;
  const o3 = calcOffset(new Date(utcGuess), timezoneString);
  if (o2 === o3) {
    return o2;
  }
  return Math.max(o2, o3);
}
function validateTimezone(hours, minutes) {
  return -23 <= hours && hours <= 23 && (minutes == null || 0 <= minutes && minutes <= 59);
}
var validIANATimezoneCache = {};
function isValidTimezoneIANAString(timeZoneString) {
  if (validIANATimezoneCache[timeZoneString])
    return true;
  try {
    new Intl.DateTimeFormat(void 0, { timeZone: timeZoneString });
    validIANATimezoneCache[timeZoneString] = true;
    return true;
  } catch (error) {
    return false;
  }
}

// ../node_modules/date-fns-tz/dist/esm/format/formatters/index.js
var MILLISECONDS_IN_MINUTE2 = 60 * 1e3;
var formatters2 = {
  // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
  X: function(date, token, options) {
    const timezoneOffset = getTimeZoneOffset(options.timeZone, date);
    if (timezoneOffset === 0) {
      return "Z";
    }
    switch (token) {
      // Hours and optional minutes
      case "X":
        return formatTimezoneWithOptionalMinutes2(timezoneOffset);
      // Hours, minutes and optional seconds without `:` delimeter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `XX`
      case "XXXX":
      case "XX":
        return formatTimezone2(timezoneOffset);
      // Hours, minutes and optional seconds with `:` delimeter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `XXX`
      case "XXXXX":
      case "XXX":
      // Hours and minutes with `:` delimeter
      default:
        return formatTimezone2(timezoneOffset, ":");
    }
  },
  // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
  x: function(date, token, options) {
    const timezoneOffset = getTimeZoneOffset(options.timeZone, date);
    switch (token) {
      // Hours and optional minutes
      case "x":
        return formatTimezoneWithOptionalMinutes2(timezoneOffset);
      // Hours, minutes and optional seconds without `:` delimeter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `xx`
      case "xxxx":
      case "xx":
        return formatTimezone2(timezoneOffset);
      // Hours, minutes and optional seconds with `:` delimeter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `xxx`
      case "xxxxx":
      case "xxx":
      // Hours and minutes with `:` delimeter
      default:
        return formatTimezone2(timezoneOffset, ":");
    }
  },
  // Timezone (GMT)
  O: function(date, token, options) {
    const timezoneOffset = getTimeZoneOffset(options.timeZone, date);
    switch (token) {
      // Short
      case "O":
      case "OO":
      case "OOO":
        return "GMT" + formatTimezoneShort2(timezoneOffset, ":");
      // Long
      case "OOOO":
      default:
        return "GMT" + formatTimezone2(timezoneOffset, ":");
    }
  },
  // Timezone (specific non-location)
  z: function(date, token, options) {
    switch (token) {
      // Short
      case "z":
      case "zz":
      case "zzz":
        return tzIntlTimeZoneName("short", date, options);
      // Long
      case "zzzz":
      default:
        return tzIntlTimeZoneName("long", date, options);
    }
  }
};
function getTimeZoneOffset(timeZone, originalDate) {
  const timeZoneOffset = timeZone ? tzParseTimezone(timeZone, originalDate, true) / MILLISECONDS_IN_MINUTE2 : originalDate?.getTimezoneOffset() ?? 0;
  if (Number.isNaN(timeZoneOffset)) {
    throw new RangeError("Invalid time zone specified: " + timeZone);
  }
  return timeZoneOffset;
}
function addLeadingZeros2(number, targetLength) {
  const sign = number < 0 ? "-" : "";
  let output = Math.abs(number).toString();
  while (output.length < targetLength) {
    output = "0" + output;
  }
  return sign + output;
}
function formatTimezone2(offset, delimiter = "") {
  const sign = offset > 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  const hours = addLeadingZeros2(Math.floor(absOffset / 60), 2);
  const minutes = addLeadingZeros2(Math.floor(absOffset % 60), 2);
  return sign + hours + delimiter + minutes;
}
function formatTimezoneWithOptionalMinutes2(offset, delimiter) {
  if (offset % 60 === 0) {
    const sign = offset > 0 ? "-" : "+";
    return sign + addLeadingZeros2(Math.abs(offset) / 60, 2);
  }
  return formatTimezone2(offset, delimiter);
}
function formatTimezoneShort2(offset, delimiter = "") {
  const sign = offset > 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  const hours = Math.floor(absOffset / 60);
  const minutes = absOffset % 60;
  if (minutes === 0) {
    return sign + String(hours);
  }
  return sign + String(hours) + delimiter + addLeadingZeros2(minutes, 2);
}

// ../node_modules/date-fns-tz/dist/esm/_lib/getTimezoneOffsetInMilliseconds/index.js
function getTimezoneOffsetInMilliseconds2(date) {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()));
  utcDate.setUTCFullYear(date.getFullYear());
  return +date - +utcDate;
}

// ../node_modules/date-fns-tz/dist/esm/_lib/tzPattern/index.js
var tzPattern = /(Z|[+-]\d{2}(?::?\d{2})?| UTC| [a-zA-Z]+\/[a-zA-Z_]+(?:\/[a-zA-Z_]+)?)$/;

// ../node_modules/date-fns-tz/dist/esm/toDate/index.js
var MILLISECONDS_IN_HOUR2 = 36e5;
var MILLISECONDS_IN_MINUTE3 = 6e4;
var DEFAULT_ADDITIONAL_DIGITS = 2;
var patterns2 = {
  dateTimePattern: /^([0-9W+-]+)(T| )(.*)/,
  datePattern: /^([0-9W+-]+)(.*)/,
  plainTime: /:/,
  // year tokens
  YY: /^(\d{2})$/,
  YYY: [
    /^([+-]\d{2})$/,
    // 0 additional digits
    /^([+-]\d{3})$/,
    // 1 additional digit
    /^([+-]\d{4})$/
    // 2 additional digits
  ],
  YYYY: /^(\d{4})/,
  YYYYY: [
    /^([+-]\d{4})/,
    // 0 additional digits
    /^([+-]\d{5})/,
    // 1 additional digit
    /^([+-]\d{6})/
    // 2 additional digits
  ],
  // date tokens
  MM: /^-(\d{2})$/,
  DDD: /^-?(\d{3})$/,
  MMDD: /^-?(\d{2})-?(\d{2})$/,
  Www: /^-?W(\d{2})$/,
  WwwD: /^-?W(\d{2})-?(\d{1})$/,
  HH: /^(\d{2}([.,]\d*)?)$/,
  HHMM: /^(\d{2}):?(\d{2}([.,]\d*)?)$/,
  HHMMSS: /^(\d{2}):?(\d{2}):?(\d{2}([.,]\d*)?)$/,
  // time zone tokens (to identify the presence of a tz)
  timeZone: tzPattern
};
function toDate2(argument, options = {}) {
  if (arguments.length < 1) {
    throw new TypeError("1 argument required, but only " + arguments.length + " present");
  }
  if (argument === null) {
    return /* @__PURE__ */ new Date(NaN);
  }
  const additionalDigits = options.additionalDigits == null ? DEFAULT_ADDITIONAL_DIGITS : Number(options.additionalDigits);
  if (additionalDigits !== 2 && additionalDigits !== 1 && additionalDigits !== 0) {
    throw new RangeError("additionalDigits must be 0, 1 or 2");
  }
  if (argument instanceof Date || typeof argument === "object" && Object.prototype.toString.call(argument) === "[object Date]") {
    return new Date(argument.getTime());
  } else if (typeof argument === "number" || Object.prototype.toString.call(argument) === "[object Number]") {
    return new Date(argument);
  } else if (!(Object.prototype.toString.call(argument) === "[object String]")) {
    return /* @__PURE__ */ new Date(NaN);
  }
  const dateStrings = splitDateString(argument);
  const { year, restDateString } = parseYear(dateStrings.date, additionalDigits);
  const date = parseDate(restDateString, year);
  if (date === null || isNaN(date.getTime())) {
    return /* @__PURE__ */ new Date(NaN);
  }
  if (date) {
    const timestamp = date.getTime();
    let time3 = 0;
    let offset;
    if (dateStrings.time) {
      time3 = parseTime(dateStrings.time);
      if (time3 === null || isNaN(time3)) {
        return /* @__PURE__ */ new Date(NaN);
      }
    }
    if (dateStrings.timeZone || options.timeZone) {
      offset = tzParseTimezone(dateStrings.timeZone || options.timeZone, new Date(timestamp + time3));
      if (isNaN(offset)) {
        return /* @__PURE__ */ new Date(NaN);
      }
    } else {
      offset = getTimezoneOffsetInMilliseconds2(new Date(timestamp + time3));
      offset = getTimezoneOffsetInMilliseconds2(new Date(timestamp + time3 + offset));
    }
    return new Date(timestamp + time3 + offset);
  } else {
    return /* @__PURE__ */ new Date(NaN);
  }
}
function splitDateString(dateString) {
  const dateStrings = {};
  let parts = patterns2.dateTimePattern.exec(dateString);
  let timeString;
  if (!parts) {
    parts = patterns2.datePattern.exec(dateString);
    if (parts) {
      dateStrings.date = parts[1];
      timeString = parts[2];
    } else {
      dateStrings.date = null;
      timeString = dateString;
    }
  } else {
    dateStrings.date = parts[1];
    timeString = parts[3];
  }
  if (timeString) {
    const token = patterns2.timeZone.exec(timeString);
    if (token) {
      dateStrings.time = timeString.replace(token[1], "");
      dateStrings.timeZone = token[1].trim();
    } else {
      dateStrings.time = timeString;
    }
  }
  return dateStrings;
}
function parseYear(dateString, additionalDigits) {
  if (dateString) {
    const patternYYY = patterns2.YYY[additionalDigits];
    const patternYYYYY = patterns2.YYYYY[additionalDigits];
    let token = patterns2.YYYY.exec(dateString) || patternYYYYY.exec(dateString);
    if (token) {
      const yearString = token[1];
      return {
        year: parseInt(yearString, 10),
        restDateString: dateString.slice(yearString.length)
      };
    }
    token = patterns2.YY.exec(dateString) || patternYYY.exec(dateString);
    if (token) {
      const centuryString = token[1];
      return {
        year: parseInt(centuryString, 10) * 100,
        restDateString: dateString.slice(centuryString.length)
      };
    }
  }
  return {
    year: null
  };
}
function parseDate(dateString, year) {
  if (year === null) {
    return null;
  }
  let date;
  let month;
  let week;
  if (!dateString || !dateString.length) {
    date = /* @__PURE__ */ new Date(0);
    date.setUTCFullYear(year);
    return date;
  }
  let token = patterns2.MM.exec(dateString);
  if (token) {
    date = /* @__PURE__ */ new Date(0);
    month = parseInt(token[1], 10) - 1;
    if (!validateDate(year, month)) {
      return /* @__PURE__ */ new Date(NaN);
    }
    date.setUTCFullYear(year, month);
    return date;
  }
  token = patterns2.DDD.exec(dateString);
  if (token) {
    date = /* @__PURE__ */ new Date(0);
    const dayOfYear = parseInt(token[1], 10);
    if (!validateDayOfYearDate(year, dayOfYear)) {
      return /* @__PURE__ */ new Date(NaN);
    }
    date.setUTCFullYear(year, 0, dayOfYear);
    return date;
  }
  token = patterns2.MMDD.exec(dateString);
  if (token) {
    date = /* @__PURE__ */ new Date(0);
    month = parseInt(token[1], 10) - 1;
    const day = parseInt(token[2], 10);
    if (!validateDate(year, month, day)) {
      return /* @__PURE__ */ new Date(NaN);
    }
    date.setUTCFullYear(year, month, day);
    return date;
  }
  token = patterns2.Www.exec(dateString);
  if (token) {
    week = parseInt(token[1], 10) - 1;
    if (!validateWeekDate(week)) {
      return /* @__PURE__ */ new Date(NaN);
    }
    return dayOfISOWeekYear(year, week);
  }
  token = patterns2.WwwD.exec(dateString);
  if (token) {
    week = parseInt(token[1], 10) - 1;
    const dayOfWeek = parseInt(token[2], 10) - 1;
    if (!validateWeekDate(week, dayOfWeek)) {
      return /* @__PURE__ */ new Date(NaN);
    }
    return dayOfISOWeekYear(year, week, dayOfWeek);
  }
  return null;
}
function parseTime(timeString) {
  let hours;
  let minutes;
  let token = patterns2.HH.exec(timeString);
  if (token) {
    hours = parseFloat(token[1].replace(",", "."));
    if (!validateTime(hours)) {
      return NaN;
    }
    return hours % 24 * MILLISECONDS_IN_HOUR2;
  }
  token = patterns2.HHMM.exec(timeString);
  if (token) {
    hours = parseInt(token[1], 10);
    minutes = parseFloat(token[2].replace(",", "."));
    if (!validateTime(hours, minutes)) {
      return NaN;
    }
    return hours % 24 * MILLISECONDS_IN_HOUR2 + minutes * MILLISECONDS_IN_MINUTE3;
  }
  token = patterns2.HHMMSS.exec(timeString);
  if (token) {
    hours = parseInt(token[1], 10);
    minutes = parseInt(token[2], 10);
    const seconds = parseFloat(token[3].replace(",", "."));
    if (!validateTime(hours, minutes, seconds)) {
      return NaN;
    }
    return hours % 24 * MILLISECONDS_IN_HOUR2 + minutes * MILLISECONDS_IN_MINUTE3 + seconds * 1e3;
  }
  return null;
}
function dayOfISOWeekYear(isoWeekYear, week, day) {
  week = week || 0;
  day = day || 0;
  const date = /* @__PURE__ */ new Date(0);
  date.setUTCFullYear(isoWeekYear, 0, 4);
  const fourthOfJanuaryDay = date.getUTCDay() || 7;
  const diff = week * 7 + day + 1 - fourthOfJanuaryDay;
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}
var DAYS_IN_MONTH2 = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var DAYS_IN_MONTH_LEAP_YEAR2 = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function isLeapYearIndex2(year) {
  return year % 400 === 0 || year % 4 === 0 && year % 100 !== 0;
}
function validateDate(year, month, date) {
  if (month < 0 || month > 11) {
    return false;
  }
  if (date != null) {
    if (date < 1) {
      return false;
    }
    const isLeapYear = isLeapYearIndex2(year);
    if (isLeapYear && date > DAYS_IN_MONTH_LEAP_YEAR2[month]) {
      return false;
    }
    if (!isLeapYear && date > DAYS_IN_MONTH2[month]) {
      return false;
    }
  }
  return true;
}
function validateDayOfYearDate(year, dayOfYear) {
  if (dayOfYear < 1) {
    return false;
  }
  const isLeapYear = isLeapYearIndex2(year);
  if (isLeapYear && dayOfYear > 366) {
    return false;
  }
  if (!isLeapYear && dayOfYear > 365) {
    return false;
  }
  return true;
}
function validateWeekDate(week, day) {
  if (week < 0 || week > 52) {
    return false;
  }
  if (day != null && (day < 0 || day > 6)) {
    return false;
  }
  return true;
}
function validateTime(hours, minutes, seconds) {
  if (hours < 0 || hours >= 25) {
    return false;
  }
  if (minutes != null && (minutes < 0 || minutes >= 60)) {
    return false;
  }
  if (seconds != null && (seconds < 0 || seconds >= 60)) {
    return false;
  }
  return true;
}

// ../node_modules/date-fns-tz/dist/esm/format/index.js
var tzFormattingTokensRegExp = /([xXOz]+)|''|'(''|[^'])+('|$)/g;
function format2(date, formatStr, options = {}) {
  formatStr = String(formatStr);
  const matches = formatStr.match(tzFormattingTokensRegExp);
  if (matches) {
    const d = toDate2(options.originalDate || date, options);
    formatStr = matches.reduce(function(result, token) {
      if (token[0] === "'") {
        return result;
      }
      const pos = result.indexOf(token);
      const precededByQuotedSection = result[pos - 1] === "'";
      const replaced = result.replace(token, "'" + formatters2[token[0]](d, token, options) + "'");
      return precededByQuotedSection ? replaced.substring(0, pos - 1) + replaced.substring(pos + 1) : replaced;
    }, formatStr);
  }
  return format(date, formatStr, options);
}

// ../node_modules/date-fns-tz/dist/esm/toZonedTime/index.js
function toZonedTime(date, timeZone, options) {
  date = toDate2(date, options);
  const offsetMilliseconds = tzParseTimezone(timeZone, date, true);
  const d = new Date(date.getTime() - offsetMilliseconds);
  const resultDate = /* @__PURE__ */ new Date(0);
  resultDate.setFullYear(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  resultDate.setHours(d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds());
  return resultDate;
}

// ../node_modules/date-fns-tz/dist/esm/formatInTimeZone/index.js
function formatInTimeZone(date, timeZone, formatStr, options) {
  options = {
    ...options,
    timeZone,
    originalDate: date
  };
  return format2(toZonedTime(date, timeZone, { timeZone: options.timeZone }), formatStr, options);
}

// ../node_modules/naive-ui/es/time-picker/src/TimePicker.mjs
import { computed as computed20, defineComponent as defineComponent36, h as h35, nextTick as nextTick5, provide as provide6, ref as ref20, toRef as toRef9, Transition as Transition5, watch as watch10, watchEffect as watchEffect8, withDirectives as withDirectives4 } from "vue";

// ../node_modules/naive-ui/es/time-picker/src/interface.mjs
var timePickerInjectionKey = createInjectionKey("n-time-picker");

// ../node_modules/naive-ui/es/time-picker/src/Panel.mjs
import { computed as computed19, defineComponent as defineComponent35, h as h34, inject as inject21, ref as ref19 } from "vue";

// ../node_modules/naive-ui/es/time-picker/src/PanelCol.mjs
import { defineComponent as defineComponent34, h as h33 } from "vue";
var PanelCol_default = defineComponent34({
  name: "TimePickerPanelCol",
  props: {
    clsPrefix: {
      type: String,
      required: true
    },
    data: {
      type: Array,
      required: true
    },
    activeValue: {
      type: [Number, String],
      default: null
    },
    // It should be required but vue's type seems to have bugs
    onItemClick: Function
  },
  render() {
    const {
      activeValue,
      onItemClick,
      clsPrefix
    } = this;
    return this.data.map((item) => {
      const {
        label,
        disabled,
        value
      } = item;
      const active = activeValue === value;
      return h33("div", {
        key: label,
        "data-active": active ? "" : null,
        class: [`${clsPrefix}-time-picker-col__item`, active && `${clsPrefix}-time-picker-col__item--active`, disabled && `${clsPrefix}-time-picker-col__item--disabled`],
        onClick: onItemClick && !disabled ? () => {
          onItemClick(value);
        } : void 0
      }, label);
    });
  }
});

// ../node_modules/naive-ui/es/time-picker/src/utils.mjs
var time2 = {
  amHours: ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"],
  pmHours: ["12", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"],
  hours: ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"],
  minutes: ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59"],
  seconds: ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59"],
  period: ["AM", "PM"]
};
function getFixValue(value) {
  return `00${value}`.slice(-2);
}
function getTimeUnits(defaultValue, stepOrList, isHourWithAmPm) {
  if (Array.isArray(stepOrList)) {
    return (isHourWithAmPm === "am" ? stepOrList.filter((v) => v < 12) : isHourWithAmPm === "pm" ? stepOrList.filter((v) => v >= 12).map((v) => v === 12 ? 12 : v - 12) : stepOrList).map((v) => getFixValue(v));
  } else if (typeof stepOrList === "number") {
    if (isHourWithAmPm === "am") {
      return defaultValue.filter((hour) => {
        const hourAsNumber = Number(hour);
        return hourAsNumber < 12 && hourAsNumber % stepOrList === 0;
      });
    } else if (isHourWithAmPm === "pm") {
      return defaultValue.filter((hour) => {
        const hourAsNumber = Number(hour);
        return hourAsNumber >= 12 && hourAsNumber % stepOrList === 0;
      }).map((hour) => {
        const hourAsNumber = Number(hour);
        return getFixValue(hourAsNumber === 12 ? 12 : hourAsNumber - 12);
      });
    }
    return defaultValue.filter((hour) => {
      return Number(hour) % stepOrList === 0;
    });
  } else {
    return isHourWithAmPm === "am" ? defaultValue.filter((hour) => Number(hour) < 12) : isHourWithAmPm === "pm" ? defaultValue.map((hour) => Number(hour)).filter((hour) => Number(hour) >= 12).map((v) => getFixValue(v === 12 ? 12 : v - 12)) : defaultValue;
  }
}
function isTimeInStep(value, type, stepOrList) {
  if (!stepOrList) {
    return true;
  } else if (typeof stepOrList === "number") {
    return value % stepOrList === 0;
  } else {
    return stepOrList.includes(value);
  }
}
function findSimilarTime(value, type, stepOrList) {
  const list = getTimeUnits(time2[type], stepOrList).map(Number);
  let lowerBound, upperBound;
  for (let i = 0; i < list.length; ++i) {
    const v = list[i];
    if (v === value) {
      return v;
    } else if (v > value) {
      upperBound = v;
      break;
    }
    lowerBound = v;
  }
  if (lowerBound === void 0) {
    if (!upperBound) {
      throwError("time-picker", "Please set 'hours' or 'minutes' or 'seconds' props");
    }
    return upperBound;
  }
  if (upperBound === void 0) {
    return lowerBound;
  }
  return upperBound - value > value - lowerBound ? lowerBound : upperBound;
}
function getAmPm(value) {
  return getHours(value) < 12 ? "am" : "pm";
}

// ../node_modules/naive-ui/es/time-picker/src/Panel.mjs
var timePickerPanelProps = {
  actions: {
    type: Array,
    default: () => ["now", "confirm"]
  },
  showHour: {
    type: Boolean,
    default: true
  },
  showMinute: {
    type: Boolean,
    default: true
  },
  showSecond: {
    type: Boolean,
    default: true
  },
  showPeriod: {
    type: Boolean,
    default: true
  },
  isHourInvalid: Boolean,
  isMinuteInvalid: Boolean,
  isSecondInvalid: Boolean,
  isAmPmInvalid: Boolean,
  isValueInvalid: Boolean,
  hourValue: {
    type: Number,
    default: null
  },
  minuteValue: {
    type: Number,
    default: null
  },
  secondValue: {
    type: Number,
    default: null
  },
  amPmValue: {
    type: String,
    default: null
  },
  isHourDisabled: Function,
  isMinuteDisabled: Function,
  isSecondDisabled: Function,
  onHourClick: {
    type: Function,
    required: true
  },
  onMinuteClick: {
    type: Function,
    required: true
  },
  onSecondClick: {
    type: Function,
    required: true
  },
  onAmPmClick: {
    type: Function,
    required: true
  },
  onNowClick: Function,
  clearText: String,
  nowText: String,
  confirmText: String,
  transitionDisabled: Boolean,
  onClearClick: Function,
  onConfirmClick: Function,
  onFocusin: Function,
  onFocusout: Function,
  onFocusDetectorFocus: Function,
  onKeydown: Function,
  hours: [Number, Array],
  minutes: [Number, Array],
  seconds: [Number, Array],
  use12Hours: Boolean
};
var Panel_default = defineComponent35({
  name: "TimePickerPanel",
  props: timePickerPanelProps,
  setup(props) {
    const {
      mergedThemeRef,
      mergedClsPrefixRef
    } = inject21(timePickerInjectionKey);
    const hoursRef = computed19(() => {
      const {
        isHourDisabled,
        hours,
        use12Hours,
        amPmValue
      } = props;
      if (!use12Hours) {
        return getTimeUnits(time2.hours, hours).map((hour) => {
          return {
            label: hour,
            value: Number(hour),
            disabled: isHourDisabled ? isHourDisabled(Number(hour)) : false
          };
        });
      } else {
        const mergedAmPmValue = amPmValue !== null && amPmValue !== void 0 ? amPmValue : getAmPm(Date.now());
        return getTimeUnits(time2.hours, hours, mergedAmPmValue).map((hour) => {
          const hourAs12FormattedNumber = Number(hour);
          const hourAs24FormattedNumber = mergedAmPmValue === "pm" && hourAs12FormattedNumber !== 12 ? hourAs12FormattedNumber + 12 : hourAs12FormattedNumber;
          return {
            label: hour,
            value: hourAs24FormattedNumber,
            disabled: isHourDisabled ? isHourDisabled(hourAs24FormattedNumber) : false
          };
        });
      }
    });
    const minutesRef = computed19(() => {
      const {
        isMinuteDisabled,
        minutes
      } = props;
      return getTimeUnits(time2.minutes, minutes).map((minute) => {
        return {
          label: minute,
          value: Number(minute),
          disabled: isMinuteDisabled ? isMinuteDisabled(Number(minute), props.hourValue) : false
        };
      });
    });
    const secondsRef = computed19(() => {
      const {
        isSecondDisabled,
        seconds
      } = props;
      return getTimeUnits(time2.seconds, seconds).map((second) => {
        return {
          label: second,
          value: Number(second),
          disabled: isSecondDisabled ? isSecondDisabled(Number(second), props.minuteValue, props.hourValue) : false
        };
      });
    });
    const amPmRef = computed19(() => {
      const {
        isHourDisabled
      } = props;
      let amDisabled = true;
      let pmDisabled = true;
      for (let i = 0; i < 12; ++i) {
        if (!(isHourDisabled === null || isHourDisabled === void 0 ? void 0 : isHourDisabled(i))) {
          amDisabled = false;
          break;
        }
      }
      for (let i = 12; i < 24; ++i) {
        if (!(isHourDisabled === null || isHourDisabled === void 0 ? void 0 : isHourDisabled(i))) {
          pmDisabled = false;
          break;
        }
      }
      return [{
        label: "AM",
        value: "am",
        disabled: amDisabled
      }, {
        label: "PM",
        value: "pm",
        disabled: pmDisabled
      }];
    });
    return {
      mergedTheme: mergedThemeRef,
      mergedClsPrefix: mergedClsPrefixRef,
      hours: hoursRef,
      minutes: minutesRef,
      seconds: secondsRef,
      amPm: amPmRef,
      hourScrollRef: ref19(null),
      minuteScrollRef: ref19(null),
      secondScrollRef: ref19(null),
      amPmScrollRef: ref19(null)
    };
  },
  render() {
    var _a, _b, _c, _d;
    const {
      mergedClsPrefix,
      mergedTheme
    } = this;
    return h34("div", {
      tabindex: 0,
      class: `${mergedClsPrefix}-time-picker-panel`,
      onFocusin: this.onFocusin,
      onFocusout: this.onFocusout,
      onKeydown: this.onKeydown
    }, h34("div", {
      class: `${mergedClsPrefix}-time-picker-cols`
    }, this.showHour ? h34("div", {
      class: [`${mergedClsPrefix}-time-picker-col`, this.isHourInvalid && `${mergedClsPrefix}-time-picker-col--invalid`, this.transitionDisabled && `${mergedClsPrefix}-time-picker-col--transition-disabled`]
    }, h34(Scrollbar_default, {
      ref: "hourScrollRef",
      theme: mergedTheme.peers.Scrollbar,
      themeOverrides: mergedTheme.peerOverrides.Scrollbar
    }, {
      default: () => [h34(PanelCol_default, {
        clsPrefix: mergedClsPrefix,
        data: this.hours,
        activeValue: this.hourValue,
        onItemClick: this.onHourClick
      }), h34("div", {
        class: `${mergedClsPrefix}-time-picker-col__padding`
      })]
    })) : null, this.showMinute ? h34("div", {
      class: [`${mergedClsPrefix}-time-picker-col`, this.transitionDisabled && `${mergedClsPrefix}-time-picker-col--transition-disabled`, this.isMinuteInvalid && `${mergedClsPrefix}-time-picker-col--invalid`]
    }, h34(Scrollbar_default, {
      ref: "minuteScrollRef",
      theme: mergedTheme.peers.Scrollbar,
      themeOverrides: mergedTheme.peerOverrides.Scrollbar
    }, {
      default: () => [h34(PanelCol_default, {
        clsPrefix: mergedClsPrefix,
        data: this.minutes,
        activeValue: this.minuteValue,
        onItemClick: this.onMinuteClick
      }), h34("div", {
        class: `${mergedClsPrefix}-time-picker-col__padding`
      })]
    })) : null, this.showSecond ? h34("div", {
      class: [`${mergedClsPrefix}-time-picker-col`, this.isSecondInvalid && `${mergedClsPrefix}-time-picker-col--invalid`, this.transitionDisabled && `${mergedClsPrefix}-time-picker-col--transition-disabled`]
    }, h34(Scrollbar_default, {
      ref: "secondScrollRef",
      theme: mergedTheme.peers.Scrollbar,
      themeOverrides: mergedTheme.peerOverrides.Scrollbar
    }, {
      default: () => [h34(PanelCol_default, {
        clsPrefix: mergedClsPrefix,
        data: this.seconds,
        activeValue: this.secondValue,
        onItemClick: this.onSecondClick
      }), h34("div", {
        class: `${mergedClsPrefix}-time-picker-col__padding`
      })]
    })) : null, this.use12Hours ? h34("div", {
      class: [`${mergedClsPrefix}-time-picker-col`, this.isAmPmInvalid && `${mergedClsPrefix}-time-picker-col--invalid`, this.transitionDisabled && `${mergedClsPrefix}-time-picker-col--transition-disabled`]
    }, h34(Scrollbar_default, {
      ref: "amPmScrollRef",
      theme: mergedTheme.peers.Scrollbar,
      themeOverrides: mergedTheme.peerOverrides.Scrollbar
    }, {
      default: () => [h34(PanelCol_default, {
        clsPrefix: mergedClsPrefix,
        data: this.amPm,
        activeValue: this.amPmValue,
        onItemClick: this.onAmPmClick
      }), h34("div", {
        class: `${mergedClsPrefix}-time-picker-col__padding`
      })]
    })) : null), ((_a = this.actions) === null || _a === void 0 ? void 0 : _a.length) ? h34("div", {
      class: `${mergedClsPrefix}-time-picker-actions`
    }, ((_b = this.actions) === null || _b === void 0 ? void 0 : _b.includes("clear")) ? h34(Button_default, {
      theme: mergedTheme.peers.Button,
      themeOverrides: mergedTheme.peerOverrides.Button,
      size: "tiny",
      onClick: this.onClearClick
    }, {
      default: () => this.clearText
    }) : null, ((_c = this.actions) === null || _c === void 0 ? void 0 : _c.includes("now")) ? h34(Button_default, {
      size: "tiny",
      theme: mergedTheme.peers.Button,
      themeOverrides: mergedTheme.peerOverrides.Button,
      onClick: this.onNowClick
    }, {
      default: () => this.nowText
    }) : null, ((_d = this.actions) === null || _d === void 0 ? void 0 : _d.includes("confirm")) ? h34(Button_default, {
      size: "tiny",
      type: "primary",
      class: `${mergedClsPrefix}-time-picker-actions__confirm`,
      theme: mergedTheme.peers.Button,
      themeOverrides: mergedTheme.peerOverrides.Button,
      disabled: this.isValueInvalid,
      onClick: this.onConfirmClick
    }, {
      default: () => this.confirmText
    }) : null) : null, h34(focus_detector_default, {
      onFocus: this.onFocusDetectorFocus
    }));
  }
});

// ../node_modules/naive-ui/es/time-picker/src/styles/index.cssr.mjs
var index_cssr_default8 = c2([cB("time-picker", `
 z-index: auto;
 position: relative;
 `, [cB("time-picker-icon", `
 color: var(--n-icon-color-override);
 transition: color .3s var(--n-bezier);
 `), cM("disabled", [cB("time-picker-icon", `
 color: var(--n-icon-color-disabled-override);
 `)])]), cB("time-picker-panel", `
 transition:
 box-shadow .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 outline: none;
 font-size: var(--n-item-font-size);
 border-radius: var(--n-border-radius);
 margin: 4px 0;
 min-width: 104px;
 overflow: hidden;
 background-color: var(--n-panel-color);
 box-shadow: var(--n-panel-box-shadow);
 `, [fadeInScaleUpTransition(), cB("time-picker-actions", `
 padding: var(--n-panel-action-padding);
 align-items: center;
 display: flex;
 justify-content: space-evenly;
 `), cB("time-picker-cols", `
 height: calc(var(--n-item-height) * 6);
 display: flex;
 position: relative;
 transition: border-color .3s var(--n-bezier);
 border-bottom: 1px solid var(--n-panel-divider-color);
 `), cB("time-picker-col", `
 flex-grow: 1;
 min-width: var(--n-item-width);
 height: calc(var(--n-item-height) * 6);
 flex-direction: column;
 transition: box-shadow .3s var(--n-bezier);
 `, [cM("transition-disabled", [cE("item", "transition: none;", [c2("&::before", "transition: none;")])]), cE("padding", `
 height: calc(var(--n-item-height) * 5);
 `), c2("&:first-child", "min-width: calc(var(--n-item-width) + 4px);", [cE("item", [c2("&::before", "left: 4px;")])]), cE("item", `
 cursor: pointer;
 height: var(--n-item-height);
 display: flex;
 align-items: center;
 justify-content: center;
 transition: 
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 opacity .3s var(--n-bezier),
 text-decoration-color .3s var(--n-bezier);
 background: #0000;
 text-decoration-color: #0000;
 color: var(--n-item-text-color);
 z-index: 0;
 box-sizing: border-box;
 padding-top: 4px;
 position: relative;
 `, [c2("&::before", `
 content: "";
 transition: background-color .3s var(--n-bezier);
 z-index: -1;
 position: absolute;
 left: 0;
 right: 4px;
 top: 4px;
 bottom: 0;
 border-radius: var(--n-item-border-radius);
 `), cNotM("disabled", [c2("&:hover::before", `
 background-color: var(--n-item-color-hover);
 `)]), cM("active", `
 color: var(--n-item-text-color-active);
 `, [c2("&::before", `
 background-color: var(--n-item-color-hover);
 `)]), cM("disabled", `
 opacity: var(--n-item-opacity-disabled);
 cursor: not-allowed;
 `)]), cM("invalid", [cE("item", [cM("active", `
 text-decoration: line-through;
 text-decoration-color: var(--n-item-text-color-active);
 `)])])])])]);

// ../node_modules/naive-ui/es/time-picker/src/TimePicker.mjs
function validateUnits(value, max) {
  if (value === void 0) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every((v) => v >= 0 && v <= max);
  } else {
    return value >= 0 && value <= max;
  }
}
var timePickerProps = Object.assign(Object.assign({}, use_theme_default.props), {
  to: useAdjustedTo.propTo,
  bordered: {
    type: Boolean,
    default: void 0
  },
  actions: Array,
  defaultValue: {
    type: Number,
    default: null
  },
  defaultFormattedValue: String,
  placeholder: String,
  placement: {
    type: String,
    default: "bottom-start"
  },
  value: Number,
  format: {
    type: String,
    default: "HH:mm:ss"
  },
  valueFormat: String,
  formattedValue: String,
  isHourDisabled: Function,
  size: String,
  isMinuteDisabled: Function,
  isSecondDisabled: Function,
  inputReadonly: Boolean,
  clearable: Boolean,
  status: String,
  "onUpdate:value": [Function, Array],
  onUpdateValue: [Function, Array],
  "onUpdate:show": [Function, Array],
  onUpdateShow: [Function, Array],
  onUpdateFormattedValue: [Function, Array],
  "onUpdate:formattedValue": [Function, Array],
  onBlur: [Function, Array],
  onConfirm: [Function, Array],
  onClear: Function,
  onFocus: [Function, Array],
  // https://www.iana.org/time-zones
  timeZone: String,
  showIcon: {
    type: Boolean,
    default: true
  },
  disabled: {
    type: Boolean,
    default: void 0
  },
  show: {
    type: Boolean,
    default: void 0
  },
  hours: {
    type: [Number, Array],
    validator: (value) => validateUnits(value, 23)
  },
  minutes: {
    type: [Number, Array],
    validator: (value) => validateUnits(value, 59)
  },
  seconds: {
    type: [Number, Array],
    validator: (value) => validateUnits(value, 59)
  },
  use12Hours: Boolean,
  // private
  stateful: {
    type: Boolean,
    default: true
  },
  // deprecated
  onChange: [Function, Array]
});
var TimePicker_default = defineComponent36({
  name: "TimePicker",
  props: timePickerProps,
  setup(props) {
    if (true) {
      watchEffect8(() => {
        if (props.onChange !== void 0) {
          warnOnce("time-picker", "`on-change` is deprecated, please use `on-update:value` instead.");
        }
      });
    }
    const {
      mergedBorderedRef,
      mergedClsPrefixRef,
      namespaceRef,
      inlineThemeDisabled
    } = useConfig(props);
    const {
      localeRef,
      dateLocaleRef
    } = useLocale("TimePicker");
    const formItem = useFormItem(props);
    const {
      mergedSizeRef,
      mergedDisabledRef,
      mergedStatusRef
    } = formItem;
    const themeRef = use_theme_default("TimePicker", "-time-picker", index_cssr_default8, light_default5, props, mergedClsPrefixRef);
    const keyboardState = useKeyboard();
    const inputInstRef = ref20(null);
    const panelInstRef = ref20(null);
    const dateFnsOptionsRef = computed20(() => {
      return {
        locale: dateLocaleRef.value.locale
      };
    });
    function getTimestampFromFormattedValue(value) {
      if (value === null) return null;
      return strictParse(value, props.valueFormat || props.format, /* @__PURE__ */ new Date(), dateFnsOptionsRef.value).getTime();
    }
    const {
      defaultValue,
      defaultFormattedValue
    } = props;
    const uncontrolledValueRef = ref20(defaultFormattedValue !== void 0 ? getTimestampFromFormattedValue(defaultFormattedValue) : defaultValue);
    const mergedValueRef = computed20(() => {
      const {
        formattedValue
      } = props;
      if (formattedValue !== void 0) {
        return getTimestampFromFormattedValue(formattedValue);
      }
      const {
        value
      } = props;
      if (value !== void 0) {
        return value;
      }
      return uncontrolledValueRef.value;
    });
    const mergedFormatRef = computed20(() => {
      const {
        timeZone
      } = props;
      if (timeZone) {
        return (date, format3, options) => {
          return formatInTimeZone(date, timeZone, format3, options);
        };
      } else {
        return (date, _format, options) => {
          return format(date, _format, options);
        };
      }
    });
    const displayTimeStringRef = ref20("");
    watch10(() => props.timeZone, () => {
      const mergedValue = mergedValueRef.value;
      displayTimeStringRef.value = mergedValue === null ? "" : mergedFormatRef.value(mergedValue, props.format, dateFnsOptionsRef.value);
    }, {
      immediate: true
    });
    const uncontrolledShowRef = ref20(false);
    const controlledShowRef = toRef9(props, "show");
    const mergedShowRef = useMergedState(controlledShowRef, uncontrolledShowRef);
    const memorizedValueRef = ref20(mergedValueRef.value);
    const transitionDisabledRef = ref20(false);
    const localizedClearRef = computed20(() => {
      return localeRef.value.clear;
    });
    const localizedNowRef = computed20(() => {
      return localeRef.value.now;
    });
    const localizedPlaceholderRef = computed20(() => {
      if (props.placeholder !== void 0) return props.placeholder;
      return localeRef.value.placeholder;
    });
    const localizedNegativeTextRef = computed20(() => {
      return localeRef.value.negativeText;
    });
    const localizedPositiveTextRef = computed20(() => {
      return localeRef.value.positiveText;
    });
    const hourInFormatRef = computed20(() => {
      return /H|h|K|k/.test(props.format);
    });
    const minuteInFormatRef = computed20(() => {
      return props.format.includes("m");
    });
    const secondInFormatRef = computed20(() => {
      return props.format.includes("s");
    });
    const hourValueRef = computed20(() => {
      const {
        value
      } = mergedValueRef;
      if (value === null) return null;
      return Number(mergedFormatRef.value(value, "HH", dateFnsOptionsRef.value));
    });
    const minuteValueRef = computed20(() => {
      const {
        value
      } = mergedValueRef;
      if (value === null) return null;
      return Number(mergedFormatRef.value(value, "mm", dateFnsOptionsRef.value));
    });
    const secondValueRef = computed20(() => {
      const {
        value
      } = mergedValueRef;
      if (value === null) return null;
      return Number(mergedFormatRef.value(value, "ss", dateFnsOptionsRef.value));
    });
    const isHourInvalidRef = computed20(() => {
      const {
        isHourDisabled
      } = props;
      if (hourValueRef.value === null) return false;
      if (!isTimeInStep(hourValueRef.value, "hours", props.hours)) return true;
      if (!isHourDisabled) return false;
      return isHourDisabled(hourValueRef.value);
    });
    const isMinuteInvalidRef = computed20(() => {
      const {
        value: minuteValue
      } = minuteValueRef;
      const {
        value: hourValue
      } = hourValueRef;
      if (minuteValue === null || hourValue === null) return false;
      if (!isTimeInStep(minuteValue, "minutes", props.minutes)) return true;
      const {
        isMinuteDisabled
      } = props;
      if (!isMinuteDisabled) return false;
      return isMinuteDisabled(minuteValue, hourValue);
    });
    const isSecondInvalidRef = computed20(() => {
      const {
        value: minuteValue
      } = minuteValueRef;
      const {
        value: hourValue
      } = hourValueRef;
      const {
        value: secondValue
      } = secondValueRef;
      if (secondValue === null || minuteValue === null || hourValue === null) {
        return false;
      }
      if (!isTimeInStep(secondValue, "seconds", props.seconds)) return true;
      const {
        isSecondDisabled
      } = props;
      if (!isSecondDisabled) return false;
      return isSecondDisabled(secondValue, minuteValue, hourValue);
    });
    const isValueInvalidRef = computed20(() => {
      return isHourInvalidRef.value || isMinuteInvalidRef.value || isSecondInvalidRef.value;
    });
    const mergedAttrSizeRef = computed20(() => {
      return props.format.length + 4;
    });
    const amPmValueRef = computed20(() => {
      const {
        value
      } = mergedValueRef;
      if (value === null) return null;
      return getHours(value) < 12 ? "am" : "pm";
    });
    function doUpdateFormattedValue(value, timestampValue) {
      const {
        onUpdateFormattedValue,
        "onUpdate:formattedValue": _onUpdateFormattedValue
      } = props;
      if (onUpdateFormattedValue) {
        call(onUpdateFormattedValue, value, timestampValue);
      }
      if (_onUpdateFormattedValue) {
        call(_onUpdateFormattedValue, value, timestampValue);
      }
    }
    function createFormattedValue(value) {
      return value === null ? null : mergedFormatRef.value(value, props.valueFormat || props.format);
    }
    function doUpdateValue(value) {
      const {
        onUpdateValue,
        "onUpdate:value": _onUpdateValue,
        onChange
      } = props;
      const {
        nTriggerFormChange,
        nTriggerFormInput
      } = formItem;
      const formattedValue = createFormattedValue(value);
      if (onUpdateValue) {
        call(onUpdateValue, value, formattedValue);
      }
      if (_onUpdateValue) {
        call(_onUpdateValue, value, formattedValue);
      }
      if (onChange) call(onChange, value, formattedValue);
      doUpdateFormattedValue(formattedValue, value);
      uncontrolledValueRef.value = value;
      nTriggerFormChange();
      nTriggerFormInput();
    }
    function doFocus(e) {
      const {
        onFocus
      } = props;
      const {
        nTriggerFormFocus
      } = formItem;
      if (onFocus) call(onFocus, e);
      nTriggerFormFocus();
    }
    function doBlur(e) {
      const {
        onBlur
      } = props;
      const {
        nTriggerFormBlur
      } = formItem;
      if (onBlur) call(onBlur, e);
      nTriggerFormBlur();
    }
    function doConfirm() {
      const {
        onConfirm
      } = props;
      if (onConfirm) {
        call(onConfirm, mergedValueRef.value, createFormattedValue(mergedValueRef.value));
      }
    }
    function handleTimeInputClear(e) {
      var _a;
      e.stopPropagation();
      doUpdateValue(null);
      deriveInputValue(null);
      (_a = props.onClear) === null || _a === void 0 ? void 0 : _a.call(props);
    }
    function handleFocusDetectorFocus() {
      closePanel({
        returnFocus: true
      });
    }
    function clearSelectedValue() {
      doUpdateValue(null);
      deriveInputValue(null);
      closePanel({
        returnFocus: true
      });
    }
    function handleInputKeydown(e) {
      if (e.key === "Escape" && mergedShowRef.value) {
        markEventEffectPerformed(e);
      }
    }
    function handleMenuKeydown(e) {
      var _a;
      switch (e.key) {
        case "Escape":
          if (mergedShowRef.value) {
            markEventEffectPerformed(e);
            closePanel({
              returnFocus: true
            });
          }
          break;
        case "Tab":
          if (keyboardState.shift && e.target === ((_a = panelInstRef.value) === null || _a === void 0 ? void 0 : _a.$el)) {
            e.preventDefault();
            closePanel({
              returnFocus: true
            });
          }
          break;
      }
    }
    function disableTransitionOneTick() {
      transitionDisabledRef.value = true;
      void nextTick5(() => {
        transitionDisabledRef.value = false;
      });
    }
    function handleTriggerClick(e) {
      if (mergedDisabledRef.value || happensIn(e, "clear")) return;
      if (!mergedShowRef.value) {
        openPanel();
      }
    }
    function handleHourClick(hour) {
      if (typeof hour === "string") return;
      if (mergedValueRef.value === null) {
        doUpdateValue(getTime(setHours(startOfHour(/* @__PURE__ */ new Date()), hour)));
      } else {
        doUpdateValue(getTime(setHours(mergedValueRef.value, hour)));
      }
    }
    function handleMinuteClick(minute) {
      if (typeof minute === "string") return;
      if (mergedValueRef.value === null) {
        doUpdateValue(getTime(setMinutes(startOfMinute(/* @__PURE__ */ new Date()), minute)));
      } else {
        doUpdateValue(getTime(setMinutes(mergedValueRef.value, minute)));
      }
    }
    function handleSecondClick(second) {
      if (typeof second === "string") return;
      if (mergedValueRef.value === null) {
        doUpdateValue(getTime(setSeconds(startOfSecond(/* @__PURE__ */ new Date()), second)));
      } else {
        doUpdateValue(getTime(setSeconds(mergedValueRef.value, second)));
      }
    }
    function handleAmPmClick(amPm) {
      const {
        value: mergedValue
      } = mergedValueRef;
      if (mergedValue === null) {
        const now = /* @__PURE__ */ new Date();
        const hours = getHours(now);
        if (amPm === "pm" && hours < 12) {
          doUpdateValue(getTime(setHours(now, hours + 12)));
        } else if (amPm === "am" && hours >= 12) {
          doUpdateValue(getTime(setHours(now, hours - 12)));
        }
        doUpdateValue(getTime(now));
      } else {
        const hours = getHours(mergedValue);
        if (amPm === "pm" && hours < 12) {
          doUpdateValue(getTime(setHours(mergedValue, hours + 12)));
        } else if (amPm === "am" && hours >= 12) {
          doUpdateValue(getTime(setHours(mergedValue, hours - 12)));
        }
      }
    }
    function deriveInputValue(time3) {
      if (time3 === void 0) time3 = mergedValueRef.value;
      if (time3 === null) {
        displayTimeStringRef.value = "";
      } else {
        displayTimeStringRef.value = mergedFormatRef.value(time3, props.format, dateFnsOptionsRef.value);
      }
    }
    function handleTimeInputFocus(e) {
      if (isInternalFocusSwitch(e)) return;
      doFocus(e);
    }
    function handleTimeInputBlur(e) {
      var _a;
      if (isInternalFocusSwitch(e)) return;
      if (mergedShowRef.value) {
        const panelEl = (_a = panelInstRef.value) === null || _a === void 0 ? void 0 : _a.$el;
        if (!(panelEl === null || panelEl === void 0 ? void 0 : panelEl.contains(e.relatedTarget))) {
          deriveInputValue();
          doBlur(e);
          closePanel({
            returnFocus: false
          });
        }
      } else {
        deriveInputValue();
        doBlur(e);
      }
    }
    function handleTimeInputActivate() {
      if (mergedDisabledRef.value) return;
      if (!mergedShowRef.value) {
        openPanel();
      }
    }
    function handleTimeInputDeactivate() {
      if (mergedDisabledRef.value) return;
      deriveInputValue();
      closePanel({
        returnFocus: false
      });
    }
    function scrollTimer() {
      if (!panelInstRef.value) return;
      const {
        hourScrollRef,
        minuteScrollRef,
        secondScrollRef,
        amPmScrollRef
      } = panelInstRef.value;
      [hourScrollRef, minuteScrollRef, secondScrollRef, amPmScrollRef].forEach((itemScrollRef) => {
        var _a;
        if (!itemScrollRef) return;
        const activeItemEl = (_a = itemScrollRef.contentRef) === null || _a === void 0 ? void 0 : _a.querySelector("[data-active]");
        if (activeItemEl) {
          itemScrollRef.scrollTo({
            top: activeItemEl.offsetTop
          });
        }
      });
    }
    function doUpdateShow(value) {
      uncontrolledShowRef.value = value;
      const {
        onUpdateShow,
        "onUpdate:show": _onUpdateShow
      } = props;
      if (onUpdateShow) call(onUpdateShow, value);
      if (_onUpdateShow) call(_onUpdateShow, value);
    }
    function isInternalFocusSwitch(e) {
      var _a, _b, _c;
      return !!(((_b = (_a = inputInstRef.value) === null || _a === void 0 ? void 0 : _a.wrapperElRef) === null || _b === void 0 ? void 0 : _b.contains(e.relatedTarget)) || ((_c = panelInstRef.value) === null || _c === void 0 ? void 0 : _c.$el.contains(e.relatedTarget)));
    }
    function openPanel() {
      memorizedValueRef.value = mergedValueRef.value;
      doUpdateShow(true);
      void nextTick5(scrollTimer);
    }
    function handleClickOutside(e) {
      var _a, _b;
      if (mergedShowRef.value && !((_b = (_a = inputInstRef.value) === null || _a === void 0 ? void 0 : _a.wrapperElRef) === null || _b === void 0 ? void 0 : _b.contains(getPreciseEventTarget(e)))) {
        closePanel({
          returnFocus: false
        });
      }
    }
    function closePanel({
      returnFocus
    }) {
      var _a;
      if (mergedShowRef.value) {
        doUpdateShow(false);
        if (returnFocus) {
          (_a = inputInstRef.value) === null || _a === void 0 ? void 0 : _a.focus();
        }
      }
    }
    function handleTimeInputUpdateValue(v) {
      if (v === "") {
        doUpdateValue(null);
        return;
      }
      const time3 = strictParse(v, props.format, /* @__PURE__ */ new Date(), dateFnsOptionsRef.value);
      displayTimeStringRef.value = v;
      if (isValid(time3)) {
        const {
          value: mergedValue
        } = mergedValueRef;
        if (mergedValue !== null) {
          const newTime = set(mergedValue, {
            hours: getHours(time3),
            minutes: getMinutes(time3),
            seconds: getSeconds(time3),
            milliseconds: getMilliseconds(time3)
          });
          doUpdateValue(getTime(newTime));
        } else {
          doUpdateValue(getTime(time3));
        }
      }
    }
    function handleCancelClick() {
      doUpdateValue(memorizedValueRef.value);
      doUpdateShow(false);
    }
    function handleNowClick() {
      const now = /* @__PURE__ */ new Date();
      const getNowTime = {
        hours: getHours,
        minutes: getMinutes,
        seconds: getSeconds
      };
      const [mergeHours, mergeMinutes, mergeSeconds] = ["hours", "minutes", "seconds"].map((i) => !props[i] || isTimeInStep(getNowTime[i](now), i, props[i]) ? getNowTime[i](now) : findSimilarTime(getNowTime[i](now), i, props[i]));
      const newValue = setSeconds(setMinutes(setHours(mergedValueRef.value ? mergedValueRef.value : getTime(now), mergeHours), mergeMinutes), mergeSeconds);
      doUpdateValue(getTime(newValue));
    }
    function handleConfirmClick() {
      deriveInputValue();
      doConfirm();
      closePanel({
        returnFocus: true
      });
    }
    function handleMenuFocusOut(e) {
      if (isInternalFocusSwitch(e)) return;
      deriveInputValue();
      doBlur(e);
      closePanel({
        returnFocus: false
      });
    }
    watch10(mergedValueRef, (value) => {
      deriveInputValue(value);
      disableTransitionOneTick();
      void nextTick5(scrollTimer);
    });
    watch10(mergedShowRef, () => {
      if (isValueInvalidRef.value) {
        doUpdateValue(memorizedValueRef.value);
      }
    });
    provide6(timePickerInjectionKey, {
      mergedThemeRef: themeRef,
      mergedClsPrefixRef
    });
    const exposedMethods = {
      focus: () => {
        var _a;
        (_a = inputInstRef.value) === null || _a === void 0 ? void 0 : _a.focus();
      },
      blur: () => {
        var _a;
        (_a = inputInstRef.value) === null || _a === void 0 ? void 0 : _a.blur();
      }
    };
    const triggerCssVarsRef = computed20(() => {
      const {
        common: {
          cubicBezierEaseInOut: cubicBezierEaseInOut4
        },
        self: {
          iconColor,
          iconColorDisabled
        }
      } = themeRef.value;
      return {
        "--n-icon-color-override": iconColor,
        "--n-icon-color-disabled-override": iconColorDisabled,
        "--n-bezier": cubicBezierEaseInOut4
      };
    });
    const triggerThemeClassHandle = inlineThemeDisabled ? useThemeClass("time-picker-trigger", void 0, triggerCssVarsRef, props) : void 0;
    const cssVarsRef = computed20(() => {
      const {
        self: {
          panelColor,
          itemTextColor,
          itemTextColorActive,
          itemColorHover,
          panelDividerColor,
          panelBoxShadow,
          itemOpacityDisabled,
          borderRadius,
          itemFontSize,
          itemWidth,
          itemHeight,
          panelActionPadding,
          itemBorderRadius
        },
        common: {
          cubicBezierEaseInOut: cubicBezierEaseInOut4
        }
      } = themeRef.value;
      return {
        "--n-bezier": cubicBezierEaseInOut4,
        "--n-border-radius": borderRadius,
        "--n-item-color-hover": itemColorHover,
        "--n-item-font-size": itemFontSize,
        "--n-item-height": itemHeight,
        "--n-item-opacity-disabled": itemOpacityDisabled,
        "--n-item-text-color": itemTextColor,
        "--n-item-text-color-active": itemTextColorActive,
        "--n-item-width": itemWidth,
        "--n-panel-action-padding": panelActionPadding,
        "--n-panel-box-shadow": panelBoxShadow,
        "--n-panel-color": panelColor,
        "--n-panel-divider-color": panelDividerColor,
        "--n-item-border-radius": itemBorderRadius
      };
    });
    const themeClassHandle = inlineThemeDisabled ? useThemeClass("time-picker", void 0, cssVarsRef, props) : void 0;
    return {
      focus: exposedMethods.focus,
      blur: exposedMethods.blur,
      mergedStatus: mergedStatusRef,
      mergedBordered: mergedBorderedRef,
      mergedClsPrefix: mergedClsPrefixRef,
      namespace: namespaceRef,
      uncontrolledValue: uncontrolledValueRef,
      mergedValue: mergedValueRef,
      isMounted: isMounted(),
      inputInstRef,
      panelInstRef,
      adjustedTo: useAdjustedTo(props),
      mergedShow: mergedShowRef,
      localizedClear: localizedClearRef,
      localizedNow: localizedNowRef,
      localizedPlaceholder: localizedPlaceholderRef,
      localizedNegativeText: localizedNegativeTextRef,
      localizedPositiveText: localizedPositiveTextRef,
      hourInFormat: hourInFormatRef,
      minuteInFormat: minuteInFormatRef,
      secondInFormat: secondInFormatRef,
      mergedAttrSize: mergedAttrSizeRef,
      displayTimeString: displayTimeStringRef,
      mergedSize: mergedSizeRef,
      mergedDisabled: mergedDisabledRef,
      isValueInvalid: isValueInvalidRef,
      isHourInvalid: isHourInvalidRef,
      isMinuteInvalid: isMinuteInvalidRef,
      isSecondInvalid: isSecondInvalidRef,
      transitionDisabled: transitionDisabledRef,
      hourValue: hourValueRef,
      minuteValue: minuteValueRef,
      secondValue: secondValueRef,
      amPmValue: amPmValueRef,
      handleInputKeydown,
      handleTimeInputFocus,
      handleTimeInputBlur,
      handleNowClick,
      handleConfirmClick,
      handleTimeInputUpdateValue,
      handleMenuFocusOut,
      handleCancelClick,
      handleClickOutside,
      handleTimeInputActivate,
      handleTimeInputDeactivate,
      handleHourClick,
      handleMinuteClick,
      handleSecondClick,
      handleAmPmClick,
      handleTimeInputClear,
      handleFocusDetectorFocus,
      handleMenuKeydown,
      handleTriggerClick,
      mergedTheme: themeRef,
      triggerCssVars: inlineThemeDisabled ? void 0 : triggerCssVarsRef,
      triggerThemeClass: triggerThemeClassHandle === null || triggerThemeClassHandle === void 0 ? void 0 : triggerThemeClassHandle.themeClass,
      triggerOnRender: triggerThemeClassHandle === null || triggerThemeClassHandle === void 0 ? void 0 : triggerThemeClassHandle.onRender,
      cssVars: inlineThemeDisabled ? void 0 : cssVarsRef,
      themeClass: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.themeClass,
      onRender: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.onRender,
      clearSelectedValue
    };
  },
  render() {
    const {
      mergedClsPrefix,
      $slots,
      triggerOnRender
    } = this;
    triggerOnRender === null || triggerOnRender === void 0 ? void 0 : triggerOnRender();
    return h35("div", {
      class: [`${mergedClsPrefix}-time-picker`, this.triggerThemeClass],
      style: this.triggerCssVars
    }, h35(Binder_default, null, {
      default: () => [h35(Target_default, null, {
        default: () => h35(Input_default, {
          ref: "inputInstRef",
          status: this.mergedStatus,
          value: this.displayTimeString,
          bordered: this.mergedBordered,
          passivelyActivated: true,
          attrSize: this.mergedAttrSize,
          theme: this.mergedTheme.peers.Input,
          themeOverrides: this.mergedTheme.peerOverrides.Input,
          stateful: this.stateful,
          size: this.mergedSize,
          placeholder: this.localizedPlaceholder,
          clearable: this.clearable,
          disabled: this.mergedDisabled,
          textDecoration: this.isValueInvalid ? "line-through" : void 0,
          onFocus: this.handleTimeInputFocus,
          onBlur: this.handleTimeInputBlur,
          onActivate: this.handleTimeInputActivate,
          onDeactivate: this.handleTimeInputDeactivate,
          onUpdateValue: this.handleTimeInputUpdateValue,
          onClear: this.handleTimeInputClear,
          internalDeactivateOnEnter: true,
          internalForceFocus: this.mergedShow,
          readonly: this.inputReadonly || this.mergedDisabled,
          onClick: this.handleTriggerClick,
          onKeydown: this.handleInputKeydown
        }, this.showIcon ? {
          [this.clearable ? "clear-icon-placeholder" : "suffix"]: () => h35(Icon_default, {
            clsPrefix: mergedClsPrefix,
            class: `${mergedClsPrefix}-time-picker-icon`
          }, {
            default: () => $slots.icon ? $slots.icon() : h35(Time_default, null)
          })
        } : null)
      }), h35(Follower_default, {
        teleportDisabled: this.adjustedTo === useAdjustedTo.tdkey,
        show: this.mergedShow,
        to: this.adjustedTo,
        containerClass: this.namespace,
        placement: this.placement
      }, {
        default: () => h35(Transition5, {
          name: "fade-in-scale-up-transition",
          appear: this.isMounted
        }, {
          default: () => {
            var _a;
            if (this.mergedShow) {
              (_a = this.onRender) === null || _a === void 0 ? void 0 : _a.call(this);
              return withDirectives4(h35(Panel_default, {
                ref: "panelInstRef",
                actions: this.actions,
                class: this.themeClass,
                style: this.cssVars,
                seconds: this.seconds,
                minutes: this.minutes,
                hours: this.hours,
                transitionDisabled: this.transitionDisabled,
                hourValue: this.hourValue,
                showHour: this.hourInFormat,
                isHourInvalid: this.isHourInvalid,
                isHourDisabled: this.isHourDisabled,
                minuteValue: this.minuteValue,
                showMinute: this.minuteInFormat,
                isMinuteInvalid: this.isMinuteInvalid,
                isMinuteDisabled: this.isMinuteDisabled,
                secondValue: this.secondValue,
                amPmValue: this.amPmValue,
                showSecond: this.secondInFormat,
                isSecondInvalid: this.isSecondInvalid,
                isSecondDisabled: this.isSecondDisabled,
                isValueInvalid: this.isValueInvalid,
                clearText: this.localizedClear,
                nowText: this.localizedNow,
                confirmText: this.localizedPositiveText,
                use12Hours: this.use12Hours,
                onFocusout: this.handleMenuFocusOut,
                onKeydown: this.handleMenuKeydown,
                onHourClick: this.handleHourClick,
                onMinuteClick: this.handleMinuteClick,
                onSecondClick: this.handleSecondClick,
                onAmPmClick: this.handleAmPmClick,
                onNowClick: this.handleNowClick,
                onConfirmClick: this.handleConfirmClick,
                onClearClick: this.clearSelectedValue,
                onFocusDetectorFocus: this.handleFocusDetectorFocus
              }), [[clickoutside_default, this.handleClickOutside, void 0, {
                capture: true
              }]]);
            }
            return null;
          }
        })
      })]
    }));
  }
});

// ../node_modules/naive-ui/es/date-picker/src/panel/datetime.mjs
var datetime_default = defineComponent37({
  name: "DateTimePanel",
  props: useCalendarProps,
  setup(props) {
    return useCalendar(props, "datetime");
  },
  render() {
    var _a, _b, _c, _d;
    const {
      mergedClsPrefix,
      mergedTheme,
      shortcuts,
      timePickerProps: timePickerProps2,
      datePickerSlots,
      onRender
    } = this;
    onRender === null || onRender === void 0 ? void 0 : onRender();
    return h36("div", {
      ref: "selfRef",
      tabindex: 0,
      class: [`${mergedClsPrefix}-date-panel`, `${mergedClsPrefix}-date-panel--datetime`, !this.panel && `${mergedClsPrefix}-date-panel--shadow`, this.themeClass],
      onKeydown: this.handlePanelKeyDown,
      onFocus: this.handlePanelFocus
    }, h36("div", {
      class: `${mergedClsPrefix}-date-panel-header`
    }, h36(Input_default, {
      value: this.dateInputValue,
      theme: mergedTheme.peers.Input,
      themeOverrides: mergedTheme.peerOverrides.Input,
      stateful: false,
      size: this.timePickerSize,
      readonly: this.inputReadonly,
      class: `${mergedClsPrefix}-date-panel-date-input`,
      textDecoration: this.isDateInvalid ? "line-through" : "",
      placeholder: this.locale.selectDate,
      onBlur: this.handleDateInputBlur,
      onUpdateValue: this.handleDateInput
    }), h36(TimePicker_default, Object.assign({
      size: this.timePickerSize,
      placeholder: this.locale.selectTime,
      format: this.timePickerFormat
    }, Array.isArray(timePickerProps2) ? void 0 : timePickerProps2, {
      showIcon: false,
      to: false,
      theme: mergedTheme.peers.TimePicker,
      themeOverrides: mergedTheme.peerOverrides.TimePicker,
      value: Array.isArray(this.value) ? null : this.value,
      isHourDisabled: this.isHourDisabled,
      isMinuteDisabled: this.isMinuteDisabled,
      isSecondDisabled: this.isSecondDisabled,
      onUpdateValue: this.handleTimePickerChange,
      stateful: false
    }))), h36("div", {
      class: `${mergedClsPrefix}-date-panel-calendar`
    }, h36("div", {
      class: `${mergedClsPrefix}-date-panel-month`
    }, h36("div", {
      class: `${mergedClsPrefix}-date-panel-month__fast-prev`,
      onClick: this.prevYear
    }, resolveSlot(datePickerSlots["prev-year"], () => [h36(FastBackward_default, null)])), h36("div", {
      class: `${mergedClsPrefix}-date-panel-month__prev`,
      onClick: this.prevMonth
    }, resolveSlot(datePickerSlots["prev-month"], () => [h36(Backward_default, null)])), h36(panelHeader_default, {
      monthYearSeparator: this.calendarHeaderMonthYearSeparator,
      monthBeforeYear: this.calendarMonthBeforeYear,
      value: this.calendarValue,
      onUpdateValue: this.onUpdateCalendarValue,
      mergedClsPrefix,
      calendarMonth: this.calendarMonth,
      calendarYear: this.calendarYear
    }), h36("div", {
      class: `${mergedClsPrefix}-date-panel-month__next`,
      onClick: this.nextMonth
    }, resolveSlot(datePickerSlots["next-month"], () => [h36(Forward_default, null)])), h36("div", {
      class: `${mergedClsPrefix}-date-panel-month__fast-next`,
      onClick: this.nextYear
    }, resolveSlot(datePickerSlots["next-year"], () => [h36(FastForward_default, null)]))), h36("div", {
      class: `${mergedClsPrefix}-date-panel-weekdays`
    }, this.weekdays.map((weekday) => h36("div", {
      key: weekday,
      class: `${mergedClsPrefix}-date-panel-weekdays__day`
    }, weekday))), h36("div", {
      class: `${mergedClsPrefix}-date-panel-dates`
    }, this.dateArray.map((dateItem2, i) => h36("div", {
      "data-n-date": true,
      key: i,
      class: [`${mergedClsPrefix}-date-panel-date`, {
        [`${mergedClsPrefix}-date-panel-date--current`]: dateItem2.isCurrentDate,
        [`${mergedClsPrefix}-date-panel-date--selected`]: dateItem2.selected,
        [`${mergedClsPrefix}-date-panel-date--excluded`]: !dateItem2.inCurrentMonth,
        [`${mergedClsPrefix}-date-panel-date--disabled`]: this.mergedIsDateDisabled(dateItem2.ts, {
          type: "date",
          year: dateItem2.dateObject.year,
          month: dateItem2.dateObject.month,
          date: dateItem2.dateObject.date
        })
      }],
      onClick: () => {
        this.handleDateClick(dateItem2);
      }
    }, h36("div", {
      class: `${mergedClsPrefix}-date-panel-date__trigger`
    }), dateItem2.dateObject.date, dateItem2.isCurrentDate ? h36("div", {
      class: `${mergedClsPrefix}-date-panel-date__sup`
    }) : null)))), this.datePickerSlots.footer ? h36("div", {
      class: `${mergedClsPrefix}-date-panel-footer`
    }, this.datePickerSlots.footer()) : null, ((_a = this.actions) === null || _a === void 0 ? void 0 : _a.length) || shortcuts ? h36("div", {
      class: `${mergedClsPrefix}-date-panel-actions`
    }, h36("div", {
      class: `${mergedClsPrefix}-date-panel-actions__prefix`
    }, shortcuts && Object.keys(shortcuts).map((key) => {
      const shortcut = shortcuts[key];
      return Array.isArray(shortcut) ? null : h36(XButton, {
        size: "tiny",
        onMouseenter: () => {
          this.handleSingleShortcutMouseenter(shortcut);
        },
        onClick: () => {
          this.handleSingleShortcutClick(shortcut);
        },
        onMouseleave: () => {
          this.handleShortcutMouseleave();
        }
      }, {
        default: () => key
      });
    })), h36("div", {
      class: `${mergedClsPrefix}-date-panel-actions__suffix`
    }, ((_b = this.actions) === null || _b === void 0 ? void 0 : _b.includes("clear")) ? resolveSlotWithTypedProps(this.datePickerSlots.clear, {
      onClear: this.clearSelectedDateTime,
      text: this.locale.clear
    }, () => [h36(Button_default, {
      theme: mergedTheme.peers.Button,
      themeOverrides: mergedTheme.peerOverrides.Button,
      size: "tiny",
      onClick: this.clearSelectedDateTime
    }, {
      default: () => this.locale.clear
    })]) : null, ((_c = this.actions) === null || _c === void 0 ? void 0 : _c.includes("now")) ? resolveSlotWithTypedProps(datePickerSlots.now, {
      onNow: this.handleNowClick,
      text: this.locale.now
    }, () => [h36(Button_default, {
      theme: mergedTheme.peers.Button,
      themeOverrides: mergedTheme.peerOverrides.Button,
      size: "tiny",
      onClick: this.handleNowClick
    }, {
      default: () => this.locale.now
    })]) : null, ((_d = this.actions) === null || _d === void 0 ? void 0 : _d.includes("confirm")) ? resolveSlotWithTypedProps(datePickerSlots.confirm, {
      onConfirm: this.handleConfirmClick,
      disabled: this.isDateInvalid,
      text: this.locale.confirm
    }, () => [h36(Button_default, {
      theme: mergedTheme.peers.Button,
      themeOverrides: mergedTheme.peerOverrides.Button,
      size: "tiny",
      type: "primary",
      disabled: this.isDateInvalid,
      onClick: this.handleConfirmClick
    }, {
      default: () => this.locale.confirm
    })]) : null)) : null, h36(focus_detector_default, {
      onFocus: this.handleFocusDetectorFocus
    }));
  }
});

// ../node_modules/naive-ui/es/date-picker/src/panel/datetimerange.mjs
import { defineComponent as defineComponent38, h as h37, watchEffect as watchEffect9 } from "vue";
var datetimerange_default = defineComponent38({
  name: "DateTimeRangePanel",
  props: useDualCalendarProps,
  setup(props) {
    if (true) {
      watchEffect9(() => {
        var _a;
        if ((_a = props.actions) === null || _a === void 0 ? void 0 : _a.includes("now")) {
          warnOnce("date-picker", "The `now` action is not supported for n-date-picker of `datetimerange` type");
        }
      });
    }
    return useDualCalendar(props, "datetimerange");
  },
  render() {
    var _a, _b, _c;
    const {
      mergedClsPrefix,
      mergedTheme,
      shortcuts,
      timePickerProps: timePickerProps2,
      onRender,
      datePickerSlots
    } = this;
    onRender === null || onRender === void 0 ? void 0 : onRender();
    return h37("div", {
      ref: "selfRef",
      tabindex: 0,
      class: [`${mergedClsPrefix}-date-panel`, `${mergedClsPrefix}-date-panel--datetimerange`, !this.panel && `${mergedClsPrefix}-date-panel--shadow`, this.themeClass],
      onKeydown: this.handlePanelKeyDown,
      onFocus: this.handlePanelFocus
    }, h37("div", {
      class: `${mergedClsPrefix}-date-panel-header`
    }, h37(Input_default, {
      value: this.startDateDisplayString,
      theme: mergedTheme.peers.Input,
      themeOverrides: mergedTheme.peerOverrides.Input,
      size: this.timePickerSize,
      stateful: false,
      readonly: this.inputReadonly,
      class: `${mergedClsPrefix}-date-panel-date-input`,
      textDecoration: this.isStartValueInvalid ? "line-through" : "",
      placeholder: this.locale.selectDate,
      onBlur: this.handleStartDateInputBlur,
      onUpdateValue: this.handleStartDateInput
    }), h37(TimePicker_default, Object.assign({
      placeholder: this.locale.selectTime,
      format: this.timePickerFormat,
      size: this.timePickerSize
    }, Array.isArray(timePickerProps2) ? timePickerProps2[0] : timePickerProps2, {
      value: this.startTimeValue,
      to: false,
      showIcon: false,
      disabled: this.isSelecting,
      theme: mergedTheme.peers.TimePicker,
      themeOverrides: mergedTheme.peerOverrides.TimePicker,
      stateful: false,
      isHourDisabled: this.isStartHourDisabled,
      isMinuteDisabled: this.isStartMinuteDisabled,
      isSecondDisabled: this.isStartSecondDisabled,
      onUpdateValue: this.handleStartTimePickerChange
    })), h37(Input_default, {
      value: this.endDateInput,
      theme: mergedTheme.peers.Input,
      themeOverrides: mergedTheme.peerOverrides.Input,
      stateful: false,
      size: this.timePickerSize,
      readonly: this.inputReadonly,
      class: `${mergedClsPrefix}-date-panel-date-input`,
      textDecoration: this.isEndValueInvalid ? "line-through" : "",
      placeholder: this.locale.selectDate,
      onBlur: this.handleEndDateInputBlur,
      onUpdateValue: this.handleEndDateInput
    }), h37(TimePicker_default, Object.assign({
      placeholder: this.locale.selectTime,
      format: this.timePickerFormat,
      size: this.timePickerSize
    }, Array.isArray(timePickerProps2) ? timePickerProps2[1] : timePickerProps2, {
      disabled: this.isSelecting,
      showIcon: false,
      theme: mergedTheme.peers.TimePicker,
      themeOverrides: mergedTheme.peerOverrides.TimePicker,
      to: false,
      stateful: false,
      value: this.endTimeValue,
      isHourDisabled: this.isEndHourDisabled,
      isMinuteDisabled: this.isEndMinuteDisabled,
      isSecondDisabled: this.isEndSecondDisabled,
      onUpdateValue: this.handleEndTimePickerChange
    }))), h37("div", {
      ref: "startDatesElRef",
      class: `${mergedClsPrefix}-date-panel-calendar ${mergedClsPrefix}-date-panel-calendar--start`
    }, h37("div", {
      class: `${mergedClsPrefix}-date-panel-month`
    }, h37("div", {
      class: `${mergedClsPrefix}-date-panel-month__fast-prev`,
      onClick: this.startCalendarPrevYear
    }, resolveSlot(datePickerSlots["prev-year"], () => [h37(FastBackward_default, null)])), h37("div", {
      class: `${mergedClsPrefix}-date-panel-month__prev`,
      onClick: this.startCalendarPrevMonth
    }, resolveSlot(datePickerSlots["prev-month"], () => [h37(Backward_default, null)])), h37(panelHeader_default, {
      monthYearSeparator: this.calendarHeaderMonthYearSeparator,
      monthBeforeYear: this.calendarMonthBeforeYear,
      value: this.startCalendarDateTime,
      onUpdateValue: this.onUpdateStartCalendarValue,
      mergedClsPrefix,
      calendarMonth: this.startCalendarMonth,
      calendarYear: this.startCalendarYear
    }), h37("div", {
      class: `${mergedClsPrefix}-date-panel-month__next`,
      onClick: this.startCalendarNextMonth
    }, resolveSlot(datePickerSlots["next-month"], () => [h37(Forward_default, null)])), h37("div", {
      class: `${mergedClsPrefix}-date-panel-month__fast-next`,
      onClick: this.startCalendarNextYear
    }, resolveSlot(datePickerSlots["next-year"], () => [h37(FastForward_default, null)]))), h37("div", {
      class: `${mergedClsPrefix}-date-panel-weekdays`
    }, this.weekdays.map((weekday) => h37("div", {
      key: weekday,
      class: `${mergedClsPrefix}-date-panel-weekdays__day`
    }, weekday))), h37("div", {
      class: `${mergedClsPrefix}-date-panel__divider`
    }), h37("div", {
      class: `${mergedClsPrefix}-date-panel-dates`
    }, this.startDateArray.map((dateItem2, i) => {
      const disabled = this.mergedIsDateDisabled(dateItem2.ts);
      return h37("div", {
        "data-n-date": true,
        key: i,
        class: [`${mergedClsPrefix}-date-panel-date`, {
          [`${mergedClsPrefix}-date-panel-date--excluded`]: !dateItem2.inCurrentMonth,
          [`${mergedClsPrefix}-date-panel-date--current`]: dateItem2.isCurrentDate,
          [`${mergedClsPrefix}-date-panel-date--selected`]: dateItem2.selected,
          [`${mergedClsPrefix}-date-panel-date--covered`]: dateItem2.inSpan,
          [`${mergedClsPrefix}-date-panel-date--start`]: dateItem2.startOfSpan,
          [`${mergedClsPrefix}-date-panel-date--end`]: dateItem2.endOfSpan,
          [`${mergedClsPrefix}-date-panel-date--disabled`]: disabled
        }],
        onClick: disabled ? void 0 : () => {
          this.handleDateClick(dateItem2);
        },
        onMouseenter: disabled ? void 0 : () => {
          this.handleDateMouseEnter(dateItem2);
        }
      }, h37("div", {
        class: `${mergedClsPrefix}-date-panel-date__trigger`
      }), dateItem2.dateObject.date, dateItem2.isCurrentDate ? h37("div", {
        class: `${mergedClsPrefix}-date-panel-date__sup`
      }) : null);
    }))), h37("div", {
      class: `${mergedClsPrefix}-date-panel__vertical-divider`
    }), h37("div", {
      ref: "endDatesElRef",
      class: `${mergedClsPrefix}-date-panel-calendar ${mergedClsPrefix}-date-panel-calendar--end`
    }, h37("div", {
      class: `${mergedClsPrefix}-date-panel-month`
    }, h37("div", {
      class: `${mergedClsPrefix}-date-panel-month__fast-prev`,
      onClick: this.endCalendarPrevYear
    }, resolveSlot(datePickerSlots["prev-year"], () => [h37(FastBackward_default, null)])), h37("div", {
      class: `${mergedClsPrefix}-date-panel-month__prev`,
      onClick: this.endCalendarPrevMonth
    }, resolveSlot(datePickerSlots["prev-month"], () => [h37(Backward_default, null)])), h37(panelHeader_default, {
      monthBeforeYear: this.calendarMonthBeforeYear,
      value: this.endCalendarDateTime,
      onUpdateValue: this.onUpdateEndCalendarValue,
      mergedClsPrefix,
      monthYearSeparator: this.calendarHeaderMonthYearSeparator,
      calendarMonth: this.endCalendarMonth,
      calendarYear: this.endCalendarYear
    }), h37("div", {
      class: `${mergedClsPrefix}-date-panel-month__next`,
      onClick: this.endCalendarNextMonth
    }, resolveSlot(datePickerSlots["next-month"], () => [h37(Forward_default, null)])), h37("div", {
      class: `${mergedClsPrefix}-date-panel-month__fast-next`,
      onClick: this.endCalendarNextYear
    }, resolveSlot(datePickerSlots["next-year"], () => [h37(FastForward_default, null)]))), h37("div", {
      class: `${mergedClsPrefix}-date-panel-weekdays`
    }, this.weekdays.map((weekday) => h37("div", {
      key: weekday,
      class: `${mergedClsPrefix}-date-panel-weekdays__day`
    }, weekday))), h37("div", {
      class: `${mergedClsPrefix}-date-panel__divider`
    }), h37("div", {
      class: `${mergedClsPrefix}-date-panel-dates`
    }, this.endDateArray.map((dateItem2, i) => {
      const disabled = this.mergedIsDateDisabled(dateItem2.ts);
      return h37("div", {
        "data-n-date": true,
        key: i,
        class: [`${mergedClsPrefix}-date-panel-date`, {
          [`${mergedClsPrefix}-date-panel-date--excluded`]: !dateItem2.inCurrentMonth,
          [`${mergedClsPrefix}-date-panel-date--current`]: dateItem2.isCurrentDate,
          [`${mergedClsPrefix}-date-panel-date--selected`]: dateItem2.selected,
          [`${mergedClsPrefix}-date-panel-date--covered`]: dateItem2.inSpan,
          [`${mergedClsPrefix}-date-panel-date--start`]: dateItem2.startOfSpan,
          [`${mergedClsPrefix}-date-panel-date--end`]: dateItem2.endOfSpan,
          [`${mergedClsPrefix}-date-panel-date--disabled`]: disabled
        }],
        onClick: disabled ? void 0 : () => {
          this.handleDateClick(dateItem2);
        },
        onMouseenter: disabled ? void 0 : () => {
          this.handleDateMouseEnter(dateItem2);
        }
      }, h37("div", {
        class: `${mergedClsPrefix}-date-panel-date__trigger`
      }), dateItem2.dateObject.date, dateItem2.isCurrentDate ? h37("div", {
        class: `${mergedClsPrefix}-date-panel-date__sup`
      }) : null);
    }))), this.datePickerSlots.footer ? h37("div", {
      class: `${mergedClsPrefix}-date-panel-footer`
    }, this.datePickerSlots.footer()) : null, ((_a = this.actions) === null || _a === void 0 ? void 0 : _a.length) || shortcuts ? h37("div", {
      class: `${mergedClsPrefix}-date-panel-actions`
    }, h37("div", {
      class: `${mergedClsPrefix}-date-panel-actions__prefix`
    }, shortcuts && Object.keys(shortcuts).map((key) => {
      const shortcut = shortcuts[key];
      return Array.isArray(shortcut) || typeof shortcut === "function" ? h37(XButton, {
        size: "tiny",
        onMouseenter: () => {
          this.handleRangeShortcutMouseenter(shortcut);
        },
        onClick: () => {
          this.handleRangeShortcutClick(shortcut);
        },
        onMouseleave: () => {
          this.handleShortcutMouseleave();
        }
      }, {
        default: () => key
      }) : null;
    })), h37("div", {
      class: `${mergedClsPrefix}-date-panel-actions__suffix`
    }, ((_b = this.actions) === null || _b === void 0 ? void 0 : _b.includes("clear")) ? resolveSlotWithTypedProps(datePickerSlots.clear, {
      onClear: this.handleClearClick,
      text: this.locale.clear
    }, () => [h37(Button_default, {
      theme: mergedTheme.peers.Button,
      themeOverrides: mergedTheme.peerOverrides.Button,
      size: "tiny",
      onClick: this.handleClearClick
    }, {
      default: () => this.locale.clear
    })]) : null, ((_c = this.actions) === null || _c === void 0 ? void 0 : _c.includes("confirm")) ? resolveSlotWithTypedProps(datePickerSlots.confirm, {
      onConfirm: this.handleConfirmClick,
      disabled: this.isRangeInvalid || this.isSelecting,
      text: this.locale.confirm
    }, () => [h37(Button_default, {
      theme: mergedTheme.peers.Button,
      themeOverrides: mergedTheme.peerOverrides.Button,
      size: "tiny",
      type: "primary",
      disabled: this.isRangeInvalid || this.isSelecting,
      onClick: this.handleConfirmClick
    }, {
      default: () => this.locale.confirm
    })]) : null)) : null, h37(focus_detector_default, {
      onFocus: this.handleFocusDetectorFocus
    }));
  }
});

// ../node_modules/naive-ui/es/date-picker/src/panel/monthrange.mjs
import { defineComponent as defineComponent39, h as h38, onMounted as onMounted10, watchEffect as watchEffect10 } from "vue";
var monthrange_default = defineComponent39({
  name: "MonthRangePanel",
  props: Object.assign(Object.assign({}, useDualCalendarProps), {
    type: {
      type: String,
      required: true
    }
  }),
  setup(props) {
    if (true) {
      watchEffect10(() => {
        var _a;
        if ((_a = props.actions) === null || _a === void 0 ? void 0 : _a.includes("now")) {
          warnOnce("date-picker", `The \`now\` action is not supported for n-date-picker of ${props.type}type`);
        }
      });
    }
    const useCalendarRef = useDualCalendar(props, props.type);
    const {
      dateLocaleRef
    } = useLocale("DatePicker");
    const renderItem = (item, i, mergedClsPrefix, type) => {
      const {
        handleColItemClick
      } = useCalendarRef;
      const disabled = false;
      return h38("div", {
        "data-n-date": true,
        key: i,
        class: [`${mergedClsPrefix}-date-panel-month-calendar__picker-col-item`, item.isCurrent && `${mergedClsPrefix}-date-panel-month-calendar__picker-col-item--current`, item.selected && `${mergedClsPrefix}-date-panel-month-calendar__picker-col-item--selected`, disabled && `${mergedClsPrefix}-date-panel-month-calendar__picker-col-item--disabled`],
        onClick: disabled ? void 0 : () => {
          handleColItemClick(item, type);
        }
      }, item.type === "month" ? getMonthString(item.dateObject.month, item.monthFormat, dateLocaleRef.value.locale) : item.type === "quarter" ? getQuarterString(item.dateObject.quarter, item.quarterFormat, dateLocaleRef.value.locale) : getYearString(item.dateObject.year, item.yearFormat, dateLocaleRef.value.locale));
    };
    onMounted10(() => {
      useCalendarRef.justifyColumnsScrollState();
    });
    return Object.assign(Object.assign({}, useCalendarRef), {
      renderItem
    });
  },
  render() {
    var _a, _b, _c;
    const {
      mergedClsPrefix,
      mergedTheme,
      shortcuts,
      type,
      renderItem,
      onRender
    } = this;
    onRender === null || onRender === void 0 ? void 0 : onRender();
    return h38("div", {
      ref: "selfRef",
      tabindex: 0,
      class: [`${mergedClsPrefix}-date-panel`, `${mergedClsPrefix}-date-panel--daterange`, !this.panel && `${mergedClsPrefix}-date-panel--shadow`, this.themeClass],
      onKeydown: this.handlePanelKeyDown,
      onFocus: this.handlePanelFocus
    }, h38("div", {
      ref: "startDatesElRef",
      class: `${mergedClsPrefix}-date-panel-calendar ${mergedClsPrefix}-date-panel-calendar--start`
    }, h38("div", {
      class: `${mergedClsPrefix}-date-panel-month-calendar`
    }, h38(Scrollbar_default, {
      ref: "startYearScrollbarRef",
      class: `${mergedClsPrefix}-date-panel-month-calendar__picker-col`,
      theme: mergedTheme.peers.Scrollbar,
      themeOverrides: mergedTheme.peerOverrides.Scrollbar,
      container: () => this.virtualListContainer("start"),
      content: () => this.virtualListContent("start"),
      horizontalRailStyle: {
        zIndex: 1
      },
      verticalRailStyle: {
        zIndex: 1
      }
    }, {
      default: () => h38(VirtualList_default, {
        ref: "startYearVlRef",
        items: this.startYearArray,
        itemSize: MONTH_ITEM_HEIGHT,
        showScrollbar: false,
        keyField: "ts",
        onScroll: this.handleStartYearVlScroll,
        paddingBottom: 4
      }, {
        default: ({
          item,
          index
        }) => {
          return renderItem(item, index, mergedClsPrefix, "start");
        }
      })
    }), type === "monthrange" || type === "quarterrange" ? h38("div", {
      class: `${mergedClsPrefix}-date-panel-month-calendar__picker-col`
    }, h38(Scrollbar_default, {
      ref: "startMonthScrollbarRef",
      theme: mergedTheme.peers.Scrollbar,
      themeOverrides: mergedTheme.peerOverrides.Scrollbar
    }, {
      default: () => [(type === "monthrange" ? this.startMonthArray : this.startQuarterArray).map((item, i) => renderItem(item, i, mergedClsPrefix, "start")), type === "monthrange" && h38("div", {
        class: `${mergedClsPrefix}-date-panel-month-calendar__padding`
      })]
    })) : null)), h38("div", {
      class: `${mergedClsPrefix}-date-panel__vertical-divider`
    }), h38("div", {
      ref: "endDatesElRef",
      class: `${mergedClsPrefix}-date-panel-calendar ${mergedClsPrefix}-date-panel-calendar--end`
    }, h38("div", {
      class: `${mergedClsPrefix}-date-panel-month-calendar`
    }, h38(Scrollbar_default, {
      ref: "endYearScrollbarRef",
      class: `${mergedClsPrefix}-date-panel-month-calendar__picker-col`,
      theme: mergedTheme.peers.Scrollbar,
      themeOverrides: mergedTheme.peerOverrides.Scrollbar,
      container: () => this.virtualListContainer("end"),
      content: () => this.virtualListContent("end"),
      horizontalRailStyle: {
        zIndex: 1
      },
      verticalRailStyle: {
        zIndex: 1
      }
    }, {
      default: () => h38(VirtualList_default, {
        ref: "endYearVlRef",
        items: this.endYearArray,
        itemSize: MONTH_ITEM_HEIGHT,
        showScrollbar: false,
        keyField: "ts",
        onScroll: this.handleEndYearVlScroll,
        paddingBottom: 4
      }, {
        default: ({
          item,
          index
        }) => {
          return renderItem(item, index, mergedClsPrefix, "end");
        }
      })
    }), type === "monthrange" || type === "quarterrange" ? h38("div", {
      class: `${mergedClsPrefix}-date-panel-month-calendar__picker-col`
    }, h38(Scrollbar_default, {
      ref: "endMonthScrollbarRef",
      theme: mergedTheme.peers.Scrollbar,
      themeOverrides: mergedTheme.peerOverrides.Scrollbar
    }, {
      default: () => [(type === "monthrange" ? this.endMonthArray : this.endQuarterArray).map((item, i) => renderItem(item, i, mergedClsPrefix, "end")), type === "monthrange" && h38("div", {
        class: `${mergedClsPrefix}-date-panel-month-calendar__padding`
      })]
    })) : null)), resolveWrappedSlot(this.datePickerSlots.footer, (children) => {
      return children ? h38("div", {
        class: `${mergedClsPrefix}-date-panel-footer`
      }, children) : null;
    }), ((_a = this.actions) === null || _a === void 0 ? void 0 : _a.length) || shortcuts ? h38("div", {
      class: `${mergedClsPrefix}-date-panel-actions`
    }, h38("div", {
      class: `${mergedClsPrefix}-date-panel-actions__prefix`
    }, shortcuts && Object.keys(shortcuts).map((key) => {
      const shortcut = shortcuts[key];
      return Array.isArray(shortcut) || typeof shortcut === "function" ? h38(XButton, {
        size: "tiny",
        onMouseenter: () => {
          this.handleRangeShortcutMouseenter(shortcut);
        },
        onClick: () => {
          this.handleRangeShortcutClick(shortcut);
        },
        onMouseleave: () => {
          this.handleShortcutMouseleave();
        }
      }, {
        default: () => key
      }) : null;
    })), h38("div", {
      class: `${mergedClsPrefix}-date-panel-actions__suffix`
    }, ((_b = this.actions) === null || _b === void 0 ? void 0 : _b.includes("clear")) ? resolveSlotWithTypedProps(this.datePickerSlots.clear, {
      onClear: this.handleClearClick,
      text: this.locale.clear
    }, () => [h38(XButton, {
      theme: mergedTheme.peers.Button,
      themeOverrides: mergedTheme.peerOverrides.Button,
      size: "tiny",
      onClick: this.handleClearClick
    }, {
      default: () => this.locale.clear
    })]) : null, ((_c = this.actions) === null || _c === void 0 ? void 0 : _c.includes("confirm")) ? resolveSlotWithTypedProps(this.datePickerSlots.confirm, {
      disabled: this.isRangeInvalid,
      onConfirm: this.handleConfirmClick,
      text: this.locale.confirm
    }, () => [h38(XButton, {
      theme: mergedTheme.peers.Button,
      themeOverrides: mergedTheme.peerOverrides.Button,
      size: "tiny",
      type: "primary",
      disabled: this.isRangeInvalid,
      onClick: this.handleConfirmClick
    }, {
      default: () => this.locale.confirm
    })]) : null)) : null, h38(focus_detector_default, {
      onFocus: this.handleFocusDetectorFocus
    }));
  }
});

// ../node_modules/naive-ui/es/date-picker/src/props.mjs
var datePickerProps = Object.assign(Object.assign({}, use_theme_default.props), {
  to: useAdjustedTo.propTo,
  bordered: {
    type: Boolean,
    default: void 0
  },
  clearable: Boolean,
  updateValueOnClose: Boolean,
  calendarDayFormat: String,
  calendarHeaderYearFormat: String,
  calendarHeaderMonthFormat: String,
  calendarHeaderMonthYearSeparator: {
    type: String,
    default: " "
  },
  calendarHeaderMonthBeforeYear: {
    type: Boolean,
    default: void 0
  },
  defaultValue: [Number, Array],
  defaultFormattedValue: [String, Array],
  defaultTime: [Number, String, Array],
  disabled: {
    type: Boolean,
    default: void 0
  },
  placement: {
    type: String,
    default: "bottom-start"
  },
  value: [Number, Array],
  formattedValue: [String, Array],
  size: String,
  type: {
    type: String,
    default: "date"
  },
  valueFormat: String,
  separator: String,
  placeholder: String,
  startPlaceholder: String,
  endPlaceholder: String,
  format: String,
  dateFormat: String,
  timePickerFormat: String,
  actions: Array,
  shortcuts: Object,
  isDateDisabled: Function,
  isTimeDisabled: Function,
  show: {
    type: Boolean,
    default: void 0
  },
  panel: Boolean,
  ranges: Object,
  firstDayOfWeek: Number,
  inputReadonly: Boolean,
  closeOnSelect: Boolean,
  status: String,
  timePickerProps: [Object, Array],
  onClear: Function,
  onConfirm: Function,
  defaultCalendarStartTime: Number,
  defaultCalendarEndTime: Number,
  bindCalendarMonths: Boolean,
  monthFormat: {
    type: String,
    default: "M"
  },
  yearFormat: {
    type: String,
    default: "y"
  },
  quarterFormat: {
    type: String,
    default: "'Q'Q"
  },
  yearRange: {
    type: Array,
    default: () => [1901, 2100]
  },
  "onUpdate:show": [Function, Array],
  onUpdateShow: [Function, Array],
  "onUpdate:formattedValue": [Function, Array],
  onUpdateFormattedValue: [Function, Array],
  "onUpdate:value": [Function, Array],
  onUpdateValue: [Function, Array],
  onFocus: [Function, Array],
  onBlur: [Function, Array],
  onNextMonth: Function,
  onPrevMonth: Function,
  onNextYear: Function,
  onPrevYear: Function,
  // deprecated
  onChange: [Function, Array]
});

// ../node_modules/naive-ui/es/date-picker/src/styles/index.cssr.mjs
var index_cssr_default9 = c2([cB("date-picker", `
 position: relative;
 z-index: auto;
 `, [cB("date-picker-icon", `
 color: var(--n-icon-color-override);
 transition: color .3s var(--n-bezier);
 `), cB("icon", `
 color: var(--n-icon-color-override);
 transition: color .3s var(--n-bezier);
 `), cM("disabled", [cB("date-picker-icon", `
 color: var(--n-icon-color-disabled-override);
 `), cB("icon", `
 color: var(--n-icon-color-disabled-override);
 `)])]), cB("date-panel", `
 width: fit-content;
 outline: none;
 margin: 4px 0;
 display: grid;
 grid-template-columns: 0fr;
 border-radius: var(--n-panel-border-radius);
 background-color: var(--n-panel-color);
 color: var(--n-panel-text-color);
 user-select: none;
 `, [fadeInScaleUpTransition(), cM("shadow", `
 box-shadow: var(--n-panel-box-shadow);
 `), cB("date-panel-calendar", {
  padding: "var(--n-calendar-left-padding)",
  display: "grid",
  gridTemplateColumns: "1fr",
  gridArea: "left-calendar"
}, [cM("end", {
  padding: "var(--n-calendar-right-padding)",
  gridArea: "right-calendar"
})]), cB("date-panel-month-calendar", {
  display: "flex",
  gridArea: "left-calendar"
}, [cE("picker-col", `
 min-width: var(--n-scroll-item-width);
 height: calc(var(--n-scroll-item-height) * 6);
 user-select: none;
 -webkit-user-select: none;
 `, [c2("&:first-child", `
 min-width: calc(var(--n-scroll-item-width) + 4px);
 `, [cE("picker-col-item", [c2("&::before", "left: 4px;")])]), cE("padding", `
 height: calc(var(--n-scroll-item-height) * 5)
 `)]), cE("picker-col-item", `
 z-index: 0;
 cursor: pointer;
 height: var(--n-scroll-item-height);
 box-sizing: border-box;
 padding-top: 4px;
 display: flex;
 align-items: center;
 justify-content: center;
 position: relative;
 transition: 
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 background: #0000;
 color: var(--n-item-text-color);
 `, [c2("&::before", `
 z-index: -1;
 content: "";
 position: absolute;
 left: 0;
 right: 4px;
 top: 4px;
 bottom: 0;
 border-radius: var(--n-scroll-item-border-radius);
 transition: 
 background-color .3s var(--n-bezier);
 `), cNotM("disabled", [c2("&:hover::before", `
 background-color: var(--n-item-color-hover);
 `), cM("selected", `
 color: var(--n-item-color-active);
 `, [c2("&::before", "background-color: var(--n-item-color-hover);")])]), cM("disabled", `
 color: var(--n-item-text-color-disabled);
 cursor: not-allowed;
 `, [cM("selected", [c2("&::before", `
 background-color: var(--n-item-color-disabled);
 `)])])])]), cM("date", {
  gridTemplateAreas: `
 "left-calendar"
 "footer"
 "action"
 `
}), cM("week", {
  gridTemplateAreas: `
 "left-calendar"
 "footer"
 "action"
 `
}), cM("daterange", {
  gridTemplateAreas: `
 "left-calendar divider right-calendar"
 "footer footer footer"
 "action action action"
 `
}), cM("datetime", {
  gridTemplateAreas: `
 "header"
 "left-calendar"
 "footer"
 "action"
 `
}), cM("datetimerange", {
  gridTemplateAreas: `
 "header header header"
 "left-calendar divider right-calendar"
 "footer footer footer"
 "action action action"
 `
}), cM("month", {
  gridTemplateAreas: `
 "left-calendar"
 "footer"
 "action"
 `
}), cB("date-panel-footer", {
  gridArea: "footer"
}), cB("date-panel-actions", {
  gridArea: "action"
}), cB("date-panel-header", {
  gridArea: "header"
}), cB("date-panel-header", `
 box-sizing: border-box;
 width: 100%;
 align-items: center;
 padding: var(--n-panel-header-padding);
 display: flex;
 justify-content: space-between;
 border-bottom: 1px solid var(--n-panel-header-divider-color);
 `, [c2(">", [c2("*:not(:last-child)", {
  marginRight: "10px"
}), c2("*", {
  flex: 1,
  width: 0
}), cB("time-picker", {
  zIndex: 1
})])]), cB("date-panel-month", `
 box-sizing: border-box;
 display: grid;
 grid-template-columns: var(--n-calendar-title-grid-template-columns);
 align-items: center;
 justify-items: center;
 padding: var(--n-calendar-title-padding);
 height: var(--n-calendar-title-height);
 `, [cE("prev, next, fast-prev, fast-next", `
 line-height: 0;
 cursor: pointer;
 width: var(--n-arrow-size);
 height: var(--n-arrow-size);
 color: var(--n-arrow-color);
 `), cE("month-year", `
 user-select: none;
 -webkit-user-select: none;
 flex-grow: 1;
 position: relative;
 `, [cE("text", `
 font-size: var(--n-calendar-title-font-size);
 line-height: var(--n-calendar-title-font-size);
 font-weight: var(--n-calendar-title-font-weight);
 padding: 6px 8px;
 text-align: center;
 color: var(--n-calendar-title-text-color);
 cursor: pointer;
 transition: background-color .3s var(--n-bezier);
 border-radius: var(--n-panel-border-radius);
 `, [cM("active", `
 background-color: var(--n-calendar-title-color-hover);
 `), c2("&:hover", `
 background-color: var(--n-calendar-title-color-hover);
 `)])])]), cB("date-panel-weekdays", `
 display: grid;
 margin: auto;
 grid-template-columns: repeat(7, var(--n-item-cell-width));
 grid-template-rows: repeat(1, var(--n-item-cell-height));
 align-items: center;
 justify-items: center;
 margin-bottom: 4px;
 border-bottom: 1px solid var(--n-calendar-days-divider-color);
 `, [cE("day", `
 white-space: nowrap;
 user-select: none;
 -webkit-user-select: none;
 line-height: 15px;
 width: var(--n-item-size);
 text-align: center;
 font-size: var(--n-calendar-days-font-size);
 color: var(--n-item-text-color);
 display: flex;
 align-items: center;
 justify-content: center;
 `)]), cB("date-panel-dates", `
 margin: auto;
 display: grid;
 grid-template-columns: repeat(7, var(--n-item-cell-width));
 grid-template-rows: repeat(6, var(--n-item-cell-height));
 align-items: center;
 justify-items: center;
 flex-wrap: wrap;
 `, [cB("date-panel-date", `
 user-select: none;
 -webkit-user-select: none;
 position: relative;
 width: var(--n-item-size);
 height: var(--n-item-size);
 line-height: var(--n-item-size);
 text-align: center;
 font-size: var(--n-item-font-size);
 border-radius: var(--n-item-border-radius);
 z-index: 0;
 cursor: pointer;
 transition:
 background-color .2s var(--n-bezier),
 color .2s var(--n-bezier);
 `, [cE("trigger", `
 position: absolute;
 left: calc(var(--n-item-size) / 2 - var(--n-item-cell-width) / 2);
 top: calc(var(--n-item-size) / 2 - var(--n-item-cell-height) / 2);
 width: var(--n-item-cell-width);
 height: var(--n-item-cell-height);
 `), cM("current", [cE("sup", `
 position: absolute;
 top: 2px;
 right: 2px;
 content: "";
 height: 4px;
 width: 4px;
 border-radius: 2px;
 background-color: var(--n-item-color-active);
 transition:
 background-color .2s var(--n-bezier);
 `)]), c2("&::after", `
 content: "";
 z-index: -1;
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 border-radius: inherit;
 transition: background-color .3s var(--n-bezier);
 `), cM("covered, start, end", [cNotM("excluded", [c2("&::before", `
 content: "";
 z-index: -2;
 position: absolute;
 left: calc((var(--n-item-size) - var(--n-item-cell-width)) / 2);
 right: calc((var(--n-item-size) - var(--n-item-cell-width)) / 2);
 top: 0;
 bottom: 0;
 background-color: var(--n-item-color-included);
 `), c2("&:nth-child(7n + 1)::before", {
  borderTopLeftRadius: "var(--n-item-border-radius)",
  borderBottomLeftRadius: "var(--n-item-border-radius)"
}), c2("&:nth-child(7n + 7)::before", {
  borderTopRightRadius: "var(--n-item-border-radius)",
  borderBottomRightRadius: "var(--n-item-border-radius)"
})])]), cM("selected", {
  color: "var(--n-item-text-color-active)"
}, [c2("&::after", {
  backgroundColor: "var(--n-item-color-active)"
}), cM("start", [c2("&::before", {
  left: "50%"
})]), cM("end", [c2("&::before", {
  right: "50%"
})]), cE("sup", {
  backgroundColor: "var(--n-panel-color)"
})]), cM("excluded", {
  color: "var(--n-item-text-color-disabled)"
}, [cM("selected", [c2("&::after", {
  backgroundColor: "var(--n-item-color-disabled)"
})])]), cM("disabled", {
  cursor: "not-allowed",
  color: "var(--n-item-text-color-disabled)"
}, [cM("covered", [c2("&::before", {
  backgroundColor: "var(--n-item-color-disabled)"
})]), cM("selected", [c2("&::before", {
  backgroundColor: "var(--n-item-color-disabled)"
}), c2("&::after", {
  backgroundColor: "var(--n-item-color-disabled)"
})])]), cM("week-hovered", [c2("&::before", `
 background-color: var(--n-item-color-included);
 `), c2("&:nth-child(7n + 1)::before", `
 border-top-left-radius: var(--n-item-border-radius);
 border-bottom-left-radius: var(--n-item-border-radius);
 `), c2("&:nth-child(7n + 7)::before", `
 border-top-right-radius: var(--n-item-border-radius);
 border-bottom-right-radius: var(--n-item-border-radius);
 `)]), cM("week-selected", `
 color: var(--n-item-text-color-active)
 `, [c2("&::before", `
 background-color: var(--n-item-color-active);
 `), c2("&:nth-child(7n + 1)::before", `
 border-top-left-radius: var(--n-item-border-radius);
 border-bottom-left-radius: var(--n-item-border-radius);
 `), c2("&:nth-child(7n + 7)::before", `
 border-top-right-radius: var(--n-item-border-radius);
 border-bottom-right-radius: var(--n-item-border-radius);
 `)])])]), cNotM("week", [cB("date-panel-dates", [cB("date-panel-date", [cNotM("disabled", [cNotM("selected", [c2("&:hover", `
 background-color: var(--n-item-color-hover);
 `)])])])])]), cM("week", [cB("date-panel-dates", [cB("date-panel-date", [c2("&::before", `
 content: "";
 z-index: -2;
 position: absolute;
 left: calc((var(--n-item-size) - var(--n-item-cell-width)) / 2);
 right: calc((var(--n-item-size) - var(--n-item-cell-width)) / 2);
 top: 0;
 bottom: 0;
 transition: background-color .3s var(--n-bezier);
 `)])])]), cE("vertical-divider", `
 grid-area: divider;
 height: 100%;
 width: 1px;
 background-color: var(--n-calendar-divider-color);
 `), cB("date-panel-footer", `
 border-top: 1px solid var(--n-panel-action-divider-color);
 padding: var(--n-panel-extra-footer-padding);
 `), cB("date-panel-actions", `
 flex: 1;
 padding: var(--n-panel-action-padding);
 display: flex;
 align-items: center;
 justify-content: space-between;
 border-top: 1px solid var(--n-panel-action-divider-color);
 `, [cE("prefix, suffix", `
 display: flex;
 margin-bottom: -8px;
 `), cE("suffix", `
 align-self: flex-end;
 `), cE("prefix", `
 flex-wrap: wrap;
 `), cB("button", `
 margin-bottom: 8px;
 `, [c2("&:not(:last-child)", `
 margin-right: 8px;
 `)])])]), c2("[data-n-date].transition-disabled", {
  transition: "none !important"
}, [c2("&::before, &::after", {
  transition: "none !important"
})])]);

// ../node_modules/naive-ui/es/date-picker/src/validation-utils.mjs
import { computed as computed21 } from "vue";
function uniCalendarValidation(props, mergedValueRef) {
  const timePickerValidatorRef = computed21(() => {
    const {
      isTimeDisabled
    } = props;
    const {
      value
    } = mergedValueRef;
    if (value === null || Array.isArray(value)) return void 0;
    return isTimeDisabled === null || isTimeDisabled === void 0 ? void 0 : isTimeDisabled(value);
  });
  const isHourDisabledRef = computed21(() => {
    var _a;
    return (_a = timePickerValidatorRef.value) === null || _a === void 0 ? void 0 : _a.isHourDisabled;
  });
  const isMinuteDisabledRef = computed21(() => {
    var _a;
    return (_a = timePickerValidatorRef.value) === null || _a === void 0 ? void 0 : _a.isMinuteDisabled;
  });
  const isSecondDisabledRef = computed21(() => {
    var _a;
    return (_a = timePickerValidatorRef.value) === null || _a === void 0 ? void 0 : _a.isSecondDisabled;
  });
  const isDateInvalidRef = computed21(() => {
    const {
      type,
      isDateDisabled
    } = props;
    const {
      value
    } = mergedValueRef;
    if (value === null || Array.isArray(value) || !["date", "datetime"].includes(type) || !isDateDisabled) {
      return false;
    }
    return isDateDisabled(value, {
      type: "input"
    });
  });
  const isTimeInvalidRef = computed21(() => {
    const {
      type
    } = props;
    const {
      value
    } = mergedValueRef;
    if (value === null || !(type !== "datetime") || Array.isArray(value)) {
      return false;
    }
    const time3 = new Date(value);
    const hour = time3.getHours();
    const minute = time3.getMinutes();
    const second = time3.getMinutes();
    return (isHourDisabledRef.value ? isHourDisabledRef.value(hour) : false) || (isMinuteDisabledRef.value ? isMinuteDisabledRef.value(minute, hour) : false) || (isSecondDisabledRef.value ? isSecondDisabledRef.value(second, minute, hour) : false);
  });
  const isDateTimeInvalidRef = computed21(() => {
    return isDateInvalidRef.value || isTimeInvalidRef.value;
  });
  const isValueInvalidRef = computed21(() => {
    const {
      type
    } = props;
    if (type === "date") return isDateInvalidRef.value;
    if (type === "datetime") return isDateTimeInvalidRef.value;
    return false;
  });
  return {
    // date & datetime
    isValueInvalidRef,
    isDateInvalidRef,
    // datetime only
    isTimeInvalidRef,
    isDateTimeInvalidRef,
    isHourDisabledRef,
    isMinuteDisabledRef,
    isSecondDisabledRef
  };
}
function dualCalendarValidation(props, mergedValueRef) {
  const timePickerValidatorRef = computed21(() => {
    const {
      isTimeDisabled
    } = props;
    const {
      value
    } = mergedValueRef;
    if (!Array.isArray(value) || !isTimeDisabled) {
      return [void 0, void 0];
    }
    return [isTimeDisabled === null || isTimeDisabled === void 0 ? void 0 : isTimeDisabled(value[0], "start", value), isTimeDisabled === null || isTimeDisabled === void 0 ? void 0 : isTimeDisabled(value[1], "end", value)];
  });
  const timeValidator = {
    isStartHourDisabledRef: computed21(() => {
      var _a;
      return (_a = timePickerValidatorRef.value[0]) === null || _a === void 0 ? void 0 : _a.isHourDisabled;
    }),
    isEndHourDisabledRef: computed21(() => {
      var _a;
      return (_a = timePickerValidatorRef.value[1]) === null || _a === void 0 ? void 0 : _a.isHourDisabled;
    }),
    isStartMinuteDisabledRef: computed21(() => {
      var _a;
      return (_a = timePickerValidatorRef.value[0]) === null || _a === void 0 ? void 0 : _a.isMinuteDisabled;
    }),
    isEndMinuteDisabledRef: computed21(() => {
      var _a;
      return (_a = timePickerValidatorRef.value[1]) === null || _a === void 0 ? void 0 : _a.isMinuteDisabled;
    }),
    isStartSecondDisabledRef: computed21(() => {
      var _a;
      return (_a = timePickerValidatorRef.value[0]) === null || _a === void 0 ? void 0 : _a.isSecondDisabled;
    }),
    isEndSecondDisabledRef: computed21(() => {
      var _a;
      return (_a = timePickerValidatorRef.value[1]) === null || _a === void 0 ? void 0 : _a.isSecondDisabled;
    })
  };
  const isStartDateInvalidRef = computed21(() => {
    const {
      type,
      isDateDisabled
    } = props;
    const {
      value
    } = mergedValueRef;
    if (value === null || !Array.isArray(value) || !["daterange", "datetimerange"].includes(type) || !isDateDisabled) {
      return false;
    }
    return isDateDisabled(value[0], "start", value);
  });
  const isEndDateInvalidRef = computed21(() => {
    const {
      type,
      isDateDisabled
    } = props;
    const {
      value
    } = mergedValueRef;
    if (value === null || !Array.isArray(value) || !["daterange", "datetimerange"].includes(type) || !isDateDisabled) {
      return false;
    }
    return isDateDisabled(value[1], "end", value);
  });
  const isStartTimeInvalidRef = computed21(() => {
    const {
      type
    } = props;
    const {
      value
    } = mergedValueRef;
    if (value === null || !Array.isArray(value) || type !== "datetimerange") {
      return false;
    }
    const startHours = getHours(value[0]);
    const startMinutes = getMinutes(value[0]);
    const startSeconds = getSeconds(value[0]);
    const {
      isStartHourDisabledRef,
      isStartMinuteDisabledRef,
      isStartSecondDisabledRef
    } = timeValidator;
    const startTimeInvalid = (isStartHourDisabledRef.value ? isStartHourDisabledRef.value(startHours) : false) || (isStartMinuteDisabledRef.value ? isStartMinuteDisabledRef.value(startMinutes, startHours) : false) || (isStartSecondDisabledRef.value ? isStartSecondDisabledRef.value(startSeconds, startMinutes, startHours) : false);
    return startTimeInvalid;
  });
  const isEndTimeInvalidRef = computed21(() => {
    const {
      type
    } = props;
    const {
      value
    } = mergedValueRef;
    if (value === null || !Array.isArray(value) || type !== "datetimerange") {
      return false;
    }
    const endHours = getHours(value[1]);
    const endMinutes = getMinutes(value[1]);
    const endSeconds = getSeconds(value[1]);
    const {
      isEndHourDisabledRef,
      isEndMinuteDisabledRef,
      isEndSecondDisabledRef
    } = timeValidator;
    const endTimeInvalid = (isEndHourDisabledRef.value ? isEndHourDisabledRef.value(endHours) : false) || (isEndMinuteDisabledRef.value ? isEndMinuteDisabledRef.value(endMinutes, endHours) : false) || (isEndSecondDisabledRef.value ? isEndSecondDisabledRef.value(endSeconds, endMinutes, endHours) : false);
    return endTimeInvalid;
  });
  const isStartValueInvalidRef = computed21(() => {
    return isStartDateInvalidRef.value || isStartTimeInvalidRef.value;
  });
  const isEndValueInvalidRef = computed21(() => {
    return isEndDateInvalidRef.value || isEndTimeInvalidRef.value;
  });
  const isRangeInvalidRef = computed21(() => {
    return isStartValueInvalidRef.value || isEndValueInvalidRef.value;
  });
  return Object.assign(Object.assign({}, timeValidator), {
    isStartDateInvalidRef,
    isEndDateInvalidRef,
    isStartTimeInvalidRef,
    isEndTimeInvalidRef,
    isStartValueInvalidRef,
    isEndValueInvalidRef,
    isRangeInvalidRef
  });
}

// ../node_modules/naive-ui/es/date-picker/src/DatePicker.mjs
var DatePicker_default = defineComponent40({
  name: "DatePicker",
  props: datePickerProps,
  slots: Object,
  setup(props, {
    slots
  }) {
    var _a;
    if (true) {
      watchEffect11(() => {
        if (props.onChange !== void 0) {
          warnOnce("date-picker", "`on-change` is deprecated, please use `on-update:value` instead.");
        }
      });
    }
    const {
      localeRef,
      dateLocaleRef
    } = useLocale("DatePicker");
    const formItem = useFormItem(props);
    const {
      mergedSizeRef,
      mergedDisabledRef,
      mergedStatusRef
    } = formItem;
    const {
      mergedComponentPropsRef,
      mergedClsPrefixRef,
      mergedBorderedRef,
      namespaceRef,
      inlineThemeDisabled
    } = useConfig(props);
    const panelInstRef = ref21(null);
    const triggerElRef = ref21(null);
    const inputInstRef = ref21(null);
    const uncontrolledShowRef = ref21(false);
    const controlledShowRef = toRef10(props, "show");
    const mergedShowRef = useMergedState(controlledShowRef, uncontrolledShowRef);
    const dateFnsOptionsRef = computed22(() => {
      return {
        locale: dateLocaleRef.value.locale,
        useAdditionalWeekYearTokens: true
      };
    });
    const mergedFormatRef = computed22(() => {
      const {
        format: format3
      } = props;
      if (format3) return format3;
      switch (props.type) {
        case "date":
        case "daterange":
          return localeRef.value.dateFormat;
        case "datetime":
        case "datetimerange":
          return localeRef.value.dateTimeFormat;
        case "year":
        case "yearrange":
          return localeRef.value.yearTypeFormat;
        case "month":
        case "monthrange":
          return localeRef.value.monthTypeFormat;
        case "quarter":
        case "quarterrange":
          return localeRef.value.quarterFormat;
        case "week":
          return localeRef.value.weekFormat;
      }
    });
    const mergedValueFormatRef = computed22(() => {
      var _a2;
      return (_a2 = props.valueFormat) !== null && _a2 !== void 0 ? _a2 : mergedFormatRef.value;
    });
    function getTimestampValue(value) {
      if (value === null) return null;
      const {
        value: mergedValueFormat
      } = mergedValueFormatRef;
      const {
        value: dateFnsOptions
      } = dateFnsOptionsRef;
      if (Array.isArray(value)) {
        return [strictParse(value[0], mergedValueFormat, /* @__PURE__ */ new Date(), dateFnsOptions).getTime(), strictParse(value[1], mergedValueFormat, /* @__PURE__ */ new Date(), dateFnsOptions).getTime()];
      }
      return strictParse(value, mergedValueFormat, /* @__PURE__ */ new Date(), dateFnsOptions).getTime();
    }
    const {
      defaultFormattedValue,
      defaultValue
    } = props;
    const uncontrolledValueRef = ref21((_a = defaultFormattedValue !== void 0 ? getTimestampValue(defaultFormattedValue) : defaultValue) !== null && _a !== void 0 ? _a : null);
    const controlledValueRef = computed22(() => {
      const {
        formattedValue
      } = props;
      if (formattedValue !== void 0) {
        return getTimestampValue(formattedValue);
      }
      return props.value;
    });
    const mergedValueRef = useMergedState(controlledValueRef, uncontrolledValueRef);
    const pendingValueRef = ref21(null);
    watchEffect11(() => {
      pendingValueRef.value = mergedValueRef.value;
    });
    const singleInputValueRef = ref21("");
    const rangeStartInputValueRef = ref21("");
    const rangeEndInputValueRef = ref21("");
    const themeRef = use_theme_default("DatePicker", "-date-picker", index_cssr_default9, light_default6, props, mergedClsPrefixRef);
    const timePickerSizeRef = computed22(() => {
      var _a2, _b;
      return ((_b = (_a2 = mergedComponentPropsRef === null || mergedComponentPropsRef === void 0 ? void 0 : mergedComponentPropsRef.value) === null || _a2 === void 0 ? void 0 : _a2.DatePicker) === null || _b === void 0 ? void 0 : _b.timePickerSize) || "small";
    });
    const isRangeRef = computed22(() => {
      return ["daterange", "datetimerange", "monthrange", "quarterrange", "yearrange"].includes(props.type);
    });
    const localizedPlacehoderRef = computed22(() => {
      const {
        placeholder
      } = props;
      if (placeholder === void 0) {
        const {
          type
        } = props;
        switch (type) {
          case "date":
            return localeRef.value.datePlaceholder;
          case "datetime":
            return localeRef.value.datetimePlaceholder;
          case "month":
            return localeRef.value.monthPlaceholder;
          case "year":
            return localeRef.value.yearPlaceholder;
          case "quarter":
            return localeRef.value.quarterPlaceholder;
          case "week":
            return localeRef.value.weekPlaceholder;
          default:
            return "";
        }
      } else {
        return placeholder;
      }
    });
    const localizedStartPlaceholderRef = computed22(() => {
      if (props.startPlaceholder === void 0) {
        if (props.type === "daterange") {
          return localeRef.value.startDatePlaceholder;
        } else if (props.type === "datetimerange") {
          return localeRef.value.startDatetimePlaceholder;
        } else if (props.type === "monthrange") {
          return localeRef.value.startMonthPlaceholder;
        }
        return "";
      } else {
        return props.startPlaceholder;
      }
    });
    const localizedEndPlaceholderRef = computed22(() => {
      if (props.endPlaceholder === void 0) {
        if (props.type === "daterange") {
          return localeRef.value.endDatePlaceholder;
        } else if (props.type === "datetimerange") {
          return localeRef.value.endDatetimePlaceholder;
        } else if (props.type === "monthrange") {
          return localeRef.value.endMonthPlaceholder;
        }
        return "";
      } else {
        return props.endPlaceholder;
      }
    });
    const mergedActionsRef = computed22(() => {
      const {
        actions,
        type,
        clearable
      } = props;
      if (actions === null) return [];
      if (actions !== void 0) return actions;
      const result = clearable ? ["clear"] : [];
      switch (type) {
        case "date":
        case "week": {
          result.push("now");
          return result;
        }
        case "datetime": {
          result.push("now", "confirm");
          return result;
        }
        case "daterange": {
          result.push("confirm");
          return result;
        }
        case "datetimerange": {
          result.push("confirm");
          return result;
        }
        case "month": {
          result.push("now", "confirm");
          return result;
        }
        case "year": {
          result.push("now");
          return result;
        }
        case "quarter": {
          result.push("now", "confirm");
          return result;
        }
        case "monthrange":
        case "yearrange":
        case "quarterrange": {
          result.push("confirm");
          return result;
        }
        default: {
          warn3("date-picker", "The type is wrong, n-date-picker's type only supports `date`, `datetime`, `daterange` and `datetimerange`.");
          break;
        }
      }
    });
    function getFormattedValue(value) {
      if (value === null) return null;
      if (Array.isArray(value)) {
        const {
          value: mergedValueFormat
        } = mergedValueFormatRef;
        const {
          value: dateFnsOptions
        } = dateFnsOptionsRef;
        return [format(value[0], mergedValueFormat, dateFnsOptions), format(value[1], mergedValueFormat, dateFnsOptionsRef.value)];
      } else {
        return format(value, mergedValueFormatRef.value, dateFnsOptionsRef.value);
      }
    }
    function doUpdatePendingValue(value) {
      pendingValueRef.value = value;
    }
    function doUpdateFormattedValue(value, timestampValue) {
      const {
        "onUpdate:formattedValue": _onUpdateFormattedValue,
        onUpdateFormattedValue
      } = props;
      if (_onUpdateFormattedValue) {
        call(_onUpdateFormattedValue, value, timestampValue);
      }
      if (onUpdateFormattedValue) {
        call(onUpdateFormattedValue, value, timestampValue);
      }
    }
    function doUpdateValue(value, options) {
      const {
        "onUpdate:value": _onUpdateValue,
        onUpdateValue,
        onChange
      } = props;
      const {
        nTriggerFormChange,
        nTriggerFormInput
      } = formItem;
      const formattedValue = getFormattedValue(value);
      if (options.doConfirm) {
        doConfirm(value, formattedValue);
      }
      if (onUpdateValue) {
        call(onUpdateValue, value, formattedValue);
      }
      if (_onUpdateValue) {
        call(_onUpdateValue, value, formattedValue);
      }
      if (onChange) call(onChange, value, formattedValue);
      uncontrolledValueRef.value = value;
      doUpdateFormattedValue(formattedValue, value);
      nTriggerFormChange();
      nTriggerFormInput();
    }
    function doClear() {
      const {
        onClear
      } = props;
      onClear === null || onClear === void 0 ? void 0 : onClear();
    }
    function doConfirm(value, formattedValue) {
      const {
        onConfirm
      } = props;
      if (onConfirm) onConfirm(value, formattedValue);
    }
    function doFocus(e) {
      const {
        onFocus
      } = props;
      const {
        nTriggerFormFocus
      } = formItem;
      if (onFocus) call(onFocus, e);
      nTriggerFormFocus();
    }
    function doBlur(e) {
      const {
        onBlur
      } = props;
      const {
        nTriggerFormBlur
      } = formItem;
      if (onBlur) call(onBlur, e);
      nTriggerFormBlur();
    }
    function doUpdateShow(show) {
      const {
        "onUpdate:show": _onUpdateShow,
        onUpdateShow
      } = props;
      if (_onUpdateShow) call(_onUpdateShow, show);
      if (onUpdateShow) call(onUpdateShow, show);
      uncontrolledShowRef.value = show;
    }
    function handleKeydown(e) {
      if (e.key === "Escape") {
        if (mergedShowRef.value) {
          markEventEffectPerformed(e);
          closeCalendar({
            returnFocus: true
          });
        }
      }
    }
    function handleInputKeydown(e) {
      if (e.key === "Escape" && mergedShowRef.value) {
        markEventEffectPerformed(e);
      }
    }
    function handleClear() {
      var _a2;
      doUpdateShow(false);
      (_a2 = inputInstRef.value) === null || _a2 === void 0 ? void 0 : _a2.deactivate();
      doClear();
    }
    function handlePanelClear() {
      var _a2;
      (_a2 = inputInstRef.value) === null || _a2 === void 0 ? void 0 : _a2.deactivate();
      doClear();
    }
    function handlePanelTabOut() {
      closeCalendar({
        returnFocus: true
      });
    }
    function handleClickOutside(e) {
      var _a2;
      if (mergedShowRef.value && !((_a2 = triggerElRef.value) === null || _a2 === void 0 ? void 0 : _a2.contains(getPreciseEventTarget(e)))) {
        closeCalendar({
          returnFocus: false
        });
      }
    }
    function handlePanelClose(disableUpdateOnClose) {
      closeCalendar({
        returnFocus: true,
        disableUpdateOnClose
      });
    }
    function handlePanelUpdateValue(value, doUpdate) {
      if (doUpdate) {
        doUpdateValue(value, {
          doConfirm: false
        });
      } else {
        doUpdatePendingValue(value);
      }
    }
    function handlePanelConfirm() {
      const pendingValue = pendingValueRef.value;
      doUpdateValue(Array.isArray(pendingValue) ? [pendingValue[0], pendingValue[1]] : pendingValue, {
        doConfirm: true
      });
    }
    function deriveInputState() {
      const {
        value
      } = pendingValueRef;
      if (isRangeRef.value) {
        if (Array.isArray(value) || value === null) {
          deriveRangeInputState(value);
        }
      } else {
        if (!Array.isArray(value)) {
          deriveSingleInputState(value);
        }
      }
    }
    function deriveSingleInputState(value) {
      if (value === null) {
        singleInputValueRef.value = "";
      } else {
        singleInputValueRef.value = format(value, mergedFormatRef.value, dateFnsOptionsRef.value);
      }
    }
    function deriveRangeInputState(values) {
      if (values === null) {
        rangeStartInputValueRef.value = "";
        rangeEndInputValueRef.value = "";
      } else {
        const dateFnsOptions = dateFnsOptionsRef.value;
        rangeStartInputValueRef.value = format(values[0], mergedFormatRef.value, dateFnsOptions);
        rangeEndInputValueRef.value = format(values[1], mergedFormatRef.value, dateFnsOptions);
      }
    }
    function handleInputActivate() {
      if (!mergedShowRef.value) {
        openCalendar();
      }
    }
    function handleInputBlur(e) {
      var _a2;
      if (!((_a2 = panelInstRef.value) === null || _a2 === void 0 ? void 0 : _a2.$el.contains(e.relatedTarget))) {
        doBlur(e);
        deriveInputState();
        closeCalendar({
          returnFocus: false
        });
      }
    }
    function handleInputDeactivate() {
      if (mergedDisabledRef.value) return;
      deriveInputState();
      closeCalendar({
        returnFocus: false
      });
    }
    function handleSingleUpdateValue(v) {
      if (v === "") {
        doUpdateValue(null, {
          doConfirm: false
        });
        pendingValueRef.value = null;
        singleInputValueRef.value = "";
        return;
      }
      const newSelectedDateTime = strictParse(v, mergedFormatRef.value, /* @__PURE__ */ new Date(), dateFnsOptionsRef.value);
      if (isValid(newSelectedDateTime)) {
        doUpdateValue(getTime(newSelectedDateTime), {
          doConfirm: false
        });
        deriveInputState();
      } else {
        singleInputValueRef.value = v;
      }
    }
    function handleRangeUpdateValue(v, {
      source
    }) {
      if (v[0] === "" && v[1] === "") {
        doUpdateValue(null, {
          doConfirm: false
        });
        pendingValueRef.value = null;
        rangeStartInputValueRef.value = "";
        rangeEndInputValueRef.value = "";
        return;
      }
      const [startTime, endTime] = v;
      const newStartTime = strictParse(startTime, mergedFormatRef.value, /* @__PURE__ */ new Date(), dateFnsOptionsRef.value);
      const newEndTime = strictParse(endTime, mergedFormatRef.value, /* @__PURE__ */ new Date(), dateFnsOptionsRef.value);
      if (isValid(newStartTime) && isValid(newEndTime)) {
        let newStartTs = getTime(newStartTime);
        let newEndTs = getTime(newEndTime);
        if (newEndTime < newStartTime) {
          if (source === 0) {
            newEndTs = newStartTs;
          } else {
            newStartTs = newEndTs;
          }
        }
        doUpdateValue([newStartTs, newEndTs], {
          doConfirm: false
        });
        deriveInputState();
      } else {
        ;
        [rangeStartInputValueRef.value, rangeEndInputValueRef.value] = v;
      }
    }
    function handleTriggerClick(e) {
      if (mergedDisabledRef.value) return;
      if (happensIn(e, "clear")) return;
      if (!mergedShowRef.value) {
        openCalendar();
      }
    }
    function handleInputFocus(e) {
      if (mergedDisabledRef.value) return;
      doFocus(e);
    }
    function openCalendar() {
      if (mergedDisabledRef.value || mergedShowRef.value) return;
      doUpdateShow(true);
    }
    function closeCalendar({
      returnFocus,
      disableUpdateOnClose
    }) {
      var _a2;
      if (mergedShowRef.value) {
        doUpdateShow(false);
        if (props.type !== "date" && props.updateValueOnClose && !disableUpdateOnClose) {
          handlePanelConfirm();
        }
        if (returnFocus) {
          (_a2 = inputInstRef.value) === null || _a2 === void 0 ? void 0 : _a2.focus();
        }
      }
    }
    watch11(pendingValueRef, () => {
      deriveInputState();
    });
    deriveInputState();
    watch11(mergedShowRef, (value) => {
      if (!value) {
        pendingValueRef.value = mergedValueRef.value;
      }
    });
    const uniVaidation = uniCalendarValidation(props, pendingValueRef);
    const dualValidation = dualCalendarValidation(props, pendingValueRef);
    provide7(datePickerInjectionKey, Object.assign(Object.assign(Object.assign({
      mergedClsPrefixRef,
      mergedThemeRef: themeRef,
      timePickerSizeRef,
      localeRef,
      dateLocaleRef,
      firstDayOfWeekRef: toRef10(props, "firstDayOfWeek"),
      isDateDisabledRef: toRef10(props, "isDateDisabled"),
      rangesRef: toRef10(props, "ranges"),
      timePickerPropsRef: toRef10(props, "timePickerProps"),
      closeOnSelectRef: toRef10(props, "closeOnSelect"),
      updateValueOnCloseRef: toRef10(props, "updateValueOnClose"),
      monthFormatRef: toRef10(props, "monthFormat"),
      yearFormatRef: toRef10(props, "yearFormat"),
      quarterFormatRef: toRef10(props, "quarterFormat"),
      yearRangeRef: toRef10(props, "yearRange")
    }, uniVaidation), dualValidation), {
      datePickerSlots: slots
    }));
    const exposedMethods = {
      focus: () => {
        var _a2;
        (_a2 = inputInstRef.value) === null || _a2 === void 0 ? void 0 : _a2.focus();
      },
      blur: () => {
        var _a2;
        (_a2 = inputInstRef.value) === null || _a2 === void 0 ? void 0 : _a2.blur();
      }
    };
    const triggerCssVarsRef = computed22(() => {
      const {
        common: {
          cubicBezierEaseInOut: cubicBezierEaseInOut4
        },
        self: {
          iconColor,
          iconColorDisabled
        }
      } = themeRef.value;
      return {
        "--n-bezier": cubicBezierEaseInOut4,
        "--n-icon-color-override": iconColor,
        "--n-icon-color-disabled-override": iconColorDisabled
      };
    });
    const triggerThemeClassHandle = inlineThemeDisabled ? useThemeClass("date-picker-trigger", void 0, triggerCssVarsRef, props) : void 0;
    const cssVarsRef = computed22(() => {
      const {
        type
      } = props;
      const {
        common: {
          cubicBezierEaseInOut: cubicBezierEaseInOut4
        },
        self: {
          calendarTitleFontSize,
          calendarDaysFontSize,
          itemFontSize,
          itemTextColor,
          itemColorDisabled,
          itemColorIncluded,
          itemColorHover,
          itemColorActive,
          itemBorderRadius,
          itemTextColorDisabled,
          itemTextColorActive,
          panelColor,
          panelTextColor,
          arrowColor,
          calendarTitleTextColor,
          panelActionDividerColor,
          panelHeaderDividerColor,
          calendarDaysDividerColor,
          panelBoxShadow,
          panelBorderRadius,
          calendarTitleFontWeight,
          panelExtraFooterPadding,
          panelActionPadding,
          itemSize,
          itemCellWidth,
          itemCellHeight,
          scrollItemWidth,
          scrollItemHeight,
          calendarTitlePadding,
          calendarTitleHeight,
          calendarDaysHeight,
          calendarDaysTextColor,
          arrowSize,
          panelHeaderPadding,
          calendarDividerColor,
          calendarTitleGridTempateColumns,
          iconColor,
          iconColorDisabled,
          scrollItemBorderRadius,
          calendarTitleColorHover,
          [createKey("calendarLeftPadding", type)]: calendarLeftPadding,
          [createKey("calendarRightPadding", type)]: calendarRightPadding
        }
      } = themeRef.value;
      return {
        "--n-bezier": cubicBezierEaseInOut4,
        "--n-panel-border-radius": panelBorderRadius,
        "--n-panel-color": panelColor,
        "--n-panel-box-shadow": panelBoxShadow,
        "--n-panel-text-color": panelTextColor,
        // panel header
        "--n-panel-header-padding": panelHeaderPadding,
        "--n-panel-header-divider-color": panelHeaderDividerColor,
        // panel calendar
        "--n-calendar-left-padding": calendarLeftPadding,
        "--n-calendar-right-padding": calendarRightPadding,
        "--n-calendar-title-color-hover": calendarTitleColorHover,
        "--n-calendar-title-height": calendarTitleHeight,
        "--n-calendar-title-padding": calendarTitlePadding,
        "--n-calendar-title-font-size": calendarTitleFontSize,
        "--n-calendar-title-font-weight": calendarTitleFontWeight,
        "--n-calendar-title-text-color": calendarTitleTextColor,
        "--n-calendar-title-grid-template-columns": calendarTitleGridTempateColumns,
        "--n-calendar-days-height": calendarDaysHeight,
        "--n-calendar-days-divider-color": calendarDaysDividerColor,
        "--n-calendar-days-font-size": calendarDaysFontSize,
        "--n-calendar-days-text-color": calendarDaysTextColor,
        "--n-calendar-divider-color": calendarDividerColor,
        // panel action
        "--n-panel-action-padding": panelActionPadding,
        "--n-panel-extra-footer-padding": panelExtraFooterPadding,
        "--n-panel-action-divider-color": panelActionDividerColor,
        // panel item
        "--n-item-font-size": itemFontSize,
        "--n-item-border-radius": itemBorderRadius,
        "--n-item-size": itemSize,
        "--n-item-cell-width": itemCellWidth,
        "--n-item-cell-height": itemCellHeight,
        "--n-item-text-color": itemTextColor,
        "--n-item-color-included": itemColorIncluded,
        "--n-item-color-disabled": itemColorDisabled,
        "--n-item-color-hover": itemColorHover,
        "--n-item-color-active": itemColorActive,
        "--n-item-text-color-disabled": itemTextColorDisabled,
        "--n-item-text-color-active": itemTextColorActive,
        // scroll item
        "--n-scroll-item-width": scrollItemWidth,
        "--n-scroll-item-height": scrollItemHeight,
        "--n-scroll-item-border-radius": scrollItemBorderRadius,
        // panel arrow
        "--n-arrow-size": arrowSize,
        "--n-arrow-color": arrowColor,
        // icon in trigger
        "--n-icon-color": iconColor,
        "--n-icon-color-disabled": iconColorDisabled
      };
    });
    const themeClassHandle = inlineThemeDisabled ? useThemeClass("date-picker", computed22(() => {
      return props.type;
    }), cssVarsRef, props) : void 0;
    return Object.assign(Object.assign({}, exposedMethods), {
      mergedStatus: mergedStatusRef,
      mergedClsPrefix: mergedClsPrefixRef,
      mergedBordered: mergedBorderedRef,
      namespace: namespaceRef,
      uncontrolledValue: uncontrolledValueRef,
      pendingValue: pendingValueRef,
      panelInstRef,
      triggerElRef,
      inputInstRef,
      isMounted: isMounted(),
      displayTime: singleInputValueRef,
      displayStartTime: rangeStartInputValueRef,
      displayEndTime: rangeEndInputValueRef,
      mergedShow: mergedShowRef,
      adjustedTo: useAdjustedTo(props),
      isRange: isRangeRef,
      localizedStartPlaceholder: localizedStartPlaceholderRef,
      localizedEndPlaceholder: localizedEndPlaceholderRef,
      mergedSize: mergedSizeRef,
      mergedDisabled: mergedDisabledRef,
      localizedPlacehoder: localizedPlacehoderRef,
      isValueInvalid: uniVaidation.isValueInvalidRef,
      isStartValueInvalid: dualValidation.isStartValueInvalidRef,
      isEndValueInvalid: dualValidation.isEndValueInvalidRef,
      handleInputKeydown,
      handleClickOutside,
      handleKeydown,
      handleClear,
      handlePanelClear,
      handleTriggerClick,
      handleInputActivate,
      handleInputDeactivate,
      handleInputFocus,
      handleInputBlur,
      handlePanelTabOut,
      handlePanelClose,
      handleRangeUpdateValue,
      handleSingleUpdateValue,
      handlePanelUpdateValue,
      handlePanelConfirm,
      mergedTheme: themeRef,
      actions: mergedActionsRef,
      triggerCssVars: inlineThemeDisabled ? void 0 : triggerCssVarsRef,
      triggerThemeClass: triggerThemeClassHandle === null || triggerThemeClassHandle === void 0 ? void 0 : triggerThemeClassHandle.themeClass,
      triggerOnRender: triggerThemeClassHandle === null || triggerThemeClassHandle === void 0 ? void 0 : triggerThemeClassHandle.onRender,
      cssVars: inlineThemeDisabled ? void 0 : cssVarsRef,
      themeClass: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.themeClass,
      onRender: themeClassHandle === null || themeClassHandle === void 0 ? void 0 : themeClassHandle.onRender,
      onNextMonth: props.onNextMonth,
      onPrevMonth: props.onPrevMonth,
      onNextYear: props.onNextYear,
      onPrevYear: props.onPrevYear
    });
  },
  render() {
    const {
      clearable,
      triggerOnRender,
      mergedClsPrefix,
      $slots
    } = this;
    const commonPanelProps = {
      onUpdateValue: this.handlePanelUpdateValue,
      onTabOut: this.handlePanelTabOut,
      onClose: this.handlePanelClose,
      onClear: this.handlePanelClear,
      onKeydown: this.handleKeydown,
      onConfirm: this.handlePanelConfirm,
      ref: "panelInstRef",
      value: this.pendingValue,
      active: this.mergedShow,
      actions: this.actions,
      shortcuts: this.shortcuts,
      style: this.cssVars,
      defaultTime: this.defaultTime,
      themeClass: this.themeClass,
      panel: this.panel,
      inputReadonly: this.inputReadonly || this.mergedDisabled,
      onRender: this.onRender,
      onNextMonth: this.onNextMonth,
      onPrevMonth: this.onPrevMonth,
      onNextYear: this.onNextYear,
      onPrevYear: this.onPrevYear,
      timePickerFormat: this.timePickerFormat,
      dateFormat: this.dateFormat,
      calendarDayFormat: this.calendarDayFormat,
      calendarHeaderYearFormat: this.calendarHeaderYearFormat,
      calendarHeaderMonthFormat: this.calendarHeaderMonthFormat,
      calendarHeaderMonthYearSeparator: this.calendarHeaderMonthYearSeparator,
      calendarHeaderMonthBeforeYear: this.calendarHeaderMonthBeforeYear
    };
    const renderPanel = () => {
      const {
        type
      } = this;
      return type === "datetime" ? h39(datetime_default, Object.assign({}, commonPanelProps, {
        defaultCalendarStartTime: this.defaultCalendarStartTime
      }), $slots) : type === "daterange" ? h39(daterange_default, Object.assign({}, commonPanelProps, {
        defaultCalendarStartTime: this.defaultCalendarStartTime,
        defaultCalendarEndTime: this.defaultCalendarEndTime,
        bindCalendarMonths: this.bindCalendarMonths
      }), $slots) : type === "datetimerange" ? h39(datetimerange_default, Object.assign({}, commonPanelProps, {
        defaultCalendarStartTime: this.defaultCalendarStartTime,
        defaultCalendarEndTime: this.defaultCalendarEndTime,
        bindCalendarMonths: this.bindCalendarMonths
      }), $slots) : type === "month" || type === "year" || type === "quarter" ? h39(month_default, Object.assign({}, commonPanelProps, {
        type,
        key: type
      })) : type === "monthrange" || type === "yearrange" || type === "quarterrange" ? h39(monthrange_default, Object.assign({}, commonPanelProps, {
        type
      })) : h39(date_default, Object.assign({}, commonPanelProps, {
        type,
        defaultCalendarStartTime: this.defaultCalendarStartTime
      }), $slots);
    };
    if (this.panel) {
      return renderPanel();
    }
    triggerOnRender === null || triggerOnRender === void 0 ? void 0 : triggerOnRender();
    const commonInputProps = {
      bordered: this.mergedBordered,
      size: this.mergedSize,
      passivelyActivated: true,
      disabled: this.mergedDisabled,
      readonly: this.inputReadonly || this.mergedDisabled,
      clearable,
      onClear: this.handleClear,
      onClick: this.handleTriggerClick,
      onKeydown: this.handleInputKeydown,
      onActivate: this.handleInputActivate,
      onDeactivate: this.handleInputDeactivate,
      onFocus: this.handleInputFocus,
      onBlur: this.handleInputBlur
    };
    return h39("div", {
      ref: "triggerElRef",
      class: [`${mergedClsPrefix}-date-picker`, this.mergedDisabled && `${mergedClsPrefix}-date-picker--disabled`, this.isRange && `${mergedClsPrefix}-date-picker--range`, this.triggerThemeClass],
      style: this.triggerCssVars,
      onKeydown: this.handleKeydown
    }, h39(Binder_default, null, {
      default: () => [h39(Target_default, null, {
        default: () => this.isRange ? h39(Input_default, Object.assign({
          ref: "inputInstRef",
          status: this.mergedStatus,
          value: [this.displayStartTime, this.displayEndTime],
          placeholder: [this.localizedStartPlaceholder, this.localizedEndPlaceholder],
          textDecoration: [this.isStartValueInvalid ? "line-through" : "", this.isEndValueInvalid ? "line-through" : ""],
          pair: true,
          onUpdateValue: this.handleRangeUpdateValue,
          theme: this.mergedTheme.peers.Input,
          themeOverrides: this.mergedTheme.peerOverrides.Input,
          internalForceFocus: this.mergedShow,
          internalDeactivateOnEnter: true
        }, commonInputProps), {
          separator: () => this.separator === void 0 ? resolveSlot($slots.separator, () => [h39(Icon_default, {
            clsPrefix: mergedClsPrefix,
            class: `${mergedClsPrefix}-date-picker-icon`
          }, {
            default: () => h39(To_default, null)
          })]) : this.separator,
          [clearable ? "clear-icon-placeholder" : "suffix"]: () => resolveSlot($slots["date-icon"], () => [h39(Icon_default, {
            clsPrefix: mergedClsPrefix,
            class: `${mergedClsPrefix}-date-picker-icon`
          }, {
            default: () => h39(Date_default, null)
          })])
        }) : h39(Input_default, Object.assign({
          ref: "inputInstRef",
          status: this.mergedStatus,
          value: this.displayTime,
          placeholder: this.localizedPlacehoder,
          textDecoration: this.isValueInvalid && !this.isRange ? "line-through" : "",
          onUpdateValue: this.handleSingleUpdateValue,
          theme: this.mergedTheme.peers.Input,
          themeOverrides: this.mergedTheme.peerOverrides.Input,
          internalForceFocus: this.mergedShow,
          internalDeactivateOnEnter: true
        }, commonInputProps), {
          [clearable ? "clear-icon-placeholder" : "suffix"]: () => h39(Icon_default, {
            clsPrefix: mergedClsPrefix,
            class: `${mergedClsPrefix}-date-picker-icon`
          }, {
            default: () => resolveSlot($slots["date-icon"], () => [h39(Date_default, null)])
          })
        })
      }), h39(Follower_default, {
        show: this.mergedShow,
        containerClass: this.namespace,
        to: this.adjustedTo,
        teleportDisabled: this.adjustedTo === useAdjustedTo.tdkey,
        placement: this.placement
      }, {
        default: () => h39(Transition6, {
          name: "fade-in-scale-up-transition",
          appear: this.isMounted
        }, {
          default: () => {
            if (!this.mergedShow) return null;
            return withDirectives5(renderPanel(), [[clickoutside_default, this.handleClickOutside, void 0, {
              capture: true
            }]]);
          }
        })
      })]
    }));
  }
});

// ../node_modules/naive-ui/es/version.mjs
var version_default = "2.42.0";

// ../node_modules/naive-ui/es/create.mjs
function create({
  componentPrefix = "N",
  components = []
} = {}) {
  const installTargets = [];
  function registerComponent(app, name, component) {
    const registered = app.component(componentPrefix + name);
    if (!registered) {
      app.component(componentPrefix + name, component);
    }
  }
  function install(app) {
    if (installTargets.includes(app)) return;
    installTargets.push(app);
    components.forEach((component) => {
      const {
        name,
        alias
      } = component;
      registerComponent(app, name, component);
      if (alias) {
        alias.forEach((aliasName) => {
          registerComponent(app, aliasName, component);
        });
      }
    });
  }
  return {
    version: version_default,
    componentPrefix,
    install
  };
}
var create_default = create;
export {
  Button_default as NButton,
  ConfigProvider_default as NConfigProvider,
  DatePicker_default as NDatePicker,
  Input_default as NInput,
  create_default as create
};
/*! Bundled license information:

lodash-es/lodash.js:
  (**
   * @license
   * Lodash (Custom Build) <https://lodash.com/>
   * Build: `lodash modularize exports="es" -o ./`
   * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
   * Released under MIT license <https://lodash.com/license>
   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
   * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   *)
*/
