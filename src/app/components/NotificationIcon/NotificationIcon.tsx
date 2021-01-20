import { useState } from 'react'
import { Modal, Button } from 'react-bootstrap'
import { analytics, functions, messaging } from '../../firebase'
import { 
    SUBSCRIBED_TOPICS_STORAGE_NAME,
    RATE_LIMIT_TIMESTAMPS,
    RATE_LIMIT_CALL_NUMBER,
    RATE_LIMIT_PERIOD_SECONDS
} from '../../../common/contants'
import {
    countryCode,
    updateTopicSubscriptionData
} from '../../../common/interfaces'
import './NotificationIcon.css'


interface Props {
    storeSelectorRef: React.RefObject<HTMLSelectElement>;
}

const NotificationIcon: React.FC<Props> = ({ storeSelectorRef }) => {

    // Modal
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    // Topic Subscription
    const [subscribedTopics, setSubscribedTopics] = useState(localStorage.getItem(SUBSCRIBED_TOPICS_STORAGE_NAME) || "[]")
    const [isLoading, setIsLoading] = useState(false)

    // Update subscribedTopics state along with localstorage
    const setSubscribedTopicsWithLocalStorage = (updatedTopics: string[]) => {
        const updatedTopicsStr = JSON.stringify(updatedTopics)
        localStorage.setItem(SUBSCRIBED_TOPICS_STORAGE_NAME, updatedTopicsStr)
        setSubscribedTopics(updatedTopicsStr)
    }

    // Topic component globals
    const topic: updateTopicSubscriptionData['topic'] = "new-rewards"
    const location = storeSelectorRef.current?.value as countryCode
    const TOPIC_ID = topic + '-' + location

    // Will initiate a browser Notification request if not already done. Will then
    // toggle notifications for the selected topic if notifications allowed.
    const subscribeToTopic = () => {

        if( messaging === null ) {
            alert('Your browser does not support web push notifications')
            return
        }

        // Will prompt the user for notification permissions if not already set
        messaging.getToken({ vapidKey: process.env.REACT_APP_MESSAGING_KEY_CERTS })
            .then( currentToken => {

                setIsLoading(true)

                // Check if currently selected location has notifications set
                const updatedTopics: string[] = JSON.parse(subscribedTopics)
                const topicIdx = updatedTopics.indexOf(TOPIC_ID)

                // Log event for analytics
                analytics.logEvent('notification_click', {
                    topic,
                    location,
                    action: topicIdx === -1 ? 'subscribe' : 'unsubscribe'
                })
                
                // Send server user subscribe request
                const updateTopicSubscription = functions.httpsCallable('updateTopicSubscription');
                const data: updateTopicSubscriptionData = {
                    registrationToken: currentToken,
                    topic,
                    location,
                    action: topicIdx === -1 ? 'subscribe' : 'unsubscribe'
                }
                
                updateTopicSubscription(data).then( () => {
                    // Store/Remove topic from localstorage
                    topicIdx === -1 ? updatedTopics.push(TOPIC_ID) : updatedTopics.splice(topicIdx, 1)
                    setSubscribedTopicsWithLocalStorage(updatedTopics)
                }).catch( err => {
                    alert("Error subscribing to notifications")
                    console.error(err);
                }).finally( () => {
                    setIsLoading(false)
                })
            })
            .catch( err => {
                alert('Notifications for this site have been blocked')
            })
    }

    // Local rate limiting for notification clicks
    const subscribeToTopicWithRate = () => {
        // Record this click's timestamp into the overall click history array
        const currentTimestamp = Date.now()
        RATE_LIMIT_TIMESTAMPS.push(currentTimestamp)

        // Check if RATE_LIMIT_CALL_NUMBER is exceeded
        const lengthExceeded = RATE_LIMIT_TIMESTAMPS.length >= RATE_LIMIT_CALL_NUMBER

        // Check if oldest recorded click in history array is within RATE_LIMIT_PERIOD_SECONDS
        const elapsedTimeSinceOldest = (currentTimestamp-RATE_LIMIT_TIMESTAMPS[0])/1000
        const oldestTimeTooRecent = elapsedTimeSinceOldest < RATE_LIMIT_PERIOD_SECONDS

        // remove oldest time if list is full
        if( lengthExceeded )
            RATE_LIMIT_TIMESTAMPS.splice(0,1)

        // Only perform a topic subscription if the click rate was not exceeded
        if( lengthExceeded && oldestTimeTooRecent )
            alert('Please slow it down :)')
        else
            subscribeToTopic()
    }

    return ( 
        <>
            { isLoading ?
                <i className="material-icons bell-loader">
                    <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true"></span>
                    <span className="sr-only">Loading...</span>
                </i> :
                <i onClick={subscribeToTopicWithRate} className="material-icons bell" title="Toggle Notifications">
                    { JSON.parse(subscribedTopics).includes(TOPIC_ID) ? 'notifications_active' : 'notifications_none' }
                </i>
            }

            <i onClick={handleShow} className="material-icons help" title="Notification Info">info</i>

            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Notifications</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>Clicking on the Notifications Bell will register you to receive notifications whenever new items are available in the <strong>My Nintendo Rewards Store</strong> for the selected region.</p>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default NotificationIcon