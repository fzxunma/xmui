<script>
export default {
    setup() {
        return {};
    }
};
</script>
<template>
    <div
        class="border-solid flex flex-col w-full sm:w-full md:w-64 lg:w-64 xl:w-64 p-2 h-100 m-4 justify-center items-center text-center rounded-lg">
        <div>两行卡片模板</div>
        <div class="flex flex-row border-solid w-full bg-blue-100 h-10 overflow-y-hidden overflow-x-auto">
            <div v-for="i in 300" :key="i" class="flex-none w-24">第二</div>
        </div>
        <div class="w-full border-solid border-b-0 bg-purple-200 h-60 flex flex-row items-center justify-center">
            <div class="w-1/3 border-solid border-b-0 bg-purple-200 h-60 overflow-y-auto">
                <div v-for="i in 300" :key="i">第二</div>
            </div>
            <div class="h-full flex flex-col flex-1 items-center justify-center h-60 overflow-y-auto">
                <div v-for="i in 300" :key="i">第二行内容</div>
            </div>
        </div>

        <div class="w-full border-solid border-b-0 bg-blue-100 h-10 items-center justify-center">
            第一行内容
        </div>
    </div>
</template>