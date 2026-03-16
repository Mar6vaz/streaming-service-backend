import axios from 'axios';
import { ISubscriptionResponse } from '../types';

const SUBSCRIPTION_URL = process.env.SUBSCRIPTION_SERVICE_URL ?? 'http://localhost:8004';

const PLAN_QUALITY_MAP: Record<string, '480p' | '720p' | '1080p'> = {
  basic: '480p',
  standard: '720p',
  premium: '1080p',
};

export const getUserSubscription = async (
  userId: string,
  authToken: string
): Promise<ISubscriptionResponse> => {
  try {
    const response = await axios.get(`${SUBSCRIPTION_URL}/subscriptions/user/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 3000,
    });

    const { status, plan } = response.data;
    const isActive: boolean = status === 'active';
    const planName = (plan?.name ?? 'basic').toLowerCase();
    const maxQuality = PLAN_QUALITY_MAP[planName] ?? '480p';

    return { active: isActive, plan: planName, maxQuality };
  } catch {
    console.error('⚠️  Error consultando Subscription Service');
    return { active: true, plan: 'premium', maxQuality: '1080p' };
  }
};

export { PLAN_QUALITY_MAP };