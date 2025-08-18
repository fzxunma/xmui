class XmWordType {
  static TEXT_TYPE = "text";
  static PARAGRAPH_TYPE = "paragraph";
  static HEADING_TYPE = "heading";
  static DOC_TYPE = "doc";
  static TABLE_TYPE = "table";
  static TABLEROW_TYPE = "tableRow";
  static TABLECELL_TYPE = "tableCell";
  static HARDBREAK_TYPE = "hardBreak";
}

export default class XmTree2Word {
  static findNodeById(nodes, id) {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children && node.children.length) {
        const found = this.findNodeById(node.children, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  static getChildNodes(nodes, parentId) {
    return nodes.filter((node) => node.pid === parentId);
  }

  static treeToDocument(data, rootId) {
    try {
      const document = {
        type: XmWordType.DOC_TYPE,
        content: [],
      };

      // Find the root node in the provided data
      const rootNode = this.findNodeById(data, rootId);
      if (!rootNode) {
        throw new Error(`Root node with id ${rootId} not found`);
      }
      if (
        [
          XmWordType.PARAGRAPH_TYPE,
          XmWordType.HEADING_TYPE,
          XmWordType.TABLE_TYPE,
          XmWordType.TABLEROW_TYPE,
          XmWordType.TABLECELL_TYPE,
        ].includes(rootNode.type)
      ) {
        const docNode = {
          type: rootNode.type,
          content: [],
        };
        if (rootNode.data_t) {
          try {
            docNode.attrs = JSON.parse(rootNode.data_t);
          } catch (e) {
            console.warn(
              `Failed to parse data_t for node ${rootNode.id}: ${e.message}`
            );
            docNode.attrs = {};
          }
        }
        const childNodes = rootNode.children;
        for (const node of childNodes) {
          const docchildNode = this.convertNodeToDoc(node, data);
          if (docchildNode) {
            docNode.content.push(docchildNode);
          }
        }
        document.content.push(docNode);
      } else if (rootNode.type === XmWordType.TEXT_TYPE) {
        const docNode = {
          type: rootNode.type,
          content: [],
        };

        docNode.text = rootNode.data ? rootNode.data : "";
        docNode.id = rootNode.id;
        docNode.marks = rootNode.data_t ? JSON.parse(rootNode.data_t) : [];
        document.content.push(docNode);
      } else if (rootNode.type === XmWordType.HARDBREAK_TYPE) {
        const docNode = {
          type: rootNode.type,
          id: rootNode.id,
          content: [],
        };

        document.content.push(docNode);
      } else {
        // Get child nodes of the root node
        const childNodes = rootNode.children;
        for (const node of childNodes) {
          const docNode = this.convertNodeToDoc(node, data);
          if (docNode) {
            document.content.push(docNode);
          }
        }
      }
      return document;
    } catch (error) {
      console.error("Failed to convert tree to document:333", error.message);
    }
  }

  static convertNodeToDoc(node, data) {
    const docNode = {
      type: node.type,
      content: [],
    };

    if (node.data_t) {
      try {
        docNode.attrs = JSON.parse(node.data_t);
      } catch (e) {
        console.warn(
          `Failed to parse data_t for node ${node.id}: ${e.message}`
        );
        docNode.attrs = {};
      }
    }

    if (node.type === XmWordType.TEXT_TYPE) {
      docNode.text = node.data ? node.data : "";
      docNode.marks = node.data_t ? JSON.parse(node.data_t) : [];
      return docNode;
    }

    if (node.type === XmWordType.HARDBREAK_TYPE) {
      return docNode;
    }

    const childNodes = node.children;
    if (childNodes) {
      for (const child of childNodes) {
        const childDoc = this.convertNodeToDoc(child, data);
        if (childDoc) {
          docNode.content.push(childDoc);
        }
      }
    }
    if (
      [
        XmWordType.PARAGRAPH_TYPE,
        XmWordType.HEADING_TYPE,
        XmWordType.TABLE_TYPE,
        XmWordType.TABLEROW_TYPE,
        XmWordType.TABLECELL_TYPE,
      ].includes(node.type)
    ) {
      return docNode;
    }

    return null;
  }
}
