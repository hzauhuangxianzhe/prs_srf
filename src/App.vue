<template>
  <div id="app">
    <h1>Upload VCF File</h1>
    <FileChecker @fileSelected="handleFileSelected" />
    <FileUploader :file="selectedFile" @uploadSuccess="handleUploadSuccess" />
    <FileDownloader :downloadLink="downloadLink" />
  </div>
</template>

<script>
import FileChecker from './components/FileChecker.vue';
import FileUploader from './components/FileUploader.vue';
import FileDownloader from './components/FileDownloader.vue';

export default {
  name: 'App',
  components: {
    FileChecker,
    FileUploader,
    FileDownloader
  },
  data() {
    return {
      selectedFile: null,
      downloadLink: null
    };
  },
  methods: {
    handleFileSelected(file) {
      this.selectedFile = file;
    },
    handleUploadSuccess(downloadLink) {
      this.downloadLink = downloadLink;
    }
  }
}
</script>

<style scoped>
/* Add your styles here */
</style>
