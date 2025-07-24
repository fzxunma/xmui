<script>
export default {
  setup() {
    return {};
  }
};
</script>
<template>
<div
      class="border-solid  flex flex-col w-full sm:w-full md:w-64 lg:w-64 xl:w-64 h-100 p-2 m-4 justify-center items-center text-center rounded-lg">
      <div>一二一二布局模板</div>
      <div class="border-solid border-b-0 bg-pink-200 flex items-center justify-center w-full h-10">
        第1部分标题
      </div>
      <div class="border-solid  bg-pink-100  border-b-0 w-full h-full flex flex-row items-center justify-center">
        <div class="bg-pink-100 w-full h-full flex items-center justify-center">1左</div>
        <div
          class="border-solid border-t-0 border-r-0 border-b-0 bg-pink-100 w-full h-full flex items-center justify-center">
          1右</div>
      </div>
      <div class="border-solid border-b-0 bg-pink-200 flex items-center justify-center w-full h-10">
        第2部分标题
      </div>
      <div class="border-solid  bg-pink-100  w-full h-full flex flex-row items-center justify-center">
        <div class="bg-pink-100 w-full h-full flex items-center justify-center">2左</div>
        <div
          class="border-solid border-t-0 border-b-0 border-r-0 bg-pink-100 w-full h-full flex items-center justify-center">
          2右</div>
      </div>
    </div>
    </template>