// ../node_modules/vant/es/utils/basic.mjs
function noop() {
}
var extend = Object.assign;
var inBrowser = typeof window !== "undefined";
var isObject = (val) => val !== null && typeof val === "object";
var isDef = (val) => val !== void 0 && val !== null;
var isFunction = (val) => typeof val === "function";
var isPromise = (val) => isObject(val) && isFunction(val.then) && isFunction(val.catch);
var isNumeric = (val) => typeof val === "number" || /^\d+(\.\d+)?$/.test(val);
var isIOS = () => inBrowser ? /ios|iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) : false;
function get(object, path) {
  const keys = path.split(".");
  let result = object;
  keys.forEach((key) => {
    var _a;
    result = isObject(result) ? (_a = result[key]) != null ? _a : "" : "";
  });
  return result;
}
function pick(obj, keys, ignoreUndefined) {
  return keys.reduce(
    (ret, key) => {
      if (!ignoreUndefined || obj[key] !== void 0) {
        ret[key] = obj[key];
      }
      return ret;
    },
    {}
  );
}

// ../node_modules/vant/es/utils/props.mjs
var unknownProp = null;
var numericProp = [Number, String];
var truthProp = {
  type: Boolean,
  default: true
};
var makeNumberProp = (defaultVal) => ({
  type: Number,
  default: defaultVal
});
var makeStringProp = (defaultVal) => ({
  type: String,
  default: defaultVal
});

// ../node_modules/@vant/use/dist/index.esm.mjs
import { unref } from "vue";
import { ref } from "vue";
import {
  ref as ref2,
  inject,
  computed,
  onUnmounted,
  getCurrentInstance
} from "vue";
import {
  isVNode,
  provide,
  reactive,
  getCurrentInstance as getCurrentInstance2
} from "vue";
import {
  ref as ref3,
  computed as computed2,
  onActivated,
  onDeactivated,
  onBeforeUnmount
} from "vue";
import { unref as unref3 } from "vue";
import {
  watch,
  isRef,
  unref as unref2,
  onUnmounted as onUnmounted2,
  onDeactivated as onDeactivated2
} from "vue";
import { nextTick, onMounted, onActivated as onActivated2 } from "vue";
import { ref as ref4 } from "vue";
import { ref as ref5, onMounted as onMounted2 } from "vue";
import { ref as ref6 } from "vue";
import { watch as watch2, inject as inject2 } from "vue";
var inBrowser2 = typeof window !== "undefined";
var SECOND = 1e3;
var MINUTE = 60 * SECOND;
var HOUR = 60 * MINUTE;
var DAY = 24 * HOUR;
function onMountedOrActivated(hook) {
  let mounted;
  onMounted(() => {
    hook();
    nextTick(() => {
      mounted = true;
    });
  });
  onActivated2(() => {
    if (mounted) {
      hook();
    }
  });
}
function useEventListener(type, listener, options = {}) {
  if (!inBrowser2) {
    return;
  }
  const { target = window, passive = false, capture = false } = options;
  let cleaned = false;
  let attached;
  const add = (target2) => {
    if (cleaned) {
      return;
    }
    const element = unref2(target2);
    if (element && !attached) {
      element.addEventListener(type, listener, {
        capture,
        passive
      });
      attached = true;
    }
  };
  const remove = (target2) => {
    if (cleaned) {
      return;
    }
    const element = unref2(target2);
    if (element && attached) {
      element.removeEventListener(type, listener, capture);
      attached = false;
    }
  };
  onUnmounted2(() => remove(target));
  onDeactivated2(() => remove(target));
  onMountedOrActivated(() => add(target));
  let stopWatch;
  if (isRef(target)) {
    stopWatch = watch(target, (val, oldVal) => {
      remove(oldVal);
      add(val);
    });
  }
  return () => {
    stopWatch == null ? void 0 : stopWatch();
    remove(target);
    cleaned = true;
  };
}
var width;
var height;
function useWindowSize() {
  if (!width) {
    width = ref4(0);
    height = ref4(0);
    if (inBrowser2) {
      const update = () => {
        width.value = window.innerWidth;
        height.value = window.innerHeight;
      };
      update();
      window.addEventListener("resize", update, { passive: true });
      window.addEventListener("orientationchange", update, { passive: true });
    }
  }
  return { width, height };
}
var overflowScrollReg = /scroll|auto|overlay/i;
var defaultRoot = inBrowser2 ? window : void 0;
function isElement(node) {
  const ELEMENT_NODE_TYPE = 1;
  return node.tagName !== "HTML" && node.tagName !== "BODY" && node.nodeType === ELEMENT_NODE_TYPE;
}
function getScrollParent(el, root = defaultRoot) {
  let node = el;
  while (node && node !== root && isElement(node)) {
    const { overflowY } = window.getComputedStyle(node);
    if (overflowScrollReg.test(overflowY)) {
      return node;
    }
    node = node.parentNode;
  }
  return root;
}
var CUSTOM_FIELD_INJECTION_KEY = Symbol("van-field");

// ../node_modules/vant/es/utils/dom.mjs
import { unref as unref4 } from "vue";
var isIOS2 = isIOS();
var stopPropagation = (event) => event.stopPropagation();
function preventDefault(event, isStopPropagation) {
  if (typeof event.cancelable !== "boolean" || event.cancelable) {
    event.preventDefault();
  }
  if (isStopPropagation) {
    stopPropagation(event);
  }
}
var { width: windowWidth, height: windowHeight } = useWindowSize();

// ../node_modules/vant/es/utils/format.mjs
function addUnit(value) {
  if (isDef(value)) {
    return isNumeric(value) ? `${value}px` : String(value);
  }
  return void 0;
}
function getSizeStyle(originSize) {
  if (isDef(originSize)) {
    if (Array.isArray(originSize)) {
      return {
        width: addUnit(originSize[0]),
        height: addUnit(originSize[1])
      };
    }
    const size = addUnit(originSize);
    return {
      width: size,
      height: size
    };
  }
}
function getZIndexStyle(zIndex) {
  const style = {};
  if (zIndex !== void 0) {
    style.zIndex = +zIndex;
  }
  return style;
}
var camelizeRE = /-(\w)/g;
var camelize = (str) => str.replace(camelizeRE, (_, c) => c.toUpperCase());
var kebabCase = (str) => str.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "");

