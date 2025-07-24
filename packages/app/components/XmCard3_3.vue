<script>
export default {
  setup() {
    return {};
  }
};
</script>
<template>
<div
      class="border-solid flex flex-col w-full sm:w-full md:w-64 lg:w-64 xl:w-64 h-100 p-2 m-4 justify-center items-center text-center rounded-lg">
      <div>每行分成三部分</div>
      <div class="border-solid border-b-0 w-full h-full  flex flex-row items-center justify-center">
        <div class="bg-purple-100 w-full h-full flex items-center justify-center">上左</div>
        <div class="border-solid border-t-0 border-b-0 bg-purple-200 w-full h-full flex items-center justify-center">上中
        </div>
        <div class=" bg-purple-300 w-full h-full flex items-center justify-center">
          上右</div>
      </div>
      <div class="border-solid border-b-0 w-full h-full  flex flex-row items-center justify-center">
        <div class="bg-purple-300 w-full h-full flex items-center justify-center">下左</div>
        <div class="border-solid border-t-0 border-b-0 bg-purple-400 w-full h-full flex items-center justify-center">下中
        </div>
        <div class="bg-purple-500 w-full h-full flex items-center justify-center">
          下右</div>
      </div>
    </div>
  </template>