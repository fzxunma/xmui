// MyEditor.js
import { ref, onMounted } from "vue";

export default {
  template: `
    <div>
<div id="vditor" class="vditor"></div>
      <div>md</div>
    </div>
  `,
  setup() {
    const meeting = ref({
      name: "示例会议",
      notes: "# 会议议程\n- 开场\n- 产品演示",
    });
    const vditor = ref(null);
    onMounted(() => {
      vditor.value = new Vditor("vditor", {
        mode: "wysiwyg", // 即时渲染（类似 Typora）
        height: 400,
        value: meeting.value.notes,
        after: () => {
          vditor.value.setValue(meeting.value.notes); // 确保初始内容
        },
        input: (value) => {
          meeting.value.notes = value; // 同步 Markdown
        },
      });
    });

    return { meeting };
  },
};
