<script>
import { ref, computed, h } from 'vue';
import naive from 'naive-ui'; // 从自定义 naive.js 导入
const { NButton, NPopconfirm, NModal, NForm, NFormItem, NInput, NTreeSelect, NTree, NDataTable, NSpin, useMessage } = naive;

export default {
  setup() {
    const message = useMessage(); // 初始化消息通知
    const treeData = ref([]);
    const flatTreeNodes = ref([]);
    const showTreeModal = ref(false);
    const isTreeEdit = ref(false);
    const loading = ref(true);
    const currentTreeNode = ref({ id: null, pid: null, name: '', key: '' });
    const selectedKeys = ref([]);
    const errorMessage = ref('');

    // 从 treeData 中提取选中节点的子节点
    const filteredTreeNodes = computed(() => {
      if (!treeData.value || !Array.isArray(treeData.value)) {
        return [];
      }
      if (selectedKeys.value.length === 0) {
        // 未选中节点时，显示所有根节点
        return treeData.value.map(node => ({
          id: node.id,
          pid: node.pid !== null ? node.pid : null,
          name: node.name,
          key: node.key,
        }));
      }

      // 查找选中节点
      const findNode = (nodes, key) => {
        for (const node of nodes) {
          if (node.id === key) {
            return node;
          }
          if (node.children && node.children.length) {
            const found = findNode(node.children, key);
            if (found) return found;
          }
        }
        return null;
      };

      const selectedNode = findNode(treeData.value, selectedKeys.value[0]);
      if (!selectedNode || !selectedNode.children) {
        return [];
      }

      // 返回选中节点的子节点，转换为表格格式
      return selectedNode.children.map(child => ({
        id: child.id,
        pid: child.pid !== null ? child.pid : null,
        name: child.name,
        key: child.key,
      }));
    });

    const treeColumns = [
      { title: 'ID', key: 'id', width: 80 },
      { title: 'Name', key: 'name', width: 150 },
      { title: 'Key', key: 'key', width: 120 },
      {
        title: 'Parent',
        key: 'pid',
        render: (row) => {
          if (!flatTreeNodes.value) return 'None';
          const parent = flatTreeNodes.value.find(n => n.value === row.pid);
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
            class: 'mr-2' // Tailwind: margin-right: 8px
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

    const fetchAllData = async () => {
      loading.value = true;
      errorMessage.value = '';
      try {
        const response = await fetch('http://localhost:3000/api/tree');
        const data = await response.json();
        if (!response.ok || data.code !== 0) {
          throw new Error(data.msg || 'Failed to fetch tree');
        }
        treeData.value = data.data ? [data.data] : [];
        // 为 NTreeSelect 生成平面节点列表
        flatTreeNodes.value = [];
        const flattenNodes = (nodes) => {
          nodes.forEach(node => {
            flatTreeNodes.value.push({
              value: node.id,
              label: node.name,
              pid: node.pid !== null ? node.pid : null,
              id: node.id,
              name: node.name,
              key: node.key
            });
            if (node.children) {
              flattenNodes(node.children);
            }
          });
        };
        flattenNodes(treeData.value);
      } catch (err) {
        errorMessage.value = err.message;
        message.error(err.message);
        treeData.value = [];
        flatTreeNodes.value = [];
      } finally {
        selectedKeys.value = [];
        loading.value = false;
      }
    };

    const handleTreeSave = async () => {
      errorMessage.value = '';
      const input = {
        name: currentTreeNode.value.name,
        key: currentTreeNode.value.key,
        pid: currentTreeNode.value.pid !== null ? currentTreeNode.value.pid : null
      };
      try {
        const response = isTreeEdit.value
          ? await fetch(`http://localhost:3000/api/tree/${currentTreeNode.value.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
          })
          : await fetch('http://localhost:3000/api/tree', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
          });
        const data = await response.json();
        if (!response.ok || data.code !== 0) {
          throw new Error(data.msg || 'Failed to save tree node');
        }
        showTreeModal.value = false;
        selectedKeys.value = [];
        await fetchAllData();
        message.success(data.msg || (isTreeEdit.value ? 'Node updated successfully' : 'Node created successfully'));
      } catch (err) {
        //errorMessage.value = err.message;
        message.error(err.message);
      }
    };

    const handleTreeDelete = async (node) => {
      errorMessage.value = '';
      try {
        const response = await fetch(`http://localhost:3000/api/tree/${node.id || node.value}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (!response.ok || data.code !== 0) {
          throw new Error(data.msg || 'Failed to delete tree node');
        }
        selectedKeys.value = [];
        await fetchAllData();
        message.success(data.msg || 'Node deleted successfully');
      } catch (err) {
        errorMessage.value = err.message;
        message.error(err.message);
      }
    };

    const openTreeAdd = () => {
      isTreeEdit.value = false;
      currentTreeNode.value = {
        id: null,
        pid: selectedKeys.value.length ? selectedKeys.value[0] : null,
        name: '',
        key: ''
      };
      showTreeModal.value = true;
    };

    const openTreeEdit = (node) => {
      isTreeEdit.value = true;
      currentTreeNode.value = {
        id: node.id || node.value,
        pid: node.pid !== null ? node.pid : null,
        name: node.name,
        key: node.key
      };
      showTreeModal.value = true;
    };

    const handleTreeSelect = (keys) => {
      selectedKeys.value = keys
    };

    const handleTableSelect = (keys) => {
      selectedKeys.value = keys
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
      errorMessage,
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
  <div class="h-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
    <h1 class="text-2xl font-bold mb-4 text-center text-blue-600">Tree Management</h1>
    <div v-if="loading" class="flex justify-center mt-4">
      <n-spin size="large" />
    </div>
    <div v-else-if="errorMessage" class="text-red-500 mb-4 text-center">
      {{ errorMessage }}
    </div>
    <div v-else class="flex gap-1 ">
      <!-- Tree View (Left) -->
      <div class="w-64  overflow-y-auto p-2.5 border border-gray-200">
        <h2 class="text-xl font-semibold mb-2">Tree View</h2>
        <n-tree :data="treeData" key-field="id" label-field="name" show-line expandable block-line default-expand-all
          :selected-keys="selectedKeys" selectable @update:selected-keys="handleTreeSelect" />
        <p v-if="treeData && !treeData.length" class="text-gray-500 mt-2">No tree nodes available. Add a node to start.
        </p>
      </div>
      <!-- Tree Nodes Table (Right) -->
      <div class="flex-1  overflow-y-auto p-2.5 border border-gray-200">
        <h2 class="text-xl font-semibold mb-2">Tree Nodes</h2>
        <n-button type="success" class="mb-4 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
          @click="openTreeAdd">
          Add Node
        </n-button>
        <n-data-table :columns="treeColumns" :data="filteredTreeNodes || []" :bordered="true" :row-key="(row) => row.id"
          :single-line="false" :key="filteredTreeNodes?.length" @update:checked-row-keys="handleTableSelect"
          class="min-h-[300px]" />
        <p v-if="filteredTreeNodes && !filteredTreeNodes.length" class="text-gray-500 mt-2">
          {{ selectedKeys.length ? 'No child nodes for selected node.' : 'No nodes available.' }}
        </p>

      </div>
    </div>

    <n-modal v-model:show="showTreeModal" preset="card" :title="isTreeEdit ? 'Edit Node' : 'Add Node'"
      style="width:400px">
      <n-form>
        <n-form-item label="Name">
          <n-input v-model:value="currentTreeNode.name" placeholder="Enter name" />
        </n-form-item>
        <n-form-item label="Key">
          <n-input v-model:value="currentTreeNode.key" placeholder="Enter key" />
        </n-form-item>
        <n-form-item label="Parent" v-if="isTreeEdit">
          <n-tree-select v-model:value="currentTreeNode.pid" :options="flatTreeNodes" placeholder="Select parent"
            clearable />
        </n-form-item>
        <n-form-item label="Parent" v-else>
          <n-input
            :value="selectedKeys.length ? flatTreeNodes.find(n => n.value === selectedKeys[0])?.label || 'None' : 'None'"
            disabled />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-button type="primary" @click="handleTreeSave">Save</n-button>
        <n-button @click="showTreeModal = false">Cancel</n-button>
      </template>
    </n-modal>
  </div>
</template>