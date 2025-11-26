// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title FlexibleEscrow V2 - WITH BUYER CANCELLATION
 * @notice Custom escrow with buyer/seller cancellation rights
 * @dev NEW FEATURES IN V2:
 *   - Buyer can cancel and get full refund
 *   - Configurable cancellation deadlines
 *   - BuyerCancelled event for tracking
 *
 * @author PrivateCharterX Team
 */
contract FlexibleEscrowV2 is ReentrancyGuard {
    // ==================== CONSTANTS ====================

    uint256 public constant FEE_TIER_1 = 200;  // 2.0%
    uint256 public constant FEE_TIER_2 = 150;  // 1.5%
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant TIER_1_MAX = 1_000_000 ether;
    uint256 public constant TIER_2_MAX = 100_000_000 ether;
    uint256 public constant EMERGENCY_TIMEOUT = 180 days;
    uint256 public constant MAX_SIGNERS = 20;
    uint256 public constant MAX_DESCRIPTION_LENGTH = 500;

    /// @notice Default cancellation deadline (7 days from creation)
    uint256 public constant DEFAULT_CANCELLATION_DEADLINE = 7 days;

    // ==================== STATE VARIABLES ====================

    address public feeCollector;
    address public admin;
    uint256 public escrowCounter;
    bool public paused;
    uint256 public totalFeesCollected;

    // ==================== STRUCTS ====================

    enum EscrowStatus {
        Active,      // Funds locked, awaiting signatures
        Released,    // Funds released to seller
        Refunded,    // Funds returned to buyer
        Disputed     // Dispute raised, admin intervention needed
    }

    struct CustomEscrow {
        address buyer;
        address seller;
        uint256 amount;
        uint256 platformFee;
        uint256 totalDeposit;
        string contractCID;
        string description;
        address[] signers;
        uint256 requiredSigs;
        mapping(address => bool) isAuthorizedSigner;
        mapping(address => bool) hasSigned;
        uint256 signCount;
        uint256 createdAt;
        uint256 releasedAt;
        uint256 cancellationDeadline;  // NEW: Deadline for cancellation
        EscrowStatus status;
        bool emergencyExitable;
    }

    // ==================== MAPPINGS ====================

    mapping(uint256 => CustomEscrow) public escrows;
    mapping(string => uint256) public bookingToEscrow;

    // ==================== EVENTS ====================

    event CustomEscrowCreated(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 platformFee,
        string contractCID,
        string description,
        address[] signers,
        uint256 requiredSigs,
        uint256 cancellationDeadline
    );

    event SignatureAdded(
        uint256 indexed escrowId,
        address indexed signer,
        uint256 currentSignCount,
        uint256 requiredSigs
    );

    event EscrowReleased(
        uint256 indexed escrowId,
        address indexed seller,
        uint256 sellerAmount,
        uint256 feeAmount
    );

    event EscrowRefunded(
        uint256 indexed escrowId,
        address indexed buyer,
        uint256 refundAmount
    );

    /// @notice NEW EVENT: Buyer cancelled escrow
    event BuyerCancelled(
        uint256 indexed escrowId,
        address indexed buyer,
        uint256 refundAmount,
        uint256 timestamp
    );

    /// @notice NEW EVENT: Seller cancelled escrow
    event SellerCancelled(
        uint256 indexed escrowId,
        address indexed seller,
        uint256 refundAmount,
        uint256 timestamp
    );

    event DisputeRaised(
        uint256 indexed escrowId,
        address indexed raiser,
        string reason
    );

    event DisputeResolved(
        uint256 indexed escrowId,
        bool favorBuyer,
        address resolver
    );

    event EmergencyTimeoutReached(
        uint256 indexed escrowId,
        address indexed caller,
        uint256 amount
    );

    event FeesWithdrawn(
        address indexed collector,
        uint256 amount
    );

    event FeeCollectorUpdated(
        address indexed oldCollector,
        address indexed newCollector
    );

    event ContractPaused(
        bool paused,
        address indexed admin
    );

    event AdminTransferred(
        address indexed oldAdmin,
        address indexed newAdmin
    );

    event EmergencyAdminWithdraw(
        uint256 indexed escrowId,
        address indexed recipient,
        uint256 amount
    );

    // ==================== MODIFIERS ====================

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyFeeCollector() {
        require(msg.sender == feeCollector, "Not fee collector");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }

    modifier escrowExists(uint256 _escrowId) {
        require(_escrowId > 0 && _escrowId <= escrowCounter, "Escrow does not exist");
        _;
    }

    // ==================== CONSTRUCTOR ====================

    constructor(address _feeCollector) {
        require(_feeCollector != address(0), "Invalid fee collector");
        feeCollector = _feeCollector;
        admin = msg.sender;
    }

    // ==================== FEE CALCULATION ====================

    function calculateFee(uint256 _amount) public pure returns (uint256 fee, string memory tierLabel) {
        require(_amount <= type(uint256).max / FEE_TIER_1, "Amount too large for fee calculation");

        if (_amount <= TIER_1_MAX) {
            fee = (_amount * FEE_TIER_1) / FEE_DENOMINATOR;
            tierLabel = "Standard (2.0%)";
        } else if (_amount <= TIER_2_MAX) {
            fee = (_amount * FEE_TIER_2) / FEE_DENOMINATOR;
            tierLabel = "Premium (1.5%)";
        } else {
            revert("Amount exceeds tier 2 max - contact admin for custom pricing");
        }
    }

    function getFeeInfo(uint256 _amount) external pure returns (uint256 percentage, string memory label) {
        if (_amount <= TIER_1_MAX) {
            return (FEE_TIER_1, "Standard (2.0%)");
        } else if (_amount <= TIER_2_MAX) {
            return (FEE_TIER_2, "Premium (1.5%)");
        } else {
            return (0, "Enterprise (Custom)");
        }
    }

    // ==================== ESCROW CREATION ====================

    /**
     * @notice Create custom escrow with optional cancellation deadline
     * @param _cancellationDeadline Custom cancellation deadline (0 = use default 7 days)
     */
    function createCustomEscrow(
        address _seller,
        string calldata _contractCID,
        string calldata _description,
        address[] calldata _signers,
        uint256 _requiredSigs,
        string calldata _bookingId,
        uint256 _cancellationDeadline  // NEW PARAMETER
    ) external payable whenNotPaused nonReentrant returns (uint256 escrowId) {
        // Enhanced validation
        require(_seller != address(0), "Invalid seller");
        require(_seller != msg.sender, "Buyer and seller cannot be same");
        require(msg.value > 0, "Amount must be > 0");
        require(_signers.length > 0, "At least one signer required");
        require(_signers.length <= MAX_SIGNERS, "Too many signers");
        require(_requiredSigs > 0 && _requiredSigs <= _signers.length, "Invalid signature count");
        require(bytes(_contractCID).length > 0, "Contract CID required");
        require(bytes(_description).length <= MAX_DESCRIPTION_LENGTH, "Description too long");

        // Validate signers
        for (uint256 i = 0; i < _signers.length; i++) {
            require(_signers[i] != address(0), "Invalid signer address");
            for (uint256 j = i + 1; j < _signers.length; j++) {
                require(_signers[i] != _signers[j], "Duplicate signer");
            }
        }

        // Calculate platform fee
        (uint256 platformFee, ) = calculateFee(msg.value);
        uint256 escrowAmount = msg.value - platformFee;

        // Create escrow
        escrowCounter++;
        escrowId = escrowCounter;

        CustomEscrow storage newEscrow = escrows[escrowId];
        newEscrow.buyer = msg.sender;
        newEscrow.seller = _seller;
        newEscrow.amount = escrowAmount;
        newEscrow.platformFee = platformFee;
        newEscrow.totalDeposit = msg.value;
        newEscrow.contractCID = _contractCID;
        newEscrow.description = _description;
        newEscrow.signers = _signers;
        newEscrow.requiredSigs = _requiredSigs;
        newEscrow.createdAt = block.timestamp;
        newEscrow.status = EscrowStatus.Active;

        // Set cancellation deadline (default 7 days or custom)
        if (_cancellationDeadline == 0) {
            newEscrow.cancellationDeadline = block.timestamp + DEFAULT_CANCELLATION_DEADLINE;
        } else {
            newEscrow.cancellationDeadline = block.timestamp + _cancellationDeadline;
        }

        // Initialize signers
        for (uint256 i = 0; i < _signers.length; i++) {
            newEscrow.isAuthorizedSigner[_signers[i]] = true;
        }

        // Optional booking reference
        if (bytes(_bookingId).length > 0) {
            bookingToEscrow[_bookingId] = escrowId;
        }

        emit CustomEscrowCreated(
            escrowId,
            msg.sender,
            _seller,
            escrowAmount,
            platformFee,
            _contractCID,
            _description,
            _signers,
            _requiredSigs,
            newEscrow.cancellationDeadline
        );
    }

    // ==================== SIGNATURE SYSTEM ====================

    function signRelease(uint256 _escrowId)
        external
        escrowExists(_escrowId)
        whenNotPaused
    {
        CustomEscrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Active, "Escrow not active");
        require(escrow.isAuthorizedSigner[msg.sender], "Not authorized signer");
        require(!escrow.hasSigned[msg.sender], "Already signed");

        escrow.hasSigned[msg.sender] = true;
        escrow.signCount++;

        emit SignatureAdded(_escrowId, msg.sender, escrow.signCount, escrow.requiredSigs);

        // Auto-release if signature threshold met
        if (escrow.signCount >= escrow.requiredSigs) {
            _releaseEscrow(_escrowId);
        }
    }

    function _releaseEscrow(uint256 _escrowId) private nonReentrant {
        CustomEscrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Active, "Escrow not active");

        // Cache values
        uint256 sellerAmount = escrow.amount;
        uint256 feeAmount = escrow.platformFee;
        address seller = escrow.seller;

        // Update state
        escrow.status = EscrowStatus.Released;
        escrow.releasedAt = block.timestamp;
        totalFeesCollected += feeAmount;

        // Transfer to seller
        (bool success, ) = payable(seller).call{value: sellerAmount}("");
        require(success, "Transfer to seller failed");

        emit EscrowReleased(_escrowId, seller, sellerAmount, feeAmount);
    }

    // ==================== CANCELLATION FUNCTIONS ====================

    /**
     * @notice NEW: Buyer cancels escrow and receives full refund
     * @dev Can only be called before cancellation deadline
     * @param _escrowId Escrow ID to cancel
     */
    function buyerCancel(uint256 _escrowId)
        external
        escrowExists(_escrowId)
        whenNotPaused
        nonReentrant
    {
        CustomEscrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Active, "Escrow not active");
        require(msg.sender == escrow.buyer, "Only buyer can cancel");
        require(block.timestamp <= escrow.cancellationDeadline, "Cancellation deadline passed");

        // Cache values
        uint256 refundAmount = escrow.totalDeposit;
        address buyer = escrow.buyer;

        // Update status
        escrow.status = EscrowStatus.Refunded;
        escrow.releasedAt = block.timestamp;

        // Refund full amount to buyer (including fee)
        (bool success, ) = payable(buyer).call{value: refundAmount}("");
        require(success, "Refund failed");

        emit EscrowRefunded(_escrowId, buyer, refundAmount);
        emit BuyerCancelled(_escrowId, buyer, refundAmount, block.timestamp);
    }

    /**
     * @notice Seller cancels escrow and refunds buyer (UPDATED with event)
     * @param _escrowId Escrow ID to refund
     */
    function sellerRefund(uint256 _escrowId)
        external
        escrowExists(_escrowId)
        whenNotPaused
        nonReentrant
    {
        CustomEscrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Active, "Escrow not active");
        require(
            msg.sender == escrow.seller || msg.sender == admin,
            "Only seller or admin can refund"
        );

        // Cache values
        uint256 refundAmount = escrow.totalDeposit;
        address buyer = escrow.buyer;
        address seller = escrow.seller;

        // Update status
        escrow.status = EscrowStatus.Refunded;
        escrow.releasedAt = block.timestamp;

        // Refund full amount to buyer (including fee since service not provided)
        (bool success, ) = payable(buyer).call{value: refundAmount}("");
        require(success, "Refund failed");

        emit EscrowRefunded(_escrowId, buyer, refundAmount);
        emit SellerCancelled(_escrowId, seller, refundAmount, block.timestamp);
    }

    // ==================== DISPUTE SYSTEM ====================

    function raiseDispute(uint256 _escrowId, string calldata _reason)
        external
        escrowExists(_escrowId)
        whenNotPaused
    {
        CustomEscrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Active, "Escrow not active");
        require(
            msg.sender == escrow.buyer || msg.sender == escrow.seller,
            "Only buyer or seller can raise dispute"
        );

        escrow.status = EscrowStatus.Disputed;

        emit DisputeRaised(_escrowId, msg.sender, _reason);
    }

    function resolveDispute(uint256 _escrowId, bool _favorBuyer)
        external
        onlyAdmin
        escrowExists(_escrowId)
        nonReentrant
    {
        CustomEscrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Disputed, "Not in dispute");

        uint256 amount = escrow.totalDeposit;
        address recipient = _favorBuyer ? escrow.buyer : escrow.seller;

        // Update status
        escrow.status = _favorBuyer ? EscrowStatus.Refunded : EscrowStatus.Released;
        escrow.releasedAt = block.timestamp;

        // Transfer
        if (_favorBuyer) {
            // Refund to buyer (no fee collected)
            (bool success, ) = payable(recipient).call{value: amount}("");
            require(success, "Transfer failed");
        } else {
            // Pay seller (collect fee)
            totalFeesCollected += escrow.platformFee;
            (bool success, ) = payable(recipient).call{value: escrow.amount}("");
            require(success, "Transfer failed");
        }

        emit DisputeResolved(_escrowId, _favorBuyer, msg.sender);
    }

    // ==================== ADMIN FUNCTIONS ====================

    function withdrawFees() external onlyFeeCollector nonReentrant {
        uint256 amount = totalFeesCollected;
        require(amount > 0, "No fees to withdraw");

        totalFeesCollected = 0;

        (bool success, ) = payable(feeCollector).call{value: amount}("");
        require(success, "Withdrawal failed");

        emit FeesWithdrawn(feeCollector, amount);
    }

    function updateFeeCollector(address _newCollector) external onlyAdmin {
        require(_newCollector != address(0), "Invalid address");
        address oldCollector = feeCollector;
        feeCollector = _newCollector;

        emit FeeCollectorUpdated(oldCollector, _newCollector);
    }

    function setPaused(bool _paused) external onlyAdmin {
        paused = _paused;
        emit ContractPaused(_paused, msg.sender);
    }

    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid address");
        address oldAdmin = admin;
        admin = _newAdmin;

        emit AdminTransferred(oldAdmin, _newAdmin);
    }

    // ==================== VIEW FUNCTIONS ====================

    function getEscrowDetails(uint256 _escrowId)
        external
        view
        escrowExists(_escrowId)
        returns (
            address buyer,
            address seller,
            uint256 amount,
            uint256 platformFee,
            uint256 totalDeposit,
            string memory contractCID,
            string memory description,
            uint256 signCount,
            uint256 requiredSigs,
            uint256 createdAt,
            uint256 cancellationDeadline,
            EscrowStatus status
        )
    {
        CustomEscrow storage escrow = escrows[_escrowId];
        return (
            escrow.buyer,
            escrow.seller,
            escrow.amount,
            escrow.platformFee,
            escrow.totalDeposit,
            escrow.contractCID,
            escrow.description,
            escrow.signCount,
            escrow.requiredSigs,
            escrow.createdAt,
            escrow.cancellationDeadline,
            escrow.status
        );
    }

    function hasSigned(uint256 _escrowId, address _signer)
        external
        view
        escrowExists(_escrowId)
        returns (bool)
    {
        return escrows[_escrowId].hasSigned[_signer];
    }

    function isAuthorizedSigner(uint256 _escrowId, address _signer)
        external
        view
        escrowExists(_escrowId)
        returns (bool)
    {
        return escrows[_escrowId].isAuthorizedSigner[_signer];
    }

    receive() external payable {
        revert("Direct deposits not allowed");
    }

    fallback() external payable {
        revert("Direct deposits not allowed");
    }
}