// ../node_modules/vant/es/locale/index.mjs
import { ref as ref7, reactive as reactive2 } from "vue";

// ../node_modules/vant/es/utils/deep-assign.mjs
var { hasOwnProperty } = Object.prototype;
function assignKey(to, from, key) {
  const val = from[key];
  if (!isDef(val)) {
    return;
  }
  if (!hasOwnProperty.call(to, key) || !isObject(val)) {
    to[key] = val;
  } else {
    to[key] = deepAssign(Object(to[key]), val);
  }
}
function deepAssign(to, from) {
  Object.keys(from).forEach((key) => {
    assignKey(to, from, key);
  });
  return to;
}

// ../node_modules/vant/es/locale/lang/zh-CN.mjs
var stdin_default = {
  name: "\u59D3\u540D",
  tel: "\u7535\u8BDD",
  save: "\u4FDD\u5B58",
  clear: "\u6E05\u7A7A",
  cancel: "\u53D6\u6D88",
  confirm: "\u786E\u8BA4",
  delete: "\u5220\u9664",
  loading: "\u52A0\u8F7D\u4E2D...",
  noCoupon: "\u6682\u65E0\u4F18\u60E0\u5238",
  nameEmpty: "\u8BF7\u586B\u5199\u59D3\u540D",
  addContact: "\u6DFB\u52A0\u8054\u7CFB\u4EBA",
  telInvalid: "\u8BF7\u586B\u5199\u6B63\u786E\u7684\u7535\u8BDD",
  vanCalendar: {
    end: "\u7ED3\u675F",
    start: "\u5F00\u59CB",
    title: "\u65E5\u671F\u9009\u62E9",
    weekdays: ["\u65E5", "\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D"],
    monthTitle: (year, month) => `${year}\u5E74${month}\u6708`,
    rangePrompt: (maxRange) => `\u6700\u591A\u9009\u62E9 ${maxRange} \u5929`
  },
  vanCascader: {
    select: "\u8BF7\u9009\u62E9"
  },
  vanPagination: {
    prev: "\u4E0A\u4E00\u9875",
    next: "\u4E0B\u4E00\u9875"
  },
  vanPullRefresh: {
    pulling: "\u4E0B\u62C9\u5373\u53EF\u5237\u65B0...",
    loosing: "\u91CA\u653E\u5373\u53EF\u5237\u65B0..."
  },
  vanSubmitBar: {
    label: "\u5408\u8BA1:"
  },
  vanCoupon: {
    unlimited: "\u65E0\u95E8\u69DB",
    discount: (discount) => `${discount}\u6298`,
    condition: (condition) => `\u6EE1${condition}\u5143\u53EF\u7528`
  },
  vanCouponCell: {
    title: "\u4F18\u60E0\u5238",
    count: (count) => `${count}\u5F20\u53EF\u7528`
  },
  vanCouponList: {
    exchange: "\u5151\u6362",
    close: "\u4E0D\u4F7F\u7528",
    enable: "\u53EF\u7528",
    disabled: "\u4E0D\u53EF\u7528",
    placeholder: "\u8F93\u5165\u4F18\u60E0\u7801"
  },
  vanAddressEdit: {
    area: "\u5730\u533A",
    areaEmpty: "\u8BF7\u9009\u62E9\u5730\u533A",
    addressEmpty: "\u8BF7\u586B\u5199\u8BE6\u7EC6\u5730\u5740",
    addressDetail: "\u8BE6\u7EC6\u5730\u5740",
    defaultAddress: "\u8BBE\u4E3A\u9ED8\u8BA4\u6536\u8D27\u5730\u5740"
  },
  vanAddressList: {
    add: "\u65B0\u589E\u5730\u5740"
  }
};

// ../node_modules/vant/es/locale/index.mjs
var lang = ref7("zh-CN");
var messages = reactive2({
  "zh-CN": stdin_default
});
var Locale = {
  messages() {
    return messages[lang.value];
  },
  use(newLang, newMessages) {
    lang.value = newLang;
    this.add({ [newLang]: newMessages });
  },
  add(newMessages = {}) {
    deepAssign(messages, newMessages);
  }
};
var stdin_default2 = Locale;

// ../node_modules/vant/es/utils/create.mjs
function createTranslate(name10) {
  const prefix = camelize(name10) + ".";
  return (path, ...args) => {
    const messages2 = stdin_default2.messages();
    const message = get(messages2, prefix + path) || get(messages2, path);
    return isFunction(message) ? message(...args) : message;
  };
}
function genBem(name10, mods) {
  if (!mods) {
    return "";
  }
  if (typeof mods === "string") {
    return ` ${name10}--${mods}`;
  }
  if (Array.isArray(mods)) {
    return mods.reduce(
      (ret, item) => ret + genBem(name10, item),
      ""
    );
  }
  return Object.keys(mods).reduce(
    (ret, key) => ret + (mods[key] ? genBem(name10, key) : ""),
    ""
  );
}
function createBEM(name10) {
  return (el, mods) => {
    if (el && typeof el !== "string") {
      mods = el;
      el = "";
    }
    el = el ? `${name10}__${el}` : name10;
    return `${el}${genBem(el, mods)}`;
  };
}
function createNamespace(name10) {
  const prefixedName = `van-${name10}`;
  return [
    prefixedName,
    createBEM(prefixedName),
    createTranslate(prefixedName)
  ];
}

// ../node_modules/vant/es/utils/constant.mjs
var BORDER = "van-hairline";
var BORDER_TOP = `${BORDER}--top`;
var BORDER_LEFT = `${BORDER}--left`;
var BORDER_RIGHT = `${BORDER}--right`;
var BORDER_BOTTOM = `${BORDER}--bottom`;
var BORDER_SURROUND = `${BORDER}--surround`;
var BORDER_TOP_BOTTOM = `${BORDER}--top-bottom`;
var BORDER_UNSET_TOP_BOTTOM = `${BORDER}-unset--top-bottom`;
var HAPTICS_FEEDBACK = "van-haptics-feedback";
var FORM_KEY = Symbol("van-form");
var TAP_OFFSET = 5;

