export class XmToSqlSchema {
  static treeTo(tree) {
    const fields = tree.children
      .filter((n) => n.type === "input" || n.type === "model")
      .map((n) => `${n.key} ${mapType(n.props?.type)}`)
      .join(",\n");

    return `CREATE TABLE ${tree.name} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ${fields}
  );`;
  }
}
