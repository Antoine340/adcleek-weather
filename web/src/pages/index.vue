<script setup lang="ts">
import CitiesTable from '../components/CitiesTable.vue'

// Force light mode - remove dark class if it exists
if (typeof document !== 'undefined') {
  document.documentElement.classList.remove('dark')
}

defineOptions({
  name: 'IndexPage',
})
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold text-gray-900">Weather Dashboard</h1>
        <p class="mt-2 text-sm text-gray-600">Manage French cities and view weather forecasts</p>
      </div>
    </header>

    <main class="py-8">
      <CitiesTable />
    </main>
  </div>
</template>

<route lang="yaml">
meta:
  layout: home
</route>
