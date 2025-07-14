<script setup lang="ts">
import type { City, WeatherResponse } from '@weather-app/shared'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { onMounted, ref } from 'vue'
import { useApi } from '~/composables/useApi'

const { useCities } = useApi()
const { data, loading, error, fetchCities, addCity, clearError } = useCities()

const newCityInsee = ref('')
const selectedCity = ref<City | null>(null)
const selectedWeather = ref<WeatherResponse | null>(null)
const weatherLoading = ref(false)
const weatherError = ref<string | null>(null)

function formatPopulation(population: number): string {
  return new Intl.NumberFormat('en-US').format(population)
}

async function refreshCities() {
  await fetchCities()
}

async function handleAddCity() {
  if (!newCityInsee.value.trim()) {
    return
  }

  await addCity({ insee: newCityInsee.value.trim() })
  newCityInsee.value = '' // Clear form on success
}

async function selectCity(city: City) {
  selectedCity.value = city
  await fetchWeatherForCity(city.insee)
}

async function fetchWeatherForCity(insee: string) {
  weatherLoading.value = true
  weatherError.value = null
  selectedWeather.value = null

  try {
    const response = await fetch(`http://localhost:3000/weather/${insee}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    selectedWeather.value = await response.json()
  }
  catch (err) {
    weatherError.value = err instanceof Error ? err.message : 'Failed to fetch weather'
    console.error('Error fetching weather:', err)
  }
  finally {
    weatherLoading.value = false
  }
}

function formatTemperature(temp: number): string {
  return `${Math.round(temp)}°C`
}

function getWeatherIcon(weatherCode: number): string {
  // Map weather codes to Bootstrap Icons
  // Based on common weather code standards
  if (weatherCode <= 1) {
    return 'bi-sun' // Clear sky
  }
  if (weatherCode <= 3) {
    return 'bi-cloud-sun' // Partly cloudy
  }
  if (weatherCode <= 48) {
    return 'bi-clouds' // Cloudy/foggy
  }
  if (weatherCode <= 67) {
    return 'bi-cloud-drizzle' // Drizzle/light rain
  }
  if (weatherCode <= 77) {
    return 'bi-cloud-rain' // Rain
  }
  if (weatherCode <= 82) {
    return 'bi-cloud-rain-heavy' // Heavy rain
  }
  if (weatherCode <= 86) {
    return 'bi-cloud-snow' // Snow
  }
  if (weatherCode <= 99) {
    return 'bi-cloud-lightning-rain' // Thunderstorm
  }
  return 'bi-question-circle' // Unknown
}

function getDayLabel(index: number): string {
  const labels = ['Aujourd\'hui', 'Demain', 'Après-demain', 'J+3']
  return labels[index] || `J+${index}`
}

onMounted(() => {
  fetchCities()
})
</script>

<template>
  <div class="max-w-7xl mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">
        French Cities
      </h2>
      <button
        :disabled="loading"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="refreshCities"
      >
        {{ loading ? 'Loading...' : 'Refresh' }}
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex justify-between items-center">
      <div>
        <strong>Error:</strong> {{ error }}
      </div>
      <button
        @click="clearError"
        class="text-red-600 hover:text-red-800 font-bold"
        title="Dismiss error"
      >
        ×
      </button>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Cities Table (Left Side) -->
      <div class="lg:col-span-2">
        <!-- Loading State -->
        <div v-if="loading && !data" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>

        <!-- Cities Table -->
        <div v-else-if="data && data.length > 0" class="rounded-md border">
          <Table>
            <TableCaption>French cities with INSEE codes and population data. Click a row to view weather forecast.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[120px]">
                  INSEE Code
                </TableHead>
                <TableHead>City Name</TableHead>
                <TableHead class="w-[100px]">
                  Zipcode
                </TableHead>
                <TableHead class="text-right w-[120px]">
                  Population
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="city in data"
                :key="city.insee"
                class="cursor-pointer transition-colors hover:bg-gray-50"
                :class="selectedCity?.insee === city.insee ? 'bg-blue-50 border-blue-200' : ''"
                @click="selectCity(city)"
              >
                <TableCell class="font-mono text-sm">
                  {{ city.insee }}
                </TableCell>
                <TableCell class="font-medium">
                  {{ city.name }}
                </TableCell>
                <TableCell class="font-mono text-sm">
                  {{ city.zipcode }}
                </TableCell>
                <TableCell class="text-right font-medium">
                  {{ formatPopulation(city.population) }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <div class="text-gray-500 text-lg">
            No cities found
          </div>
          <p class="text-gray-400 mt-2">
            Try adding some cities using the API
          </p>
        </div>
      </div>

      <!-- Weather Forecast (Right Side) -->
      <div class="lg:col-span-1">
        <div class="sticky top-6">
          <!-- No City Selected -->
          <div v-if="!selectedCity" class="rounded-lg border bg-white shadow-sm p-6">
            <div class="text-center text-gray-500">
              <div class="text-lg font-medium mb-2">
                Prévisions météo
              </div>
              <p class="text-sm">
                Cliquez sur une ville pour voir ses prévisions sur 4 jours
              </p>
            </div>
          </div>

          <!-- Weather Loading -->
          <div v-else-if="weatherLoading" class="rounded-lg border bg-white shadow-sm p-6">
            <div class="text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" />
              <div class="text-lg font-medium">
                Chargement...
              </div>
              <p class="text-sm text-gray-500">
                {{ selectedCity.name }}
              </p>
            </div>
          </div>

          <!-- Weather Error -->
          <div v-else-if="weatherError" class="rounded-lg border bg-white shadow-sm p-6">
            <div class="text-center text-red-600">
              <div class="text-lg font-medium mb-2">
                Erreur de chargement
              </div>
              <p class="text-sm">
                {{ weatherError }}
              </p>
              <button
                class="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                @click="fetchWeatherForCity(selectedCity!.insee)"
              >
                Réessayer
              </button>
            </div>
          </div>

          <!-- Weather Data -->
          <div v-else-if="selectedWeather" class="rounded-lg border bg-white shadow-sm">
            <div class="p-6">
              <div class="text-lg font-semibold mb-1">
                {{ selectedCity.name }}
              </div>
              <div class="text-sm text-gray-500 mb-6">
                Prévisions sur 4 jours
              </div>

              <!-- Weather Cards Grid -->
              <div class="grid grid-cols-2 gap-4">
                <div
                  v-for="(day, index) in selectedWeather.forecast.slice(0, 4)"
                  :key="index"
                  class="bg-gray-50 rounded-lg p-4 text-center border"
                >
                  <!-- Weather Icon -->
                  <div class="mb-3">
                    <i
                      :class="getWeatherIcon(day.weather_code)"
                      class="text-3xl text-gray-700"
                    />
                  </div>

                  <!-- Day Label -->
                  <div class="text-xs text-gray-600 mb-2">
                    {{ getDayLabel(index) }}
                  </div>

                  <!-- Probability of Rain -->
                  <div class="mb-2">
                    <div class="text-xs text-gray-600 mb-1">
                      Probabilité de pluie
                    </div>
                    <div class="text-lg font-bold text-gray-800">
                      {{ day.rain_probability || 0 }}%
                    </div>
                  </div>

                  <!-- Temperature Range -->
                  <div class="flex justify-between items-center text-sm">
                    <div class="text-center">
                      <div class="text-xs text-gray-600">
                        Min
                      </div>
                      <div class="font-semibold text-gray-800">
                        {{ formatTemperature(day.tmin) }}
                      </div>
                    </div>
                    <div class="text-center">
                      <div class="text-xs text-gray-600">
                        Max
                      </div>
                      <div class="font-semibold text-gray-800">
                        {{ formatTemperature(day.tmax) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Weather Summary -->
              <div class="mt-6 p-4 bg-blue-50 rounded-lg">
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div class="font-medium text-blue-700">
                      Pluie totale
                    </div>
                    <div class="text-blue-900">
                      {{ selectedWeather.statistics?.rain_sum?.toFixed(1) ?? 'N/A' }}mm
                    </div>
                  </div>
                  <div>
                    <div class="font-medium text-blue-700">
                      Température moy.
                    </div>
                    <div class="text-blue-900">
                      {{ selectedWeather.statistics?.avg_temperature?.toFixed(1) ?? 'N/A' }}°C
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add New City Form -->
    <div class="mt-8 rounded-lg border bg-white shadow-sm">
      <div class="p-6">
        <h3 class="text-lg font-semibold leading-none tracking-tight mb-4">
          Ajouter une ville
        </h3>
        <form class="flex gap-4" @submit.prevent="handleAddCity">
          <input
            v-model="newCityInsee"
            type="text"
            placeholder="Code INSEE (ex: 75101)"
            pattern="[0-9]{5,6}"
            required
            class="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
          >
          <button
            type="submit"
            :disabled="loading"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-6 py-2"
          >
            {{ loading ? 'Ajout...' : 'Ajouter' }}
          </button>
        </form>
        <p class="text-sm text-gray-500 mt-2">
          Entrez un code INSEE français valide (5-6 chiffres)
        </p>
      </div>
    </div>
  </div>
</template>
