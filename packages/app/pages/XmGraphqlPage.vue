<script>
import { ref, computed, h } from 'vue';
import naive from 'naive-ui';
const { NButton, NPopconfirm, NModal, NForm, NFormItem, NInput, NTreeSelect, NTree, NDataTable, NSpin } = naive;

export default {
  setup() {
    const treeData = ref([]);
    const flatTreeNodes = ref([]);
    const showTreeModal = ref(false);
    const isTreeEdit = ref(false);
    const loading = ref(true);
    const currentTreeNode = ref({ id: null, parentId: null, name: '', key: '' });
    const selectedKeys = ref([]);

    // 显示选中节点的子节点
    const filteredTreeNodes = computed(() => {
      if (!flatTreeNodes.value || !Array.isArray(flatTreeNodes.value)) {
        console.log('Filtered tree nodes: [] (flatTreeNodes undefined or not array)');
        return [];
      }
      const result = flatTreeNodes.value.filter(node => {
        console.log('Filter node:', node, 'parentId:', String(node.parentId), 'selectedKey:', selectedKeys.value[0]);
        if (selectedKeys.value.length === 0) return true;
        return String(node.parentId) === String(selectedKeys.value[0]);
      });
      console.log('Filtered tree nodes:', result);
      return result;
    });

    const treeColumns = [
      { title: 'ID', key: 'id', width: 80 },
      { title: 'Name', key: 'name', width: 150 },
      { title: 'Key', key: 'key', width: 120 },
      {
        title: 'Parent',
        key: 'parentId',
        render: (row) => {
          if (!flatTreeNodes.value) return 'None';
          const parent = flatTreeNodes.value.find(n => String(n.value) === String(row.parentId));
          return parent ? parent.label : 'None';
        }
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (row) => h('span', [
          h(NButton, {
            size: 'small',
            type: 'primary',
            onClick: () => openTreeEdit(row),
            style: { marginRight: '8px' }
          }, { default: () => 'Edit' }),
          h(NPopconfirm, {
            onPositiveClick: () => handleTreeDelete(row)
          }, {
            trigger: () => h(NButton, {
              size: 'small',
              type: 'error'
            }, { default: () => 'Delete' }),
            default: () => 'Delete this node and children?'
          })
        ])
      }
    ];

    const graphQLFetch = async (query, variables = {}) => {
      try {
        const res = await fetch('http://localhost:3000/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, variables })
        });
        const json = await res.json();
        if (json.errors) {
          console.error('GraphQL error:', json.errors);
          return null;
        }
        return json.data;
      } catch (err) {
        console.error('Fetch error:', err);
        return null;
      }
    };

    const fetchAllData = async () => {
      loading.value = true;
      const data = await graphQLFetch(`
        query {
          tree {
            id
            name
            key
            children {
              id
              name
              key
              children {
                id
                name
                key
              }
            }
          }
          flatTreeNodes {
            id
            name
            parentId
            key
          }
        }
      `);
      treeData.value = data?.tree ? [data.tree] : [];
      
      // Derive parentId from treeData if flatTreeNodes has incorrect parentId
      const deriveParentIds = (nodes, parentId = null) => {
        const result = [];
        for (const node of nodes) {
          result.push({
            value: String(node.id),
            label: node.name,
            parentId: parentId !== null ? String(parentId) : null,
            id: String(node.id),
            name: node.name,
            key: node.key
          });
          if (node.children && node.children.length) {
            result.push(...deriveParentIds(node.children, node.id));
          }
        }
        return result;
      };

      // Use server flatTreeNodes if parentId is valid; otherwise derive from treeData
      if (data?.flatTreeNodes && data.flatTreeNodes.some(n => n.parentId !== null)) {
        flatTreeNodes.value = data.flatTreeNodes.map(n => ({
          value: String(n.id),
          label: n.name,
          parentId: n.parentId !== null ? String(n.parentId) : null,
          id: String(n.id),
          name: n.name,
          key: n.key
        }));
      } else {
        flatTreeNodes.value = treeData.value.length ? deriveParentIds(treeData.value[0].children, treeData.value[0].id) : [];
      }

      console.log('Tree data:', treeData.value);
      console.log('Flat tree nodes:', flatTreeNodes.value);
      selectedKeys.value = [];
      loading.value = false;
    };

    const openTreeAdd = () => {
      isTreeEdit.value = false;
      currentTreeNode.value = {
        id: null,
        parentId: selectedKeys.value.length ? String(selectedKeys.value[0]) : null,
        name: '',
        key: ''
      };
      showTreeModal.value = true;
    };

    const openTreeEdit = (node) => {
      isTreeEdit.value = true;
      currentTreeNode.value = {
        id: node.id || node.value,
        parentId: node.parentId !== null ? String(node.parentId) : null,
        name: node.name,
        key: node.key
      };
      showTreeModal.value = true;
    };

      const handleTreeSave = async () => {
      const input = {
        name: currentTreeNode.value.name,
        key: currentTreeNode.value.key,
        parentId: currentTreeNode.value.parentId !== null ? String(currentTreeNode.value.parentId) : null
      };
      console.log('Sending mutation with input:', input); // Debug client input
      let query = '';
      let variables = {};
      if (isTreeEdit.value) {
        query = `
          mutation($id: ID!, $input: TreeNodeInput!) {
            updateTreeNode(id: $id, input: $input) {
              id
              parentId
              name
              key
            }
          }
        `;
        variables = { id: currentTreeNode.value.id, input };
      } else {
        query = `
          mutation($input: TreeNodeInput!) {
            createTreeNode(input: $input) {
              id
              parentId
              name
              key
            }
          }
        `;
        variables = { input };
      }
      await graphQLFetch(query, variables);
      showTreeModal.value = false;
      selectedKeys.value = [];
      fetchAllData();
    };
    const handleTreeDelete = async (node) => {
      await graphQLFetch(`
        mutation($id: ID!) {
          deleteTreeNode(id: $id)
        }
      `, { id: node.id || node.value });
      selectedKeys.value = [];
      fetchAllData();
    };

    const handleTreeSelect = (keys) => {
      console.log('Selected keys:', keys);
      selectedKeys.value = keys.map(String);
    };

    const handleTableSelect = (keys) => {
      console.log('Table selected keys:', keys);
      selectedKeys.value = keys.map(String);
    };

    fetchAllData();

    return {
      treeData,
      flatTreeNodes,
      filteredTreeNodes,
      treeColumns,
      showTreeModal,
      isTreeEdit,
      currentTreeNode,
      selectedKeys,
      loading,
      openTreeAdd,
      handleTreeSave,
      handleTreeDelete,
      openTreeEdit,
      handleTreeSelect,
      handleTableSelect
    };
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
    <h1 class="text-2xl font-bold mb-4 text-center text-blue-600">Tree Management</h1>
    <div v-if="loading" class="flex justify-center mt-4">
      <n-spin size="large" />
    </div>
    <div v-else style="display: flex; gap: 20px;">
      <!-- Tree View (Left) -->
      <div style="flex: 1; max-height: 600px; overflow-y: auto; padding: 10px; border: 1px solid #e5e7eb;">
        <h2 class="text-xl font-semibold mb-2">Tree View</h2>
        <n-tree 
          :data="treeData" 
          key-field="id" 
          label-field="name" 
          show-line
          expandable
          block-line
          default-expand-all
          :selected-keys="selectedKeys"
          selectable
          @update:selected-keys="handleTreeSelect"
          :style="{ minHeight: '300px' }"
        />
        <p v-if="treeData && !treeData.length" class="text-gray-500 mt-2">No tree nodes available. Add a node to start.</p>
        <!-- Debug: Display raw tree data -->
        <pre v-if="treeData && treeData.length" class="mt-2 bg-gray-100 p-2 rounded text-sm">
          {{ JSON.stringify(treeData, null, 2) }}
        </pre>
      </div>
      <!-- Tree Table for CRUD (Right) -->
      <div style="flex: 1; max-height: 600px; overflow-y: auto; padding: 10px; border: 1px solid #e5e7eb;">
        <h2 class="text-xl font-semibold mb-2">Tree Nodes</h2>
        <n-button type="success" class="mb-4 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
          @click="openTreeAdd">
          Add Node
        </n-button>
        <n-data-table 
          :columns="treeColumns" 
          :data="filteredTreeNodes || []" 
          :bordered="true" 
          :max-height="400" 
          :min-height="300" 
          :scroll-x="600" 
          :row-key="(row) => row.id" 
          :single-line="false"
          :key="filteredTreeNodes?.length"
          @update:checked-row-keys="handleTableSelect"
        />
        <p v-if="filteredTreeNodes && !filteredTreeNodes.length" class="text-gray-500 mt-2">
          {{ selectedKeys.length ? 'No child nodes for selected node.' : 'No nodes available.' }}
        </p>
        <!-- Debug: Display filteredTreeNodes -->
        <pre v-if="filteredTreeNodes && filteredTreeNodes.length" class="mt-2 bg-gray-100 p-2 rounded text-sm">
          {{ JSON.stringify(filteredTreeNodes, null, 2) }}
        </pre>
        <n-modal v-model:show="showTreeModal" preset="card" :title="isTreeEdit ? 'Edit Node' : 'Add Node'" style="width: 600px;">
          <n-form>
            <n-form-item label="Name">
              <n-input v-model:value="currentTreeNode.name" placeholder="Enter name" />
            </n-form-item>
            <n-form-item label="Key">
              <n-input v-model:value="currentTreeNode.key" placeholder="Enter key" />
            </n-form-item>
            <n-form-item label="Parent" v-if="isTreeEdit">
              <n-tree-select 
                v-model:value="currentTreeNode.parentId" 
                :options="flatTreeNodes" 
                placeholder="Select parent" 
                clearable 
              />
            </n-form-item>
            <n-form-item label="Parent" v-else>
              <n-input 
                :value="selectedKeys.length ? flatTreeNodes.find(n => n.value === selectedKeys[0])?.label || 'None' : 'None'" 
                disabled 
              />
            </n-form-item>
          </n-form>
          <template #footer>
            <n-button type="primary" @click="handleTreeSave">Save</n-button>
            <n-button @click="showTreeModal = false">Cancel</n-button>
          </template>
        </n-modal>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure the main flex container splits Tree and Table sections */
div[style*="display: flex"] {
  display: flex;
  flex-direction: row;
  gap: 20px;
}

/* Style for each main section */
div[style*="flex: 1"] {
  flex: 1;
  max-height: 600px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #e5e7eb;
  box-sizing: border-box;
}

/* Ensure tree and table have visible height */
.n-tree, .n-data-table {
  min-height: 300px;
}
</style>