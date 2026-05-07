import { Subscription } from '../../types';

export interface BuildMihomoOptions {
  secret: string;
  subscriptions: Subscription[];
  customProxies: string;
  customProxyNames: string[];
  ghProxy?: string | null;
  isStash: boolean;
  isWhite: boolean;
  isBlack: boolean;
  isDual: boolean;
}
