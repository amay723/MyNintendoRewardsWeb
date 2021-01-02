import { useState, useRef } from 'react'
import Toasts from './components/Toasts/Toasts'
import NotificationIcon from './components/NotificationIcon/NotificationIcon'
import RewardItems from './components/RewardItems/RewardItems'
import Footer from './components/Footer/Footer'
import { countryCode } from '../common/interfaces'
import { 
  RUN_SCHEDULE, 
  REWARD_LOCATION_STORAGE_NAME,
  STORE_LOCATIONS 
} from '../common/contants'
import './App.css';


const App = () => {

  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [storeLocation, setStoreLocation] = useState(localStorage.getItem(REWARD_LOCATION_STORAGE_NAME))

  const storeSelectorRef = useRef<HTMLSelectElement>(null)

  const handleLocationSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocationValue = e.target.value
    localStorage.setItem(REWARD_LOCATION_STORAGE_NAME, newLocationValue)
    setStoreLocation(newLocationValue)
  }

  return (
    <>
      <div className="App">
        <Toasts />

        <h2 className="updated-title">
          Last Updated At: { lastUpdated ? new Date(lastUpdated).toLocaleString() : "loading..."}
        </h2>
          
        <p><em>*updates every {RUN_SCHEDULE} minutes</em></p>
        
        <div className="store-bar">
          <select 
            className="custom-select"
            ref={storeSelectorRef} 
            defaultValue={storeLocation || ''} 
            onChange={handleLocationSelect}>

              <option disabled>Choose Store Location...</option>
              { Object.keys(STORE_LOCATIONS).map( locationId => (
                  <option key={locationId} value={locationId}>
                    {STORE_LOCATIONS[locationId as countryCode].name}
                  </option>
                ))
              }

          </select>

          <NotificationIcon storeSelectorRef={storeSelectorRef} />
          
        </div>

        <RewardItems 
          setLastUpdated={setLastUpdated}
          storeLocation={storeLocation}
          storeSelectorRef={storeSelectorRef}
        />

      </div>

      <Footer />

    </>
  );
}

export default App;
