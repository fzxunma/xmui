import document from "./test1.js";
import { XmDbCRUD } from "./XmDbCRUD.js";
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
export default class XmWord2Tree {
  static parseDocument(doc, index) {
    const nodes = [];

    switch (doc.type) {
      case XmWordType.DOC_TYPE:
        doc.content.forEach((paragraph, cindex) => {
          const docNodes = XmWord2Tree.parseDocument(paragraph, cindex);
          nodes.push(...docNodes);
        });
        break;
      case XmWordType.PARAGRAPH_TYPE:
        doc.content.forEach((paragraph, cindex) => {
          const items = XmWord2Tree.parseDocument(
            paragraph,
            index + ":" + cindex
          );
          const node = {
            name: "段落" + index,
            data_t: doc.attrs,
            type: doc.type,
            data: null,
            children: [],
          };
          node.children.push(...items);
          nodes.push(node);
        });
        break;
      case XmWordType.HEADING_TYPE:
        doc.content.forEach((paragraph, cindex) => {
          const items = XmWord2Tree.parseDocument(
            paragraph,
            index + ":" + cindex
          );
          const node = {
            name: "标题" + index,
            data_t: doc.attrs,
            data: null,
            type: doc.type,
            children: [],
          };
          node.children.push(...items);
          nodes.push(node);
        });
        break;
      case XmWordType.TEXT_TYPE:
        {
          const node = {
            name: "文本" + index,
            data: doc.text,
            type: doc.type,
            data_t: doc.marks,
          };
          nodes.push(node);
        }
        break;
      case XmWordType.HARDBREAK_TYPE:
        {
          const node = {
            name: "换行" + index,
            data: null,
            type: doc.type,
          };
          nodes.push(node);
        }
        break;
      case XmWordType.TABLE_TYPE:
        doc.content.forEach((paragraph, cindex) => {
          const items = XmWord2Tree.parseDocument(
            paragraph,
            index + ":" + cindex
          );
          const node = {
            name: "表格" + index,
            data_t: doc.attrs,
            data: null,
            type: doc.type,
            children: [],
          };
          node.children.push(...items);
          nodes.push(node);
        });
        break;
      case XmWordType.TABLEROW_TYPE:
        doc.content.forEach((paragraph, cindex) => {
          const items = XmWord2Tree.parseDocument(
            paragraph,
            index + ":" + cindex
          );
          const node = {
            name: "表行" + index,
            data_t: doc.attrs,
            data: null,
            type: doc.type,
            children: [],
          };
          node.children.push(...items);
          nodes.push(node);
        });
        break;
      case XmWordType.TABLECELL_TYPE:
        doc.content.forEach((paragraph, cindex) => {
          const items = XmWord2Tree.parseDocument(
            paragraph,
            index + ":" + cindex
          );
          const node = {
            name: "表列" + index,
            data_t: doc.attrs,
            data: null,
            type: doc.type,
            children: [],
          };
          node.children.push(...items);
          nodes.push(node);
        });
        break;
    }
    return nodes;
  }

  // Insert nodes into the database
  static async insertNodes(req, nodes, parentId = 0, dbName, table, XmRouter) {
    for (const node of nodes) {
      const nodeId = await this.createNode(
        req,
        {
          pid: parentId,
          name: node.name,
          data: node.data,
          data_o: null, // Adjust based on your requirements
          data_t: node.data_t,
          data_a: null,
        },
        dbName,
        table,
        XmRouter
      );
      if (node.children && node.children.length > 0) {
        await this.insertNodes(
          req,
          node.children,
          nodeId,
          dbName,
          table,
          XmRouter
        );
      }
    }
  }
  static async createNode(
    req,
    {
      pid,
      name,
      type = "default",
      data = null,
      data_o = null,
      data_t = null,
      data_a = null,
    },
    dbName,
    table,
    XmRouter
  ) {
    try {
      const treeNode = await XmDbCRUD.upsert({
        tableName: table,
        pid,
        name,
        type,
        uniqueFields: [],
        uniqueValues: [],
        dbName,
        data: {
          data: data ? JSON.stringify(data) : null,
          data_o: data_o ? JSON.stringify(data_o) : null,
          data_t: data_t ? JSON.stringify(data_t) : null,
          data_a: data_a ? JSON.stringify(data_a) : null,
        },
        req,
        userId: 0,
      });
      console.log(`Created node: ${name} with id: ${treeNode.id}`);
      return treeNode.id;
    } catch (error) {
      console.error(`Failed to create node ${name}: ${error.message}`);
      throw error;
    }
  }

  static async convertDocumentToTree(
    req,
    dbName = "xm1",
    table = "tree",
    XmRouter
  ) {
    try {
      // Parse the document
      const treeNodes = this.parseDocument(document, 0);
      console.log("Parsed tree nodes:", JSON.stringify(treeNodes, null, 2));

      // Create root node
      const rootId = await this.createNode(
        req,
        {
          pid: 0,
          type: "doc",
          name: "方案",
          data: null,
          data_o: null,
          data_t: null,
          data_a: null,
        },
        dbName,
        table,
        XmRouter
      );

      // Insert child nodes
      await this.insertNodes(req, treeNodes, rootId, dbName, table, XmRouter);
      console.log(
        "Successfully converted document to tree structure in database"
      );
      return XmRouter.gzipResponse({ code: 0, msg: "Success" }, 200);
    } catch (error) {
      console.error("Failed to convert document to tree:", error.message);
    }
  }
}
