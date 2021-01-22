// Firebase
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin'
// External Libraries
import fetch from 'node-fetch'
// Project type definitions & constants
import {
    RewardItem,
    updateTopicSubscriptionData,
    RewardHistoryItem,
    RewardHistory,
} from '../../common/interfaces'
import {
    SITE_URL,
    RUN_SCHEDULE,
    STORE_LOCATIONS,
} from '../../common/contants'

// Initialize Firebase Services
admin.initializeApp();

// Function container runtime specifications
const RUN_OPTS: functions.RuntimeOptions = {
    memory: '128MB', 
    timeoutSeconds: 15,
}

// Structure for the JSON object retrieved from the REWARDS_URL page
interface embeddedResponsesType {
    api_reward_list: { 
        data: { 
            items: RewardItem[];
        };
    };
}

/**
 * Scrapes the My Nintendo Rewards webpage to generate a current list of available
 * Reward Items.
 * 
 * @param categoryName The naming convention for a region's Nintendo Store items.
 * 
 * @returns {Promise<RewardItemp[]} The stripped-down Nintendo Store Reward items
*/
const getRewardsList = async(categoryName: string): Promise<RewardItem[]> => {

    // The URL containing the RewardItem data
    const REWARDS_URL = 'https://my.nintendo.com/reward_categories';

    const webpageData = await fetch(REWARDS_URL)
    const webpageText = await webpageData.text()

    // Get line containing "embeddedResponses: "
    const match = webpageText.match(/embeddedResponses: (.*)/g)
    if( !match )
        throw new Error("No matches for embeddedResponses")
    const rewardsLine = match[0]

    // Remove "JSON.parse(NEEDED_OBJECT)," enclosing NEEDED_OBJECT
    const strippedLine = rewardsLine.replace(/(^.*JSON.parse\()|(\),$)/g, '')

    // Convert escaped JSON string to normal JSON string
    const embeddedResponsesStr = JSON.parse(strippedLine)
    // Convert normal JSON string to JS Object
    const embeddedResponses: embeddedResponsesType = JSON.parse(embeddedResponsesStr)

    // Filter out all but nintendo_store items. Remove unneeded data to reduce bandwidth as 
    // original object contains much more than just RewardItem properties
    const nintendo_store_rewards: RewardItem[] = embeddedResponses.api_reward_list.data.items
        .filter( (item: RewardItem) => item.category === categoryName )
        .map( ({ title, category, type, id, beginsAt, endsAt, stock, points, links, images }): RewardItem => {
            return { title, category, type, id, beginsAt, endsAt, stock, points, links, images }
        })

    return nintendo_store_rewards;

};

/**
 * Syncs the Firestore database with the current My Nintendo Rewards items for the US region.
 * 
 * @param {functions.RuntimeOptions} RUN_OPTS The runtime specs of the function
 * @param {string} region The region the function will run in
 * @param {number} RUN_SCHEDULE What minute interval the function will be run
 */
export const rewardsSync_US = functions
    .runWith(RUN_OPTS)
    .region(STORE_LOCATIONS.US.region)
    .pubsub.schedule(`every ${RUN_SCHEDULE} minutes`).onRun( async (context) => {

        const rewardList: RewardItem[] = await getRewardsList(STORE_LOCATIONS.US.categoryName);

        const currentTimestamp = Date.now()

        const db = admin.firestore();

        // Update current reward data
        await db.collection('rewards').doc('US').set({
            lastUpdatedAt: currentTimestamp,
            rewards: rewardList,
        })

        // Update reward stock history
        const rewardHistoryRef = db.collection('rewards-history').doc('US')
        const rewardHistoryDoc = await rewardHistoryRef.get()
        const rewardHistoryData = rewardHistoryDoc.data()

        // Default to empty if no previous rewards for this region
        const rewardHistory: RewardHistory = rewardHistoryData?.rewardHistory || {}

        // Add stock values for each current reward item
        rewardList.forEach( (item: RewardItem) => {

            const newHistoryItem: RewardHistoryItem = {
                timestamp: currentTimestamp,
                stock: item.stock.remains,
            }

            if( rewardHistory[item.id] ) {
                // only add new history items if the stock amount has changed
                if( rewardHistory[item.id][rewardHistory[item.id].length - 1].stock !== newHistoryItem.stock ) {
                    rewardHistory[item.id].push(newHistoryItem)
                }
            }
            else {
                // If item is new, initialize new list
                rewardHistory[item.id] = [newHistoryItem]
            }
        })

        // Remove all items not present in the current reward list
        Object.keys(rewardHistory).forEach( id => {
            rewardList.find( item => item.id === id) || delete rewardHistory[id]
        })

        // Save updated reward history
        await rewardHistoryRef.set({
            rewardHistory,
        })
        
        return null;
})

/**
 * Sends a topic notification if new rewards are detected
 */
export const sendNotificationOnNewRewards = functions
    .runWith(RUN_OPTS)
    .firestore.document('rewards/{locationId}')
    .onUpdate((change, context) => {

        const oldRewardsData = change.before.data();
        const newRewardsData = change.after.data();

        const oldRewardIds: number[] = oldRewardsData.rewards.map( (rewardItem: RewardItem) => rewardItem.id)
        const newRewardIds: number[] = newRewardsData.rewards.map( (rewardItem: RewardItem) => rewardItem.id)

        for( const newId of newRewardIds) {
            if( ! oldRewardIds.includes(newId) ) {
                // If we find an item that was not in the previous list, it is new. Send
                // a topic notification.
                const message: admin.messaging.Message = {
                    topic: 'new-rewards-' + context.params.locationId,
                    notification: {
                        title: `New ${context.params.locationId} Rewards`,
                        body: 'Check the site for new or restocked rewards',
                    },
                    webpush: {
                        notification: {
                            requireInteraction: true,
                        },
                        fcmOptions: {
                            link: SITE_URL,
                        },
                    },
                }
                return admin.messaging().send(message)
            }
        }

        return null
    
    });

/**
 * Adds or removes a device from a notification topic.
 * 
 * @param {string} registrationToken The device's identifying token
 * @param {string} topic The topic associated with the subscription
 * @param {string} location The store region
 * @param {'subscribe' | 'ubsubscribe'} action Whether the request will subscribe or unsubscribe form the topic
 */
export const updateTopicSubscription = functions
    .runWith(RUN_OPTS)
    .https.onCall( async (data, context) => {

        const { 
            registrationToken, 
            topic, 
            location, 
            action,
        }: updateTopicSubscriptionData = data;

        // Ensure location exists
        if( ! STORE_LOCATIONS[location] )
            throw new functions.https.HttpsError(
                'failed-precondition', 
                'The location does not exist.',
            );

        // Ensure topic is valid
        const allowedTopics = ['new-rewards']
        if( ! allowedTopics.includes(topic) )
            throw new functions.https.HttpsError(
                'failed-precondition', 
                'The topic does not exist.',
            );

        const topicId = topic + '-' + location

        switch(action) {
            case 'subscribe': {
                return admin.messaging().subscribeToTopic(registrationToken, topicId)
            }
            case 'unsubscribe': {
                return admin.messaging().unsubscribeFromTopic(registrationToken, topicId)
            }
            default: {
                throw new functions.https.HttpsError(
                    'failed-precondition', 
                    'An invalid action was provided.',
                );
            }
        }

})