import { useState, useEffect } from 'react'
import { firestore } from '../../firebase'
import { RewardItem } from '../../../common/interfaces'
import RewardItemGraph from './RewardItemGraph'
import './RewardItems.css'


interface Props {
  setLastUpdated: React.Dispatch<React.SetStateAction<number | null>>;
  storeLocation: string | null;
  storeSelectorRef: React.RefObject<HTMLSelectElement>;
}

const RewardItems: React.FC<Props> = ({ setLastUpdated, storeLocation, storeSelectorRef }) => {

  // Modal
  const [show, setShow] = useState(false);
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null)
  const handleClose = () => setShow(false);
  const handleShow = (item: RewardItem) => {
    setSelectedReward(item)
    setShow(true)
  };

  const [rewards, setRewards] = useState<RewardItem[] | null>(null)

  useEffect( () => {
    const snapshotUnsubscribe = firestore.collection('rewards').doc(storeSelectorRef.current?.value)
      .onSnapshot( rewardDoc => {
        const data = rewardDoc.data()
        setLastUpdated(data ? data.lastUpdatedAt : null)
        setRewards(data ? data.rewards : [])
      })
    return snapshotUnsubscribe
    }, [setLastUpdated, storeLocation, storeSelectorRef])
  
  // Calculates whether an item was published within the last week
  const isNewItem = (itemBeginsAt: number) => {
    return (Date.now() / 1000 - itemBeginsAt) < 604800
  }

  return (
    <div className="card-group">

      <RewardItemGraph show={show} handleClose={handleClose} item={selectedReward} location={storeSelectorRef.current?.value} />
      
      { rewards !== null ?
        rewards.map( (item: RewardItem) => (
          <div className="card" key={item.id}>

            { isNewItem(item.beginsAt) &&
              <i className="new-item" />
            }

            <a href={item.links.myNintendo.href} target="_blank" rel="noreferrer noopener">
              <img className="card-img-top" src={item.images.default.url} alt={item.title} />
            </a>
            <div className="card-body">
              <h5 className="card-title">{item.title}</h5>

              <i onClick={ () => handleShow(item)} className="material-icons graph-icon" title="Open Stock History Graph">
                insert_chart_outlined
              </i>
              
            </div>
            <div className="card-footer">
              <small className={item.stock.remains === 0 ? "red" : ""}><strong>{`Stock: ${item.stock.remains}/${item.stock.total}`}</strong></small>
              <small className={item.points[0].category}><strong>{`Cost: ${item.points[0].amount}`}</strong></small>
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