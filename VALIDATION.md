# 🔍 Validation System - Vue Smart UI

This document explains how the validation system works and how to configure global messages.

## 📋 Table of Contents

- [Overview](#overview)
- [Global Configuration](#global-configuration)
- [Available Validators](#available-validators)
- [Validation Behavior](#validation-behavior)
- [Usage Examples](#usage-examples)
- [Advanced Customization](#advanced-customization)

## Overview

Vue Smart UI has an integrated validation system that allows:

✅ **Global configuration** of error messages  
✅ **Progressive validation** (only validates in real-time after first interaction)  
✅ **Multiple rules** per field  
✅ **Custom validators**  
✅ **Dynamic messages** with parameters  

## Global Configuration

### Configuring in `main.js`

```javascript
import { createApp } from 'vue'
import App from './App.vue'
import { useValidationConfig } from 'vue-smart-ui'

const app = createApp(App)

// Configure messages globally
const { setValidationMessages } = useValidationConfig()

setValidationMessages({
  required: 'This field is required',
  email: 'Please enter a valid email',
  min: (min) => `Must be at least ${min} characters`,
  max: (max) => `Must be no more than ${max} characters`,
  minValue: (min) => `Minimum value is ${min}`,
  maxValue: (max) => `Maximum value is ${max}`,
  pattern: 'Invalid format',
  hexColor: 'Invalid HEX color',
  rgbColor: 'Invalid RGB color',
  rgbaColor: 'Invalid RGBA color',
  hslColor: 'Invalid HSL color',
})

app.mount('#app')
```

### Reset to Default Messages

```javascript
import { useValidationConfig } from 'vue-smart-ui'

const { resetValidationMessages } = useValidationConfig()

// Reset to default messages in English
resetValidationMessages()
```

## Available Validators

### Simple Validators (String)

| Validator | Description | Example |
|-----------|-------------|---------|
| `required` | Required field | `:rules="['required']"` |
| `email` | Valid email format | `:rules="['email']"` |
| `pattern` | Custom regex | `:rules="['pattern']"` |
| `hexColor` | Valid HEX color (#FFF or #FFFFFF) | `:rules="['hexColor']"` |
| `rgbColor` | Valid RGB color | `:rules="['rgbColor']"` |
| `rgbaColor` | Valid RGBA color | `:rules="['rgbaColor']"` |
| `hslColor` | Valid HSL color | `:rules="['hslColor']"` |
| `passwordStrength` | Password with lowercase, uppercase, number and special character | `:rules="['passwordStrength']"` |

### Validators with Parameters (Object)

| Validator | Parameter | Description | Example |
|-----------|-----------|-------------|---------|
| `min` | number | Minimum characters | `:rules="[{ min: 8 }]"` |
| `max` | number | Maximum characters | `:rules="[{ max: 50 }]"` |
| `minValue` | number | Minimum numeric value | `:rules="[{ minValue: 18 }]"` |
| `maxValue` | number | Maximum numeric value | `:rules="[{ maxValue: 100 }]"` |
| `passwordStrength` | `('lowercase' \| 'uppercase' \| 'number' \| 'special')[]` | Required character types (`true` = all four, `false` = off) | `:rules="[{ passwordStrength: ['number', 'special'] }]"` |

### Password Strength

The `passwordStrength` rule makes the requirements mandatory: the field is invalid until every
one is met (an empty value passes, so combine it with `required`). The error lists what is
missing, e.g. `Must contain: uppercase letter, number`.

The `password-strength` prop on `type="password"` adds a visual indicator (strength bar plus a
checklist). It is purely visual and never blocks on its own.

```vue
<BaseInput
  v-model="password"
  type="password"
  label="Password"
  password-strength
  :rules="['required', { min: 8 }, { passwordStrength: ['lowercase', 'number'] }]"
/>
```

The indicator shows the requirements from the `passwordStrength` rule. To show a different list
than the rule enforces, pass `:password-requirements="['number', 'special']"`, which takes
precedence. Without either, all four are shown.

#### Changing the texts

Texts are resolved in this order: the `password-labels` prop (one input), then the global
messages (`setValidationMessages`, every input), then the English defaults. Any key you leave out
falls back to the next level.

Per input, with `password-labels` (keys: `lowercase`, `uppercase`, `number`, `special`, `weak`,
`medium`, `strong`):

```vue
<BaseInput
  v-model="password"
  type="password"
  password-strength
  :password-labels="{
    lowercase: 'Letra minúscula',
    uppercase: 'Letra maiúscula',
    number: 'Pelo menos 1 número',
    special: 'Símbolo (!@#…)',
    weak: 'Fraca',
    medium: 'Média',
    strong: 'Forte',
  }"
  :rules="[{ passwordStrength: true, message: 'Senha muito simples' }]"
/>
```

The same labels name the missing items in the rule's error message. To replace the whole error
text for one input, use `message` on the rule, as above.

Globally, for every input (e.g. the app language):

```javascript
setValidationMessages({
  passwordStrength: (missing) => `Faltando: ${missing}`,
  passwordLowercase: 'letra minúscula',
  passwordUppercase: 'letra maiúscula',
  passwordNumber: 'número',
  passwordSpecial: 'caractere especial',
  passwordStrengthWeak: 'Fraca',
  passwordStrengthMedium: 'Média',
  passwordStrengthStrong: 'Forte',
})
```

## Validation Behavior

### Progressive Validation (Default)

By default, the behavior is:

1. **First typing**: User types freely, without validation
2. **On blur**: Validation is executed for the first time
3. **After first validation**: Validates in real-time with each character typed

This provides a smooth UX, without interrupting the user on their first typing, but allowing instant feedback when correcting errors.

### Validation Settings

```vue
<BaseInput
  v-model="value"
  :rules="['required', 'email']"
  :validate-on-blur="true"   <!-- Default: true -->
  :validate-on-input="false"  <!-- Default: false -->
/>
```

- `validate-on-blur`: Validates when losing focus
- `validate-on-input`: Validates on each character from the start

## Usage Examples

### Basic Example

```vue
<template>
  <BaseInput
    v-model="email"
    :rules="['required', 'email']"
    label="Email"
  />
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')
</script>
```

### Multiple Rules

```vue
<template>
  <BaseInput
    v-model="password"
    type="password"
    :rules="['required', { min: 8 }, { max: 50 }]"
    label="Password"
  />
</template>

<script setup>
import { ref } from 'vue'

const password = ref('')
</script>
```

### Custom Validator

```vue
<template>
  <BaseInput
    v-model="username"
    :rules="[
      'required',
      {
        validator: (value) => /^[a-zA-Z0-9_]+$/.test(value),
        message: 'Only letters, numbers and underscore allowed'
      }
    ]"
    label="Username"
  />
</template>

<script setup>
import { ref } from 'vue'

const username = ref('')
</script>
```

### Number Validation

```vue
<template>
  <BaseInput
    v-model="age"
    type="number"
    :rules="[
      'required',
      { minValue: 18 },
      { maxValue: 120 }
    ]"
    label="Age"
  />
</template>

<script setup>
import { ref } from 'vue'

const age = ref('')
</script>
```

### Validation with Regex

```vue
<template>
  <BaseInput
    v-model="phone"
    :rules="[
      'required',
      {
        pattern: /^\(\d{2}\) \d{4,5}-\d{4}$/,
        message: 'Format: (00) 00000-0000'
      }
    ]"
    label="Phone"
  />
</template>

<script setup>
import { ref } from 'vue'

const phone = ref('')
</script>
```

## Advanced Customization

### Messages by Language

You can create an internationalization system:

```javascript
// i18n/validations/pt-BR.js
export default {
  required: 'Este campo é obrigatório',
  email: 'Email inválido',
  min: (min) => `Mínimo ${min} caracteres`,
  max: (max) => `Máximo ${max} caracteres`,
  minValue: (min) => `Valor mínimo: ${min}`,
  maxValue: (max) => `Valor máximo: ${max}`,
}

// i18n/validations/en-US.js
export default {
  required: 'This field is required',
  email: 'Invalid email',
  min: (min) => `Minimum ${min} characters`,
  max: (max) => `Maximum ${max} characters`,
  minValue: (min) => `Minimum value: ${min}`,
  maxValue: (max) => `Maximum value: ${max}`,
}

// main.js
import { useValidationConfig } from 'vue-smart-ui'
import ptBR from './i18n/validations/pt-BR'
import enUS from './i18n/validations/en-US'

const { setValidationMessages } = useValidationConfig()

const currentLanguage = 'pt-BR' // or 'en-US'
const messages = currentLanguage === 'pt-BR' ? ptBR : enUS

setValidationMessages(messages)
```

### Listening to Validation Events

```vue
<template>
  <BaseInput
    v-model="email"
    :rules="['required', 'email']"
    @validation="handleValidation"
    label="Email"
  />
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')

const handleValidation = ({ valid, error }) => {
  console.log('Valid?', valid)
  console.log('Error:', error)
}
</script>
```

### Programmatic Validation

```vue
<template>
  <BaseInput
    v-model="email"
    :rules="['required', 'email']"
    @mounted="handleMounted"
    label="Email"
  />
  
  <button @click="validateManually">Validate</button>
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')
const inputInstance = ref(null)

const handleMounted = (instance) => {
  inputInstance.value = instance
}

const validateManually = () => {
  if (inputInstance.value) {
    const isValid = inputInstance.value.validate()
    console.log('Field valid?', isValid)
  }
}
</script>
```

## 🎯 Tips and Best Practices

1. **Configure messages globally** in `main.js` to avoid repetition
2. **Use built-in validators** whenever possible
3. **Combine multiple rules** for complex validations
4. **Clear messages** help users correct errors
5. **Progressive validation** provides better UX
6. **Custom validators** for specific business rules

## 🐛 Troubleshooting

### Messages are not changing

- Check if `setValidationMessages()` is being called **before** the app mount
- Make sure to import `useValidationConfig` correctly

### Validation is not working

- Check if the `:rules` prop is defined
- Confirm that `validate-on-blur` is not set to `false`
- Check the console for validation errors

### English messages still appear

- Default messages are in English
- Configure with `setValidationMessages()` to change
- Check if the configuration is being applied before the component renders

---

**Need help?** Open an issue in the repository! 🚀
