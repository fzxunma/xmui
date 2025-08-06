export class XmToNL {
  static treeTo(tree) {
    return (
      tree.children
        ?.map((child) => {
          return `字段 ${child.name}（${child.key}）是一个${child.props?.type}类型的输入。`;
        })
        .join("\n") || ""
    );
  }
}
