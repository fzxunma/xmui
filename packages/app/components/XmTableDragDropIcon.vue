<template>
    <NIcon>
        <DragDrop></DragDrop>
    </NIcon>{{ row.id }}
</template>
<script>
import { DragDrop } from "xicons"
export default {
    components: {
        DragDrop
    },
    props: {
        row: { type: Object, required: true }
    }
}
</script>