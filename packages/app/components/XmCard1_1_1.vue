<script>
export default {
    setup() {
        return {};
    },
};
</script>
<template>
    <div
        class="border-solid  flex flex-col w-full sm:w-full md:w-64 lg:w-64 xl:w-64 h-100  p-2 m-4 justify-center items-center text-center rounded-lg">
        <div>三行卡片模板</div>
        <div class="border-solid border-b-0  bg-purple-100   w-full h-full  flex items-center justify-center">
            第一行内容
        </div>
        <div class="border-solid border-b-0  bg-purple-200   w-full h-full  flex items-center justify-center">
            第二行内容
        </div>
        <div class="border-solid  bg-purple-300 flex items-center justify-center w-full h-full">
            第三行内容
        </div>
    </div>
</template>