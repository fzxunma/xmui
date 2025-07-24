<script>
export default {
    setup() {
        return {};
    },
};
</script>
<template>
<div
      class="border-solid  flex flex-col w-full sm:w-full md:w-64 lg:w-64 xl:w-64 h-100 p-2 m-4 justify-center items-center text-center rounded-lg">
      <div>第一行分两部</div>
      <div class="border-solid border-b-0 w-full h-full  flex flex-row items-center justify-center">
        <div class=" w-full h-full bg-blue-100 flex items-center justify-center">左</div>
        <div
          class="border-solid bg-blue-100 border-t-0 border-r-0 border-b-0  w-full h-full flex items-center justify-center">
          右</div>
      </div>
      <div class="border-solid  bg-blue-200 flex items-center justify-center w-full h-full">
        第二行内容
      </div>
    </div>
    </template>