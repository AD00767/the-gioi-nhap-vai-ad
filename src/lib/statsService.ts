import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { reconcileFollowerCount } from './followService';

export interface CreatorStats {
  characterCount: number;
  promptCount: number;
  followerCount: number;
}

/**
 * Calculates exact real-time character, prompt, and follower counts for a creator
 * and updates the creator's user document if out of sync.
 */
export async function getExactCreatorStats(creatorId: string): Promise<CreatorStats> {
  if (!creatorId) {
    return { characterCount: 0, promptCount: 0, followerCount: 0 };
  }

  try {
    // 1. Query characters count
    const charsQuery = query(
      collection(db, 'characters'),
      where('creatorId', '==', creatorId)
    );
    const charsSnap = await getDocs(charsQuery);
    const characterCount = charsSnap.docs.filter(d => !d.data().deletedAt).length;

    // 2. Query prompts count (handling authorId or creatorId)
    const promptsQuery = query(
      collection(db, 'prompts'),
      where('authorId', '==', creatorId)
    );
    const promptsSnap = await getDocs(promptsQuery);
    let promptCount = promptsSnap.docs.filter(d => !d.data().deletedAt).length;

    // Fallback if legacy prompts used creatorId instead of authorId
    if (promptCount === 0) {
      const legacyPromptsQuery = query(
        collection(db, 'prompts'),
        where('creatorId', '==', creatorId)
      );
      const legacySnap = await getDocs(legacyPromptsQuery);
      const legacyCount = legacySnap.docs.filter(d => !d.data().deletedAt).length;
      if (legacyCount > promptCount) promptCount = legacyCount;
    }

    // 3. Reconcile followers count
    const followerCount = await reconcileFollowerCount(creatorId);

    // 4. Update user doc if counts differ
    try {
      const userRef = doc(db, 'users', creatorId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (
          data.characterCount !== characterCount ||
          data.promptCount !== promptCount ||
          data.followerCount !== followerCount
        ) {
          await updateDoc(userRef, {
            characterCount,
            promptCount,
            followerCount
          });
        }
      }
    } catch (updateErr) {
      console.warn("Non-fatal: Failed to update creator stats in user doc:", updateErr);
    }

    return { characterCount, promptCount, followerCount };
  } catch (error) {
    console.warn("Notice: Unable to get exact creator stats (using default/cached):", error);
    return { characterCount: 0, promptCount: 0, followerCount: 0 };
  }
}