// ../node_modules/vant/es/utils/interceptor.mjs
function callInterceptor(interceptor, {
  args = [],
  done,
  canceled,
  error
}) {
  if (interceptor) {
    const returnVal = interceptor.apply(null, args);
    if (isPromise(returnVal)) {
      returnVal.then((value) => {
        if (value) {
          done();
        } else if (canceled) {
          canceled();
        }
      }).catch(error || noop);
    } else if (returnVal) {
      done();
    } else if (canceled) {
      canceled();
    }
  } else {
    done();
  }
}

// ../node_modules/vant/es/utils/with-install.mjs
function withInstall(options) {
  options.install = (app) => {
    const { name: name10 } = options;
    if (name10) {
      app.component(name10, options);
      app.component(camelize(`-${name10}`), options);
    }
  };
  return options;
}

// ../node_modules/vant/es/composables/on-popup-reopen.mjs
import { inject as inject3, watch as watch3 } from "vue";
var POPUP_TOGGLE_KEY = Symbol();

// ../node_modules/vant/es/composables/use-expose.mjs
import { getCurrentInstance as getCurrentInstance3 } from "vue";
function useExpose(apis) {
  const instance = getCurrentInstance3();
  if (instance) {
    extend(instance.proxy, apis);
  }
}

// ../node_modules/vant/es/composables/use-route.mjs
import {
  getCurrentInstance as getCurrentInstance4
} from "vue";
var routeProps = {
  to: [String, Object],
  url: String,
  replace: Boolean
};
function route({
  to,
  url,
  replace,
  $router: router
}) {
  if (to && router) {
    router[replace ? "replace" : "push"](to);
  } else if (url) {
    replace ? location.replace(url) : location.href = url;
  }
}
function useRoute() {
  const vm = getCurrentInstance4().proxy;
  return () => route(vm);
}

// ../node_modules/vant/es/button/Button.mjs
import { defineComponent as defineComponent5, createVNode as _createVNode5 } from "vue";

// ../node_modules/vant/es/icon/Icon.mjs
import { inject as inject4, computed as computed5, defineComponent as defineComponent3, createVNode as _createVNode3, mergeProps as _mergeProps } from "vue";

// ../node_modules/vant/es/badge/Badge.mjs
import { computed as computed3, defineComponent, createVNode as _createVNode } from "vue";
var [name, bem] = createNamespace("badge");
var badgeProps = {
  dot: Boolean,
  max: numericProp,
  tag: makeStringProp("div"),
  color: String,
  offset: Array,
  content: numericProp,
  showZero: truthProp,
  position: makeStringProp("top-right")
};
var stdin_default3 = defineComponent({
  name,
  props: badgeProps,
  setup(props, {
    slots
  }) {
    const hasContent = () => {
      if (slots.content) {
        return true;
      }
      const {
        content,
        showZero
      } = props;
      return isDef(content) && content !== "" && (showZero || content !== 0 && content !== "0");
    };
    const renderContent = () => {
      const {
        dot,
        max,
        content
      } = props;
      if (!dot && hasContent()) {
        if (slots.content) {
          return slots.content();
        }
        if (isDef(max) && isNumeric(content) && +content > +max) {
          return `${max}+`;
        }
        return content;
      }
    };
    const getOffsetWithMinusString = (val) => val.startsWith("-") ? val.replace("-", "") : `-${val}`;
    const style = computed3(() => {
      const style2 = {
        background: props.color
      };
      if (props.offset) {
        const [x, y] = props.offset;
        const {
          position
        } = props;
        const [offsetY, offsetX] = position.split("-");
        if (slots.default) {
          if (typeof y === "number") {
            style2[offsetY] = addUnit(offsetY === "top" ? y : -y);
          } else {
            style2[offsetY] = offsetY === "top" ? addUnit(y) : getOffsetWithMinusString(y);
          }
          if (typeof x === "number") {
            style2[offsetX] = addUnit(offsetX === "left" ? x : -x);
          } else {
            style2[offsetX] = offsetX === "left" ? addUnit(x) : getOffsetWithMinusString(x);
          }
        } else {
          style2.marginTop = addUnit(y);
          style2.marginLeft = addUnit(x);
        }
      }
      return style2;
    });
    const renderBadge = () => {
      if (hasContent() || props.dot) {
        return _createVNode("div", {
          "class": bem([props.position, {
            dot: props.dot,
            fixed: !!slots.default
          }]),
          "style": style.value
        }, [renderContent()]);
      }
    };
    return () => {
      if (slots.default) {
        const {
          tag
        } = props;
        return _createVNode(tag, {
          "class": bem("wrapper")
        }, {
          default: () => [slots.default(), renderBadge()]
        });
      }
      return renderBadge();
    };
  }
});

// ../node_modules/vant/es/badge/index.mjs
var Badge = withInstall(stdin_default3);

// ../node_modules/vant/es/config-provider/ConfigProvider.mjs
import { watch as watch4, provide as provide2, computed as computed4, watchEffect, onActivated as onActivated3, onDeactivated as onDeactivated3, onBeforeUnmount as onBeforeUnmount2, defineComponent as defineComponent2, createVNode as _createVNode2 } from "vue";

// ../node_modules/vant/es/composables/use-global-z-index.mjs
var globalZIndex = 2e3;
var useGlobalZIndex = () => ++globalZIndex;
var setGlobalZIndex = (val) => {
  globalZIndex = val;
};

