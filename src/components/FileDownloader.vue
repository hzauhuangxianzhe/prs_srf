<template>
    <div>
      <div v-if="downloadLink" style="margin-top: 20px;">
        <button @click="downloadResult">Download Result</button>
      </div>
      <p v-if="message" :class="{ error: error }">{{ message }}</p>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: 'FileDownloader',
    props: ['downloadLink'],
    data() {
      return {
        message: "",
        error: false
      };
    },
    methods: {
      async downloadResult() {
        try {
          const response = await axios.get(this.downloadLink, {
            responseType: 'blob'
          });
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'prs_result.png');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          this.log("info", "Result file downloaded");
        } catch (err) {
          this.message = 'Failed to download the result file';
          this.error = true;
          this.log("error", "Download error: " + err.message);
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
  