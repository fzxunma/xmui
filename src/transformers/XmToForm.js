export class XmToForm {
  static treeTo(tree) {
    return tree.children
      .filter((n) => n.type === "input")
      .map((n) => ({
        label: n.name,
        key: n.key,
        type: n.props?.type || "text",
        required: n.props?.required || false,
      }));
  }
}
