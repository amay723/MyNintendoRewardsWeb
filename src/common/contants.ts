import { storeLocationsType } from './interfaces'

// Used for FCM notification click links
export const SITE_URL = 'https://my-nintendo-rewards.web.app'

// How often the data will refresh
export const RUN_SCHEDULE: number = 10

// Local storage naming
export const LOCAL_STORAGE_BASE = "MY_NINTENDO_STORE"
export const REWARD_LOCATION_STORAGE_NAME = LOCAL_STORAGE_BASE + "_LOCATION"
export const SUBSCRIBED_TOPICS_STORAGE_NAME = LOCAL_STORAGE_BASE + "_SUBSCRIBED_TOPICS"

// Notification function call rate limits
export const RATE_LIMIT_TIMESTAMPS: number[] = []
export const RATE_LIMIT_CALL_NUMBER: number = 5
export const RATE_LIMIT_PERIOD_SECONDS: number = 30

// Control for app selector/notifications & functions sync logic
export const STORE_LOCATIONS: storeLocationsType = {
    US: {
        name: 'United States',
        categoryName: 'nintendo_store',
        proxy: null
    },
    CA: {
        name: 'Canada',
        categoryName: 'nintendo_store',
        proxy: 'proxy-canada'
    },
    GB: {
        name: 'United Kingdom',
        categoryName: 'my_nintendo_store',
        proxy: 'proxy-london'
    }    
}