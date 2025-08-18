import { XmDbCRUD } from "./XmDbCRUD.js";
import XmDbTree from "./XmDbTree.js";

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
  static async generateUniqueName(baseName, pid, dbName, table) {
    let name = baseName;
    let index = 0;
    const children = await XmDbTree.getChildren(pid, dbName, table);
    while (children.some(child => child.name === name)) {
      index++;
      name = `${baseName}_${index}`;
    }
    return name;
  }

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
            name: "段落" + index, // Will be adjusted in insertNodes
            data_t: doc.attrs,
            type: doc.type,
            data: null,
            children: items,
          };
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
            type: doc.type,
            data: null,
            children: items,
          };
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
            type: doc.type,
            data: null,
            children: items,
          };
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
            type: doc.type,
            data: null,
            children: items,
          };
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
            type: doc.type,
            data: null,
            children: items,
          };
          nodes.push(node);
        });
        break;
    }
    return nodes;
  }

  static async insertNodes(req, nodes, parentId = 0, dbName, table, XmRouter) {
    for (const node of nodes) {
      const uniqueName = await this.generateUniqueName(node.name, parentId, dbName, table);
      const existingNodes = await XmDbTree.getChildren(parentId, dbName, table);
      const existingNode = existingNodes.find(
        n => n.type === node.type && n.name === uniqueName
      );
      let nodeId;

      if (existingNode && node.type !== XmWordType.TEXT_TYPE) {
        nodeId = existingNode.id;
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
      } else {
        nodeId = await this.createNode(
          req,
          {
            pid: parentId,
            name: uniqueName,
            type: node.type,
            data: node.data,
            data_o: null,
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
      const treeNode = await XmDbCRUD.create({
        tableName: table,
        pid,
        name,
        type,
        uniqueFields: [],
        uniqueValues: [],
        dbName,
        data,
        data_o,
        data_t,
        data_a,
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

  static async updateTextNode(
    req,
    { id, text, marks },
    dbName,
    table,
    XmRouter
  ) {
    try {
      const existingNode = await XmDbCRUD.read({
        tableName: table,
        id,
        dbName,
        req,
        userId: 0,
      });

      if (!existingNode) {
        throw new Error(`Node with id ${id} not found`);
      }

      if (existingNode.type !== XmWordType.TEXT_TYPE) {
        throw new Error(`Node with id ${id} is not a text node`);
      }

      const updatedNode = await XmDbCRUD.update({
        tableName: table,
        id,
        updates: {
          data: text,
          data_t: marks || existingNode.data_t,
          name: existingNode.name,
          type: existingNode.type,
          pid: existingNode.pid,
          data_o: existingNode.data_o,
          data_a: existingNode.data_a,
        },
        dbName,
        req,
        userId: 0,
      });

      console.log(`Updated text node: ${existingNode.name} with id: ${id}`);
      return updatedNode.id;
    } catch (error) {
      console.error(`Failed to update text node ${id}: ${error.message}`);
      throw error;
    }
  }

  static async updateParagraphNode(
    req,
    { id, attrs },
    dbName,
    table,
    XmRouter
  ) {
    try {
      const existingNode = await XmDbCRUD.read({
        tableName: table,
        id,
        dbName,
        req,
        userId: 0,
      });

      if (!existingNode) {
        throw new Error(`Node with id ${id} not found`);
      }

      if (existingNode.type !== XmWordType.PARAGRAPH_TYPE) {
        throw new Error(`Node with id ${id} is not a paragraph node`);
      }

      const updatedNode = await XmDbCRUD.update({
        tableName: table,
        id,
        updates: {
          data_t: attrs || existingNode.data_t,
          name: existingNode.name,
          type: existingNode.type,
          pid: existingNode.pid,
          data: existingNode.data,
          data_o: existingNode.data_o,
          data_a: existingNode.data_a,
        },
        dbName,
        req,
        userId: 0,
      });

      console.log(`Updated paragraph node: ${existingNode.name} with id: ${id}`);
      return updatedNode.id;
    } catch (error) {
      console.error(`Failed to update paragraph node ${id}: ${error.message}`);
      throw error;
    }
  }

  static async convertDocumentToTree(
    req,
    data,
    dbName = "xm1",
    table = "tree",
    XmRouter
  ) {
    try {
      const { rootId, data: docData } = data;

      if (!rootId || rootId <= 0) {
        throw new Error("Invalid rootId provided");
      }

      // Check if the rootId corresponds to a node
      const rootNode = await XmDbCRUD.read({
        tableName: table,
        id: rootId,
        dbName,
        req,
        userId: 0,
      });

      if (!rootNode) {
        throw new Error(`Root node with id ${rootId} not found`);
      }

      const textContent = docData.content?.[0]?.content?.[0]?.text;
      const textMarks = docData.content?.[0]?.content?.[0]?.marks || null;

      if (!textContent && rootId !== 1) {
        throw new Error("No text content found in document");
      }

      if (rootNode.type === XmWordType.TEXT_TYPE) {
        // Update the text node's data
        await this.updateTextNode(
          req,
          { id: rootId, text: textContent, marks: textMarks },
          dbName,
          table,
          XmRouter
        );
      } else if (rootNode.type === XmWordType.PARAGRAPH_TYPE) {
        // Find existing text node under the paragraph
        const children = await XmDbTree.getChildren(rootId, dbName, table);
        const textNodes = children.filter(node => node.type === XmWordType.TEXT_TYPE);

        if (textNodes.length > 0) {
          // Update the first text node
          await this.updateTextNode(
            req,
            { id: textNodes[0].id, text: textContent, marks: textMarks },
            dbName,
            table,
            XmRouter
          );
        } else {
          // Create a new text node with unique name
          const uniqueTextName = await this.generateUniqueName("文本0", rootId, dbName, table);
          const newTextNode = await this.createNode(
            req,
            {
              pid: rootId,
              name: uniqueTextName,
              type: XmWordType.TEXT_TYPE,
              data: textContent,
              data_t: textMarks,
              data_o: null,
              data_a: null,
            },
            dbName,
            table,
            XmRouter
          );
          console.log(`Created new text node with id: ${newTextNode}`);
        }
        // Update paragraph attributes if provided
        if (docData.content?.[0]?.attrs) {
          await this.updateParagraphNode(
            req,
            { id: rootId, attrs: docData.content[0].attrs },
            dbName,
            table,
            XmRouter
          );
        }
      } else if (rootNode.type === XmWordType.DOC_TYPE && rootId === 1) {
        // Full document update: compare and update by index
        const children = await XmDbTree.getChildren(rootId, dbName, table);
        const paragraphNodes = children.filter(node => node.type === XmWordType.PARAGRAPH_TYPE);
        const paragraphs = docData.content || [];

        // Update or create paragraph nodes based on index
        for (let i = 0; i < paragraphs.length; i++) {
          const paragraph = paragraphs[i];
          const paragraphNode = i < paragraphNodes.length ? paragraphNodes[i] : null;

          let paragraphNodeId;
          if (paragraphNode) {
            // Update existing paragraph node
            paragraphNodeId = paragraphNode.id;
            if (paragraph.attrs) {
              await this.updateParagraphNode(
                req,
                { id: paragraphNodeId, attrs: paragraph.attrs },
                dbName,
                table,
                XmRouter
              );
            }
          } else {
            // Create new paragraph node with unique name
            const uniqueParagraphName = await this.generateUniqueName(`段落${i}`, rootId, dbName, table);
            paragraphNodeId = await this.createNode(
              req,
              {
                pid: rootId,
                name: uniqueParagraphName,
                type: XmWordType.PARAGRAPH_TYPE,
                data: null,
                data_t: paragraph.attrs || null,
                data_o: null,
                data_a: null,
              },
              dbName,
              table,
              XmRouter
            );
            console.log(`Created new paragraph node with id: ${paragraphNodeId}`);
          }

          // Update or create text nodes under the paragraph
          const paragraphChildren = await XmDbTree.getChildren(paragraphNodeId, dbName, table);
          const textNodes = paragraphChildren.filter(node => node.type === XmWordType.TEXT_TYPE);
          const textContent = paragraph.content || [];

          for (let j = 0; j < textContent.length; j++) {
            if (textContent[j].type === XmWordType.TEXT_TYPE) {
              const textNode = j < textNodes.length ? textNodes[j] : null;
              if (textNode) {
                // Update existing text node
                await this.updateTextNode(
                  req,
                  { id: textNode.id, text: textContent[j].text, marks: textContent[j].marks || null },
                  dbName,
                  table,
                  XmRouter
                );
              } else {
                // Create new text node with unique name
                const uniqueTextName = await this.generateUniqueName(`文本${j}`, paragraphNodeId, dbName, table);
                const newTextNode = await this.createNode(
                  req,
                  {
                    pid: paragraphNodeId,
                    name: uniqueTextName,
                    type: XmWordType.TEXT_TYPE,
                    data: textContent[j].text,
                    data_t: textContent[j].marks || null,
                    data_o: null,
                    data_a: null,
                  },
                  dbName,
                  table,
                  XmRouter
                );
                console.log(`Created new text node with id: ${newTextNode}`);
              }
            }
          }
        }

        // Optionally, delete extra paragraph nodes if content.json has fewer paragraphs
        for (let i = paragraphs.length; i < paragraphNodes.length; i++) {
          await XmDbCRUD.delete({
            tableName: table,
            id: paragraphNodes[i].id,
            soft: true,
            dbName,
            req,
            userId: 0,
          });
          console.log(`Deleted extra paragraph node with id: ${paragraphNodes[i].id}`);
        }
      } else {
        // Parse and insert new nodes for other node types
        const treeNodes = this.parseDocument(docData, 0);
        await this.insertNodes(req, treeNodes, rootId, dbName, table, XmRouter);
      }

      return XmRouter.gzipResponse({ code: 0, msg: "Success" }, 200);
    } catch (error) {
      console.error("Failed to convert document to tree:", error.message);
      return XmRouter.gzipResponse(
        { code: -1, msg: `Error: ${error.message}` },
        500
      );
    }
  }
}