// ../node_modules/vant/es/config-provider/ConfigProvider.mjs
var [name2, bem2] = createNamespace("config-provider");
var CONFIG_PROVIDER_KEY = Symbol(name2);
var configProviderProps = {
  tag: makeStringProp("div"),
  theme: makeStringProp("light"),
  zIndex: Number,
  themeVars: Object,
  themeVarsDark: Object,
  themeVarsLight: Object,
  themeVarsScope: makeStringProp("local"),
  iconPrefix: String
};
function insertDash(str) {
  return str.replace(/([a-zA-Z])(\d)/g, "$1-$2");
}
function mapThemeVarsToCSSVars(themeVars) {
  const cssVars = {};
  Object.keys(themeVars).forEach((key) => {
    const formattedKey = insertDash(kebabCase(key));
    cssVars[`--van-${formattedKey}`] = themeVars[key];
  });
  return cssVars;
}
function syncThemeVarsOnRoot(newStyle = {}, oldStyle = {}) {
  Object.keys(newStyle).forEach((key) => {
    if (newStyle[key] !== oldStyle[key]) {
      document.documentElement.style.setProperty(key, newStyle[key]);
    }
  });
  Object.keys(oldStyle).forEach((key) => {
    if (!newStyle[key]) {
      document.documentElement.style.removeProperty(key);
    }
  });
}
var stdin_default4 = defineComponent2({
  name: name2,
  props: configProviderProps,
  setup(props, {
    slots
  }) {
    const style = computed4(() => mapThemeVarsToCSSVars(extend({}, props.themeVars, props.theme === "dark" ? props.themeVarsDark : props.themeVarsLight)));
    if (inBrowser) {
      const addTheme = () => {
        document.documentElement.classList.add(`van-theme-${props.theme}`);
      };
      const removeTheme = (theme = props.theme) => {
        document.documentElement.classList.remove(`van-theme-${theme}`);
      };
      watch4(() => props.theme, (newVal, oldVal) => {
        if (oldVal) {
          removeTheme(oldVal);
        }
        addTheme();
      }, {
        immediate: true
      });
      onActivated3(addTheme);
      onDeactivated3(removeTheme);
      onBeforeUnmount2(removeTheme);
      watch4(style, (newStyle, oldStyle) => {
        if (props.themeVarsScope === "global") {
          syncThemeVarsOnRoot(newStyle, oldStyle);
        }
      });
      watch4(() => props.themeVarsScope, (newScope, oldScope) => {
        if (oldScope === "global") {
          syncThemeVarsOnRoot({}, style.value);
        }
        if (newScope === "global") {
          syncThemeVarsOnRoot(style.value, {});
        }
      });
      if (props.themeVarsScope === "global") {
        syncThemeVarsOnRoot(style.value, {});
      }
    }
    provide2(CONFIG_PROVIDER_KEY, props);
    watchEffect(() => {
      if (props.zIndex !== void 0) {
        setGlobalZIndex(props.zIndex);
      }
    });
    return () => _createVNode2(props.tag, {
      "class": bem2(),
      "style": props.themeVarsScope === "local" ? style.value : void 0
    }, {
      default: () => {
        var _a;
        return [(_a = slots.default) == null ? void 0 : _a.call(slots)];
      }
    });
  }
});

// ../node_modules/vant/es/icon/Icon.mjs
var [name3, bem3] = createNamespace("icon");
var isImage = (name22) => name22 == null ? void 0 : name22.includes("/");
var iconProps = {
  dot: Boolean,
  tag: makeStringProp("i"),
  name: String,
  size: numericProp,
  badge: numericProp,
  color: String,
  badgeProps: Object,
  classPrefix: String
};
var stdin_default5 = defineComponent3({
  name: name3,
  props: iconProps,
  setup(props, {
    slots
  }) {
    const config = inject4(CONFIG_PROVIDER_KEY, null);
    const classPrefix = computed5(() => props.classPrefix || (config == null ? void 0 : config.iconPrefix) || bem3());
    return () => {
      const {
        tag,
        dot,
        name: name22,
        size,
        badge,
        color
      } = props;
      const isImageIcon = isImage(name22);
      return _createVNode3(Badge, _mergeProps({
        "dot": dot,
        "tag": tag,
        "class": [classPrefix.value, isImageIcon ? "" : `${classPrefix.value}-${name22}`],
        "style": {
          color,
          fontSize: addUnit(size)
        },
        "content": badge
      }, props.badgeProps), {
        default: () => {
          var _a;
          return [(_a = slots.default) == null ? void 0 : _a.call(slots), isImageIcon && _createVNode3("img", {
            "class": bem3("image"),
            "src": name22
          }, null)];
        }
      });
    };
  }
});

// ../node_modules/vant/es/icon/index.mjs
var Icon = withInstall(stdin_default5);

// ../node_modules/vant/es/loading/Loading.mjs
import { computed as computed6, defineComponent as defineComponent4, createVNode as _createVNode4 } from "vue";
var [name4, bem4] = createNamespace("loading");
var SpinIcon = Array(12).fill(null).map((_, index) => _createVNode4("i", {
  "class": bem4("line", String(index + 1))
}, null));
var CircularIcon = _createVNode4("svg", {
  "class": bem4("circular"),
  "viewBox": "25 25 50 50"
}, [_createVNode4("circle", {
  "cx": "50",
  "cy": "50",
  "r": "20",
  "fill": "none"
}, null)]);
var loadingProps = {
  size: numericProp,
  type: makeStringProp("circular"),
  color: String,
  vertical: Boolean,
  textSize: numericProp,
  textColor: String
};
var stdin_default6 = defineComponent4({
  name: name4,
  props: loadingProps,
  setup(props, {
    slots
  }) {
    const spinnerStyle = computed6(() => extend({
      color: props.color
    }, getSizeStyle(props.size)));
    const renderIcon = () => {
      const DefaultIcon = props.type === "spinner" ? SpinIcon : CircularIcon;
      return _createVNode4("span", {
        "class": bem4("spinner", props.type),
        "style": spinnerStyle.value
      }, [slots.icon ? slots.icon() : DefaultIcon]);
    };
    const renderText = () => {
      var _a;
      if (slots.default) {
        return _createVNode4("span", {
          "class": bem4("text"),
          "style": {
            fontSize: addUnit(props.textSize),
            color: (_a = props.textColor) != null ? _a : props.color
          }
        }, [slots.default()]);
      }
    };
    return () => {
      const {
        type,
        vertical
      } = props;
      return _createVNode4("div", {
        "class": bem4([type, {
          vertical
        }]),
        "aria-live": "polite",
        "aria-busy": true
      }, [renderIcon(), renderText()]);
    };
  }
});

// ../node_modules/vant/es/loading/index.mjs
var Loading = withInstall(stdin_default6);

