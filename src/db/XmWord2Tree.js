import XmDbTree from "./XmDbTree.js";
import document from "./test.js";
import { XmDbCRUD, XmDb } from "./XmDbCRUD";

export default class XmWord2Tree {
  static parseDocument(doc) {
    const nodes = [];
    let currentParent = null;
    let currentGrandparent = null;
    let currentLevel = 0;

    // Patterns to detect levels
    const level1Pattern =
      /^(活动时间：|主题：|目标：|提纲：|活动规则:|一、|二、|三、)/;
    const level2Pattern = /^\d+、/;
    const level3Pattern = /^\(\d+\)/;

    // Extract text from paragraphs
    doc.content.forEach((paragraph, index) => {
      if (!paragraph.content) return;
      console.log(index);
      let text = "" + index;
      let isHeader = false;
      let level = 0;
      let description = "";

      paragraph.content.forEach((item) => {
        if (item.type === "text") {
          text += item.text;
        } else if (item.type === "hardBreak") {
          // Process the accumulated text as a line
          if (text.trim()) {
            // Determine level
            if (level1Pattern.test(text)) {
              level = 1;
              isHeader = true;
            } else if (level2Pattern.test(text)) {
              level = 2;
              isHeader = true;
            } else if (level3Pattern.test(text)) {
              level = 3;
              isHeader = true;
            } else {
              level = currentLevel; // Inherit level for non-header lines
            }

            // Split header into name and description
            let name = text;
            if (isHeader) {
              const split = text.split(/[:：]/);
              name = split[0].trim();
              description =
                split.length > 1 ? split.slice(1).join(":").trim() : "";
            } else {
              description = text.trim();
            }

            // Build node
            if (isHeader) {
              const node = {
                name,
                data: description || null,
                level,
                children: [],
              };

              if (level === 1) {
                nodes.push(node);
                currentParent = node;
                currentGrandparent = null;
              } else if (level === 2) {
                if (currentParent) {
                  currentParent.children.push(node);
                  currentGrandparent = node;
                } else {
                  // Fallback: treat as level 1 if no parent
                  nodes.push(node);
                  currentParent = node;
                }
              } else if (level === 3) {
                if (currentGrandparent) {
                  currentGrandparent.children.push(node);
                } else if (currentParent) {
                  currentParent.children.push(node);
                  currentGrandparent = node;
                } else {
                  // Fallback: treat as level 1
                  nodes.push(node);
                  currentParent = node;
                }
              }
              currentLevel = level;
            } else if (currentGrandparent && level === 3) {
              currentGrandparent.data =
                (currentGrandparent.data || "") +
                (currentGrandparent.data ? " " : "") +
                description;
            } else if (currentParent) {
              currentParent.data =
                (currentParent.data || "") +
                (currentParent.data ? " " : "") +
                description;
            }
          }
          text = ""; // Reset text after processing
        }
      });

      // Handle last text segment if no hardBreak
      if (text.trim()) {
        if (level1Pattern.test(text)) {
          level = 1;
          isHeader = true;
        } else if (level2Pattern.test(text)) {
          level = 2;
          isHeader = true;
        } else if (level3Pattern.test(text)) {
          level = 3;
          isHeader = true;
        } else {
          level = currentLevel;
        }

        let name = text;
        if (isHeader) {
          const split = text.split(/[:：]/);
          name = split[0].trim();
          description = split.length > 1 ? split.slice(1).join(":").trim() : "";
        } else {
          description = text.trim();
        }

        if (isHeader) {
          const node = {
            name,
            data: description || null,
            level,
            children: [],
          };

          if (level === 1) {
            nodes.push(node);
            currentParent = node;
            currentGrandparent = null;
          } else if (level === 2) {
            if (currentParent) {
              currentParent.children.push(node);
              currentGrandparent = node;
            } else {
              nodes.push(node);
              currentParent = node;
            }
          } else if (level === 3) {
            if (currentGrandparent) {
              currentGrandparent.children.push(node);
            } else if (currentParent) {
              currentParent.children.push(node);
              currentGrandparent = node;
            } else {
              nodes.push(node);
              currentParent = node;
            }
          }
          currentLevel = level;
        } else if (currentGrandparent && level === 3) {
          currentGrandparent.data =
            (currentGrandparent.data || "") +
            (currentGrandparent.data ? " " : "") +
            description;
        } else if (currentParent) {
          currentParent.data =
            (currentParent.data || "") +
            (currentParent.data ? " " : "") +
            description;
        }
      }
    });

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
          data_t: null,
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
      const treeNodes = this.parseDocument(document);
      console.log("Parsed tree nodes:", JSON.stringify(treeNodes, null, 2));

      // Create root node
      const rootId = await this.createNode(
        req,
        {
          pid: 0,
          name: "双十二电商活动策划方案",
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
     return XmRouter.gzipResponse(
        { code: 0, msg: "Success" },
        200
      );
      console.log(
        "Successfully converted document to tree structure in database"
      );
    } catch (error) {
      console.error("Failed to convert document to tree:", error.message);
    }
  }
}
