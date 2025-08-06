export class XmToRender {
  static treeTo(tree) {
    // 假设是 WebGPU 的渲染节点描述
    return (
      tree.children
        ?.map((child) => {
          if (child.type === "shader") {
            return `await loadShader("${child.props?.path}");`;
          }
          if (child.type === "pipeline") {
            return `const pipeline = createPipeline(${JSON.stringify(
              child.props
            )});`;
          }
        })
        .join("\n") || ""
    );
  }
}
