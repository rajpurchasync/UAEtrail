/** Host-submitted rider scores on completed rideshare outings (1–5 each). */
export type RideshareRiderRatingDimensionsDTO = {
  cleanliness: number;
  punctuality: number;
  behaviour: number;
  payment?: number | null;
};

export type RideshareRiderReputationDTO = {
  ratingCount: number;
  overallScore: number;
  averages: RideshareRiderRatingDimensionsDTO;
};
