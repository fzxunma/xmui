<script>
export default {
    setup() {
        return {};
    }
};
</script>
<template>
    <div
        class="border-solid  flex flex-col w-full sm:w-full md:w-64 lg:w-64 xl:w-64 p-2 h-100 m-4 justify-center items-center text-center rounded-lg">
        <div>两行卡片模板</div>
        <div class="border-solid border-b-0  bg-blue-100   w-full h-10   items-center justify-center">
            第一行内容
        </div>
        <div class="border-solid  bg-blue-200 flex-1 items-center justify-center w-full h-60 overflow-y-auto">
            <div v-for="i in 100" :key='i'>第二行内容</div>
        </div>
        <div class="border-solid border-b-0  bg-blue-100   w-full h-10   items-center justify-center">
            第一行内容
        </div>
    </div>
</template>