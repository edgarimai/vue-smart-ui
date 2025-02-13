<script setup>
import { ref } from 'vue'
import BaseButton from './components/BaseButton.vue'

const isLoading = ref(false)

const handleClick = () => {
  console.log('Clicou no botão')
}

const handleSaveWithLoading = async () => {
  isLoading.value = true
  try {
    await saveData()
  } finally {
    isLoading.value = false
  }
}

const saveData = async () => {
  console.log('Salvando dados...')
  await new Promise((resolve) => setTimeout(resolve, 8000))
  console.log('Dados salvos!')
}
</script>

<template>
  <!-- Botão primário básico -->
  <BaseButton @click="handleClick"> Clique aqui </BaseButton>

  <!-- Botão secundário com tamanho pequeno -->
  <BaseButton variant="secondary" size="small" @click="handleSaveWithLoading" :loading="isLoading">
    Botão pequeno
  </BaseButton>

  <!-- Botão outline grande -->
  <BaseButton variant="outline" size="large" @click="handleSaveWithLoading" :loading="isLoading">
    Botão grande
  </BaseButton>

  <!-- Botão primário com ícone -->
  <BaseButton variant="primary" @click="handleSaveWithLoading" :loading="isLoading">
    Continuar
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
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </template>
  </BaseButton>

  <!-- Botão com ícones usando slots -->
  <BaseButton @click="handleSaveWithLoading" :loading="isLoading"> Pesquisar </BaseButton>

  <!-- Botão com loading -->
  <BaseButton :loading="isLoading" @click="handleSaveWithLoading"> Salvar </BaseButton>

  <!-- Botão ghost -->
  <BaseButton variant="ghost" @click="handleSaveWithLoading"> Salvar ghost </BaseButton>

  <!-- Botão que requer ícone -->
  <BaseButton require-icon @click="handleClick"> Ação com ícone obrigatório </BaseButton>

  <!-- Botão desabilitado -->
  <BaseButton disabled> Botão desabilitado </BaseButton>

  <!-- Botão que ocupa toda a largura -->
  <BaseButton block> Botão em bloco </BaseButton>

  <!-- Combinando várias propriedades -->
  <BaseButton
    variant="primary"
    size="large"
    block
    @click="handleSaveWithLoading"
    :loading="isLoading"
  >
    Enviar formulário
  </BaseButton>

  <!-- Usando classes Tailwind adicionais -->
  <BaseButton class="mt-4 shadow-lg"> Com classes Tailwind </BaseButton>
</template>

<style scoped></style>
