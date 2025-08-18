<!-- Updated XmTreePage.vue -->
<script>
import { ref, computed, onMounted, watch, h } from 'vue';
import naive from 'naive-ui';
const { useMessage, NButton, NPopconfirm, NIcon, NModal, NForm, NFormItem, NInput, NTreeSelect, NTree, NDataTable, NSpin, NSelect, NTabs, NTabPane } = naive;
import XmTableEdit from "../components/XmTableEditCheck.vue";
import XmTableDragDropIcon from "../components/XmTableDragDropIcon.vue";
import XmApiRequest from "../units/XmApiRequest.js";
import umoOption from "../vendor/umodoc/umoOption.js";
import { useDraggable } from 'vue-draggable-plus'
import XmTree2Word from "../units/XmTree2Word.js";

export default {
  components: {
    XmTableEdit,
    XmTableDragDropIcon
  },
  setup() {
    umoOption.onSave = async (content, page, document) => {
      const action = 'd2t';
      const rootId = selectedKeys.value[0];
      if (rootId > 0) {
        errorMessage.value = '';
        try {
          // Send content.json and rootId to server for parsing
          const data = await XmApiRequest(action, { rootId, data: content.json }, "tree");
          if (data.code !== 0) {
            throw new Error(data.msg || 'Failed to save document to tree');
          }
          await loadData();
          message.success(data.msg || 'Document saved to tree successfully');
        } catch (err) {
          errorMessage.value = err.message;
          message.error(err.message);
        }
      } else {
        errorMessage.value = 'No root node selected';
        message.error('Please select a root node to save the document');
      }
      return true;
    };
    const tableRef = ref(null);
    const editorRef = ref(null);
    const message = useMessage();
    const treeData = ref([]);
    const listData = ref([]);
    const flatTreeNodes = ref([]);
    const showTreeModal = ref(false);
    const isTreeEdit = ref(false);
    const loading = ref(true);
    const currentTreeNode = ref({
      id: null,
      pid: null,
      name: '',
      key: '',
      type: 'default',
      data: '',
      data_o: '',
      data_t: '',
      data_a: '',
      version: 1,
      version_o: 0,
      version_t: 0,
      version_a: 0
    });
    const selectedKeys = ref([]);
    const errorMessage = ref('');
    const table = ref('page');

    const filteredTreeNodes = computed(() => {
      if (!listData.value || !Array.isArray(listData.value)) {
        return [];
      }
      return listData.value.map(node => ({
        id: node.id,
        type: node.type,
        pid: node.pid !== null ? node.pid : null,
        name: node.name,
        key: node.key,
        version: node.version,
        version_o: node.version_o,
        version_t: node.version_t,
        version_a: node.version_a,
        data: node.data,
        data_o: node.data_o,
        data_t: node.data_t,
        data_a: node.data_a,
      }));
    });

    const treeColumns = [
      {
        title: '序号',
        key: 'id',
        width: 80,
        render: (row) => {
          return h(
            XmTableDragDropIcon,
            { row },
            { default: () => h('div', 'Drag') }
          );
        }
      },
      { title: '名称', key: 'name' },
      { title: '类型', key: 'type' },
      { title: '数据', key: 'data' },
      { title: '数据 (O)', key: 'data_o', },
      { title: '数据 (T)', key: 'data_t' },
      { title: '数据 (A)', key: 'data_a' },
      {
        title: '类别',
        key: 'pid',
        render: (row) => {
          if (!flatTreeNodes.value) return 'None';
          const parent = flatTreeNodes.value.find(n => n.value === row.pid);
          return parent ? parent.label : 'None';
        }
      },
      { title: '版本', key: 'version' },
      { title: '版本 (O)', key: 'version_o' },
      { title: '版本 (T)', key: 'version_t' },
      { title: '版本 (A)', key: 'version_a' },
      {
        title: '动作',
        key: 'actions',
        width: 120,
        render: (row) => h(XmTableEdit, {
          row,
          onOpenTreeEdit: (row) => {
            openTreeEdit(row);
          },
          onHandleTreeDelete: (row) => {
            handleTreeDelete(row);
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
    const convertTreeToDocument = () => {
      if (!selectedKeys.value.length) {
        message.error('Please select a root node to convert');
        return;
      }
      loading.value = true;
      errorMessage.value = '';
      try {
        const rootId = selectedKeys.value[0];
        const doc = XmTree2Word.treeToDocument(
          treeData.value, // req, adjust based on your XmApiRequest setup
          rootId
        );
        editorRef.value.setContent(doc);
      } catch (err) {
        errorMessage.value = err.message;
        message.error(err.message);
      } finally {
        loading.value = false;
      }
    };
    const fetchListData = async () => {
      if (table.value === 'page') {
        return;
      }
      loading.value = true;
      errorMessage.value = '';
      try {
        let pid = 0;
        if (selectedKeys.value.length > 0) {
          pid = selectedKeys.value[0];
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
      initDraggable();
    };

    const handleTreeSave = async () => {
      errorMessage.value = '';
      const input = {
        name: currentTreeNode.value.name,
        pid: currentTreeNode.value.pid !== null ? currentTreeNode.value.pid : null,
        type: currentTreeNode.value.type,
        version: currentTreeNode.value.version,
        data: currentTreeNode.value.data,
        data_o: currentTreeNode.value.data_o,
        data_t: currentTreeNode.value.data_t,
        data_a: currentTreeNode.value.data_a,
      };
      try {
        const action = isTreeEdit.value ? 'edit' : 'add';
        if (isTreeEdit.value) input.id = currentTreeNode.value.id;
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
        type: 'default',
        data: '',
        data_o: '',
        data_t: '',
        data_a: '',
        version: 1,
        version_o: 0,
        version_t: 0,
        version_a: 0
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
        type: node.type || 'default',
        data: node.data || '',
        data_o: node.data_o || '',
        data_t: node.data_t || '',
        data_a: node.data_a || '',
        version: node.version,
        version_o: node.version_o,
        version_t: node.version_t,
        version_a: node.version_a
      };
      showTreeModal.value = true;
    };

    const handleTreeSelect = async (keys) => {
      if (keys.length > 0) {
        selectedKeys.value = keys;
        await loadData();
      }
      initDraggable();
      convertTreeToDocument()
    };

    const handleTableSelect = (keys) => {
      //selectedKeys.value = keys;
    };

    const handleTabChange = async (value) => {
      table.value = value;
      //editorRef.value.setContent(testData);
      console.log(editorRef.value.getJSON())
      await fetchListData();
    };

    const loadData = async () => {
      await fetchAllData();
      await fetchListData();
    };
    loadData();

    let draggable = null;

    const initDraggable = () => {
      const tbody = document.querySelector('.n-data-table .n-data-table-tbody');
      if (!tbody) return;

      if (draggable) {
        draggable.destroy?.();
        draggable = null;
      }

      draggable = useDraggable(tbody, filteredTreeNodes.value, {
        animation: 150,
        handle: 'tr',
        onEnd: async () => {
          const ids = filteredTreeNodes.value.map(item => item.id);
          const pid = selectedKeys.value.length ? selectedKeys.value[0] : null;
          const input = {
            id: pid,
            data_o: ids,
          };
          const action = 'edit';
          await XmApiRequest(action, input, "tree");
          await loadData();
        },
      });
    };

    const adjustHeight = () => {
      return window.innerHeight - 150;
    };

    onMounted(async () => {
      initDraggable();
    });
    const onSaved = () => {
      console.log('onSaved', '文档已保存，无可用参数')
    }
    const onChanged = (editor) => {
      console.log('onChanged', '编辑器内容已更新，可用参数:', { editor })
    }
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
      table,
      umoOption,
      editorRef,
      adjustHeight,
      onSaved,
      onChanged
    };
  }
}
</script>

<template>
  <div class="h-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
    <div class="h-full flex gap-1">
      <!-- Tree View (Left) -->
      <div class="w-64 h-full min-h-0  border border-gray-200">
        <n-tabs type="line" animated v-model:value="table" @update:value="handleTabChange">
          <n-tab name="page" tab="编排"></n-tab>
          <n-tab name="tree" tab="数据"></n-tab>
        </n-tabs>
        <n-tree :data="treeData" style="max-height: calc(100vh - 100px);" key-field="id" label-field="name" show-line
          expandable block-line virtual-scroll selectable :selected-keys="selectedKeys"
          @update:selected-keys="handleTreeSelect" />
        <p v-if="treeData && !treeData.length" class="text-gray-500 mt-2">
          No tree nodes available. Add a node to start.
        </p>
      </div>
      <!-- Tree Nodes and List Items Table (Right) -->
      <div class="flex-1 h-full overflow-hidden  border border-gray-200">

        <div v-show="table == 'page'" class="h-full min-h-0 overflow-y-auto">
          <umo-editor v-bind="umoOption" ref="editorRef" @saved="onSaved" @changed="onChanged"></umo-editor>
        </div>
        <div v-show="table !== 'page'" class="h-full min-h-0">
          <div class="my-1">
            <n-button type="success" class="p-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded"
              @click="openTreeAdd">
              添加
            </n-button>
          </div>
          <div class="h-full min-h-0 overflow-y-auto">
            <n-data-table :columns="treeColumns" :data="filteredTreeNodes || []" :bordered="true"
              :row-key="(row) => row.id" :single-line="false" :key="filteredTreeNodes?.length"
              @update:checked-row-keys="handleTableSelect" :max-height="adjustHeight()" striped />
            <p v-if="filteredTreeNodes && !filteredTreeNodes.length" class="text-gray-500 mt-2">
              {{ selectedKeys.length ? 'No child nodes for selected node.' : 'No nodes available.' }}
            </p>
          </div>
        </div>
      </div>

      <n-modal v-model:show="showTreeModal" preset="card" :title="isTreeEdit ? '编辑' : '添加'" style="width:400px">
        <n-form>
          <n-form-item label="名称">
            <n-input v-model:value="currentTreeNode.name" placeholder="Enter name" />
          </n-form-item>
          <n-form-item label="类型">
            <n-input v-model:value="currentTreeNode.type" placeholder="Enter type" />
          </n-form-item>
          <n-form-item label="数据">
            <n-input v-model:value="currentTreeNode.data" placeholder="Enter data" />
          </n-form-item>
          <n-form-item label="数据 (O)">
            <n-input v-model:value="currentTreeNode.data_o" placeholder="Enter data_o" />
          </n-form-item>
          <n-form-item label="数据 (T)">
            <n-input v-model:value="currentTreeNode.data_t" placeholder="Enter data_t" />
          </n-form-item>
          <n-form-item label="数据 (A)">
            <n-input v-model:value="currentTreeNode.data_a" placeholder="Enter data_a" />
          </n-form-item>
          <n-form-item label="类别" v-if="isTreeEdit">
            <n-tree-select v-model:value="currentTreeNode.pid" :options="treeData" placeholder="Select parent"
              default-expand-all value-field="id" label-field="name" key-field="id" clearable />
          </n-form-item>
          <n-form-item label="类别" v-else>
            <n-input
              :value="selectedKeys.length ? flatTreeNodes.find(n => n.value === selectedKeys[0])?.label || 'None' : 'None'"
              disabled />
          </n-form-item>
          <n-form-item label="版本">
            <n-input :value="currentTreeNode.version" disabled />
          </n-form-item>
          <n-form-item label="版本 (O)">
            <n-input :value="currentTreeNode.version_o" disabled />
          </n-form-item>
          <n-form-item label="版本 (T)">
            <n-input :value="currentTreeNode.version_t" disabled />
          </n-form-item>
          <n-form-item label="版本 (A)">
            <n-input :value="currentTreeNode.version_a" disabled />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-button type="primary" @click="handleTreeSave">保存</n-button>
          <n-button @click="showTreeModal = false">取消</n-button>
        </template>
      </n-modal>
    </div>
  </div>
</template>