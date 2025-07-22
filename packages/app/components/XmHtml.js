// MyEditor.js
import { ref, onMounted } from "vue";
export default {
  template: `
    <div>
<div id="editor">
  <p>Hello World!</p>
  <p>Some initial <strong>bold</strong> text</p>
  <p><br /></p>
</div>
      <div>md</div>
    </div>
  `,
  setup() {
    const meeting = ref({
      name: "示例会议",
      notes: "# 会议议程\n- 开场\n- 产品演示",
    });
    const toolbarOptions = [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ align: [] }],
      ["bold", "italic", "underline", "strike"], // toggled buttons
            [{ color: [] }, { background: [] }], // dropdown with defaults from theme

      ["link", "image"],
      

      [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
      [{ script: "sub" }, { script: "super" }], // superscript/subscript
      [{ indent: "-1" }, { indent: "+1" }], // outdent/indent

    
      ["blockquote"],
      ["clean"], // remove formatting button
      [{ direction: "rtl" }], // text direction
    ];
    onMounted(() => {
      const quill = new Quill("#editor", {
        modules: {
          toolbar: toolbarOptions,
        },
        theme: "snow",
      });
    });

    return { meeting };
  },
};
