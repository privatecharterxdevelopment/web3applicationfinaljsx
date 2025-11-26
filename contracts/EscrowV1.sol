// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title EscrowV1
 * @notice Hybrid escrow contract combining simplicity with security
 * @dev Features:
 *   - On-chain fee enforcement (cannot be bypassed)
 *   - Simple single-contract architecture
 *   - Dispute flags for manual admin resolution
 *   - Emergency exit mechanism (180 days)
 *   - Support for ETH and native token payments
 *
 * @author PrivateCharterX Team
 */
contract EscrowV1 {
    // ==================== CONSTANTS ====================

    /// @notice Treasury address receiving platform fees
    address public constant TREASURY = 0xe2eeCBbfE60d013e93c7dC4da482E6657Ee7801b;

    /// @notice Classic tier fee: 1.5% (150 basis points)
    uint256 public constant FEE_CLASSIC = 150;

    /// @notice Managed tier fee with disputes: 2.5% (250 basis points)
    uint256 public constant FEE_MANAGED = 250;

    /// @notice Emergency exit timeout: 180 days
    uint256 public constant EMERGENCY_TIMEOUT = 180 days;

    /// @notice Basis points denominator (10000 = 100%)
    uint256 public constant BASIS_POINTS = 10000;

    // ==================== STATE VARIABLES ====================

    /// @notice Admin address for dispute resolution
    address public admin;

    /// @notice Escrow counter for unique IDs
    uint256 public escrowCounter;

    /// @notice Contract paused state
    bool public paused;

    // ==================== STRUCTS ====================

    /// @notice Escrow status enum
    enum EscrowStatus {
        Active,      // Funds locked, awaiting release
        Released,    // Funds released to seller
        Refunded,    // Funds returned to buyer
        Disputed     // Dispute raised, admin intervention needed
    }

    /// @notice Escrow data structure
    struct Escrow {
        address buyer;           // Buyer address
        address seller;          // Seller address
        uint256 amount;          // Total amount deposited (includes fee)
        uint256 feePercentage;   // Fee tier: 150 (1.5%) or 250 (2.5%)
        uint256 createdAt;       // Creation timestamp
        uint256 releasedAt;      // Release/refund timestamp
        EscrowStatus status;     // Current status
        string bookingId;        // Off-chain booking reference
        bool emergencyExitable;  // True if emergency exit available
    }

    // ==================== MAPPINGS ====================

    /// @notice Escrow ID => Escrow data
    mapping(uint256 => Escrow) public escrows;

    /// @notice Booking ID => Escrow ID (for lookup)
    mapping(string => uint256) public bookingToEscrow;

    // ==================== EVENTS ====================

    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 feePercentage,
        string bookingId
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

    event DisputeRaised(
        uint256 indexed escrowId,
        address indexed raisedBy,
        string reason
    );

    event DisputeResolved(
        uint256 indexed escrowId,
        address indexed resolvedBy,
        bool favorBuyer
    );

    event EmergencyExit(
        uint256 indexed escrowId,
        address indexed exitedBy,
        uint256 amount
    );

    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);

    event PausedStateChanged(bool isPaused);

    // ==================== MODIFIERS ====================

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }

    modifier escrowExists(uint256 _escrowId) {
        require(_escrowId > 0 && _escrowId <= escrowCounter, "Invalid escrow ID");
        _;
    }

    // ==================== CONSTRUCTOR ====================

    constructor() {
        admin = msg.sender;
        escrowCounter = 0;
        paused = false;
    }

    // ==================== CORE FUNCTIONS ====================

    /**
     * @notice Create a new escrow
     * @param _seller Seller address
     * @param _feePercentage Fee tier: 150 (1.5%) or 250 (2.5%)
     * @param _bookingId Off-chain booking reference
     * @return escrowId The created escrow ID
     */
    function createEscrow(
        address _seller,
        uint256 _feePercentage,
        string calldata _bookingId
    ) external payable whenNotPaused returns (uint256) {
        require(msg.value > 0, "Must deposit funds");
        require(_seller != address(0), "Invalid seller address");
        require(_seller != msg.sender, "Buyer cannot be seller");
        require(
            _feePercentage == FEE_CLASSIC || _feePercentage == FEE_MANAGED,
            "Invalid fee tier"
        );
        require(bytes(_bookingId).length > 0, "Booking ID required");
        require(bookingToEscrow[_bookingId] == 0, "Booking ID already used");

        escrowCounter++;
        uint256 escrowId = escrowCounter;

        escrows[escrowId] = Escrow({
            buyer: msg.sender,
            seller: _seller,
            amount: msg.value,
            feePercentage: _feePercentage,
            createdAt: block.timestamp,
            releasedAt: 0,
            status: EscrowStatus.Active,
            bookingId: _bookingId,
            emergencyExitable: false
        });

        bookingToEscrow[_bookingId] = escrowId;

        emit EscrowCreated(
            escrowId,
            msg.sender,
            _seller,
            msg.value,
            _feePercentage,
            _bookingId
        );

        return escrowId;
    }

    /**
     * @notice Release funds to seller (buyer approves)
     * @param _escrowId Escrow ID to release
     */
    function releaseFunds(uint256 _escrowId)
        external
        whenNotPaused
        escrowExists(_escrowId)
    {
        Escrow storage escrow = escrows[_escrowId];

        require(
            msg.sender == escrow.buyer || msg.sender == admin,
            "Only buyer or admin"
        );
        require(escrow.status == EscrowStatus.Active, "Escrow not active");

        // Calculate fee and seller amount (ON-CHAIN - cannot be bypassed!)
        uint256 feeAmount = (escrow.amount * escrow.feePercentage) / BASIS_POINTS;
        uint256 sellerAmount = escrow.amount - feeAmount;

        // Update state BEFORE transfers (Checks-Effects-Interactions pattern)
        escrow.status = EscrowStatus.Released;
        escrow.releasedAt = block.timestamp;

        // Transfer fee to treasury
        (bool feeSuccess, ) = TREASURY.call{value: feeAmount}("");
        require(feeSuccess, "Fee transfer failed");

        // Transfer remaining to seller
        (bool sellerSuccess, ) = escrow.seller.call{value: sellerAmount}("");
        require(sellerSuccess, "Seller transfer failed");

        emit EscrowReleased(_escrowId, escrow.seller, sellerAmount, feeAmount);
    }

    /**
     * @notice Refund to buyer (seller cancels or admin approves)
     * @param _escrowId Escrow ID to refund
     */
    function refund(uint256 _escrowId)
        external
        whenNotPaused
        escrowExists(_escrowId)
    {
        Escrow storage escrow = escrows[_escrowId];

        require(
            msg.sender == escrow.seller || msg.sender == admin,
            "Only seller or admin"
        );
        require(escrow.status == EscrowStatus.Active, "Escrow not active");

        uint256 refundAmount = escrow.amount;

        // Update state BEFORE transfer
        escrow.status = EscrowStatus.Refunded;
        escrow.releasedAt = block.timestamp;

        // Full refund to buyer (no fee charged on refund)
        (bool success, ) = escrow.buyer.call{value: refundAmount}("");
        require(success, "Refund transfer failed");

        emit EscrowRefunded(_escrowId, escrow.buyer, refundAmount);
    }

    /**
     * @notice Raise a dispute (flags for admin review)
     * @param _escrowId Escrow ID to dispute
     * @param _reason Dispute reason
     */
    function raiseDispute(uint256 _escrowId, string calldata _reason)
        external
        whenNotPaused
        escrowExists(_escrowId)
    {
        Escrow storage escrow = escrows[_escrowId];

        require(
            msg.sender == escrow.buyer || msg.sender == escrow.seller,
            "Only buyer or seller"
        );
        require(escrow.status == EscrowStatus.Active, "Escrow not active");
        require(bytes(_reason).length > 0, "Reason required");

        escrow.status = EscrowStatus.Disputed;

        emit DisputeRaised(_escrowId, msg.sender, _reason);
    }

    /**
     * @notice Admin resolves dispute
     * @param _escrowId Escrow ID
     * @param _favorBuyer True to refund buyer, false to release to seller
     */
    function resolveDispute(uint256 _escrowId, bool _favorBuyer)
        external
        onlyAdmin
        escrowExists(_escrowId)
    {
        Escrow storage escrow = escrows[_escrowId];

        require(escrow.status == EscrowStatus.Disputed, "Not disputed");

        if (_favorBuyer) {
            // Refund to buyer (no fee)
            escrow.status = EscrowStatus.Refunded;
            escrow.releasedAt = block.timestamp;

            (bool success, ) = escrow.buyer.call{value: escrow.amount}("");
            require(success, "Refund failed");

            emit EscrowRefunded(_escrowId, escrow.buyer, escrow.amount);
        } else {
            // Release to seller (with fee)
            uint256 feeAmount = (escrow.amount * escrow.feePercentage) / BASIS_POINTS;
            uint256 sellerAmount = escrow.amount - feeAmount;

            escrow.status = EscrowStatus.Released;
            escrow.releasedAt = block.timestamp;

            (bool feeSuccess, ) = TREASURY.call{value: feeAmount}("");
            require(feeSuccess, "Fee transfer failed");

            (bool sellerSuccess, ) = escrow.seller.call{value: sellerAmount}("");
            require(sellerSuccess, "Seller transfer failed");

            emit EscrowReleased(_escrowId, escrow.seller, sellerAmount, feeAmount);
        }

        emit DisputeResolved(_escrowId, msg.sender, _favorBuyer);
    }

    /**
     * @notice Emergency exit after 180 days of inactivity
     * @param _escrowId Escrow ID
     */
    function emergencyExit(uint256 _escrowId)
        external
        escrowExists(_escrowId)
    {
        Escrow storage escrow = escrows[_escrowId];

        require(
            msg.sender == escrow.buyer || msg.sender == escrow.seller,
            "Only buyer or seller"
        );
        require(escrow.status == EscrowStatus.Active, "Escrow not active");
        require(
            block.timestamp >= escrow.createdAt + EMERGENCY_TIMEOUT,
            "Emergency timeout not reached"
        );

        uint256 exitAmount = escrow.amount;
        address recipient = msg.sender;

        escrow.status = EscrowStatus.Refunded;
        escrow.releasedAt = block.timestamp;
        escrow.emergencyExitable = true;

        (bool success, ) = recipient.call{value: exitAmount}("");
        require(success, "Emergency exit failed");

        emit EmergencyExit(_escrowId, recipient, exitAmount);
    }

    // ==================== VIEW FUNCTIONS ====================

    /**
     * @notice Get escrow details
     * @param _escrowId Escrow ID
     */
    function getEscrow(uint256 _escrowId)
        external
        view
        escrowExists(_escrowId)
        returns (Escrow memory)
    {
        return escrows[_escrowId];
    }

    /**
     * @notice Get escrow ID by booking ID
     * @param _bookingId Booking reference
     */
    function getEscrowByBooking(string calldata _bookingId)
        external
        view
        returns (uint256)
    {
        return bookingToEscrow[_bookingId];
    }

    /**
     * @notice Calculate fee amount for given value and percentage
     * @param _amount Total amount
     * @param _feePercentage Fee percentage in basis points
     */
    function calculateFee(uint256 _amount, uint256 _feePercentage)
        external
        pure
        returns (uint256 feeAmount, uint256 netAmount)
    {
        feeAmount = (_amount * _feePercentage) / BASIS_POINTS;
        netAmount = _amount - feeAmount;
    }

    /**
     * @notice Check if emergency exit is available
     * @param _escrowId Escrow ID
     */
    function canEmergencyExit(uint256 _escrowId)
        external
        view
        escrowExists(_escrowId)
        returns (bool)
    {
        Escrow storage escrow = escrows[_escrowId];
        return escrow.status == EscrowStatus.Active &&
               block.timestamp >= escrow.createdAt + EMERGENCY_TIMEOUT;
    }

    // ==================== ADMIN FUNCTIONS ====================

    /**
     * @notice Change admin address
     * @param _newAdmin New admin address
     */
    function changeAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid admin address");
        address oldAdmin = admin;
        admin = _newAdmin;
        emit AdminChanged(oldAdmin, _newAdmin);
    }

    /**
     * @notice Pause/unpause contract
     * @param _paused New paused state
     */
    function setPaused(bool _paused) external onlyAdmin {
        paused = _paused;
        emit PausedStateChanged(_paused);
    }

    // ==================== RECEIVE ====================

    /// @notice Reject direct ETH transfers (must use createEscrow)
    receive() external payable {
        revert("Use createEscrow function");
    }

    fallback() external payable {
        revert("Use createEscrow function");
    }
}
