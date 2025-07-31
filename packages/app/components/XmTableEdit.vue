<template>
    <div class="flex gap-2">
        <n-button size="small" type="primary" @click="onOpenTreeEdit(row)">
            Edit
        </n-button>

        <n-popconfirm @positive-click="() => onHandleTreeDelete(row)">
            <template #trigger>
                <n-button size="small" type="error">
                    Delete
                </n-button>
            </template>
            Are you sure to delete this node and its children?
        </n-popconfirm>
    </div>
</template>

<script>
import naive from 'naive-ui'; // 从自定义 naive.js 导入
const { NButton, NPopconfirm } = naive;
export default {
    props: {
        row: { type: Object, required: true },
        onOpenTreeEdit: { type: Function, required: true },
        onHandleTreeDelete: { type: Function, required: true }
    }
}
</script>
