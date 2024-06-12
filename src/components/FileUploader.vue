<template>
    <div>
      <button @click="sendFile">Upload</button>
      <p v-if="message" :class="{ error: error }">{{ message }}</p>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: 'FileUploader',
    props: ['file'],
    data() {
      return {
        message: "",
        error: false,
        downloadLink: null
      };
    },
    methods: {
      async sendFile() {
        if (!this.file) {
          this.message = "Please select a file first.";
          this.error = true;
          this.log("error", this.message);
          return;
        }
  
        const formData = new FormData();
        formData.append('file', this.file);
  
        try {
          this.log("info", "Sending file: " + this.file.name);
          const response = await axios.post('http://localhost:3000/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          this.message = response.data.message;
          this.downloadLink = response.data.downloadPath;
          this.error = false;
          this.$emit('uploadSuccess', this.downloadLink); // 触发上传成功事件，传递下载链接
          this.log("info", "Upload response: " + JSON.stringify(response.data));
        } catch (err) {
          const errorMessage = err.response ? err.response.data.error : 'An error occurred';
          this.message = errorMessage;
          this.error = true;
          this.log("error", "Upload error: " + errorMessage);
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
  