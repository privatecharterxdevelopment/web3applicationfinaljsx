import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, ThumbsUp, Eye, Calendar, User, MessageCircle,
  Send, Shield, ExternalLink, Share2, Loader2, CheckCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSignMessage } from 'wagmi';
import Button from './Button';
import PageHeader from './PageHeader';

export default function BlogPostDetail({ post, onBack, walletAddress, isConnected }) {
  const { signMessageAsync } = useSignMessage();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const [dbPostId, setDbPostId] = useState(null);

  useEffect(() => {
    fetchComments();
  }, [post.id]);

  // Real-time comment subscription
  useEffect(() => {
    if (!dbPostId) return;

    console.log('🔴 Setting up real-time comment subscription for post:', dbPostId);

    // Subscribe to new comments
    const channel = supabase
      .channel(`comments:${dbPostId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'blog_comments',
          filter: `post_id=eq.${dbPostId}`
        },
        (payload) => {
          console.log('🔴 Real-time comment update:', payload);

          if (payload.eventType === 'INSERT') {
            // New comment added
            if (payload.new.status === 'approved') {
              setComments(prev => [payload.new, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            // Comment updated (e.g., approved)
            setComments(prev =>
              prev.map(comment =>
                comment.id === payload.new.id ? payload.new : comment
              )
            );
          } else if (payload.eventType === 'DELETE') {
            // Comment deleted
            setComments(prev =>
              prev.filter(comment => comment.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      console.log('🔴 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [dbPostId]);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      // If WordPress post, find the database post ID first
      let postId = post.id;

      if (typeof post.id === 'number' && post.sourceUrl) {
        const { data: existingPost } = await supabase
          .from('blog_posts')
          .select('id')
          .eq('source_url', post.sourceUrl)
          .maybeSingle();

        if (existingPost) {
          postId = existingPost.id;
          setDbPostId(existingPost.id); // Set for real-time subscription
        } else {
          // No post in database yet, no comments possible
          setComments([]);
          setLoadingComments(false);
          return;
        }
      } else {
        setDbPostId(postId); // Set for real-time subscription
      }

      const { data, error } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('post_id', postId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };


  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!isConnected || !walletAddress) {
      alert('Please connect your wallet to comment');
      return;
    }

    if (!newComment.trim()) {
      alert('Please enter a comment');
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: Find or create the post in database using source_url
      let dbPostId = post.id;

      // Check if this is a WordPress post (numeric ID from API)
      if (typeof post.id === 'number' && post.sourceUrl) {
        console.log('🔍 Looking up post in database by source_url...');

        // Try to find post by source_url
        const { data: existingPost, error: lookupError } = await supabase
          .from('blog_posts')
          .select('id')
          .eq('source_url', post.sourceUrl)
          .maybeSingle();

        if (existingPost) {
          dbPostId = existingPost.id;
          console.log('✅ Found post in database:', dbPostId);
        } else {
          // Post not in database yet, need to create it
          console.log('📝 Creating post in database...');
          const { data: newPost, error: insertError } = await supabase
            .from('blog_posts')
            .insert([{
              title: post.title,
              excerpt: post.excerpt,
              content: post.content,
              featured_image: post.image,
              author: post.author,
              source: 'privatecharterx.blog',
              category: 'web3',
              source_url: post.sourceUrl,
              tags: post.tags || [],
              published_at: post.publishedAt,
              views: post.views || 0,
              likes: post.likes || 0
            }])
            .select('id')
            .single();

          if (insertError) {
            console.error('❌ Error creating post:', insertError);
            throw new Error('Could not create post in database');
          }

          dbPostId = newPost.id;
          setDbPostId(newPost.id); // Set for real-time subscription
          console.log('✅ Created post in database:', dbPostId);
        }
      } else {
        setDbPostId(dbPostId); // Ensure it's set for subscription
      }

      // Step 2: Create message to sign
      const timestamp = Date.now();
      const message = `PrivateCharterX Blog Comment\n\nPost ID: ${dbPostId}\nComment: ${newComment.trim()}\nWallet: ${walletAddress}\nTimestamp: ${timestamp}`;

      // Step 3: Request signature from wallet
      const signature = await signMessageAsync({ message });

      if (!signature) {
        throw new Error('Signature cancelled or failed');
      }

      // Step 4: Submit comment with signature to database
      const { data, error } = await supabase
        .from('blog_comments')
        .insert([{
          post_id: dbPostId,
          wallet_address: walletAddress.toLowerCase(),
          comment_text: newComment.trim(),
          signature: signature,
          signed_message: message,
          status: 'approved' // Auto-approve for now (change to 'pending' for moderation)
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Comment submitted:', data.id);

      // Step 5: Record comment in transactions table for transparency
      try {
        const { error: txError } = await supabase
          .from('transactions')
          .insert([{
            wallet_address: walletAddress.toLowerCase(),
            transaction_type: 'blog_comment',
            category: 'wallet_signature',
            amount: 0, // No monetary value for comments
            status: 'completed',
            description: `Posted comment on blog: "${post.title}"`,
            signature: signature,
            metadata: {
              comment_id: data.id,
              post_id: dbPostId,
              post_title: post.title,
              comment_preview: newComment.trim().substring(0, 100) + (newComment.length > 100 ? '...' : ''),
              signed_message: message,
              timestamp: timestamp
            }
          }]);

        if (txError) {
          console.error('⚠️ Failed to record transaction:', txError);
          // Don't fail the comment submission if transaction recording fails
        } else {
          console.log('✅ Transaction recorded');
        }
      } catch (txRecordError) {
        console.error('⚠️ Error recording transaction:', txRecordError);
        // Continue even if transaction recording fails
      }

      setNewComment('');
      // No need to fetch - real-time subscription will add it automatically
    } catch (error) {
      console.error('Error submitting comment:', error);
      if (error.message.includes('cancel') || error.message.includes('reject')) {
        alert('❌ Signature cancelled. Comment not submitted.');
      } else {
        alert(`Failed to submit comment: ${error.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatWalletAddress = (address) => {
    if (!address) return 'Anonymous';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="w-full h-full flex flex-col bg-transparent">
      {/* Fixed Navigation Bar at Top */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={18} />}
          >
            Back to Community
          </Button>

          {/* Post Meta in Header */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Eye size={16} />
              <span>{post.views.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageCircle size={16} />
              <span>{comments.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Hero Image - Smaller & More Compact */}
        {post.image && (
          <div className="relative h-64 rounded-xl overflow-hidden mb-6">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        )}

        {/* Header - Compact */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter mb-3">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex items-center gap-6 text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <User size={18} />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              <span>{formatDate(post.publishedAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye size={18} />
              <span>{post.views} views</span>
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          {post.sourceUrl && (
            <div className="flex items-center gap-4">
              <Button
                onClick={() => window.open(post.sourceUrl, '_blank')}
                variant="secondary"
                size="sm"
                icon={<ExternalLink size={16} />}
              >
                View Original Article
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none mb-8">
          <div
            className="text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* Comments Section */}
        <div className="border-t border-gray-200/50 pt-8">
          <h2 className="text-2xl font-light text-gray-900 tracking-tighter mb-4">
            Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          {isConnected ? (
            <form onSubmit={handleSubmitComment} className="mb-6">
              <div className="bg-white/40 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 mb-3">
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                  <Shield size={16} className="text-green-600" />
                  <span>Connected as: {formatWalletAddress(walletAddress)}</span>
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/60 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  disabled={submitting}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={<Send size={16} />}
                disabled={submitting || !newComment.trim()}
                loading={submitting}
              >
                {submitting ? 'Submitting...' : 'Post Comment'}
              </Button>
            </form>
          ) : (
            <div className="mb-6 p-4 bg-blue-50/60 backdrop-blur-sm border border-blue-200/50 rounded-xl text-center">
              <Shield size={28} className="text-blue-600 mx-auto mb-2" />
              <p className="text-blue-900 font-semibold mb-1 text-sm">Wallet Connection Required</p>
              <p className="text-xs text-blue-700">
                Connect your wallet to post comments and engage with the community
              </p>
            </div>
          )}

          {/* Comments List */}
          {loadingComments ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-gray-400" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

function CommentCard({ comment }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatWalletAddress = (address) => {
    if (!address) return 'Anonymous';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="bg-white/30 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {comment.wallet_address ? comment.wallet_address.substring(2, 4).toUpperCase() : 'A'}
        </div>

        {/* Comment Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-semibold text-gray-900">
              {formatWalletAddress(comment.wallet_address)}
            </span>
            <div className="flex items-center gap-1">
              <Shield size={14} className="text-green-600" />
              <span className="text-xs text-gray-500">Verified</span>
            </div>
            {comment.signature && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded-full">
                <CheckCircle size={12} className="text-blue-600" />
                <span className="text-xs text-blue-700 font-medium">Signed</span>
              </div>
            )}
          </div>

          <p className="text-gray-700 mb-2">
            {comment.comment_text}
          </p>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{formatDate(comment.created_at)}</span>
            {comment.signature && (
              <span className="text-gray-400" title="Comment recorded in transaction history">
                • Recorded in transactions
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
