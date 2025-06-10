// contracts/GoApeMeCrowdfundingEscrow.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract GoApeMeCrowdfundingEscrow {
    // Platform configuration
    address public immutable PLATFORM_ADDRESS; // Your platform address
    uint256 public constant PLATFORM_FEE = 5; // 5%
    uint256 public constant CREATOR_SHARE = 95; // 95%
    uint256 public constant MAX_CAMPAIGN_DURATION = 30 days;
    
    enum CampaignStatus {
        Active,      // Campaign is running
        Successful,  // Goal reached, funds distributed
        Failed,      // Goal not reached, refunds available
        Withdrawn    // Creator has withdrawn funds
    }
    
    struct Campaign {
        uint256 id;
        address creator;
        string title;
        string description;
        string category;
        string ipfsCid;
        uint256 goal;                // Goal in Wei
        uint256 raised;              // Current amount in escrow
        uint256 deadline;            // Unix timestamp
        CampaignStatus status;
        uint256 createdAt;
        uint256 donorCount;
    }
    
    struct Donation {
        address donor;
        uint256 amount;
        uint256 timestamp;
        bool refunded;               // Track if refund was claimed
    }
    
    // State Variables
    uint256 public campaignCounter;
    uint256 public totalPlatformFees;
    
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => Donation[]) public campaignDonations;
    mapping(uint256 => mapping(address => uint256)) public donorAmounts;
    mapping(address => uint256[]) public creatorCampaigns;
    mapping(address => uint256[]) public donorCampaigns;
    
    // Events
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string title,
        uint256 goal,
        uint256 deadline
    );
    
    event DonationMade(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount,
        uint256 newTotal
    );
    
    event CampaignSuccessful(
        uint256 indexed campaignId,
        uint256 creatorAmount,
        uint256 platformFee
    );
    
    event CampaignFailed(uint256 indexed campaignId, uint256 totalRefundable);
    
    event RefundClaimed(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 refundAmount,
        uint256 platformFee
    );
    
    event FundsWithdrawn(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 amount
    );
    
    // Modifiers
    modifier validCampaign(uint256 _campaignId) {
        require(_campaignId > 0 && _campaignId <= campaignCounter, "Invalid campaign ID");
        _;
    }
    
    modifier onlyCreator(uint256 _campaignId) {
        require(campaigns[_campaignId].creator == msg.sender, "Only creator allowed");
        _;
    }
    
    modifier onlyPlatform() {
        require(msg.sender == PLATFORM_ADDRESS, "Only platform allowed");
        _;
    }
    
    modifier campaignActive(uint256 _campaignId) {
        require(campaigns[_campaignId].status == CampaignStatus.Active, "Campaign not active");
        require(block.timestamp < campaigns[_campaignId].deadline, "Campaign ended");
        _;
    }
    
    constructor(address _platformAddress) {
        require(_platformAddress != address(0), "Invalid platform address");
        PLATFORM_ADDRESS = _platformAddress;
    }
    
    // Create new campaign
    function createCampaign(
        string memory _title,
        string memory _description,
        string memory _category,
        string memory _ipfsCid,
        uint256 _goalInAPE,
        uint256 _durationInDays
    ) external returns (uint256) {
        require(bytes(_title).length > 0, "Title required");
        require(bytes(_description).length > 0, "Description required");
        require(_goalInAPE > 0, "Goal must be > 0");
        require(_durationInDays > 0 && _durationInDays <= 30, "Duration: 1-30 days");
        
        campaignCounter++;
        uint256 goalInWei = _goalInAPE * 1 ether;
        uint256 deadline = block.timestamp + (_durationInDays * 1 days);
        
        campaigns[campaignCounter] = Campaign({
            id: campaignCounter,
            creator: msg.sender,
            title: _title,
            description: _description,
            category: _category,
            ipfsCid: _ipfsCid,
            goal: goalInWei,
            raised: 0,
            deadline: deadline,
            status: CampaignStatus.Active,
            createdAt: block.timestamp,
            donorCount: 0
        });
        
        creatorCampaigns[msg.sender].push(campaignCounter);
        
        emit CampaignCreated(campaignCounter, msg.sender, _title, goalInWei, deadline);
        return campaignCounter;
    }
    
    // Donate to campaign (funds go into escrow)
    function donate(uint256 _campaignId) 
        external 
        payable 
        validCampaign(_campaignId) 
        campaignActive(_campaignId) 
    {
        require(msg.value > 0, "Donation must be > 0");
        
        Campaign storage campaign = campaigns[_campaignId];
        
        // Track donation
        if (donorAmounts[_campaignId][msg.sender] == 0) {
            campaign.donorCount++;
            donorCampaigns[msg.sender].push(_campaignId);
        }
        
        donorAmounts[_campaignId][msg.sender] += msg.value;
        campaign.raised += msg.value;
        
        // Store donation details
        campaignDonations[_campaignId].push(Donation({
            donor: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            refunded: false
        }));
        
        emit DonationMade(_campaignId, msg.sender, msg.value, campaign.raised);
        
        // Check if goal reached
        if (campaign.raised >= campaign.goal) {
            _markCampaignSuccessful(_campaignId);
        }
    }
    
    // Internal: Mark campaign as successful
    function _markCampaignSuccessful(uint256 _campaignId) internal {
        Campaign storage campaign = campaigns[_campaignId];
        campaign.status = CampaignStatus.Successful;
        
        uint256 platformFee = (campaign.raised * PLATFORM_FEE) / 100;
        uint256 creatorAmount = campaign.raised - platformFee;
        
        totalPlatformFees += platformFee;
        
        emit CampaignSuccessful(_campaignId, creatorAmount, platformFee);
    }
    
    // Creator withdraws funds (only if successful)
    function withdrawFunds(uint256 _campaignId) 
        external 
        validCampaign(_campaignId) 
        onlyCreator(_campaignId) 
    {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.status == CampaignStatus.Successful, "Campaign not successful");
        require(campaign.raised > 0, "No funds to withdraw");
        
        uint256 platformFee = (campaign.raised * PLATFORM_FEE) / 100;
        uint256 creatorAmount = campaign.raised - platformFee;
        
        campaign.status = CampaignStatus.Withdrawn;
        campaign.raised = 0; // Prevent re-withdrawal
        
        // Transfer to creator
        (bool success, ) = payable(campaign.creator).call{value: creatorAmount}("");
        require(success, "Transfer to creator failed");
        
        // Platform fee stays in contract
        emit FundsWithdrawn(_campaignId, campaign.creator, creatorAmount);
    }
    
    // Mark failed campaigns (callable by anyone after deadline)
    function markCampaignFailed(uint256 _campaignId) 
        external 
        validCampaign(_campaignId) 
    {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.status == CampaignStatus.Active, "Campaign not active");
        require(block.timestamp >= campaign.deadline, "Campaign not ended");
        require(campaign.raised < campaign.goal, "Campaign reached goal");
        
        campaign.status = CampaignStatus.Failed;
        
        emit CampaignFailed(_campaignId, campaign.raised);
    }
    
    // Claim refund (95% back to donor, 5% to platform)
    function claimRefund(uint256 _campaignId) external validCampaign(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.status == CampaignStatus.Failed, "Campaign not failed");
        
        uint256 donatedAmount = donorAmounts[_campaignId][msg.sender];
        require(donatedAmount > 0, "No donation found");
        
        // Mark as refunded
        donorAmounts[_campaignId][msg.sender] = 0;
        
        uint256 platformFee = (donatedAmount * PLATFORM_FEE) / 100;
        uint256 refundAmount = donatedAmount - platformFee;
        
        totalPlatformFees += platformFee;
        
        // Transfer refund to donor
        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Refund transfer failed");
        
        emit RefundClaimed(_campaignId, msg.sender, refundAmount, platformFee);
    }
    
    // Platform can withdraw accumulated fees
    function withdrawPlatformFees() external onlyPlatform {
        require(totalPlatformFees > 0, "No fees to withdraw");
        
        uint256 amount = totalPlatformFees;
        totalPlatformFees = 0;
        
        (bool success, ) = payable(PLATFORM_ADDRESS).call{value: amount}("");
        require(success, "Platform fee withdrawal failed");
    }
    
    // Batch refund processing (platform pays gas for user experience)
    function batchProcessRefunds(uint256 _campaignId, address[] calldata _donors) 
        external 
        onlyPlatform 
        validCampaign(_campaignId) 
    {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.status == CampaignStatus.Failed, "Campaign not failed");
        
        for (uint256 i = 0; i < _donors.length; i++) {
            address donor = _donors[i];
            uint256 donatedAmount = donorAmounts[_campaignId][donor];
            
            if (donatedAmount > 0) {
                donorAmounts[_campaignId][donor] = 0;
                
                uint256 platformFee = (donatedAmount * PLATFORM_FEE) / 100;
                uint256 refundAmount = donatedAmount - platformFee;
                
                totalPlatformFees += platformFee;
                
                (bool success, ) = payable(donor).call{value: refundAmount}("");
                if (success) {
                    emit RefundClaimed(_campaignId, donor, refundAmount, platformFee);
                }
            }
        }
    }
    
    // View functions
    function getAllCampaigns() external view returns (Campaign[] memory) {
        Campaign[] memory allCampaigns = new Campaign[](campaignCounter);
        for (uint256 i = 1; i <= campaignCounter; i++) {
            allCampaigns[i - 1] = campaigns[i];
        }
        return allCampaigns;
    }
    
    function getActiveCampaigns() external view returns (Campaign[] memory) {
        uint256 activeCount = 0;
        
        for (uint256 i = 1; i <= campaignCounter; i++) {
            if (campaigns[i].status == CampaignStatus.Active && 
                block.timestamp < campaigns[i].deadline) {
                activeCount++;
            }
        }
        
        Campaign[] memory activeCampaigns = new Campaign[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= campaignCounter; i++) {
            if (campaigns[i].status == CampaignStatus.Active && 
                block.timestamp < campaigns[i].deadline) {
                activeCampaigns[index] = campaigns[i];
                index++;
            }
        }
        
        return activeCampaigns;
    }
    
    function getCampaignDonations(uint256 _campaignId) 
        external 
        view 
        validCampaign(_campaignId) 
        returns (Donation[] memory) 
    {
        return campaignDonations[_campaignId];
    }
    
    function getRefundableAmount(uint256 _campaignId, address _donor) 
        external 
        view 
        validCampaign(_campaignId) 
        returns (uint256 refundAmount, uint256 platformFee) 
    {
        uint256 donatedAmount = donorAmounts[_campaignId][_donor];
        if (donatedAmount == 0) return (0, 0);
        
        platformFee = (donatedAmount * PLATFORM_FEE) / 100;
        refundAmount = donatedAmount - platformFee;
    }
    
    function getContractStats() external view returns (
        uint256 totalCampaigns,
        uint256 activeCampaigns,
        uint256 successfulCampaigns,
        uint256 totalEscrowAmount,
        uint256 platformFeesAccumulated
    ) {
        totalCampaigns = campaignCounter;
        platformFeesAccumulated = totalPlatformFees;
        
        uint256 activeCount = 0;
        uint256 successfulCount = 0;
        uint256 escrowAmount = 0;
        
        for (uint256 i = 1; i <= campaignCounter; i++) {
            Campaign storage campaign = campaigns[i];
            
            if (campaign.status == CampaignStatus.Active && 
                block.timestamp < campaign.deadline) {
                activeCount++;
            }
            
            if (campaign.status == CampaignStatus.Successful || 
                campaign.status == CampaignStatus.Withdrawn) {
                successfulCount++;
            }
            
            if (campaign.status == CampaignStatus.Active || 
                campaign.status == CampaignStatus.Successful) {
                escrowAmount += campaign.raised;
            }
        }
        
        return (totalCampaigns, activeCount, successfulCount, escrowAmount, platformFeesAccumulated);
    }
}