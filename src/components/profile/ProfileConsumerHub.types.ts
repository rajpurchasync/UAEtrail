export type ProfileHubStat = {
  key: string;
  label: string;
  value: number | string;
  to?: string;
  onClick?: () => void;
};
