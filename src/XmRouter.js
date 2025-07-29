import { FileSystemRouter } from "bun";
import { watch } from "fs/promises";
import { XmProject } from "./XmProject.js";
import { XmDb } from "./XmDb.js";
import { XmStaticFs } from "./XmStaticFs.js";
import { createYoga, createSchema } from 'graphql-yoga';

export class XmRouter {
  static router = new FileSystemRouter({
    style: "nextjs",
    dir: XmProject.serverPath,
    fileExtensions: [".ts", ".js"],
  });

  static yoga = createYoga({
    graphiql: true,
    schema: createSchema({
      typeDefs: `
        type TreeNode {
          id: ID!
          parentId: ID
          name: String!
          key: String
          children: [TreeNode!]
        }

        input TreeNodeInput {
          parentId: ID
          name: String!
          key: String
        }

        type ListItem {
          id: ID!
          value: String!
          listId: String!
        }

        input ListItemInput {
          value: String!
          listId: String = "default_list"
        }

        type Query {
          products: [Product!]!
          tree: TreeNode
          flatTreeNodes: [TreeNode!]!
          listItems(listId: String = "default_list"): [ListItem!]!
        }

        type Mutation {
          createTreeNode(input: TreeNodeInput!): TreeNode!
          updateTreeNode(id: ID!, input: TreeNodeInput!): TreeNode!
          deleteTreeNode(id: ID!): Boolean!
          createListItem(input: ListItemInput!): ListItem!
          updateListItem(id: ID!, input: ListItemInput!): ListItem!
          deleteListItem(id: ID!): Boolean!
        }
      `,
      resolvers: {
        Query: {
          tree: () => {
            const typeMap = XmDb.cache.get('tree_node');
            if (!typeMap) return null;
            let root_id = null;
            let root_data = null;
            for (const [id, data] of typeMap.entries()) {
              if (data.pid === null) {
                root_id = id;
                root_data = data;
                break;
              }
            }
            if (!root_id) return null;
            // Return root node with children resolved by TreeNode.children
            return {
              id: root_id,
              parentId: null,
              name: root_data.name,
              key: root_data.key,
              children: [] // Let TreeNode.children resolver populate this
            };
          },
          flatTreeNodes: () => {
            const typeMap = XmDb.cache.get('tree_node') || new Map();
            return Array.from(typeMap.entries()).map(([id, data]) => ({
              id,
              parentId: data.pid,
              name: data.name,
              key: data.key
            }));
          },
          listItems: (_, { listId }) => {
            const typeMap = XmDb.cache.get('list_item') || new Map();
            const items = [];
            for (const [id, data] of typeMap.entries()) {
              if (data.key === listId) {
                items.push({
                  id,
                  value: data.name,
                  listId: data.key
                });
              }
            }
            return items;
          },
        },
        Mutation: {
          createTreeNode: (_, { input }) => {
            const typeMap = XmDb.cache.get('tree_node') || new Map();
            const id = String(Date.now());
            const data = {
              pid: input.parentId || null,
              name: input.name,
              key: input.key || ''
            };
            typeMap.set(id, data);
            XmDb.cache.set('tree_node', typeMap);
            return { id, parentId: data.pid, name: data.name, key: data.key };
          },
          updateTreeNode: (_, { id, input }) => {
            const typeMap = XmDb.cache.get('tree_node') || new Map();
            const data = typeMap.get(id);
            if (!data) throw new Error('TreeNode not found');
            if (input.name) data.name = input.name;
            if (input.key !== undefined) data.key = input.key;
            if (input.parentId !== undefined) data.pid = input.parentId;
            typeMap.set(id, data);
            XmDb.cache.set('tree_node', typeMap);
            return { id, parentId: data.pid, name: data.name, key: data.key };
          },
          deleteTreeNode: (_, { id }) => {
            const typeMap = XmDb.cache.get('tree_node') || new Map();
            if (!typeMap.has(id)) return false;

            // Recursive delete children
            const deleteRecursive = (nodeId) => {
              for (const [childId, childData] of typeMap.entries()) {
                if (childData.pid === nodeId) {
                  deleteRecursive(childId);
                }
              }
              typeMap.delete(nodeId);
            };

            deleteRecursive(id);
            XmDb.cache.set('tree_node', typeMap);
            return true;
          },
          createListItem: (_, { input }) => {
            const typeMap = XmDb.cache.get('list_item') || new Map();
            const id = String(Date.now());
            const data = {
              name: input.value,
              key: input.listId || 'default_list'
            };
            typeMap.set(id, data);
            XmDb.cache.set('list_item', typeMap);
            return { id, value: data.name, listId: data.key };
          },
          updateListItem: (_, { id, input }) => {
            const typeMap = XmDb.cache.get('list_item') || new Map();
            const data = typeMap.get(id);
            if (!data) throw new Error('ListItem not found');
            if (input.value) data.name = input.value;
            if (input.listId) data.key = input.listId;
            typeMap.set(id, data);
            XmDb.cache.set('list_item', typeMap);
            return { id, value: data.name, listId: data.key };
          },
          deleteListItem: (_, { id }) => {
            const typeMap = XmDb.cache.get('list_item') || new Map();
            if (typeMap.delete(id)) {
              XmDb.cache.set('list_item', typeMap);
              return true;
            }
            return false;
          },
        },
        TreeNode: {
          parentId: (source) => source.pid || null,
          children: (source) => {
            const typeMap = XmDb.cache.get('tree_node') || new Map();
            const children = [];
            for (const [id, data] of typeMap.entries()) {
              if (data.pid === source.id) {
                children.push({
                  id,
                  pid: data.pid,
                  name: data.name,
                  key: data.key
                });
              }
            }
            return children;
          },
        }
      }
    })
  });

  static async setup(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;
    if (pathname.startsWith('/graphql')) {
      return await XmRouter.yoga.handle(req);
    }
    const match = XmRouter.router.match(pathname);
    if (match) {
      return await XmRouter.routerMatch(req, match);
    }
    return await XmStaticFs.serve(pathname);
  }

  static async routerMatch(req, match) {
    try {
      const file = Bun.file(match.filePath);
      if (!(await file.exists())) {
        return new Response("Route file not found", { status: 404 });
      }
      delete require.cache[match.filePath];
      const handler = await import(`file://${match.filePath}`);
      if (typeof handler.default !== "function") {
        return new Response("Invalid route handler", { status: 500 });
      }
      return await handler.default(req, XmDb.db);
    } catch (error) {
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  static async setupHotReload() {
    if (process.env.NODE_ENV !== "production") {
      const watcher = watch(XmProject.serverPath, { recursive: true });
      for await (const event of watcher) {
        console.log(`File changed: ${event.filename}, reloading router...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          XmRouter.router.reload();
        } catch (error) {
          console.error("Error reloading router:", error);
        }
      }
    }
  }
}