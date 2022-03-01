import { useState, useEffect } from 'react'
import { firestore } from '../../firebase'
import { NewRewardItem } from '../../../common/interfaces'

import {
  NINTENDO_PRODUCT_PREFIX,
  NINTENTO_IMAGE_PREFIX
} from '../../../common/contants'

import './RewardItems.css'

interface Props {
  setLastUpdated: React.Dispatch<React.SetStateAction<number | null>>;
  storeLocation: string | null;
  storeSelectorRef: React.RefObject<HTMLSelectElement>;
}

const RewardItems: React.FC<Props> = ({ setLastUpdated, storeLocation, storeSelectorRef }) => {

  const [rewards, setRewards] = useState<NewRewardItem[] | null>(null)

  useEffect( () => {
    const snapshotUnsubscribe = firestore.collection('rewards').doc(storeSelectorRef.current?.value)
      .onSnapshot( rewardDoc => {
        const data = rewardDoc.data()
        setLastUpdated(data ? data.lastUpdatedAt : null)
        setRewards(data ? data.rewards : [])
      })
    return snapshotUnsubscribe
    }, [setLastUpdated, storeLocation, storeSelectorRef])

  return (
    <div className="card-group">
      
      { rewards !== null ?
        rewards.map( (item: NewRewardItem) => (
          <div className="card" key={item.sku}>

            <a
              href={ NINTENDO_PRODUCT_PREFIX + item.urlKey }
              target="_blank"
              rel="noreferrer noopener"
            >
              <img
                className="card-img-top"
                src={NINTENTO_IMAGE_PREFIX + item.productImage.publicId}
                alt={item.name}
              />
            </a>
            <div className="card-body">
              <h5 className="card-title">{item.name}</h5>
              
            </div>
            <div className="card-footer">
              <small className={true ? "text-success" : "red"}><strong>{ true ? "AVAILABLE" : "OUT OF STOCK"}</strong></small>
              <small className="platinum"><strong>{`Cost: ${item.platinumPoints}`}</strong></small>
            </div>
          </div> 
        )) :
        <div className="text-center loading-icon">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      }
    </div>
  )
}

export default RewardItems