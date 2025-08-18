import { XmDbCRUD } from "./XmDbCRUD.js";
import { XmWordType } from "./XmWord2Tree.js";

export default class XmTree2Word {
  static async fetchNodes(req, parentId, dbName, table, XmRouter) {
    try {
      const nodes = await XmDbCRUD.find({
        tableName: table,
        query: { pid: parentId },
        dbName,
        req,
        userId: 0,
      });
      return nodes;
    } catch (error) {
      console.error(`Failed to fetch nodes for parentId ${parentId}: ${error.message}`);
      throw error;
    }
  }

  static async treeToDocument(req, rootId, dbName = "xm1", table = "tree", XmRouter) {
    try {
      const document = {
        type: XmWordType.DOC_TYPE,
        content: [],
      };

      const rootNode = await XmDbCRUD.findOne({
        tableName: table,
        query: { id: rootId },
        dbName,
        req,
        userId: 0,
      });

      if (!rootNode) {
        throw new Error(`Root node with id ${rootId} not found`);
      }

      const childNodes = await this.fetchNodes(req, rootId, dbName, table, XmRouter);
      for (const node of childNodes) {
        const docNode = await this.convertNodeToDoc(node, req, dbName, table, XmRouter);
        if (docNode) {
          document.content.push(docNode);
        }
      }

      return XmRouter.gzipResponse(
        { code: 0, msg: "Success", data: document },
        200
      );
    } catch (error) {
      console.error("Failed to convert tree to document:", error.message);
      return XmRouter.gzipResponse(
        { code: -1, msg: `Error: ${error.message}` },
        500
      );
    }
  }

  static async convertNodeToDoc(node, req, dbName, table, XmRouter) {
    const docNode = {
      type: node.type,
      content: [],
    };

    if (node.data_t) {
      docNode.attrs = JSON.parse(node.data_t);
    }

    if (node.type === XmWordType.TEXT_TYPE) {
      docNode.text = node.data ? node.data : "";
      docNode.marks = node.data_t ? JSON.parse(node.data_t) : [];
      return docNode;
    }

    if (node.type === XmWordType.HARDBREAK_TYPE) {
      return docNode;
    }

    const childNodes = await this.fetchNodes(req, node.id, dbName, table, XmRouter);
    for (const child of childNodes) {
      const childDoc = await this.convertNodeToDoc(child, req, dbName, table, XmRouter);
      if (childDoc) {
        docNode.content.push(childDoc);
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