import { Client, Context, ContextParams, TokenVotingClient, CreateDaoParams } from '@aragon/sdk-client';
import { GasFeeEstimation } from '@aragon/sdk-client-common';

// Aragon configuration for Base network
const ARAGON_BASE_NETWORK = 'base'; // Base Mainnet
const ARAGON_CONTEXT_PARAMS: ContextParams = {
  network: ARAGON_BASE_NETWORK,
  web3Providers: ['https://mainnet.base.org'],
  // Add fallback providers
};

/**
 * Initialize Aragon Client
 */
export function createAragonClient(signer: any): Client {
  const context = new Context(ARAGON_CONTEXT_PARAMS);
  return new Client(context);
}

/**
 * Initialize Token Voting Client for governance
 */
export function createTokenVotingClient(signer: any): TokenVotingClient {
  const context = new Context(ARAGON_CONTEXT_PARAMS);
  return new TokenVotingClient(context);
}

/**
 * Create a new DAO for a campaign
 * @param campaignTitle - Name of the campaign/DAO
 * @param creatorAddress - Wallet address of campaign creator
 * @param treasuryAddress - Gnosis Safe address for holding funds
 * @returns DAO address and metadata
 */
export async function createCampaignDAO(
  client: Client,
  campaignTitle: string,
  creatorAddress: string,
  treasuryAddress: string
): Promise<{
  daoAddress: string;
  daoName: string;
  votingPluginAddress: string;
  metadata: any;
}> {
  // DAO creation parameters
  const daoParams: CreateDaoParams = {
    metadataUri: '', // Will be populated with IPFS URI
    daoUri: '',
    ensSubdomain: campaignTitle.toLowerCase().replace(/\s+/g, '-').substring(0, 30),

    // Token-based voting setup
    plugins: [
      {
        id: 'token-voting.plugin.dao.eth',
        data: {
          // Voting settings
          votingSettings: {
            minDuration: 86400, // 1 day minimum
            minParticipation: 0.15, // 15% participation required
            supportThreshold: 0.5, // 50% support needed
            minProposerVotingPower: BigInt(1), // Any token holder can propose
            votingMode: 1, // Standard voting
          },

          // Token settings - distribute tokens to backers
          useToken: {
            tokenAddress: '0x0', // We'll mint a new governance token
            wrappedToken: {
              name: `${campaignTitle} Governance`,
              symbol: 'GOV',
            },
          },

          // Initial token distribution to creator
          mintSettings: {
            receivers: [creatorAddress],
            amounts: [BigInt(1000000)], // 1M initial tokens to creator
          },
        },
      },
    ],

    // Treasury/multisig setup
    trustedForwarder: treasuryAddress,
  };

  try {
    // Estimate gas
    const estimation: GasFeeEstimation = await client.estimation.createDao(daoParams);
    console.log('DAO creation gas estimation:', estimation);

    // Create the DAO
    const steps = client.methods.createDao(daoParams);

    let daoAddress = '';
    let votingPluginAddress = '';

    for await (const step of steps) {
      console.log('DAO creation step:', step);

      if (step.key === 'daoAddress') {
        daoAddress = step.value;
      }

      if (step.key === 'pluginAddresses') {
        votingPluginAddress = step.value[0]; // First plugin is token voting
      }
    }

    return {
      daoAddress,
      daoName: campaignTitle,
      votingPluginAddress,
      metadata: {
        created: new Date().toISOString(),
        network: ARAGON_BASE_NETWORK,
        votingSettings: daoParams.plugins[0].data.votingSettings,
      },
    };
  } catch (error) {
    console.error('Error creating DAO:', error);
    throw new Error(`Failed to create DAO: ${error.message || error}`);
  }
}

/**
 * Create a proposal in the DAO
 * @param daoAddress - Address of the DAO
 * @param title - Proposal title
 * @param description - Proposal description
 * @param actions - Actions to execute if proposal passes
 */
export async function createProposal(
  votingClient: TokenVotingClient,
  daoAddress: string,
  pluginAddress: string,
  title: string,
  description: string,
  actions: any[] = []
) {
  const proposalParams = {
    pluginAddress,
    metadataUri: '', // IPFS metadata URI
    actions: actions,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    executeOnPass: false, // Manual execution
    creatorVote: 2, // Yes vote
  };

  try {
    const steps = votingClient.methods.createProposal(proposalParams);

    let proposalId = '';
    for await (const step of steps) {
      console.log('Proposal creation step:', step);
      if (step.key === 'proposalId') {
        proposalId = step.value;
      }
    }

    return proposalId;
  } catch (error) {
    console.error('Error creating proposal:', error);
    throw error;
  }
}

/**
 * Vote on a proposal
 * @param proposalId - ID of the proposal
 * @param vote - Vote value (1 = abstain, 2 = yes, 3 = no)
 */
export async function voteOnProposal(
  votingClient: TokenVotingClient,
  proposalId: string,
  vote: 1 | 2 | 3 // Abstain, Yes, No
) {
  try {
    const steps = votingClient.methods.voteProposal({
      proposalId,
      vote,
    });

    for await (const step of steps) {
      console.log('Vote step:', step);
    }

    return true;
  } catch (error) {
    console.error('Error voting:', error);
    throw error;
  }
}

/**
 * Get DAO information
 */
export async function getDAOInfo(client: Client, daoAddress: string) {
  try {
    const dao = await client.methods.getDao(daoAddress);
    return dao;
  } catch (error) {
    console.error('Error fetching DAO info:', error);
    throw error;
  }
}

/**
 * Get all proposals for a DAO
 */
export async function getProposals(
  votingClient: TokenVotingClient,
  pluginAddress: string
) {
  try {
    const proposals = await votingClient.methods.getProposals({
      daoAddressOrEns: pluginAddress,
      limit: 10,
      skip: 0,
      direction: 'desc',
      status: 'active',
    });

    return proposals;
  } catch (error) {
    console.error('Error fetching proposals:', error);
    throw error;
  }
}
