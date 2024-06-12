<template>
    <div>
      <input type="file" ref="file" @change="selectFile" />
      <p v-if="message" :class="{ error: error }">{{ message }}</p>
    </div>
  </template>
  
  <script>
  export default {
    name: 'FileChecker',
    data() {
      return {
        file: null,
        message: "",
        error: false
      };
    },
    methods: {
      selectFile() {
        const fileInput = this.$refs.file;
        if (fileInput && fileInput.files.length > 0) {
          const file = fileInput.files[0];
  
          const allowTypes = ["text/x-vcard", "text/vcard"];
  
          if (allowTypes.includes(file.type)) {
            this.file = file;
            this.message = "";
            this.error = false;
            this.$emit('fileSelected', file); // 触发文件选中事件，传递文件对象
            this.log("info", "File selected: " + file.name);
          } else {
            this.error = true;
            this.message = "Only VCF files are allowed";
            this.log("error", this.message);
          }
        } else {
          this.file = null;
          this.error = true;
          this.message = "No file selected";
          this.log("error", this.message);
        }
      },
      log(level, message) {
        const timestamp = new Date().toISOString();
        console[level](`[${timestamp}] ${level.toUpperCase()}: ${message}`);
      }
    }
  }
  </script>
  
  <style scoped>
  .error {
    color: red;
  }
  </style>
  