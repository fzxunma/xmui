<template>
    <div class="flex gap-2 items-center">
        <n-button size="small" type="primary" @click="onOpenTreeEdit(row)">
            Edit
        </n-button>
        <n-popconfirm v-model:show="showPopconfirm" @positive-click="confirmDelete">
            <template #trigger>
                <n-button size="small" type="error" @click="showPopconfirm = true">
                    Delete
                </n-button>
            </template>
            <div>
                <p>Please input <strong>{{ row.name }}</strong> to confirm deletion</p>
                <n-input v-model:value="inputName" placeholder="Enter name to confirm" />
            </div>
        </n-popconfirm>
    </div>
</template>

<script>
import { ref } from 'vue'
import naive from 'naive-ui'
const { NButton, NPopconfirm, NInput, useMessage } = naive

export default {
    props: {
        row: { type: Object, required: true },
        onOpenTreeEdit: { type: Function, required: true },
        onHandleTreeDelete: { type: Function, required: true }
    },
    setup(props) {
        const showPopconfirm = ref(false)
        const inputName = ref('')
        const message = useMessage()

        const confirmDelete = () => {
            if (inputName.value.trim() === props.row.name) {
                props.onHandleTreeDelete(props.row)
                showPopconfirm.value = false
                inputName.value = ''
            } else {
                message.error('Name does not match. Please try again.')
                // 不关闭
                //弹窗，保持 showPopconfirm = true
                 return false
            }
        }

        return { showPopconfirm, inputName, confirmDelete }
    }
}
</script>
