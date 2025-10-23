// Example: How to configure global validation messages
// Import the validation config composable
import { useValidationConfig } from './composables/validationConfig'

// In your main.js or app setup
const { setValidationMessages } = useValidationConfig()

// Set custom messages globally
setValidationMessages({
  // Simple string messages
  required: 'Este campo é obrigatório',
  email: 'Por favor, insira um email válido',
  pattern: 'Formato inválido',
  hexColor: 'Cor HEX inválida',
  rgbColor: 'Cor RGB inválida',
  rgbaColor: 'Cor RGBA inválida',
  hslColor: 'Cor HSL inválida',

  // Function messages (for dynamic values)
  min: (min) => `Mínimo de ${min} caracteres`,
  max: (max) => `Máximo de ${max} caracteres`,
  minValue: (min) => `O valor deve ser no mínimo ${min}`,
  maxValue: (max) => `O valor deve ser no máximo ${max}`,
})

// Example usage in a Vue component:
/*
<template>
  <BaseInput
    v-model="email"
    :rules="['required', 'email']"
    label="Email"
  />

  <BaseInput
    v-model="password"
    :rules="['required', { min: 8 }]"
    label="Senha"
  />

  <BaseInput
    v-model="age"
    type="number"
    :rules="[{ minValue: 18 }, { maxValue: 120 }]"
    label="Idade"
  />
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const age = ref('')
</script>
*/

// You can also add custom validation rules with custom messages:
/*
<BaseInput
  v-model="customField"
  :rules="[
    'required',
    {
      validator: (value) => value.startsWith('VSU'),
      message: 'Deve começar com VSU'
    }
  ]"
  label="Código"
/>
*/

