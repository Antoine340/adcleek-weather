import type { Cities, CreateCity, WeatherResponse } from '@weather-app/shared'
import type { Ref } from 'vue'

const API_BASE_URL = 'http://localhost:3000'

interface ApiState<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
}

export function useApi() {
  // Cities API
  const useCities = (): ApiState<Cities> & { fetchCities: () => Promise<void>, addCity: (city: CreateCity) => Promise<void>, clearError: () => void } => {
    const data = ref<Cities | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    const clearError = () => {
      error.value = null
    }

    const fetchCities = async () => {
      loading.value = true
      error.value = null

      try {
        const response = await fetch(`${API_BASE_URL}/cities`)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }
        const result = await response.json()
        data.value = result
      }
      catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to fetch cities'
        console.error('Error fetching cities:', err)
        // Don't clear existing data on error to keep app usable
      }
      finally {
        loading.value = false
      }
    }

    const addCity = async (city: CreateCity) => {
      loading.value = true
      error.value = null

      try {
        const response = await fetch(`${API_BASE_URL}/cities`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(city),
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }

        // Refresh cities list after successful add
        await fetchCities()
      }
      catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to add city'
        console.error('Error adding city:', err)
        // Auto-clear error after 5 seconds for better UX
        setTimeout(() => {
          error.value = null
        }, 5000)
      }
      finally {
        loading.value = false
      }
    }

    return {
      data,
      loading,
      error,
      fetchCities,
      addCity,
      clearError,
    }
  }

  // Weather API
  const useWeather = (insee: string): ApiState<WeatherResponse> & { fetchWeather: () => Promise<void>, clearError: () => void } => {
    const data = ref<WeatherResponse | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    const clearError = () => {
      error.value = null
    }

    const fetchWeather = async () => {
      loading.value = true
      error.value = null

      try {
        const response = await fetch(`${API_BASE_URL}/weather/${insee}`)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }
        data.value = await response.json()
      }
      catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to fetch weather'
        console.error('Error fetching weather:', err)
      }
      finally {
        loading.value = false
      }
    }

    return {
      data,
      loading,
      error,
      fetchWeather,
      clearError,
    }
  }

  return {
    useCities,
    useWeather,
  }
}