// ../node_modules/vant/es/button/Button.mjs
var [name5, bem5] = createNamespace("button");
var buttonProps = extend({}, routeProps, {
  tag: makeStringProp("button"),
  text: String,
  icon: String,
  type: makeStringProp("default"),
  size: makeStringProp("normal"),
  color: String,
  block: Boolean,
  plain: Boolean,
  round: Boolean,
  square: Boolean,
  loading: Boolean,
  hairline: Boolean,
  disabled: Boolean,
  iconPrefix: String,
  nativeType: makeStringProp("button"),
  loadingSize: numericProp,
  loadingText: String,
  loadingType: String,
  iconPosition: makeStringProp("left")
});
var stdin_default7 = defineComponent5({
  name: name5,
  props: buttonProps,
  emits: ["click"],
  setup(props, {
    emit,
    slots
  }) {
    const route2 = useRoute();
    const renderLoadingIcon = () => {
      if (slots.loading) {
        return slots.loading();
      }
      return _createVNode5(Loading, {
        "size": props.loadingSize,
        "type": props.loadingType,
        "class": bem5("loading")
      }, null);
    };
    const renderIcon = () => {
      if (props.loading) {
        return renderLoadingIcon();
      }
      if (slots.icon) {
        return _createVNode5("div", {
          "class": bem5("icon")
        }, [slots.icon()]);
      }
      if (props.icon) {
        return _createVNode5(Icon, {
          "name": props.icon,
          "class": bem5("icon"),
          "classPrefix": props.iconPrefix
        }, null);
      }
    };
    const renderText = () => {
      let text;
      if (props.loading) {
        text = props.loadingText;
      } else {
        text = slots.default ? slots.default() : props.text;
      }
      if (text) {
        return _createVNode5("span", {
          "class": bem5("text")
        }, [text]);
      }
    };
    const getStyle = () => {
      const {
        color,
        plain
      } = props;
      if (color) {
        const style = {
          color: plain ? color : "white"
        };
        if (!plain) {
          style.background = color;
        }
        if (color.includes("gradient")) {
          style.border = 0;
        } else {
          style.borderColor = color;
        }
        return style;
      }
    };
    const onClick = (event) => {
      if (props.loading) {
        preventDefault(event);
      } else if (!props.disabled) {
        emit("click", event);
        route2();
      }
    };
    return () => {
      const {
        tag,
        type,
        size,
        block,
        round,
        plain,
        square,
        loading,
        disabled,
        hairline,
        nativeType,
        iconPosition
      } = props;
      const classes = [bem5([type, size, {
        plain,
        block,
        round,
        square,
        loading,
        disabled,
        hairline
      }]), {
        [BORDER_SURROUND]: hairline
      }];
      return _createVNode5(tag, {
        "type": nativeType,
        "class": classes,
        "style": getStyle(),
        "disabled": disabled,
        "onClick": onClick
      }, {
        default: () => [_createVNode5("div", {
          "class": bem5("content")
        }, [iconPosition === "left" && renderIcon(), renderText(), iconPosition === "right" && renderIcon()])]
      });
    };
  }
});

// ../node_modules/vant/es/button/index.mjs
var Button = withInstall(stdin_default7);

// ../node_modules/vant/es/popup/Popup.mjs
import { ref as ref11, watch as watch7, provide as provide3, Teleport as Teleport2, nextTick as nextTick2, computed as computed7, onMounted as onMounted3, Transition as Transition2, onActivated as onActivated4, onDeactivated as onDeactivated5, defineComponent as defineComponent7, mergeProps as _mergeProps3, createVNode as _createVNode7, vShow as _vShow2, withDirectives as _withDirectives2, Fragment as _Fragment } from "vue";

// ../node_modules/vant/es/popup/shared.mjs
var popupSharedProps = {
  // whether to show popup
  show: Boolean,
  // z-index
  zIndex: numericProp,
  // whether to show overlay
  overlay: truthProp,
  // transition duration
  duration: numericProp,
  // teleport
  teleport: [String, Object],
  // prevent body scroll
  lockScroll: truthProp,
  // whether to lazy render
  lazyRender: truthProp,
  // callback function before close
  beforeClose: Function,
  // overlay props
  overlayProps: Object,
  // overlay custom style
  overlayStyle: Object,
  // overlay custom class name
  overlayClass: unknownProp,
  // Initial rendering animation
  transitionAppear: Boolean,
  // whether to close popup when overlay is clicked
  closeOnClickOverlay: truthProp
};
var popupSharedPropKeys = Object.keys(
  popupSharedProps
);

// ../node_modules/vant/es/composables/use-lock-scroll.mjs
import { watch as watch5, onBeforeUnmount as onBeforeUnmount3, onDeactivated as onDeactivated4 } from "vue";

// ../node_modules/vant/es/composables/use-touch.mjs
import { ref as ref8 } from "vue";
function getDirection(x, y) {
  if (x > y) {
    return "horizontal";
  }
  if (y > x) {
    return "vertical";
  }
  return "";
}
function useTouch() {
  const startX = ref8(0);
  const startY = ref8(0);
  const deltaX = ref8(0);
  const deltaY = ref8(0);
  const offsetX = ref8(0);
  const offsetY = ref8(0);
  const direction = ref8("");
  const isTap = ref8(true);
  const isVertical = () => direction.value === "vertical";
  const isHorizontal = () => direction.value === "horizontal";
  const reset = () => {
    deltaX.value = 0;
    deltaY.value = 0;
    offsetX.value = 0;
    offsetY.value = 0;
    direction.value = "";
    isTap.value = true;
  };
  const start = (event) => {
    reset();
    startX.value = event.touches[0].clientX;
    startY.value = event.touches[0].clientY;
  };
  const move = (event) => {
    const touch = event.touches[0];
    deltaX.value = (touch.clientX < 0 ? 0 : touch.clientX) - startX.value;
    deltaY.value = touch.clientY - startY.value;
    offsetX.value = Math.abs(deltaX.value);
    offsetY.value = Math.abs(deltaY.value);
    const LOCK_DIRECTION_DISTANCE = 10;
    if (!direction.value || offsetX.value < LOCK_DIRECTION_DISTANCE && offsetY.value < LOCK_DIRECTION_DISTANCE) {
      direction.value = getDirection(offsetX.value, offsetY.value);
    }
    if (isTap.value && (offsetX.value > TAP_OFFSET || offsetY.value > TAP_OFFSET)) {
      isTap.value = false;
    }
  };
  return {
    move,
    start,
    reset,
    startX,
    startY,
    deltaX,
    deltaY,
    offsetX,
    offsetY,
    direction,
    isVertical,
    isHorizontal,
    isTap
  };
}

