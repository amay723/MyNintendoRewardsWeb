// LOCATIONS
export type countryCode = 'US'

type storeLocationsData = {
    name: string;
    categoryName: string;
    region: string;
}

export type storeLocationsType = { 
    [key in countryCode]: storeLocationsData;
};

// TOPICS
export interface updateTopicSubscriptionData {
    registrationToken: string;
    topic: 'new-rewards';
    location: countryCode;
    action: 'subscribe' | 'unsubscribe'
}

// REWARD ITEM
export interface RewardItem {
    title: string;
    category: string;
    type: string;
    id: string;
    beginsAt: number;
    endsAt: number;
    stock: { 
      remains: number; 
      total: number; 
    };
    points: { 
      amount: number; 
      category: 'platinum' | 'gold';
    }[];
    links: { 
      myNintendo: { 
        href: string; 
      }; 
    };
    images: { 
      default: { 
        url: string; 
      }; 
    };
  };