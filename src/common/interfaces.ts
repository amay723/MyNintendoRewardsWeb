// LOCATIONS
export type countryCode = 'US' | 'GB' | 'CA'

type storeLocationsData = {
    name: string;
    categoryName: string;
    proxy: string | null;
    enabled: boolean;
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
      available: boolean;
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

// Reward History
export type RewardHistoryItem = {
  timestamp: number;
  stock: number;
}
export interface RewardHistory {
  [id: string]: RewardHistoryItem[];
}

export interface NewRewardItem {
  CONTENT_TYPE: string;
  sku: string;
  name: string;
  urlKey: string;
  categories: string[];
  platinumPoints: string;
  productImage: {
    publicId: string;
  }
}

export interface NextProps {
  props: {
    pageProps: {
      page: {
        content: {
          merchandisedGrid: {
            0: NewRewardItem[]
          };
        };
      };
    }
  }
}