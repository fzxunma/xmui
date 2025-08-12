<script>
import { ref, computed, h } from 'vue';
import naive from 'naive-ui';
const { useMessage, NButton, NPopconfirm, NModal, NForm, NFormItem, NInput, NTreeSelect, NTree, NDataTable, NSpin, NSelect, NTabs, NTabPane } = naive;
import XmTableEdit from "../components/XmTableEditCheck.vue";
import XmApiRequest from "../units/XmApiRequest.js";

export default {
  components: {
    XmTableEdit
  },
  setup() {
    const message = useMessage();
    const treeData = ref([]);
    const listData = ref([]);
    const flatTreeNodes = ref([]);
    const showTreeModal = ref(false);
    const isTreeEdit = ref(false);
    const loading = ref(true);
    const currentTreeNode = ref({ id: null, pid: null, name: '', key: '' });
    const selectedKeys = ref([]);
    const errorMessage = ref('');
    const table = ref('tree');

    const filteredTreeNodes = computed(() => {
      if (!listData.value || !Array.isArray(listData.value)) {
        return [];
      }
      return listData.value.map(node => ({
        id: node.id,
        pid: node.pid !== null ? node.pid : null,
        name: node.name,
        key: node.key,
        version: node.version,
        data: node.data
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
      { title: 'Version', key: 'version', width: 80 },
      { title: 'Data', key: 'data', width: 150 },
      {
        title: 'Actions',
        key: 'actions',
        render: (row) => h(XmTableEdit, {
          row,
          onOpenTreeEdit: (row) => {
            openTreeEdit(row)
          },
          onHandleTreeDelete: (row) => {
            handleTreeDelete(row)
          }
        })
      }
    ];

    const fetchAllData = async () => {
      loading.value = true;
      errorMessage.value = '';
      try {
        const data = await XmApiRequest('tree', null, 'tree');
        treeData.value = data.data || [];
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
            if (node.children && node.children.length) {
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
        loading.value = false;
      }
    };
    const fetchListData = async () => {
      loading.value = true;
      errorMessage.value = '';
      try {
        let pid = 0
        if (selectedKeys.value.length > 0) {
          pid = selectedKeys.value[0]
        }
        const data = await XmApiRequest('list', { pid }, table.value);
        listData.value = data.data?.rows || [];
      } catch (err) {
        errorMessage.value = err.message;
        message.error(err.message);
        listData.value = [];
      } finally {
        loading.value = false;
      }
    };
    const handleTreeSave = async () => {
      errorMessage.value = '';
      const input = {
        name: currentTreeNode.value.name,
        pid: currentTreeNode.value.pid !== null ? currentTreeNode.value.pid : null,
        version: currentTreeNode.value.version,
        data: currentTreeNode.value.data,
      };
      try {
        const action = isTreeEdit.value ? 'edit' : 'add';
        if (isTreeEdit.value) input.id = currentTreeNode.value.id;
        console.log(input)
        const data = await XmApiRequest(action, input, table.value);
        if (data.code !== 0) {
          throw new Error(data.msg || 'Failed to save tree node');
        }
        showTreeModal.value = false;
        await loadData();
        message.success(data.msg || (isTreeEdit.value ? 'Node updated successfully' : 'Node created successfully'));
      } catch (err) {
        errorMessage.value = err.message;
        message.error(err.message);
      }
    };

    const handleTreeDelete = async (node) => {
      errorMessage.value = '';
      try {
        const data = await XmApiRequest('delete', { id: node.id }, table.value);
        if (data.code !== 0) {
          throw new Error(data.msg || 'Failed to delete tree node');
        }
        await loadData();
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
        key: '',
        version: 1,
        data: '',
      };
      showTreeModal.value = true;
    };

    const openTreeEdit = (node) => {
      isTreeEdit.value = true;
      currentTreeNode.value = {
        id: node.id,
        pid: node.pid !== null ? node.pid : null,
        name: node.name,
        key: node.key,
        version: node.version,
        data: node.data,
      };
      showTreeModal.value = true;
    };

    const handleTreeSelect = async (keys) => {
      if (keys.length > 0) {
        selectedKeys.value = keys;
        loadData()
      } else {

      }
    };

    const handleTableSelect = (keys) => {
      selectedKeys.value = keys;
    };

    const handleTabChange = async (value) => {
      table.value = value;
      await fetchListData()
    }
    const loadData = async () => {
      await fetchAllData();
      await fetchListData()
    }
    loadData();
    const value1=ref(['', '', ''])
    const value2= ref(['', '', ''])
    return {
      treeData,
      listData,
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
      handleTableSelect,
      handleTabChange,
      value1,
      value2
    };
  }
}
</script>

<template>
  <div class="h-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
    <div class="flex gap-1">
      <!-- Tree View (Left) -->
      <div class="w-1/3 h-full overflow-y-auto p-2.5 border border-gray-200">
        <h2 class="text-xl font-semibold mb-2">编排</h2>
        <!-- <n-tree :data="treeData" key-field="id" label-field="name" show-line expandable block-line default-expand-all
          virtual-scroll selectable :selected-keys="selectedKeys" @update:selected-keys="handleTreeSelect" /> -->
        <n-collapse>
          <n-collapse-item title="基础信息" name="1">
            <div>基础信息</div>
          </n-collapse-item>
          <n-collapse-item title="会议一" name="2">
            <n-dynamic-input v-model:value="value1" placeholder="请输入" :min="3" :max="6" />
          </n-collapse-item>
          <n-collapse-item title="会议二" name="3">
            <n-dynamic-input v-model:value="value2" placeholder="请输入" :min="3" :max="6" />
          </n-collapse-item>
        </n-collapse>
        <!-- <p v-if="treeData && !treeData.length" class="text-gray-500 mt-2">
          No tree nodes available. Add a node to start.
        </p> -->
      </div>
      <!-- Tree Nodes and List Items Table (Right) -->
      <div class="flex-1  h-full  p-2.5 border border-gray-100">
        <umo-editor />
      </div>
    </div>

    <!-- <n-modal v-model:show="showTreeModal" preset="card" :title="isTreeEdit ? 'Edit Node' : 'Add Node'"
      style="width:400px">
      <n-form>
        <n-form-item label="Name">
          <n-input v-model:value="currentTreeNode.name" placeholder="Enter name" />
        </n-form-item>
        <n-form-item label="value">
          <n-input v-model:value="currentTreeNode.data" placeholder="Enter value" />
        </n-form-item>
        <n-form-item label="Parent" v-if="isTreeEdit">
          <n-tree-select v-model:value="currentTreeNode.pid" :options="treeData" placeholder="Select parent"
            default-expand-all value-field="id" label-field="name" key-field="id" clearable />
        </n-form-item>
        <n-form-item label="Parent" v-else>
          <n-input
            :value="selectedKeys.length ? flatTreeNodes.find(n => n.value === selectedKeys[0])?.label || 'None' : 'None'"
            disabled />
        </n-form-item>
        <n-form-item label="version">
          <n-input :value="currentTreeNode.version" disabled />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-button type="primary" @click="handleTreeSave">Save</n-button>
        <n-button @click="showTreeModal = false">Cancel</n-button>
      </template>
    </n-modal> -->
  </div>

</template>