// ../node_modules/vant/es/composables/use-lock-scroll.mjs
var totalLockCount = 0;
var BODY_LOCK_CLASS = "van-overflow-hidden";
function useLockScroll(rootRef, shouldLock) {
  const touch = useTouch();
  const DIRECTION_UP = "01";
  const DIRECTION_DOWN = "10";
  const onTouchMove = (event) => {
    touch.move(event);
    const direction = touch.deltaY.value > 0 ? DIRECTION_DOWN : DIRECTION_UP;
    const el = getScrollParent(
      event.target,
      rootRef.value
    );
    const { scrollHeight, offsetHeight, scrollTop } = el;
    let status = "11";
    if (scrollTop === 0) {
      status = offsetHeight >= scrollHeight ? "00" : "01";
    } else if (scrollTop + offsetHeight >= scrollHeight) {
      status = "10";
    }
    if (status !== "11" && touch.isVertical() && !(parseInt(status, 2) & parseInt(direction, 2))) {
      preventDefault(event, true);
    }
  };
  const lock = () => {
    document.addEventListener("touchstart", touch.start);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    if (!totalLockCount) {
      document.body.classList.add(BODY_LOCK_CLASS);
    }
    totalLockCount++;
  };
  const unlock = () => {
    if (totalLockCount) {
      document.removeEventListener("touchstart", touch.start);
      document.removeEventListener("touchmove", onTouchMove);
      totalLockCount--;
      if (!totalLockCount) {
        document.body.classList.remove(BODY_LOCK_CLASS);
      }
    }
  };
  const init = () => shouldLock() && lock();
  const destroy = () => shouldLock() && unlock();
  onMountedOrActivated(init);
  onDeactivated4(destroy);
  onBeforeUnmount3(destroy);
  watch5(shouldLock, (value) => {
    value ? lock() : unlock();
  });
}

// ../node_modules/vant/es/composables/use-lazy-render.mjs
import { ref as ref9, watch as watch6 } from "vue";
function useLazyRender(show) {
  const inited = ref9(false);
  watch6(
    show,
    (value) => {
      if (value) {
        inited.value = value;
      }
    },
    { immediate: true }
  );
  return (render) => () => inited.value ? render() : null;
}

// ../node_modules/vant/es/composables/use-scope-id.mjs
import { getCurrentInstance as getCurrentInstance5 } from "vue";
var useScopeId = () => {
  var _a;
  const { scopeId } = ((_a = getCurrentInstance5()) == null ? void 0 : _a.vnode) || {};
  return scopeId ? { [scopeId]: "" } : null;
};

// ../node_modules/vant/es/overlay/Overlay.mjs
import { ref as ref10, defineComponent as defineComponent6, Teleport, Transition, vShow as _vShow, mergeProps as _mergeProps2, createVNode as _createVNode6, withDirectives as _withDirectives } from "vue";
var [name6, bem6] = createNamespace("overlay");
var overlayProps = {
  show: Boolean,
  zIndex: numericProp,
  duration: numericProp,
  className: unknownProp,
  lockScroll: truthProp,
  lazyRender: truthProp,
  customStyle: Object,
  teleport: [String, Object]
};
var stdin_default8 = defineComponent6({
  name: name6,
  inheritAttrs: false,
  props: overlayProps,
  setup(props, {
    attrs,
    slots
  }) {
    const root = ref10();
    const lazyRender = useLazyRender(() => props.show || !props.lazyRender);
    const onTouchMove = (event) => {
      if (props.lockScroll) {
        preventDefault(event, true);
      }
    };
    const renderOverlay = lazyRender(() => {
      var _a;
      const style = extend(getZIndexStyle(props.zIndex), props.customStyle);
      if (isDef(props.duration)) {
        style.animationDuration = `${props.duration}s`;
      }
      return _withDirectives(_createVNode6("div", _mergeProps2({
        "ref": root,
        "style": style,
        "class": [bem6(), props.className]
      }, attrs), [(_a = slots.default) == null ? void 0 : _a.call(slots)]), [[_vShow, props.show]]);
    });
    useEventListener("touchmove", onTouchMove, {
      target: root
    });
    return () => {
      const Content = _createVNode6(Transition, {
        "name": "van-fade",
        "appear": true
      }, {
        default: renderOverlay
      });
      if (props.teleport) {
        return _createVNode6(Teleport, {
          "to": props.teleport
        }, {
          default: () => [Content]
        });
      }
      return Content;
    };
  }
});

// ../node_modules/vant/es/overlay/index.mjs
var Overlay = withInstall(stdin_default8);

