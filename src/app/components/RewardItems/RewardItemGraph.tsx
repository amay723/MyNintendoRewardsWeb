import { useEffect, useState, lazy, Suspense } from 'react'
import { Modal, Button } from 'react-bootstrap'
import { firestore } from '../../firebase'
import { RewardHistoryItem, RewardItem } from '../../../common/interfaces';

// apexcharts library is huge, use code splitting to only load when needed
const Chart = lazy( () => import('react-apexcharts'))

interface RewardItemGraphProps {
    show: boolean;
    handleClose: () => void;
    item: RewardItem | null;
    location: string | undefined;
}

const RewardItemGraph: React.FC<RewardItemGraphProps> = ({item, location, show, handleClose}) => {

    const [stockData, setStockData] = useState<number[][]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect( () => {

      if( !item || !location )
        return

      setError(null)
            
      const snapshotUnsubscribe = firestore.collection('rewards-history').doc(location)
        .onSnapshot( historyDoc => {
          const historyDocData = historyDoc.data()

          if( !historyDocData ) {
            setError(`No item stock history available for ${location}`)
            return
          }

          // Get stock history for selected item
          const rewardHistory: RewardHistoryItem[] = historyDocData.rewardHistory[item.id]

          if( !rewardHistory ) {
            setError(`No stock history available for ${item.title}`)
            return
          }

          // Calculate timezone offset from UTC to local in milliseconds
          const timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000

          // Convert stock data to array list formatted for ApexCharts graph
          const data = rewardHistory.map( entry => [entry.timestamp - timezoneOffset, entry.stock])

          // Ensure the line fills up graph to current time
          data.push( [Date.now() - timezoneOffset, data[data.length-1][1]] )

          setStockData(data)
        })
      return snapshotUnsubscribe
    },[item, location])

    // Describing the line attributes
    const series = [{
      name: 'Stock',
      data: stockData
    }]

    // Appearence configurations for the graph
    const options = {
      chart: {
        id: 'area-datetime',
        type: 'area',
        height: 350,
        zoom: {
          autoScaleYaxis: true
        }
      },
      dataLabels: {
        enabled: false
      },
      markers: {
        size: 0,
        style: 'hollow',
      },
      xaxis: {
        type: 'datetime',
        tickAmount: 6,
        datetimeUTC: false,
      },
      yaxis: {
        title: {
          text: 'Stock'
        },
      },
      tooltip: {
        x: {
          format: 'dd MMM yyyy hh:mm TT'
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.9,
          stops: [0, 100]
        }
      },
      selection: 'all',
    }

    return (
      <Modal size="lg" show={show} onHide={handleClose}>
        <Modal.Header closeButton>
            <Modal.Title>{item?.title}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          { error ?
            error :
            <div id="graph">
              <Suspense fallback={<div>loading...</div>}>
                <Chart 
                  options={options}
                  series={series}
                  type="line"
                  height="300"
                />
              </Suspense>
            </div>
          }
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
              Close
          </Button>
        </Modal.Footer>
      </Modal>
    )
}

export default RewardItemGraph;