<template>
  <img
    :src="src"
    :alt="alt"
    class="image"
  />
</template>

<script setup>
defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: 'Image'
  }
})
</script>

<style scoped>
.image {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}
</style>