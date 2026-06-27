export const FACTORY_ABI = [
  "function createCampaign(string title, string description, string metadataUri, uint256 fundingGoal, uint256 fundingDeadline, uint256 refundRatio, uint256 usableRatio, uint256 votingDuration) external returns (address)",
  "function createCommitmentCampaign(string title, string description, string metadataUri, uint256 fundingGoal, uint256 fundingDeadline, uint256 refundRatio, uint256 usableRatio, uint256 votingDuration, uint256 defectionRateBps, uint256[] cohortCaps) external returns (address)",
  "function getAllCampaigns() external view returns (tuple(address id, address developer, string title, uint256 fundingGoal, uint256 fundingDeadline, string metadataUri, uint8 launchMode)[])",
  "function getCampaignCount() external view returns (uint256)",
  "event CampaignCreated(address indexed campaign, address indexed developer, string title, uint8 launchMode)",
] as const;

export const CAMPAIGN_ABI = [
  "function title() external view returns (string)",
  "function description() external view returns (string)",
  "function metadataUri() external view returns (string)",
  "function developer() external view returns (address)",
  "function fundingGoal() external view returns (uint256)",
  "function fundingDeadline() external view returns (uint256)",
  "function refundRatio() external view returns (uint256)",
  "function usableRatio() external view returns (uint256)",
  "function votingDuration() external view returns (uint256)",
  "function status() external view returns (uint8)",
  "function totalInvested() external view returns (uint256)",
  "function totalUsableAllocated() external view returns (uint256)",
  "function totalUsableWithdrawn() external view returns (uint256)",
  "function getAvailableFunds() external view returns (uint256)",
  "function approvalPower() external view returns (uint256)",
  "function rejectionPower() external view returns (uint256)",
  "function votingDeadline() external view returns (uint256)",
  "function getInvestorPosition(address investor) external view returns (tuple(uint256 totalInvested, uint256 refundableAmount, uint256 usableAmount, bool hasVoted, uint256 voteChoice, bool refunded))",
  "function invest(uint256 amount) external",
  "function vote(uint256 choice) external",
  "function markFinished() external",
  "function openVotingAfterDeadline() external",
  "function finalizeCampaign() external returns (uint8)",
  "function withdrawAvailableFunds(uint256 amount) external",
  "function withdrawRemainingFunds() external returns (uint256)",
  "function claimRefund() external returns (uint256)",
  "function cancelCampaign() external",
] as const;

export const COMMITMENT_CAMPAIGN_ABI = [
  ...CAMPAIGN_ABI,
  "function defectionRateBps() external view returns (uint256)",
  "function currentCohort() external view returns (uint256)",
  "function penaltyPool() external view returns (uint256)",
  "function getCohortInfo() external view returns (uint256[] caps, uint256[] filled, uint256 activeCohort)",
  "function exitEarly() external",
] as const;

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
] as const;
