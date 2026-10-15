/** Short line when accepted buddies are already on the outing roster. */
export const activityDetailFriendsGoingLabel = (
  buddyUserIdsOnActivity: string[] | null | undefined
): string | null => {
  const count = buddyUserIdsOnActivity?.length ?? 0;
  if (count <= 0) return null;
  return count === 1 ? '1 friend going' : `${count} friends going`;
};
