<script setup>
import { ref } from 'vue'
import BaseButton from './components/BaseButton.vue'

const isLoading = ref(false)
const isLoadingEnabled = ref(false)

const handleSaveWithLoading = async () => {
  isLoading.value = true
  try {
    await saveData()
  } finally {
    isLoading.value = false
  }
}

const saveData = async () => {
  console.log('Saving data...')
  await new Promise((resolve) => setTimeout(resolve, 2000))
  console.log('Data saved!')
}
</script>

<template>
  <div class="button-container">
    <h2>Loading on button</h2>
    <div class="container">
      <label class="checkbox-label">
        <input type="checkbox" v-model="isLoadingEnabled" class="checkbox-input" />
        Enable loading state
      </label>
    </div>

    <h2>Buttons sizes</h2>
    <div class="container">
      <!-- Small button -->
      <BaseButton
        size="small"
        @click="handleSaveWithLoading"
        :loading="isLoading && isLoadingEnabled"
        >Small button</BaseButton
      >
      <!-- Medium button -->
      <BaseButton @click="handleSaveWithLoading" :loading="isLoading && isLoadingEnabled" n
        >Button</BaseButton
      >
      <!-- Large button -->
      <BaseButton
        size="large"
        @click="handleSaveWithLoading"
        :loading="isLoading && isLoadingEnabled"
        >Large button</BaseButton
      >
    </div>

    <h2>Button variants</h2>
    <div class="container">
      <!-- Primary button -->
      <BaseButton
        variant="primary"
        @click="handleSaveWithLoading"
        :loading="isLoading && isLoadingEnabled"
        >Primary variant</BaseButton
      >
      <!-- Secondary button -->
      <BaseButton
        variant="secondary"
        @click="handleSaveWithLoading"
        :loading="isLoading && isLoadingEnabled"
        >Secondary variant</BaseButton
      >
      <!-- Gray button -->
      <BaseButton
        variant="gray"
        @click="handleSaveWithLoading"
        :loading="isLoading && isLoadingEnabled"
        >Gray variant</BaseButton
      >
      <!-- Outline button -->
      <BaseButton
        variant="outline"
        @click="handleSaveWithLoading"
        :loading="isLoading && isLoadingEnabled"
        >Outline variant</BaseButton
      >
      <!-- Ghost button -->
      <BaseButton
        variant="ghost"
        @click="handleSaveWithLoading"
        :loading="isLoading && isLoadingEnabled"
        >Ghost variant</BaseButton
      >
    </div>

    <h2>Button with icons</h2>
    <div class="container">
      <!-- Button with icon left-->
      <BaseButton
        variant="primary"
        @click="handleSaveWithLoading"
        :loading="isLoading && isLoadingEnabled"
      >
        Icon left
        <template #prefix>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M17 12h-14" />
            <path d="m10 5-7 7 7 7" />
          </svg>
        </template>
      </BaseButton>

      <!-- Button with icon -->
      <BaseButton
        variant="primary"
        @click="handleSaveWithLoading"
        :loading="isLoading && isLoadingEnabled"
      >
        Icon right
        <template #suffix>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </template>
      </BaseButton>
    </div>

    <h2>Others</h2>
    <div class="container">
      <!-- Disabled button -->
      <BaseButton disabled> Disabled button </BaseButton>

      <!-- Button that takes full width -->
      <BaseButton block style="margin: 1rem 0"> Block button </BaseButton>
    </div>
  </div>
</template>

<style scoped>
h2 {
  text-align: center;
  margin-bottom: 1rem;
}
.container {
  text-align: center;

  button {
    margin-inline: 1rem;
  }
}
</style>
