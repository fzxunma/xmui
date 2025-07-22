import {
  parse,
  compileTemplate,
  compileScript,
} from "./vendor/compiler-sfc.esm-browser.js";
import { resolve } from "path";

export class XmCacheFs {
  static cacheFile = new Map();
  static getCacheFile(file) {
    if (XmCacheFs.cacheFile.has(file)) {
      return XmCacheFs.cacheFile.get(file);
    }
    return null;
  }
  static setCacheFile(file, content) {
    XmCacheFs.cacheFile.set(file, content);
  }
  static async rebuildVue(vueFilePath, finalFilePath) {
    const vueContent = await Bun.file(vueFilePath).text();
    const { descriptor } = parse(vueContent);
    const script = compileScript(descriptor, { id: vueFilePath });
    const template = compileTemplate({
      source: descriptor.template.content,
      filename: vueFilePath,
      id: vueFilePath,
    });

    let output = script.content.replace(
      "export default {",
      "const component = {"
    );

    // Attach render function
    output += `\n${template.code.replace(
      "export function render",
      "component.render = function render"
    )}`;

    // Export the component
    output += `\nexport default component;`;

    // Post-process to remove ', ref' from __returned__ (exclude import from exposed bindings)
    output = output.replace(", ref", "");
    XmCacheFs.setCacheFile(finalFilePath, output);
    return output;
  }
  static async buildVue(filePath) {
    const vueFilePath = resolve(filePath);
    try {
      let finalFilePath = `${vueFilePath}.js`;

      //let fileExists = XmCacheFs.getCacheFile(finalFilePath);
      //if (!fileExists) {
      const fileContext = await XmCacheFs.rebuildVue(vueFilePath, finalFilePath);
      //}

      return new Response(fileContext, {
        headers: { "Content-Type": "text/javascript" },
      });
    } catch (error) {
      console.error(`Error compiling Vue file: ${vueFilePath}`, error);
      return new Response("Not Found", { status: 404 });
    }
  }
}
