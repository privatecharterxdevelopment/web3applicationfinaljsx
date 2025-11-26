import { ethers, BrowserProvider, Contract, parseEther, formatEther } from 'ethers';

// Contract ABI - only include functions we need
export const ESCROW_ABI = [
  // Read functions
  "function escrowCounter() view returns (uint256)",
  "function getEscrow(uint256 _escrowId) view returns (tuple(address buyer, address seller, uint256 amount, uint256 feePercentage, uint256 createdAt, uint256 releasedAt, uint8 status, string bookingId, bool emergencyExitable))",
  "function getEscrowByBooking(string _bookingId) view returns (uint256)",
  "function calculateFee(uint256 _amount, uint256 _feePercentage) view returns (uint256 feeAmount, uint256 netAmount)",
  "function canEmergencyExit(uint256 _escrowId) view returns (bool)",
  "function admin() view returns (address)",
  "function paused() view returns (bool)",
  "function TREASURY() view returns (address)",
  "function FEE_CLASSIC() view returns (uint256)",
  "function FEE_MANAGED() view returns (uint256)",

  // Write functions
  "function createEscrow(address _seller, uint256 _feePercentage, string _bookingId) payable returns (uint256)",
  "function releaseFunds(uint256 _escrowId)",
  "function refund(uint256 _escrowId)",
  "function raiseDispute(uint256 _escrowId, string _reason)",
  "function resolveDispute(uint256 _escrowId, bool _favorBuyer)",
  "function emergencyExit(uint256 _escrowId)",

  // Events
  "event EscrowCreated(uint256 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount, uint256 feePercentage, string bookingId)",
  "event EscrowReleased(uint256 indexed escrowId, address indexed seller, uint256 sellerAmount, uint256 feeAmount)",
  "event EscrowRefunded(uint256 indexed escrowId, address indexed buyer, uint256 refundAmount)",
  "event DisputeRaised(uint256 indexed escrowId, address indexed raisedBy, string reason)",
  "event DisputeResolved(uint256 indexed escrowId, address indexed resolvedBy, bool favorBuyer)",
  "event EmergencyExit(uint256 indexed escrowId, address indexed exitedBy, uint256 amount)"
];

// Escrow status enum matching contract
export enum EscrowStatus {
  Active = 0,
  Released = 1,
  Refunded = 2,
  Disputed = 3
}

// Fee tiers
export const FEE_CLASSIC = 150; // 1.5%
export const FEE_MANAGED = 250; // 2.5%

// Contract address - will be set after deployment
export const ESCROW_CONTRACT_ADDRESS = import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || "";

// Treasury address
export const TREASURY_ADDRESS = "0xe2eeCBbfE60d013e93c7dC4da482E6657Ee7801b";

// Escrow data type
export interface EscrowData {
  buyer: string;
  seller: string;
  amount: bigint;
  feePercentage: bigint;
  createdAt: bigint;
  releasedAt: bigint;
  status: EscrowStatus;
  bookingId: string;
  emergencyExitable: boolean;
}

/**
 * Get escrow contract instance
 */
export async function getEscrowContract(signer?: any): Promise<Contract> {
  if (!ESCROW_CONTRACT_ADDRESS) {
    throw new Error("Escrow contract address not configured. Please set VITE_ESCROW_CONTRACT_ADDRESS in .env");
  }

  if (!window.ethereum) {
    throw new Error("No Web3 wallet detected. Please install MetaMask or another Web3 wallet.");
  }

  const provider = new BrowserProvider(window.ethereum);
  const contractSigner = signer || await provider.getSigner();

  return new Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, contractSigner);
}

/**
 * Get escrow contract in read-only mode
 */
export async function getEscrowContractReadOnly(): Promise<Contract> {
  if (!ESCROW_CONTRACT_ADDRESS) {
    throw new Error("Escrow contract address not configured");
  }

  if (!window.ethereum) {
    throw new Error("No Web3 provider detected");
  }

  const provider = new BrowserProvider(window.ethereum);
  return new Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, provider);
}

/**
 * Create a new escrow
 */
