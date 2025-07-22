// MyEditor.js (reusable Quill editor component)
import { ref, onMounted } from "vue";

export default {
  props: {
    id: {
      type: String,
      required: true, // Unique ID for each instance, e.g., 'editor1', 'editor2'
    },
    initialContent: {
      type: String,
      default: "",
    },
  },
  emits: ["update:content"], // Emit updated content for v-model
  template: `
  <div class="h-64">
      <div :id="'editor-' + id" >
      </div>
      </div>
  `,
  setup(props, { emit }) {
    const content = ref(props.initialContent);
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
      const quill = new Quill(`#editor-${props.id}`, {
        modules: {
          toolbar: toolbarOptions,
        },
        theme: "snow",
      });
      quill.root.innerHTML = content.value;
      quill.on("text-change", () => {
        content.value = quill.root.innerHTML;
        emit("update:content", content.value); // Support v-model
      });
    });

    return { content };
  },
};
