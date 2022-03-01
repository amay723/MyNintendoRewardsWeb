// Firebase
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin'

// External Libraries
import fetch from 'node-fetch'
import * as cheerio from 'cheerio';

// Project type definitions & constants
import {
    RewardItem,
    updateTopicSubscriptionData,
    NextProps,
    NewRewardItem,
} from '../../common/interfaces'
import {
    SITE_URL,
    RUN_SCHEDULE,
    STORE_LOCATIONS,
} from '../../common/contants'

// Proxy requests
const HttpsProxyAgent = require('https-proxy-agent');
const url = require('url')

// Initialize Firebase Services
admin.initializeApp();

// Function container runtime specifications
const RUN_OPTS: functions.RuntimeOptions = {
    memory: '128MB', 
    timeoutSeconds: 15,
}

/**
 * Scrapes the My Nintendo Rewards webpage to generate a current list of available
 * Reward Items.
 * 
 * @param {string | null}   proxy           Which proxy data to use from the Firebase Functions config.
 * 
 * @returns {Promise<NewRewardItem[]}          The Nintendo Store Reward items
*/
const getRewardsList = async( proxy: string | null ): Promise<NewRewardItem[]> => {

    // The URL containing the RewardItem data
    const REWARDS_URL = 'https://www.nintendo.com/store/exclusives/rewards/';

    // Attempt to bypass any restrictions/rate limiting from Nintendo
    const userAgents: string[] = [
        // Desktop
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9',
        'Mozilla/5.0 (X11; CrOS x86_64 8172.45.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.64 Safari/537.36',
        // Mobile
        'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 8.0.0; SM-G960F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.84 Mobile Safari/537.36',
    ]

    // Setup proxy for different region stores
    let proxyAgent = null;
    if( proxy ) {
        const {
            username,
            password,
            ip,
            port,
        } = functions.config()[proxy]

        const proxyOpts = url.parse(`http://${ip}:${port}`);
        proxyOpts.auth = `${username}:${password}`;

        proxyAgent = new HttpsProxyAgent(proxyOpts)
    }

    // Fetch page content
    const webpageData = await fetch( REWARDS_URL, {
        agent: proxyAgent,
        headers: {
            'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
        },
    })
    const webpageText = await webpageData.text()


    // Parse page html
    const $ = cheerio.load(webpageText)

    // Find element with __NEXT_DATA__ id, interpret contents as our reward item data
    const nextPropsText = $('#__NEXT_DATA__').contents()
    const nextPropsData: NextProps = JSON.parse(nextPropsText.text())

    const rewardItems = nextPropsData.props.pageProps.page.content.merchandisedGrid[0]
    if( !rewardItems )
        throw new Error("Unable to fetch reward items")

    return rewardItems;

};

/**
 * Syncs the Firestore database with the current My Nintendo Rewards items for the US region.
 * 
 * @param {functions.RuntimeOptions} RUN_OPTS The runtime specs of the function
 * @param {string} region The region the function will run in
 * @param {number} RUN_SCHEDULE What minute interval the function will be run
 */
export const updateRewards = functions
    .runWith(RUN_OPTS)
    .pubsub.schedule(`every ${RUN_SCHEDULE} minutes`)
    .onRun( async (context) => {

        const rewardList: NewRewardItem[] = await getRewardsList(STORE_LOCATIONS.US.proxy);

        if( rewardList.length === 0 )
            return

        const currentTimestamp = Date.now()

        const db = admin.firestore();

        // Update current reward data
        await db.collection('rewards').doc('US').set({
            lastUpdatedAt: currentTimestamp,
            rewards: rewardList,
        })
})

/**
 * Determines whether to send notifications when changes in the reward database is detected
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
                // return sendNotifications(context.params.locationId)
                console.log("New reward found:", newId)
            }
        }

        return null
    
});

/**
 * Sends new rewards push notifications for the specified region
 * @param {string} locationId The 2 character country code for the specified store region
 */
// @ts-ignore
const sendNotifications = async (locationId: string) => {

        const pushTopic = `new-rewards-${locationId}`
        const pushTitle = `New ${locationId} Rewards`
        const pushBody = 'Check My Nintendo for new or restocked rewards'

        // FCM
        const fcmNotification = admin.messaging().send({
            topic: pushTopic,
            notification: {
                title: pushTitle,
                body: pushBody,
            },
            webpush: {
                notification: {
                    requireInteraction: true,
                },
                fcmOptions: {
                    link: SITE_URL,
                },
            },
        })


        // SPONTIT
        const spontitNotification = fetch('https://api.spontit.com/v3/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Authorization': functions.config().spontit.api_key,
                'X-UserId': functions.config().spontit.username,
            },
            body: JSON.stringify({
                "channelName": `mynintendorewards${locationId.toLowerCase()}`,
                "pushTitle": pushTitle,
                "content": pushBody,
                "link": SITE_URL,
                "openLinkInApp": false,
            }),
        })


        return await Promise.all([fcmNotification, spontitNotification])
};

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