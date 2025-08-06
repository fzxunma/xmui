export class XmToLayout {
  static treeTo(tree) {
    return (
      tree.children
        ?.map((child) => {
          if (child.type === "layout") {
            return `<div class="${child.props?.class}">${XmToLayout.treeTo(
              child
            )}</div>`;
          } else if (child.type === "input") {
            return `<n-input v-model="form.${child.key}" placeholder="${child.name}" />`;
          }
        })
        .join("\n") || ""
    );
  }
}
