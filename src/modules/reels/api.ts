import api from '../../services/api';
import { IPaginatedResponse } from '../../types';
import { IReel, IReelFilters } from './types';

export const DEFAULT_REELS_LIMIT = 12;

export const listReels = async (
  filters: IReelFilters = {},
): Promise<IPaginatedResponse<IReel[]>> => {
  const { page = 1, limit = DEFAULT_REELS_LIMIT } = filters;
  const response = await api.get('/reels', {
    params: { page, limit },
  });
  return response.data;
};

/** Payload returned inside the like-toggle envelope's `data` field. */
export interface ILikeReelResult {
  likes: number;
}

/**
 * Toggle a reel's like. `liked: true` increments, `liked: false` decrements
 * (server floors at 0). No auth — per-device liked state is the client's job.
 * The server wraps the result as `{ success, data: { likes }, ... }`, so we
 * unwrap `.data.data` to hand back just the fresh count.
 */
export const likeReel = async (reelId: string, liked: boolean): Promise<ILikeReelResult> => {
  const response = await api.post(`/reels/${reelId}/like`, { liked });
  return response.data.data;
};
