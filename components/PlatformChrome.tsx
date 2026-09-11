"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 挂载主站导出的平台页眉与页脚（虾米伙伴 › 虾米看AI）。
 *
 * 做法与虾米看股一致（wiki/27 第 3 节）：**不抄一份、也不共享源码**，
 * 而是运行时加载主站构建产出的 `/chrome/chrome.js` —— 那里面跑的是真正的组件，
 * 自带账号请求与积分胶囊。主站改了页眉，这里下次刷新就跟上，本仓不用重新构建。
 *
 * ## 两件本仓特有的事
 *
 * 1. **路径必须写死 `/chrome/…`，不能带 basePath。** 本仓的 basePath 是 `/atlas`，
 *    但制品在站点根上（`xiamimate.com/chrome/chrome.js`），走 Next 的资源前缀会 404。
 *
 * 2. **取不到就整个不渲染。** 本地 dev（:3400）与一份干净 clone 都没有主站，
 *    一律降级成「没有平台页眉」——本仓自己的导航是完整的，
 *    少一条平台横条不影响用。**半塌的页眉比没有更糟。**
 *
 *    ⚠️ 这带来一个坑：**直接开 :3400 永远看不到平台页眉**，因为 `/chrome/*`
 *    在主站那个源上。两个「看起来都对」的地址只有一个是并入后的真形态。
 *    要看真形态跑 `npm run gateway`（:8080），规则与线上 Caddy 一一对应。
 *
 * 挂上之后 `<html data-chrome="on">`，Nav 据此收起自己那份品牌字样，
 * 避免「虾米伙伴 › 虾米看AI」和「虾米看AI · AI 视频」在两行里各说一遍。
 */
const CHROME_JS = "/chrome/chrome.js";
const CHROME_CSS = "/chrome/chrome.css";
const CHROME_MANIFEST = "/chrome/manifest.json";
const MODULE_KEY = "atlas";

interface ChromeApi {
  header(selector: string, options?: { module?: string; headerPadding?: string }): void;
  footer(selector: string, options?: { footerPadding?: string }): void;
}
declare global {
  interface Window {
    XiamiChrome?: ChromeApi;
  }
}

let loading: Promise<ChromeApi | null> | null = null;

/**
 * **先探 manifest，确认真有制品再注入 `<script>`。**
 *
 * 不能只靠 `script.onerror` —— 那只在网络层失败时触发。很多静态服务器（包括我们
 * 自己出站验证里那个、以及配错的 Caddy）对未命中的路径**回退 index.html**：
 * `/chrome/chrome.js` 于是回 200 + 一坨 HTML，浏览器把它当 JS 解析，
 * 结果是控制台一句 `SyntaxError: Unexpected token '<'`，而**页面看上去完全正常**。
 * 又一个「200 不代表拿到的是那个东西」。
 */
async function probe(): Promise<boolean> {
  try {
    const res = await fetch(CHROME_MANIFEST, { cache: "no-cache" });
    if (!res.ok) return false;
    const m = await res.json();          // 回退成 HTML 时这里就抛了
    return typeof m?.files?.script === "string";
  } catch {
    return false;
  }
}

function loadChrome(): Promise<ChromeApi | null> {
  loading ??= new Promise<ChromeApi | null>((resolve) => {
    if (window.XiamiChrome) return resolve(window.XiamiChrome);
    void probe().then((ok) => {
      if (!ok) return resolve(null);
      inject(resolve);
    });
  });
  return loading;
}

function inject(resolve: (api: ChromeApi | null) => void) {
  {
    if (!document.querySelector("link[data-xm-chrome]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CHROME_CSS;
      link.dataset.xmChrome = "1";
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = CHROME_JS;
    script.onload = () => resolve(window.XiamiChrome ?? null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  }
}

function Slot({ part }: { part: "header" | "footer" }) {
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (done.current) return;
    let live = true;
    void loadChrome().then((api) => {
      if (!live || !api || !ref.current) return;
      done.current = true;
      ref.current.id = `xm-chrome-${part}`;
      /**
       * **不传 padding，用主站的默认值。**
       *
       * 主站 `.topbar` 是 `0 4vw`、`.site-footer` 是 `14px 5vw`，虾米跨境用的就是这个。
       * 我第一版传了 `0 24px`，结果 /atlas 的页眉贴着屏幕边，跟主页、虾米跨境**明显对不齐** ——
       * 用户一眼就看出来了。
       *
       * 虾米看股确实传了自己的 padding，但那是**它有理由**：左边 248px 侧边栏，
       * 套 4vw 会把页脚内容挤到右半边。本仓是居中排版，与主站同构，
       * **没有那个理由就不该覆盖** —— 平台页眉的意义正是「看着像同一个产品」。
       */
      if (part === "header") api.header(`#xm-chrome-${part}`, { module: MODULE_KEY });
      else api.footer(`#xm-chrome-${part}`);
      setOn(true);
      document.documentElement.dataset.chrome = "on";
    });
    return () => {
      live = false;
    };
  }, [part]);

  // 没挂上时不占位 —— 留一个空 div 会在导航上方压出一条无来由的空白
  return <div ref={ref} style={on ? undefined : { display: "none" }} />;
}

export const ChromeHeader = () => <Slot part="header" />;
export const ChromeFooter = () => <Slot part="footer" />;