// ../node_modules/vant/es/popup/Popup.mjs
var popupProps = extend({}, popupSharedProps, {
  round: Boolean,
  position: makeStringProp("center"),
  closeIcon: makeStringProp("cross"),
  closeable: Boolean,
  transition: String,
  iconPrefix: String,
  closeOnPopstate: Boolean,
  closeIconPosition: makeStringProp("top-right"),
  destroyOnClose: Boolean,
  safeAreaInsetTop: Boolean,
  safeAreaInsetBottom: Boolean
});
var [name7, bem7] = createNamespace("popup");
var stdin_default9 = defineComponent7({
  name: name7,
  inheritAttrs: false,
  props: popupProps,
  emits: ["open", "close", "opened", "closed", "keydown", "update:show", "clickOverlay", "clickCloseIcon"],
  setup(props, {
    emit,
    attrs,
    slots
  }) {
    let opened;
    let shouldReopen;
    const zIndex = ref11();
    const popupRef = ref11();
    const lazyRender = useLazyRender(() => props.show || !props.lazyRender);
    const style = computed7(() => {
      const style2 = {
        zIndex: zIndex.value
      };
      if (isDef(props.duration)) {
        const key = props.position === "center" ? "animationDuration" : "transitionDuration";
        style2[key] = `${props.duration}s`;
      }
      return style2;
    });
    const open = () => {
      if (!opened) {
        opened = true;
        zIndex.value = props.zIndex !== void 0 ? +props.zIndex : useGlobalZIndex();
        emit("open");
      }
    };
    const close = () => {
      if (opened) {
        callInterceptor(props.beforeClose, {
          done() {
            opened = false;
            emit("close");
            emit("update:show", false);
          }
        });
      }
    };
    const onClickOverlay = (event) => {
      emit("clickOverlay", event);
      if (props.closeOnClickOverlay) {
        close();
      }
    };
    const renderOverlay = () => {
      if (props.overlay) {
        const overlayProps2 = extend({
          show: props.show,
          class: props.overlayClass,
          zIndex: zIndex.value,
          duration: props.duration,
          customStyle: props.overlayStyle,
          role: props.closeOnClickOverlay ? "button" : void 0,
          tabindex: props.closeOnClickOverlay ? 0 : void 0
        }, props.overlayProps);
        return _createVNode7(Overlay, _mergeProps3(overlayProps2, useScopeId(), {
          "onClick": onClickOverlay
        }), {
          default: slots["overlay-content"]
        });
      }
    };
    const onClickCloseIcon = (event) => {
      emit("clickCloseIcon", event);
      close();
    };
    const renderCloseIcon = () => {
      if (props.closeable) {
        return _createVNode7(Icon, {
          "role": "button",
          "tabindex": 0,
          "name": props.closeIcon,
          "class": [bem7("close-icon", props.closeIconPosition), HAPTICS_FEEDBACK],
          "classPrefix": props.iconPrefix,
          "onClick": onClickCloseIcon
        }, null);
      }
    };
    let timer;
    const onOpened = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        emit("opened");
      });
    };
    const onClosed = () => emit("closed");
    const onKeydown = (event) => emit("keydown", event);
    const renderPopup = lazyRender(() => {
      var _a;
      const {
        destroyOnClose,
        round,
        position,
        safeAreaInsetTop,
        safeAreaInsetBottom,
        show
      } = props;
      if (!show && destroyOnClose) {
        return;
      }
      return _withDirectives2(_createVNode7("div", _mergeProps3({
        "ref": popupRef,
        "style": style.value,
        "role": "dialog",
        "tabindex": 0,
        "class": [bem7({
          round,
          [position]: position
        }), {
          "van-safe-area-top": safeAreaInsetTop,
          "van-safe-area-bottom": safeAreaInsetBottom
        }],
        "onKeydown": onKeydown
      }, attrs, useScopeId()), [(_a = slots.default) == null ? void 0 : _a.call(slots), renderCloseIcon()]), [[_vShow2, show]]);
    });
    const renderTransition = () => {
      const {
        position,
        transition,
        transitionAppear
      } = props;
      const name22 = position === "center" ? "van-fade" : `van-popup-slide-${position}`;
      return _createVNode7(Transition2, {
        "name": transition || name22,
        "appear": transitionAppear,
        "onAfterEnter": onOpened,
        "onAfterLeave": onClosed
      }, {
        default: renderPopup
      });
    };
    watch7(() => props.show, (show) => {
      if (show && !opened) {
        open();
        if (attrs.tabindex === 0) {
          nextTick2(() => {
            var _a;
            (_a = popupRef.value) == null ? void 0 : _a.focus();
          });
        }
      }
      if (!show && opened) {
        opened = false;
        emit("close");
      }
    });
    useExpose({
      popupRef
    });
    useLockScroll(popupRef, () => props.show && props.lockScroll);
    useEventListener("popstate", () => {
      if (props.closeOnPopstate) {
        close();
        shouldReopen = false;
      }
    });
    onMounted3(() => {
      if (props.show) {
        open();
      }
    });
    onActivated4(() => {
      if (shouldReopen) {
        emit("update:show", true);
        shouldReopen = false;
      }
    });
    onDeactivated5(() => {
      if (props.show && props.teleport) {
        close();
        shouldReopen = true;
      }
    });
    provide3(POPUP_TOGGLE_KEY, () => props.show);
    return () => {
      if (props.teleport) {
        return _createVNode7(Teleport2, {
          "to": props.teleport
        }, {
          default: () => [renderOverlay(), renderTransition()]
        });
      }
      return _createVNode7(_Fragment, null, [renderOverlay(), renderTransition()]);
    };
  }
});

// ../node_modules/vant/es/popup/index.mjs
var Popup = withInstall(stdin_default9);