export async function createEscrow(
  sellerAddress: string,
  amountInEth: string,
  feePercentage: number,
  bookingId: string
): Promise<{ escrowId: number; txHash: string }> {
  const contract = await getEscrowContract();
  const amount = parseEther(amountInEth);

  const tx = await contract.createEscrow(sellerAddress, feePercentage, bookingId, {
    value: amount
  });

  const receipt = await tx.wait();

  // Find EscrowCreated event
  const event = receipt.logs
    .map((log: any) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((e: any) => e && e.name === 'EscrowCreated');

  const escrowId = event ? Number(event.args.escrowId) : 0;

  return {
    escrowId,
    txHash: receipt.hash
  };
}

/**
 * Get escrow details by ID
 */
export async function getEscrowById(escrowId: number): Promise<EscrowData> {
  const contract = await getEscrowContractReadOnly();
  const data = await contract.getEscrow(escrowId);

  return {
    buyer: data.buyer,
    seller: data.seller,
    amount: data.amount,
    feePercentage: data.feePercentage,
    createdAt: data.createdAt,
    releasedAt: data.releasedAt,
    status: data.status as EscrowStatus,
    bookingId: data.bookingId,
    emergencyExitable: data.emergencyExitable
  };
}

/**
 * Get escrow details by booking ID
 */
export async function getEscrowByBookingId(bookingId: string): Promise<EscrowData | null> {
  const contract = await getEscrowContractReadOnly();
  const escrowId = await contract.getEscrowByBooking(bookingId);

  if (escrowId === 0n) {
    return null;
  }

  return getEscrowById(Number(escrowId));
}

/**
 * Release funds to seller
 */
export async function releaseFunds(escrowId: number): Promise<string> {
  const contract = await getEscrowContract();
  const tx = await contract.releaseFunds(escrowId);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Refund to buyer
 */
export async function refundEscrow(escrowId: number): Promise<string> {
  const contract = await getEscrowContract();
  const tx = await contract.refund(escrowId);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Raise a dispute
 */
export async function raiseDispute(escrowId: number, reason: string): Promise<string> {
  const contract = await getEscrowContract();
  const tx = await contract.raiseDispute(escrowId, reason);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Resolve dispute (admin only)
 */
export async function resolveDispute(escrowId: number, favorBuyer: boolean): Promise<string> {
  const contract = await getEscrowContract();
  const tx = await contract.resolveDispute(escrowId, favorBuyer);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Emergency exit (after 180 days)
 */
export async function emergencyExit(escrowId: number): Promise<string> {
  const contract = await getEscrowContract();
  const tx = await contract.emergencyExit(escrowId);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Check if emergency exit is available
 */
export async function canEmergencyExit(escrowId: number): Promise<boolean> {
  const contract = await getEscrowContractReadOnly();
  return await contract.canEmergencyExit(escrowId);
}

/**
 * Calculate fee for given amount
 */
export async function calculateFee(
  amountInEth: string,
  feePercentage: number
): Promise<{ feeAmount: string; netAmount: string; totalAmount: string }> {
  const contract = await getEscrowContractReadOnly();
  const amount = parseEther(amountInEth);

  const [feeAmountBigInt, netAmountBigInt] = await contract.calculateFee(amount, feePercentage);

  return {
    feeAmount: formatEther(feeAmountBigInt),
    netAmount: formatEther(netAmountBigInt),
    totalAmount: formatEther(amount)
  };
}

/**
 * Get fee percentage label
 */
export function getFeeTierLabel(feePercentage: number): string {
  switch (feePercentage) {
    case FEE_CLASSIC:
      return "Classic (1.5%)";
    case FEE_MANAGED:
      return "Managed with Disputes (2.5%)";
    default:
      return `${feePercentage / 100}%`;
  }
}

/**
 * Get escrow status label
 */
export function getStatusLabel(status: EscrowStatus): string {
  switch (status) {
    case EscrowStatus.Active:
      return "Active";
    case EscrowStatus.Released:
      return "Released";
    case EscrowStatus.Refunded:
      return "Refunded";
    case EscrowStatus.Disputed:
      return "Disputed";
    default:
      return "Unknown";
  }
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: EscrowStatus): string {
  switch (status) {
    case EscrowStatus.Active:
      return "blue";
    case EscrowStatus.Released:
      return "green";
    case EscrowStatus.Refunded:
      return "gray";
    case EscrowStatus.Disputed:
      return "red";
    default:
      return "gray";
  }
}

/**
 * Format timestamp to date string
 */
export function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

/**
 * Check if user is connected to correct network
 */
export async function checkNetwork(): Promise<{ isCorrect: boolean; chainId: bigint }> {
  if (!window.ethereum) {
    throw new Error("No Web3 wallet detected");
  }

  const provider = new BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();

  // Base Mainnet: 8453, Base Sepolia: 84532
  const expectedChainId = import.meta.env.VITE_ESCROW_NETWORK === 'base' ? 8453n : 84532n;

  return {
    isCorrect: network.chainId === expectedChainId,
    chainId: network.chainId
  };
}

/**
 * Switch to correct network
 */
export async function switchToCorrectNetwork(): Promise<void> {
  if (!window.ethereum) {
    throw new Error("No Web3 wallet detected");
  }

  const isMainnet = import.meta.env.VITE_ESCROW_NETWORK === 'base';
  const chainIdHex = isMainnet ? '0x2105' : '0x14a34'; // 8453 or 84532

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (switchError: any) {
    // Chain not added to wallet
    if (switchError.code === 4902) {
      const params = isMainnet
        ? {
            chainId: '0x2105',
            chainName: 'Base',
            nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org']
          }
        : {
            chainId: '0x14a34',
            chainName: 'Base Sepolia',
            nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://sepolia.base.org'],
            blockExplorerUrls: ['https://sepolia.basescan.org']
          };

      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [params],
      });
    } else {
      throw switchError;
    }
  }
}

/**
 * Get current user address
 */
export async function getCurrentAddress(): Promise<string> {
  if (!window.ethereum) {
    throw new Error("No Web3 wallet detected");
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return await signer.getAddress();
}

/**
 * Request wallet connection
 */
export async function connectWallet(): Promise<string> {
  if (!window.ethereum) {
    throw new Error("No Web3 wallet detected. Please install MetaMask.");
  }

  await window.ethereum.request({ method: 'eth_requestAccounts' });
  return getCurrentAddress();
}
