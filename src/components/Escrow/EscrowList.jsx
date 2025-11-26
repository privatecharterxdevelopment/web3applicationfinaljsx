import React, { useState, useEffect } from 'react';
import {
  getEscrowById,
  releaseFunds,
  refundEscrow,
  raiseDispute,
  emergencyExit,
  canEmergencyExit,
  getStatusLabel,
  getStatusColor,
  getFeeTierLabel,
  formatTimestamp,
  getCurrentAddress,
  EscrowStatus
} from '../../lib/escrow';
import { formatEther } from 'ethers';

/**
 * EscrowList Component
 *
 * Displays list of escrows with management actions:
 * - Release funds (buyer)
 * - Refund (seller)
 * - Raise dispute (buyer/seller)
 * - Emergency exit (after 180 days)
 *
 * @param {Object} props
 * @param {number[]} props.escrowIds - Array of escrow IDs to display
 * @param {Function} props.onUpdate - Callback when escrow is updated
 */
export default function EscrowList({ escrowIds, onUpdate }) {
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEscrow, setSelectedEscrow] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [error, setError] = useState('');

  // Load escrows
  useEffect(() => {
    loadEscrows();
    loadUserAddress();
  }, [escrowIds]);

  /**
   * Load user's wallet address
   */
  async function loadUserAddress() {
    try {
      const address = await getCurrentAddress();
      setUserAddress(address.toLowerCase());
    } catch (err) {
      console.error('Failed to get user address:', err);
    }
  }

  /**
   * Load all escrows
   */
  async function loadEscrows() {
    try {
      setLoading(true);
      setError('');

      const escrowData = await Promise.all(
        escrowIds.map(async (id) => {
          try {
            const data = await getEscrowById(id);
            const canExit = await canEmergencyExit(id);
            return { id, ...data, canExit };
          } catch (err) {
            console.error(`Failed to load escrow ${id}:`, err);
            return null;
          }
        })
      );

      setEscrows(escrowData.filter(Boolean));
    } catch (err) {
      setError('Failed to load escrows: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handle release funds
   */
  async function handleRelease(escrowId) {
    if (!confirm('Release funds to seller? This cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');

      const txHash = await releaseFunds(escrowId);
      console.log('Funds released, tx:', txHash);

      // Reload escrows
      await loadEscrows();
      onUpdate?.({ action: 'release', escrowId, txHash });
    } catch (err) {
      setError('Release failed: ' + (err.reason || err.message));
    } finally {
      setActionLoading(false);
    }
  }

  /**
   * Handle refund
   */
  async function handleRefund(escrowId) {
    if (!confirm('Refund to buyer? This cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');

      const txHash = await refundEscrow(escrowId);
      console.log('Refund processed, tx:', txHash);

      await loadEscrows();
      onUpdate?.({ action: 'refund', escrowId, txHash });
    } catch (err) {
      setError('Refund failed: ' + (err.reason || err.message));
    } finally {
      setActionLoading(false);
    }
  }

  /**
   * Handle raise dispute
   */
  async function handleRaiseDispute(escrowId) {
    const reason = prompt('Enter dispute reason:');
    if (!reason || reason.trim() === '') {
      return;
    }

    try {
      setActionLoading(true);
      setError('');

      const txHash = await raiseDispute(escrowId, reason.trim());
      console.log('Dispute raised, tx:', txHash);

      await loadEscrows();
      onUpdate?.({ action: 'dispute', escrowId, txHash, reason: reason.trim() });
    } catch (err) {
      setError('Dispute failed: ' + (err.reason || err.message));
    } finally {
      setActionLoading(false);
    }
  }

  /**
   * Handle emergency exit
   */
  async function handleEmergencyExit(escrowId) {
    if (!confirm('Perform emergency exit? This will withdraw all funds to your address.')) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');

      const txHash = await emergencyExit(escrowId);
      console.log('Emergency exit completed, tx:', txHash);

      await loadEscrows();
      onUpdate?.({ action: 'emergency_exit', escrowId, txHash });
    } catch (err) {
      setError('Emergency exit failed: ' + (err.reason || err.message));
    } finally {
      setActionLoading(false);
    }
  }

  /**
   * Check if user is buyer
   */
  function isBuyer(escrow) {
    return escrow.buyer.toLowerCase() === userAddress;
  }

  /**
   * Check if user is seller
   */
  function isSeller(escrow) {
    return escrow.seller.toLowerCase() === userAddress;
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4" />
          <p className="text-white/70">Loading escrows...</p>
        </div>
      </div>
    );
  }

  if (escrows.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20">
        <div className="text-center">
          <svg className="w-16 h-16 text-white/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-white/70 text-lg">No escrows found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Escrow Cards */}
      {escrows.map((escrow) => {
        const statusColor = getStatusColor(escrow.status);
        const statusLabel = getStatusLabel(escrow.status);
        const isUserBuyer = isBuyer(escrow);
        const isUserSeller = isSeller(escrow);

        return (
          <div
            key={escrow.id}
            className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden hover:border-white/30 transition-all"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Escrow #{escrow.id}
                  </h3>
                  <p className="text-white/60 text-sm font-mono">{escrow.bookingId}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${statusColor}-500/20 text-${statusColor}-300 border border-${statusColor}-500/30`}>
                  {statusLabel}
                </span>
              </div>

              {/* Amount */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4">
                <div className="text-white/70 text-sm mb-1">Total Amount</div>
                <div className="text-3xl font-bold text-white font-mono">
                  {formatEther(escrow.amount)} ETH
                </div>
                <div className="text-white/60 text-sm mt-2">
                  Fee: {getFeeTierLabel(Number(escrow.feePercentage))}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-6 grid grid-cols-2 gap-4">
              {/* Buyer */}
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-white/70 text-sm mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Buyer
                  {isUserBuyer && <span className="text-xs bg-blue-500/30 px-2 py-0.5 rounded-full">You</span>}
                </div>
                <div className="text-white font-mono text-xs break-all">
                  {escrow.buyer.slice(0, 10)}...{escrow.buyer.slice(-8)}
                </div>
              </div>

              {/* Seller */}
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-white/70 text-sm mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Seller
                  {isUserSeller && <span className="text-xs bg-purple-500/30 px-2 py-0.5 rounded-full">You</span>}
                </div>
                <div className="text-white font-mono text-xs break-all">
                  {escrow.seller.slice(0, 10)}...{escrow.seller.slice(-8)}
                </div>
              </div>

              {/* Created At */}
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-white/70 text-sm mb-2">Created</div>
                <div className="text-white text-sm">
                  {formatTimestamp(escrow.createdAt)}
                </div>
              </div>

              {/* Released At */}
              {escrow.releasedAt > 0n && (
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-white/70 text-sm mb-2">
                    {escrow.status === EscrowStatus.Released ? 'Released' : 'Refunded'}
                  </div>
                  <div className="text-white text-sm">
                    {formatTimestamp(escrow.releasedAt)}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {escrow.status === EscrowStatus.Active && (
              <div className="p-6 border-t border-white/10 bg-white/5">
                <div className="flex flex-wrap gap-3">
                  {/* Buyer Actions */}
                  {isUserBuyer && (
                    <>
                      <button
                        onClick={() => handleRelease(escrow.id)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Release Funds
                      </button>
                      <button
                        onClick={() => handleRaiseDispute(escrow.id)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        Raise Dispute
                      </button>
                    </>
                  )}

                  {/* Seller Actions */}
                  {isUserSeller && (
                    <>
                      <button
                        onClick={() => handleRefund(escrow.id)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        Refund Buyer
                      </button>
                      <button
                        onClick={() => handleRaiseDispute(escrow.id)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        Raise Dispute
                      </button>
                    </>
                  )}

                  {/* Emergency Exit */}
                  {(isUserBuyer || isUserSeller) && escrow.canExit && (
                    <button
                      onClick={() => handleEmergencyExit(escrow.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      Emergency Exit
                    </button>
                  )}
                </div>

                {escrow.canExit && (
                  <div className="mt-3 text-yellow-300 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Emergency exit available (180 days passed)</span>
                  </div>
                )}
              </div>
            )}

            {/* Disputed Status */}
            {escrow.status === EscrowStatus.Disputed && (
              <div className="p-6 border-t border-white/10 bg-red-500/10">
                <div className="flex items-center gap-2 text-red-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Dispute raised - awaiting admin resolution</span>
                </div>
              </div>
            )}

            {/* Completed Status */}
            {(escrow.status === EscrowStatus.Released || escrow.status === EscrowStatus.Refunded) && (
              <div className={`p-6 border-t border-white/10 bg-${statusColor}-500/10`}>
                <div className={`flex items-center gap-2 text-${statusColor}-300`}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">
                    {escrow.status === EscrowStatus.Released ? 'Funds released to seller' : 'Funds refunded to buyer'}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