// ../node_modules/vant/es/cell/Cell.mjs
import { defineComponent as defineComponent8, createVNode as _createVNode8 } from "vue";
var [name8, bem8] = createNamespace("cell");
var cellSharedProps = {
  tag: makeStringProp("div"),
  icon: String,
  size: String,
  title: numericProp,
  value: numericProp,
  label: numericProp,
  center: Boolean,
  isLink: Boolean,
  border: truthProp,
  iconPrefix: String,
  valueClass: unknownProp,
  labelClass: unknownProp,
  titleClass: unknownProp,
  titleStyle: null,
  arrowDirection: String,
  required: {
    type: [Boolean, String],
    default: null
  },
  clickable: {
    type: Boolean,
    default: null
  }
};
var cellProps = extend({}, cellSharedProps, routeProps);
var stdin_default10 = defineComponent8({
  name: name8,
  props: cellProps,
  setup(props, {
    slots
  }) {
    const route2 = useRoute();
    const renderLabel = () => {
      const showLabel = slots.label || isDef(props.label);
      if (showLabel) {
        return _createVNode8("div", {
          "class": [bem8("label"), props.labelClass]
        }, [slots.label ? slots.label() : props.label]);
      }
    };
    const renderTitle = () => {
      var _a;
      if (slots.title || isDef(props.title)) {
        const titleSlot = (_a = slots.title) == null ? void 0 : _a.call(slots);
        if (Array.isArray(titleSlot) && titleSlot.length === 0) {
          return;
        }
        return _createVNode8("div", {
          "class": [bem8("title"), props.titleClass],
          "style": props.titleStyle
        }, [titleSlot || _createVNode8("span", null, [props.title]), renderLabel()]);
      }
    };
    const renderValue = () => {
      const slot = slots.value || slots.default;
      const hasValue = slot || isDef(props.value);
      if (hasValue) {
        return _createVNode8("div", {
          "class": [bem8("value"), props.valueClass]
        }, [slot ? slot() : _createVNode8("span", null, [props.value])]);
      }
    };
    const renderLeftIcon = () => {
      if (slots.icon) {
        return slots.icon();
      }
      if (props.icon) {
        return _createVNode8(Icon, {
          "name": props.icon,
          "class": bem8("left-icon"),
          "classPrefix": props.iconPrefix
        }, null);
      }
    };
    const renderRightIcon = () => {
      if (slots["right-icon"]) {
        return slots["right-icon"]();
      }
      if (props.isLink) {
        const name22 = props.arrowDirection && props.arrowDirection !== "right" ? `arrow-${props.arrowDirection}` : "arrow";
        return _createVNode8(Icon, {
          "name": name22,
          "class": bem8("right-icon")
        }, null);
      }
    };
    return () => {
      var _a;
      const {
        tag,
        size,
        center,
        border,
        isLink,
        required
      } = props;
      const clickable = (_a = props.clickable) != null ? _a : isLink;
      const classes = {
        center,
        required: !!required,
        clickable,
        borderless: !border
      };
      if (size) {
        classes[size] = !!size;
      }
      return _createVNode8(tag, {
        "class": bem8(classes),
        "role": clickable ? "button" : void 0,
        "tabindex": clickable ? 0 : void 0,
        "onClick": route2
      }, {
        default: () => {
          var _a2;
          return [renderLeftIcon(), renderTitle(), renderValue(), renderRightIcon(), (_a2 = slots.extra) == null ? void 0 : _a2.call(slots)];
        }
      });
    };
  }
});

// ../node_modules/vant/es/cell/index.mjs
var Cell = withInstall(stdin_default10);

// ../node_modules/vant/es/toast/Toast.mjs
import { watch as watch8, onMounted as onMounted4, onUnmounted as onUnmounted3, defineComponent as defineComponent9, createVNode as _createVNode9, mergeProps as _mergeProps4 } from "vue";

// ../node_modules/vant/es/toast/lock-click.mjs
var lockCount = 0;
function lockClick(lock) {
  if (lock) {
    if (!lockCount) {
      document.body.classList.add("van-toast--unclickable");
    }
    lockCount++;
  } else if (lockCount) {
    lockCount--;
    if (!lockCount) {
      document.body.classList.remove("van-toast--unclickable");
    }
  }
}

// ../node_modules/vant/es/toast/Toast.mjs
var [name9, bem9] = createNamespace("toast");
var popupInheritProps = ["show", "overlay", "teleport", "transition", "overlayClass", "overlayStyle", "closeOnClickOverlay", "zIndex"];
var toastProps = {
  icon: String,
  show: Boolean,
  type: makeStringProp("text"),
  overlay: Boolean,
  message: numericProp,
  iconSize: numericProp,
  duration: makeNumberProp(2e3),
  position: makeStringProp("middle"),
  teleport: [String, Object],
  wordBreak: String,
  className: unknownProp,
  iconPrefix: String,
  transition: makeStringProp("van-fade"),
  loadingType: String,
  forbidClick: Boolean,
  overlayClass: unknownProp,
  overlayStyle: Object,
  closeOnClick: Boolean,
  closeOnClickOverlay: Boolean,
  zIndex: numericProp
};
var stdin_default11 = defineComponent9({
  name: name9,
  props: toastProps,
  emits: ["update:show"],
  setup(props, {
    emit,
    slots
  }) {
    let timer;
    let clickable = false;
    const toggleClickable = () => {
      const newValue = props.show && props.forbidClick;
      if (clickable !== newValue) {
        clickable = newValue;
        lockClick(clickable);
      }
    };
    const updateShow = (show) => emit("update:show", show);
    const onClick = () => {
      if (props.closeOnClick) {
        updateShow(false);
      }
    };
    const clearTimer = () => clearTimeout(timer);
    const renderIcon = () => {
      const {
        icon,
        type,
        iconSize,
        iconPrefix,
        loadingType
      } = props;
      const hasIcon = icon || type === "success" || type === "fail";
      if (hasIcon) {
        return _createVNode9(Icon, {
          "name": icon || type,
          "size": iconSize,
          "class": bem9("icon"),
          "classPrefix": iconPrefix
        }, null);
      }
      if (type === "loading") {
        return _createVNode9(Loading, {
          "class": bem9("loading"),
          "size": iconSize,
          "type": loadingType
        }, null);
      }
    };
    const renderMessage = () => {
      const {
        type,
        message
      } = props;
      if (slots.message) {
        return _createVNode9("div", {
          "class": bem9("text")
        }, [slots.message()]);
      }
      if (isDef(message) && message !== "") {
        return type === "html" ? _createVNode9("div", {
          "key": 0,
          "class": bem9("text"),
          "innerHTML": String(message)
        }, null) : _createVNode9("div", {
          "class": bem9("text")
        }, [message]);
      }
    };
    watch8(() => [props.show, props.forbidClick], toggleClickable);
    watch8(() => [props.show, props.type, props.message, props.duration], () => {
      clearTimer();
      if (props.show && props.duration > 0) {
        timer = setTimeout(() => {
          updateShow(false);
        }, props.duration);
      }
    });
    onMounted4(toggleClickable);
    onUnmounted3(toggleClickable);
    return () => _createVNode9(Popup, _mergeProps4({
      "class": [bem9([props.position, props.wordBreak === "normal" ? "break-normal" : props.wordBreak, {
        [props.type]: !props.icon
      }]), props.className],
      "lockScroll": false,
      "onClick": onClick,
      "onClosed": clearTimer,
      "onUpdate:show": updateShow
    }, pick(props, popupInheritProps)), {
      default: () => [renderIcon(), renderMessage()]
    });
  }
});

// ../node_modules/vant/es/toast/index.mjs
var Toast = withInstall(stdin_default11);
export {
  Button,
  Cell,
  Toast
};
